import User from "../models/User.js";

// @desc: Lấy thông tin công khai của user bằng ID
// @route: GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-passwordHash -email -googleId"); // KHÔNG trả về thông tin nhạy cảm

    if (!user) {
      return res.status(404).json({ msg: "Người chơi không tồn tại." });
    }

    // Trả về format thống nhất
    res.status(200).json({
      id: user._id,
      displayName: user.displayName,
      ratings: user.ratings,
      puzzleStats: user.puzzleStats,
      createdAt: user.createdAt,
    });
  } catch (err) {
    // Lỗi CastError xảy ra nếu ID không đúng định dạng MongoDB
    if (err.name === "CastError") {
      return res.status(404).json({ msg: "Người chơi không tồn tại." });
    }
    res.status(500).json({ error: err.message });
  }
};