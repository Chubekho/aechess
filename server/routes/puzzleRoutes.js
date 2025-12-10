// server/routes/puzzleRoutes.js
import express from 'express';
// Nhớ thêm .js khi import file local
import * as puzzleController from '../controllers/puzzleController.js'; 
import checkAuth from '../middleware/authMiddleware.js'; 

const router = express.Router();


router.get('/next', checkAuth, puzzleController.getPuzzle);
router.post('/solve', checkAuth, puzzleController.solvePuzzle);

export default router;