// server/controllers/puzzleController.js
import Puzzle from '../models/Puzzle.js';
import User from '../models/User.js';
import { Glicko2 } from 'glicko2';

const glicko = new Glicko2({
  tau: 0.5,
  rating: 1500,
  rd: 350,
  vol: 0.06
});

// Sử dụng export const thay vì exports.func
export const getPuzzle = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) return res.status(404).json({ message: "User not found" });

    const userRating = user.puzzleStats.rating;

    // Tìm puzzle +/- 200 Elo
    const puzzles = await Puzzle.aggregate([
      { 
        $match: { 
          rating: { $gte: userRating - 200, $lte: userRating + 200 } 
        } 
      },
      { $sample: { size: 1 } }
    ]);

    let puzzle = puzzles[0];
    
    // Fallback nếu không tìm thấy
    if (!puzzle) {
        const randomPuzzles = await Puzzle.aggregate([{ $sample: { size: 1 } }]);
        puzzle = randomPuzzles[0];
    }

    if (!puzzle) {
      return res.status(404).json({ message: "No puzzle data available" });
    }

    res.status(200).json(puzzle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error getting puzzle" });
  }
};

export const solvePuzzle = async (req, res) => {
  try {
    const userId = req.user.id;
    const { puzzleId, isCorrect } = req.body;

    const user = await User.findById(userId);
    const puzzle = await Puzzle.findOne({ puzzleId: puzzleId });

    if (!user || !puzzle) return res.status(404).json({ message: "Data not found" });

    // --- GLICKO-2 LOGIC ---
    const playerUser = glicko.makePlayer(user.puzzleStats.rating, user.puzzleStats.rd, user.puzzleStats.vol);
    const playerPuzzle = glicko.makePlayer(puzzle.rating, puzzle.rd, puzzle.vol);

    const score = isCorrect ? 1 : 0;
    const matches = [[playerUser, playerPuzzle, score]];
    
    glicko.updateRatings(matches);

    const oldRating = user.puzzleStats.rating;
    const newRating = playerUser.getRating();
    const ratingChange = Math.round(newRating - oldRating);

    // Cập nhật User
    user.puzzleStats = {
      rating: newRating,
      rd: playerUser.getRd(),
      vol: playerUser.getVol()
    };
    
    // Cập nhật Puzzle
    puzzle.rating = playerPuzzle.getRating();
    puzzle.rd = playerPuzzle.getRd();
    puzzle.vol = playerPuzzle.getVol();

    await user.save();
    await puzzle.save();

    res.status(200).json({
      success: true,
      newRating: Math.round(newRating),
      ratingChange: ratingChange,
      message: isCorrect ? "Correct!" : "Incorrect!"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error solving puzzle" });
  }
};