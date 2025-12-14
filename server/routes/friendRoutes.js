import express from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  getFriendsList,
  getPendingRequests,
  getSentRequests,
  checkFriendshipStatus,
  unfriend,
} from "../controllers/friendController.js";
import checkAuth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/request", checkAuth, sendFriendRequest);
router.post("/accept", checkAuth, acceptFriendRequest);
router.get("/list", checkAuth, getFriendsList);
router.get("/pending", checkAuth, getPendingRequests);
router.get('/sent', checkAuth, getSentRequests);
router.get("/status/:targetUserId", checkAuth, checkFriendshipStatus);
router.post("/unfriend", checkAuth, unfriend);

export default router;
