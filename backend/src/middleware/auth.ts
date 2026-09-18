import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                username: string;
                role: string;
            };
        }
    }
}

export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token;
    if (!token) {
        return next(); // Continue without user
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = decoded;
    } catch (err) {
        // invalid token, just continue as anonymous
    }
    next();
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ success: false, error: { message: "Authentication required" }});
    }
    next();
};
