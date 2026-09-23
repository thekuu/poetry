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
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: { message: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}` }
  });
});

// Global error handler - ensure all unhandled errors return clean JSON
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error in serverless function:", err);
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: {
        message: err?.message || "Internal server error"
      }
    });
  }
});

export default app;
