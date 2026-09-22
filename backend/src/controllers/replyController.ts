import type { Request, Response } from "express";
import { db } from "../db/index.ts";
import { replies } from "../db/schema.ts";
import { eq, desc, and, asc } from "drizzle-orm";
import { hashToken } from "../utils/crypto.ts";

export const getRepliesByPoemId = async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ success: false, error: { message: "Database not configured" }});
        
        const poemId = req.params.id as string;
        const rawAuthorToken = (req.headers['x-author-token'] as string) || (req.query?.authorToken as string) || req.headers['authorization']?.split(' ')[1];
        const isAdmin = Boolean(req.user && req.user.role === 'admin');

        const result = await db.select()
            .from(replies)
            .where(and(eq(replies.poemId, poemId), eq(replies.status, 'active')))
            .orderBy(asc(replies.createdAt));
            
        const safeData = result.map(({ authorTokenHash, ...rest }) => {
            const isAuthor = Boolean(
                (rawAuthorToken && authorTokenHash === hashToken(rawAuthorToken)) ||
                (req.user && rest.userId && rest.userId === req.user.id) ||
                (req.user && authorTokenHash === hashToken(req.user.id))
            );
            return {
                ...rest,
                canManage: isAdmin || isAuthor
            };
        });
        res.json({ success: true, data: safeData });
    } catch (err: any) {
        res.status(500).json({ success: false, error: { message: "Failed to fetch replies" }});
    }
};

export const createReply = async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ success: false, error: { message: "Database not configured" }});
        
        const poemId = req.params.id as string;
        const { content, authorName, authorToken, parentReplyId } = req.body || {};
        
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
        const { content, authorToken } = req.body || {};
        
        const rawAuthorToken = authorToken || (req.headers['x-author-token'] as string) || req.headers['authorization']?.split(' ')[1];
        const isAdmin = Boolean(req.user && req.user.role === 'admin');
        
        const existing = await db.select().from(replies).where(eq(replies.id, id)).limit(1);
        if (existing.length === 0 || existing[0].status !== 'active') {
            return res.status(404).json({ success: false, error: { message: "Reply not found" }});
        }
        
        const isAuthor = Boolean(
            (rawAuthorToken && existing[0].authorTokenHash === hashToken(rawAuthorToken)) ||
            (req.user && existing[0].userId && existing[0].userId === req.user.id) ||
            (req.user && existing[0].authorTokenHash === hashToken(req.user.id))
        );
        
        if (!isAdmin && !isAuthor) {
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
        const rawAuthorToken = req.body?.authorToken 
            || (req.headers['x-author-token'] as string)
            || (req.query?.authorToken as string)
            || req.headers['authorization']?.split(' ')[1];
            
        const isAdmin = Boolean(req.user && req.user.role === 'admin');
        
        const existing = await db.select().from(replies).where(eq(replies.id, id)).limit(1);
        if (existing.length === 0 || existing[0].status === 'deleted') {
            return res.status(404).json({ success: false, error: { message: "Reply not found" }});
        }
        
        const isAuthor = Boolean(
            (rawAuthorToken && existing[0].authorTokenHash === hashToken(rawAuthorToken)) ||
            (req.user && existing[0].userId && existing[0].userId === req.user.id) ||
            (req.user && existing[0].authorTokenHash === hashToken(req.user.id))
        );
        
        if (!isAdmin && !isAuthor) {
            return res.status(403).json({ success: false, error: { message: "Forbidden: You don't have permission to delete this reply" }});
        }
        
        await db.update(replies).set({ status: 'deleted', updatedAt: new Date() }).where(eq(replies.id, id));
        res.json({ success: true, data: { id }});
    } catch (err: any) {
        console.error("Delete reply error:", err);
        res.status(500).json({ success: false, error: { message: "Failed to delete reply" }});
    }
};
