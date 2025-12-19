// server/routes/adminRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import verifyAdmin from "../middleware/adminMiddleware.js";
import {
  getUsers,
  banUser,
  getDashboardStats,
  getActiveGames,
  abortGame,
} from "../controllers/adminController.js";

const router = express.Router();

// Apply auth and admin middleware to all admin routes
router.use(authMiddleware, verifyAdmin);

// User Management
router.get("/users", getUsers);
router.patch("/users/:id/ban", banUser);

// Dashboard
router.get("/stats", getDashboardStats);

// Game Monitoring
router.get("/games/active", getActiveGames);
router.patch("/games/:gameId/abort", abortGame);


export default router;
