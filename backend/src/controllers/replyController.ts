import { Request, Response } from "express";
import { db } from "../db/index.js";
import { replies } from "../db/schema.js";
import { eq, desc, and, asc } from "drizzle-orm";
import { hashToken } from "../utils/crypto.js";

export const getRepliesByPoemId = async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ success: false, error: { message: "Database not configured" }});
        
        const poemId = req.params.id as string;
        const result = await db.select()
            .from(replies)
            .where(and(eq(replies.poemId, poemId), eq(replies.status, 'active')))
            .orderBy(asc(replies.createdAt));
            
        const safeData = result.map(({ authorTokenHash, ...rest }) => rest);
        res.json({ success: true, data: safeData });
    } catch (err: any) {
        res.status(500).json({ success: false, error: { message: "Failed to fetch replies" }});
    }
};

export const createReply = async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ success: false, error: { message: "Database not configured" }});
        
        const poemId = req.params.id as string;
        const { content, authorName, authorToken, parentReplyId } = req.body;
        
        if (!content || (!authorToken && !req.user)) {
            return res.status(400).json({ success: false, error: { message: "Missing required fields" }});
        }
        
        const finalAuthorName = req.user ? req.user.username : (authorName || 'ያልታወቀ');
        const finalAuthorToken = req.user ? req.user.id : authorToken;
        const userId = req.user ? req.user.id : null;
        
        const result = await db.insert(replies).values({
            poemId,
            content,
            authorName: finalAuthorName,
            userId,
            authorTokenHash: hashToken(finalAuthorToken),
            parentReplyId: parentReplyId || null
        }).returning();
        
        const { authorTokenHash, ...replyData } = result[0];
        res.status(201).json({ success: true, data: replyData });
    } catch (err: any) {
        res.status(500).json({ success: false, error: { message: "Failed to publish reply" }});
    }
};

export const updateReply = async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ success: false, error: { message: "Database not configured" }});
        
        const id = req.params.id as string;
        const { content, authorToken } = req.body;
        
        const token = req.headers['authorization']?.split(' ')[1] || authorToken;
        const isAdmin = req.user && req.user.role === 'admin';
        
        if (!isAdmin && !token) return res.status(401).json({ success: false, error: { message: "Unauthorized" }});
        
        const existing = await db.select().from(replies).where(eq(replies.id, id)).limit(1);
        if (existing.length === 0 || existing[0].status !== 'active') {
            return res.status(404).json({ success: false, error: { message: "Reply not found" }});
        }
        
        if (!isAdmin && existing[0].authorTokenHash !== hashToken(token)) {
            return res.status(403).json({ success: false, error: { message: "Forbidden: You don't own this reply" }});
        }
        
        const result = await db.update(replies).set({
            content: content || existing[0].content,
            updatedAt: new Date()
        }).where(eq(replies.id, id)).returning();
        
        const { authorTokenHash, ...replyData } = result[0];
        res.json({ success: true, data: replyData });
    } catch (err: any) {
        res.status(500).json({ success: false, error: { message: "Failed to update reply" }});
    }
};

export const deleteReply = async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ success: false, error: { message: "Database not configured" }});
        
        const id = req.params.id as string;
        const { authorToken } = req.body;
        
        const token = req.headers['authorization']?.split(' ')[1] || authorToken;
        const isAdmin = req.user && req.user.role === 'admin';
        
        if (!isAdmin && !token) return res.status(401).json({ success: false, error: { message: "Unauthorized" }});
        
        const existing = await db.select().from(replies).where(eq(replies.id, id)).limit(1);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: { message: "Reply not found" }});
        }
        
        if (!isAdmin && existing[0].authorTokenHash !== hashToken(token)) {
            return res.status(403).json({ success: false, error: { message: "Forbidden" }});
        }
        
        await db.update(replies).set({ status: 'deleted', updatedAt: new Date() }).where(eq(replies.id, id));
        res.json({ success: true, data: { id }});
    } catch (err: any) {
        res.status(500).json({ success: false, error: { message: "Failed to delete reply" }});
    }
};
