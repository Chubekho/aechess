import express from "express";
import { 
    getUserProfile,
    updatePreferences,
    setPassword,
    changePassword,
    updateProfile
} from "../controllers/userController.js";
import checkAuth from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route to get user profile
router.get("/:username", getUserProfile);

// Protected routes
router.patch("/profile", checkAuth, updateProfile);
router.patch("/preferences", checkAuth, updatePreferences);
router.post("/set-password", checkAuth, setPassword);
router.post("/change-password", checkAuth, changePassword);


export default router;