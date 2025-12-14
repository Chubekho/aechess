import express from "express";
import { getUserById, getUserProfile } from "../controllers/userController.js";

const router = express.Router();

// Route này công khai (Public), ai cũng xem được
router.get("/:username", getUserProfile);

export default router;
