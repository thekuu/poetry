import { Request, Response } from "express";
import { db } from "../db/index.js";
import { poems, replies } from "../db/schema.js";
import { eq, desc, ilike, or, and, sql, count } from "drizzle-orm";
import { hashToken } from "../utils/crypto.js";
import { getSearchVariants } from "../utils/amharicTransliterator.js";

export const getPoems = async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ success: false, error: { message: "Database not configured (DATABASE_URL is missing)" }});
        
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
        console.error("Error in getPoems:", err);
        res.status(500).json({ success: false, error: { message: err?.message || "Failed to fetch poems" }});
    }
};

export const getPoemById = async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ success: false, error: { message: "Database not configured (DATABASE_URL is missing)" }});
        
        const id = req.params.id as string;
        const result = await db.select().from(poems).where(and(eq(poems.id, id), eq(poems.status, 'active'))).limit(1);
        
        if (result.length === 0) {
            return res.status(404).json({ success: false, error: { code: "POEM_NOT_FOUND", message: "ግጥሙ አልተገኘም።" }});
        }
        
        const rawAuthorToken = (req.headers['x-author-token'] as string) || (req.query?.authorToken as string) || req.headers['authorization']?.split(' ')[1];
        const isAdmin = Boolean(req.user && req.user.role === 'admin');
        const isAuthor = Boolean(
            (rawAuthorToken && result[0].authorTokenHash === hashToken(rawAuthorToken)) ||
            (req.user && result[0].userId && result[0].userId === req.user.id) ||
            (req.user && result[0].authorTokenHash === hashToken(req.user.id))
        );
        const canManage = isAdmin || isAuthor;
        
        const { authorTokenHash, ...poemData } = result[0];
        res.json({ success: true, data: { ...poemData, canManage } });
    } catch (err: any) {
        console.error("Error in getPoemById:", err);
        res.status(500).json({ success: false, error: { message: err?.message || "Failed to fetch poem" }});
    }
};

export const createPoem = async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ success: false, error: { message: "Database not configured" }});
        
        const { title, content, authorName, category, type, sourceUrl, authorToken } = req.body || {};
        
        if (!title || !content || (!authorToken && !req.user)) {
            return res.status(400).json({ success: false, error: { message: "Missing required fields" }});
        }
        
        // Use the explicitly provided authorName first. Only fallback to logged in username or 'ያልታወቀ' if none provided
        const trimmedAuthorName = typeof authorName === 'string' ? authorName.trim() : '';
        const finalAuthorName = trimmedAuthorName.length > 0 
            ? trimmedAuthorName 
            : (req.user?.username || 'ያልታወቀ');
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
        const { title, content, authorToken, authorName, category, type, sourceUrl } = req.body || {};
        
        const rawAuthorToken = authorToken || (req.headers['x-author-token'] as string) || req.headers['authorization']?.split(' ')[1];
        const isAdmin = Boolean(req.user && req.user.role === 'admin');
        
        const existing = await db.select().from(poems).where(eq(poems.id, id)).limit(1);
        if (existing.length === 0 || existing[0].status !== 'active') {
            return res.status(404).json({ success: false, error: { message: "Poem not found" }});
        }
        
        const isAuthor = Boolean(
            (rawAuthorToken && existing[0].authorTokenHash === hashToken(rawAuthorToken)) ||
            (req.user && existing[0].userId && existing[0].userId === req.user.id) ||
            (req.user && existing[0].authorTokenHash === hashToken(req.user.id))
        );
        
        if (!isAdmin && !isAuthor) {
            return res.status(403).json({ success: false, error: { message: "Forbidden: You don't own this poem" }});
        }
        
        const updateData: any = {
            title: title !== undefined ? title : existing[0].title,
            content: content !== undefined ? content : existing[0].content,
            updatedAt: new Date()
        };
        if (authorName !== undefined && typeof authorName === 'string') {
            updateData.authorName = authorName.trim() || existing[0].authorName;
        }
        if (category !== undefined) {
            updateData.category = category;
        }
        if (type !== undefined) {
            updateData.type = type;
        }
        if (sourceUrl !== undefined) {
            updateData.sourceUrl = sourceUrl;
        }
        
        const result = await db.update(poems).set(updateData).where(eq(poems.id, id)).returning();
        
        const { authorTokenHash, ...poemData } = result[0];
        res.json({ success: true, data: poemData });
    } catch (err: any) {
        console.error("Update poem error:", err);
        res.status(500).json({ success: false, error: { message: "Failed to update poem" }});
    }
};

export const deletePoem = async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(500).json({ success: false, error: { message: "Database not configured" }});
        
        const id = req.params.id as string;
        const rawAuthorToken = req.body?.authorToken 
            || (req.headers['x-author-token'] as string)
            || (req.query?.authorToken as string)
            || req.headers['authorization']?.split(' ')[1];
            
        const isAdmin = Boolean(req.user && req.user.role === 'admin');
        
        const existing = await db.select().from(poems).where(eq(poems.id, id)).limit(1);
        if (existing.length === 0 || existing[0].status === 'deleted') {
            return res.status(404).json({ success: false, error: { message: "Poem not found" }});
        }
        
        const isAuthor = Boolean(
            (rawAuthorToken && existing[0].authorTokenHash === hashToken(rawAuthorToken)) ||
            (req.user && existing[0].userId && existing[0].userId === req.user.id) ||
            (req.user && existing[0].authorTokenHash === hashToken(req.user.id))
        );
        
        if (!isAdmin && !isAuthor) {
            return res.status(403).json({ success: false, error: { message: "Forbidden: You don't have permission to delete this poem" }});
        }
        
        await db.update(poems).set({ status: 'deleted', updatedAt: new Date() }).where(eq(poems.id, id));
        await db.update(replies).set({ status: 'deleted', updatedAt: new Date() }).where(eq(replies.poemId, id));
        
        res.json({ success: true, data: { id }});
    } catch (err: any) {
        console.error("Delete poem error:", err);
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
