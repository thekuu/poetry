import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { appRouter } from "../backend/src/app.ts";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Handle both /api/path and /path in case Vercel rewrites strip or keep /api
app.use("/api", appRouter);
app.use(appRouter);

// Unmatched API routes return JSON 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}` }
  });
});

export default app;
