import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { scrapeAndParsePoems } from "../services/telegramScraper.ts";
import { db } from "../db/index.ts";
import { telegramChannels, users } from "../db/schema.ts";
import { eq, desc } from "drizzle-orm";

export const createAdmin = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: { message: "Unauthorized" }});
        }
        
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, error: { message: "Username and password required" }});
        }
        
        const existing = await db.select().from(users).where(eq(users.username, username));
        if (existing.length > 0) {
            return res.status(400).json({ success: false, error: { message: "Username taken" }});
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        const result = await db.insert(users).values({
            username,
            passwordHash,
            role: 'admin',
        }).returning({ id: users.id, username: users.username, role: users.role });
        
        res.status(201).json({ success: true, user: result[0] });
    } catch (err: any) {
        console.error("Create admin error:", err);
        res.status(500).json({ success: false, error: { message: "Failed to create admin" }});
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: { message: "Unauthorized" }});
        }
        
        const allUsers = await db.select({
            id: users.id,
            username: users.username,
            role: users.role,
            createdAt: users.createdAt,
        }).from(users).orderBy(desc(users.createdAt));
        
        res.json({ success: true, data: allUsers });
    } catch (err: any) {
        console.error("Get users error:", err);
        res.status(500).json({ success: false, error: { message: "Failed to fetch users" }});
    }
};

export const updateUserRole = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: { message: "Unauthorized" }});
        }
        
        const id = req.params.id as string;
        const { role } = req.body;
        
        if (!id || !role || (role !== 'admin' && role !== 'user')) {
            return res.status(400).json({ success: false, error: { message: "Invalid user ID or role" }});
        }

        // Prevent admin from demoting themselves to avoid lockout
        if (id === req.user.id && role !== 'admin') {
            return res.status(400).json({ success: false, error: { message: "You cannot demote yourself" }});
        }
        
        const updated = await db.update(users)
            .set({ role })
            .where(eq(users.id, id))
            .returning({ id: users.id, username: users.username, role: users.role });
            
        if (updated.length === 0) {
            return res.status(404).json({ success: false, error: { message: "User not found" }});
        }
        
        res.json({ success: true, user: updated[0] });
    } catch (err: any) {
        console.error("Update user role error:", err);
        res.status(500).json({ success: false, error: { message: "Failed to update user role" }});
    }
};

export const getChannels = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: { message: "Unauthorized" }});
        }
        
        const channels = await db.select().from(telegramChannels).orderBy(desc(telegramChannels.createdAt));
        res.json({ success: true, data: channels });
    } catch (err: any) {
        console.error("Get channels error:", err);
        res.status(500).json({ success: false, error: { message: "Failed to fetch channels" }});
    }
};

export const addChannel = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: { message: "Unauthorized" }});
        }
        
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ success: false, error: { message: "URL is required" }});
        }
        
        const existing = await db.select().from(telegramChannels).where(eq(telegramChannels.url, url)).limit(1);
        if (existing.length > 0) {
            return res.json({ success: true, data: existing[0] });
        }
        
        const result = await db.insert(telegramChannels).values({
            url,
            addedBy: req.user.id
        }).returning();
        
        res.json({ success: true, data: result[0] });
    } catch (err: any) {
        console.error("Add channel error:", err);
        res.status(500).json({ success: false, error: { message: "Failed to add channel" }});
    }
};

export const deleteChannel = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: { message: "Unauthorized" }});
        }
        
        const id = req.params.id as string;
        await db.delete(telegramChannels).where(eq(telegramChannels.id, id));
        
        res.json({ success: true, data: { id } });
    } catch (err: any) {
        console.error("Delete channel error:", err);
        res.status(500).json({ success: false, error: { message: "Failed to delete channel" }});
    }
};

export const scrapeTelegram = async (req: Request, res: Response) => {
    try {
        const { url } = req.body;
        
        // Simple authentication via jwt middleware
        if (!req.user || req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: { message: "Unauthorized" }});
        }
        
        if (!url) {
            return res.status(400).json({ success: false, error: { message: "URL is required" }});
        }
        
        const data = await scrapeAndParsePoems(url);
        
        // Auto-save the channel to DB on successful scrape
        try {
            const existing = await db.select().from(telegramChannels).where(eq(telegramChannels.url, url)).limit(1);
            if (existing.length === 0) {
                await db.insert(telegramChannels).values({
                    url,
                    addedBy: req.user.id
                });
            }
        } catch (dbErr) {
            console.error("Failed to auto-save channel:", dbErr);
        }

        res.json({ success: true, data });
    } catch (err: any) {
        console.error("Scrape error:", err);
        res.status(500).json({ success: false, error: { message: err.message || "Failed to scrape Telegram" }});
    }
};
