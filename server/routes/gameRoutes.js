import express from "express";
import { getGameById, getGameHistory } from "../controllers/gameController.js";
import checkAuth from "../middleware/authMiddleware.js";

const router = express.Router();

// Lấy lịch sử đấu (cần đăng nhập)
router.get("/history", getGameHistory);
router.get("/:id", checkAuth, getGameById);


export default router;