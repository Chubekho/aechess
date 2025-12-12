import express from "express";
import * as friendController from "../controllers/friendController.js";
import checkAuth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/request", checkAuth, friendController.sendFriendRequest);
router.post("/accept", checkAuth, friendController.acceptFriendRequest);
router.get("/list", checkAuth, friendController.getFriendsList); // List bạn bè
router.get("/pending", checkAuth, friendController.getPendingRequests); // List lời mời nhận được
router.get(
  "/status/:targetUserId",
  checkAuth,
  friendController.checkFriendshipStatus
); // Check quan hệ

export default router;
