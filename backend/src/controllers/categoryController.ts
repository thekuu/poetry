import { Request, Response } from "express";
import { CATEGORIES } from "../utils/constants.js";

export const getCategories = async (req: Request, res: Response) => {
    try {
        res.json({ success: true, data: CATEGORIES });
    } catch (err: any) {
        res.status(500).json({ success: false, error: { message: "Failed to fetch categories" }});
    }
};
