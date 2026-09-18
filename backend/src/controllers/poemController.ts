import { Request, Response } from "express";
import { db } from "../db/index.js";
import { poems, replies } from "../db/schema.js";
import { eq, desc, ilike, or, and, sql, count } from "drizzle-orm";
import { hashToken } from "../utils/crypto.js";
import { getSearchVariants } from "../utils/amharicTransliterator.js";

export const getPoems = async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ success: false, error: { message: "Database not configured" }});
        
        const category = req.query.category as string;
        const search = req.query.q as string;
        const type = req.query.type as string;
        
        let conditions = [eq(poems.status, 'active')];
        if (category) {
            conditions.push(eq(poems.category, category));
        }
        if (type) {
            conditions.push(eq(poems.type, type));
        }
        if (search) {
            const variants = getSearchVariants(search);
            const searchConditions = variants.flatMap(v => [
                ilike(poems.title, `%${v}%`),
                ilike(poems.content, `%${v}%`),
                ilike(poems.authorName, `%${v}%`)
            ]);
            conditions.push(or(...searchConditions)!);
        }

        const result = await db.select({
            id: poems.id,
            title: poems.title,
            content: poems.content,
            authorName: poems.authorName,
            category: poems.category,
            type: poems.type,
            sourceUrl: poems.sourceUrl,
            createdAt: poems.createdAt,
            replyCount: sql<number>`cast(count(${replies.id}) as int)`
        })
        .from(poems)
        .leftJoin(replies, and(eq(replies.poemId, poems.id), eq(replies.status, 'active')))
        .where(and(...conditions))
        .groupBy(poems.id)
        .orderBy(desc(poems.createdAt))
        .limit(50); // limit for MVP

        res.json({ success: true, data: result });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, error: { message: "Failed to fetch poems" }});
    }
};

export const getPoemById = async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ success: false, error: { message: "Database not configured" }});
        
        const id = req.params.id as string;
        const result = await db.select().from(poems).where(and(eq(poems.id, id), eq(poems.status, 'active'))).limit(1);
        
        if (result.length === 0) {
            return res.status(404).json({ success: false, error: { code: "POEM_NOT_FOUND", message: "ግጥሙ አልተገኘም።" }});
        }
        
        const { authorTokenHash, ...poemData } = result[0];
        res.json({ success: true, data: poemData });
    } catch (err: any) {
        res.status(500).json({ success: false, error: { message: "Failed to fetch poem" }});
    }
};

export const createPoem = async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ success: false, error: { message: "Database not configured" }});
        
        const { title, content, authorName, category, type, sourceUrl, authorToken } = req.body;
        
        if (!title || !content || (!authorToken && !req.user)) {
            return res.status(400).json({ success: false, error: { message: "Missing required fields" }});
        }
        
        const finalAuthorName = req.user ? req.user.username : (authorName || 'ያልታወቀ');
        const finalAuthorToken = req.user ? req.user.id : authorToken;
        const userId = req.user ? req.user.id : null;
        
        const result = await db.insert(poems).values({
            title,
            content,
            authorName: finalAuthorName,
            userId,
            category: category || null,
            type: type || 'formal',
            sourceUrl: sourceUrl || null,
            authorTokenHash: hashToken(finalAuthorToken)
        }).returning();
        
        const { authorTokenHash, ...poemData } = result[0];
        res.status(201).json({ success: true, data: poemData });
    } catch (err: any) {
        console.error("Create poem error:", err);
        res.status(500).json({ success: false, error: { message: err.message || "Failed to publish poem" }});
    }
};

export const updatePoem = async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ success: false, error: { message: "Database not configured" }});
        
        const id = req.params.id as string;
        const { title, content, authorToken } = req.body;
        
        const token = req.headers['authorization']?.split(' ')[1] || authorToken;
        const isAdmin = req.user && req.user.role === 'admin';
        
        if (!isAdmin && !token) return res.status(401).json({ success: false, error: { message: "Unauthorized" }});
        
        const existing = await db.select().from(poems).where(eq(poems.id, id)).limit(1);
        if (existing.length === 0 || existing[0].status !== 'active') {
            return res.status(404).json({ success: false, error: { message: "Poem not found" }});
        }
        
        if (!isAdmin && existing[0].authorTokenHash !== hashToken(token)) {
            return res.status(403).json({ success: false, error: { message: "Forbidden: You don't own this poem" }});
        }
        
        const result = await db.update(poems).set({
            title: title || existing[0].title,
            content: content || existing[0].content,
            updatedAt: new Date()
        }).where(eq(poems.id, id)).returning();
        
        const { authorTokenHash, ...poemData } = result[0];
        res.json({ success: true, data: poemData });
    } catch (err: any) {
        res.status(500).json({ success: false, error: { message: "Failed to update poem" }});
    }
};

export const deletePoem = async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ success: false, error: { message: "Database not configured" }});
        
        const id = req.params.id as string;
        const { authorToken } = req.body; // In REST, body in DELETE is allowed but sometimes tricky. Better to pass in headers, but for MVP body is fine.
        
        const token = req.headers['authorization']?.split(' ')[1] || authorToken;
        const isAdmin = req.user && req.user.role === 'admin';
        
        if (!isAdmin && !token) return res.status(401).json({ success: false, error: { message: "Unauthorized" }});
        
        const existing = await db.select().from(poems).where(eq(poems.id, id)).limit(1);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: { message: "Poem not found" }});
        }
        
        if (!isAdmin && existing[0].authorTokenHash !== hashToken(token)) {
            return res.status(403).json({ success: false, error: { message: "Forbidden" }});
        }
        
        await db.update(poems).set({ status: 'deleted', updatedAt: new Date() }).where(eq(poems.id, id));
        res.json({ success: true, data: { id }});
    } catch (err: any) {
        res.status(500).json({ success: false, error: { message: "Failed to delete poem" }});
    }
};

export const searchPoems = async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ success: false, error: { message: "Database not configured" }});
        
        const search = req.query.q as string;
        if (!search) return res.json({ success: true, data: [] });
        
        const variants = getSearchVariants(search);
        const searchConditions = variants.flatMap(v => [
            ilike(poems.title, `%${v}%`),
            ilike(poems.content, `%${v}%`),
            ilike(poems.authorName, `%${v}%`)
        ]);

        const result = await db.select({
            id: poems.id,
            title: poems.title,
            content: poems.content,
            authorName: poems.authorName,
            category: poems.category,
            type: poems.type,
            sourceUrl: poems.sourceUrl,
            createdAt: poems.createdAt,
            replyCount: sql<number>`cast(count(${replies.id}) as int)`
        })
        .from(poems)
        .leftJoin(replies, and(eq(replies.poemId, poems.id), eq(replies.status, 'active')))
        .where(
            and(
                eq(poems.status, 'active'),
                or(...searchConditions)
            )
        )
        .groupBy(poems.id)
        .orderBy(desc(poems.createdAt))
        .limit(20);
        
        res.json({ success: true, data: result });
    } catch(err: any) {
        res.status(500).json({ success: false, error: { message: "Search failed" }});
    }
};
