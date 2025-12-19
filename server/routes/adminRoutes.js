// server/routes/adminRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import verifyAdmin from "../middleware/adminMiddleware.js";
import {
  getUsers,
  banUser,
  getDashboardStats,
} from "../controllers/adminController.js";

const router = express.Router();

// Apply auth and admin middleware to all admin routes
router.use(authMiddleware, verifyAdmin);

// GET /api/admin/users - Get all users
router.get("/users", getUsers);

// PATCH /api/admin/users/:id/ban - Toggle user's isActive status
router.patch("/users/:id/ban", banUser);

// GET /api/admin/stats - Get basic statistics
router.get("/stats", getDashboardStats);

export default router;
