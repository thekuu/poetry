import { Router } from "express";
import { getPoems, getPoemById, createPoem, updatePoem, deletePoem, searchPoems } from "./controllers/poemController.js";
import { getRepliesByPoemId, createReply, updateReply, deleteReply } from "./controllers/replyController.js";
import { getCategories } from "./controllers/categoryController.js";
import { scrapeTelegram, getChannels, addChannel, deleteChannel, createAdmin, getUsers, updateUserRole } from "./controllers/adminController.js";
import { login, register, logout, getMe } from "./controllers/authController.js";
import { authenticateUser } from "./middleware/auth.js";

export const appRouter = Router();

appRouter.use(authenticateUser);

appRouter.post("/auth/register", register);
appRouter.post("/auth/login", login);
appRouter.post("/auth/logout", logout);
appRouter.get("/auth/me", getMe);

appRouter.post("/admin/create-admin", createAdmin);
appRouter.get("/admin/users", getUsers);
appRouter.patch("/admin/users/:id/role", updateUserRole);
appRouter.post("/admin/scrape", scrapeTelegram);
appRouter.get("/admin/channels", getChannels);
appRouter.post("/admin/channels", addChannel);
appRouter.delete("/admin/channels/:id", deleteChannel);

appRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    dbConfigured: Boolean(process.env.DATABASE_URL),
    timestamp: new Date().toISOString()
  });
});

appRouter.get("/search", searchPoems);
appRouter.get("/categories", getCategories);

appRouter.get("/poems", getPoems);
appRouter.get("/poems/:id", getPoemById);
appRouter.post("/poems", createPoem);
appRouter.patch("/poems/:id", updatePoem);
appRouter.delete("/poems/:id", deletePoem);

appRouter.get("/poems/:id/replies", getRepliesByPoemId);
appRouter.post("/poems/:id/replies", createReply);

appRouter.patch("/replies/:id", updateReply);
appRouter.delete("/replies/:id", deleteReply);
