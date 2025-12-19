import User from "../models/User.js";

const verifyAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user && user.role === "admin") {
      req.user = user;
      next();
    } else {
      res.status(403).json({ message: "Access denied. Admins only." });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error during admin verification." });
  }
};

export default verifyAdmin;
