import express from "express";
import { getUserById } from "../controllers/userController.js";

const router = express.Router();

// Route này công khai (Public), ai cũng xem được
router.get("/:id", getUserById);

export default router;