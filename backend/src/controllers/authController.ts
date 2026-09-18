import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev';

export const register = async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ success: false, error: { message: "Database not configured" }});
        
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
            role: 'user', // Default role
        }).returning({ id: users.id, username: users.username, role: users.role });
        
        const user = result[0];
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        res.status(201).json({ success: true, user });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, error: { message: "Failed to register" }});
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ success: false, error: { message: "Database not configured" }});
        
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, error: { message: "Username and password required" }});
        }
        
        const result = await db.select().from(users).where(eq(users.username, username));
        const user = result[0];
        
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ success: false, error: { message: "Invalid credentials" }});
        }
        
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, error: { message: "Failed to login" }});
    }
};

export const logout = (req: Request, res: Response) => {
    res.clearCookie('token');
    res.json({ success: true });
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, error: { message: "Not authenticated" }});
        }
        
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        res.json({ success: true, user: { id: decoded.id, username: decoded.username, role: decoded.role } });
    } catch (err) {
        res.status(401).json({ success: false, error: { message: "Invalid token" }});
    }
};
