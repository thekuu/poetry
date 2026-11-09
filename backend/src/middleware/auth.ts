import type { Request, Response, NextFunction } from 'express';
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
    let token = req.cookies?.token;
    
    // Check Authorization Bearer header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.substring(7).trim();
    }
    
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            req.user = decoded;
            return next();
        } catch (err) {
            // invalid token - leave req.user undefined
        }
    }
    
    next();
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ success: false, error: { message: "Authentication required" }});
    }
    next();
};
