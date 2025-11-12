import express from "express";
import { getMyGameHistory } from "../controllers/gameController.js";
import checkAuth from "../middleware/authMiddleware.js";

const router = express.Router();

// Lấy lịch sử đấu (cần đăng nhập)
router.get("/my-history", checkAuth, getMyGameHistory);

export default router;