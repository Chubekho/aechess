import Friendship from "../models/Friendship.js";
import User from "../models/User.js";

// 1. Gửi lời mời kết bạn
export const sendFriendRequest = async (req, res) => {
  try {
    const requesterId = req.user.id; // Người gửi (lấy từ token)
    const { recipientId } = req.body; // Người nhận (gửi từ client)

    if (requesterId === recipientId) {
      return res
        .status(400)
        .json({ message: "Không thể kết bạn với chính mình" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Người dùng này không tồn tại" });
    }

    // Kiểm tra xem đã có quan hệ nào chưa (cả 2 chiều)
    const existing = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existing) {
      if (existing.status === "pending")
        return res
          .status(400)
          .json({ message: "Đã có lời mời đang chờ xử lý." });
      if (existing.status === "accepted")
        return res.status(400).json({ message: "Hai bạn đã là bạn bè." });
      return res.status(400).json({ message: "Không thể gửi lời mời." });
    }

    // Tạo lời mời mới
    const newFriendship = new Friendship({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
    });

    await newFriendship.save();
    res
      .status(200)
      .json({ message: "Đã gửi lời mời kết bạn", data: newFriendship });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 2. Chấp nhận lời mời
export const acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id; // Mình là người nhận (Recipient)
    const { requesterId } = req.body; // ID người gửi

    // Tìm lời mời đang pending giữa 2 người
    const friendship = await Friendship.findOne({
      requester: requesterId,
      recipient: userId,
      status: "pending",
    });

    if (!friendship)
      return res.status(404).json({ message: "Không tìm thấy lời mời." });

    friendship.status = "accepted";
    await friendship.save();

    res.status(200).json({ message: "Đã chấp nhận kết bạn", data: friendship });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 3. Lấy danh sách bạn bè (Đã accept)
export const getFriendsList = async (req, res) => {
  try {
    const userId = req.user.id;

    // Tìm tất cả record mà user là requester HOẶC recipient, VÀ status là 'accepted'
    const friendships = await Friendship.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: "accepted",
    })
      .populate("requester", "displayName avatar ratings") // Lấy thông tin user
      .populate("recipient", "displayName avatar ratings");

    // Format lại dữ liệu để trả về list user đơn giản
    const friends = friendships.map((f) => {
      // Nếu mình là requester thì bạn là recipient và ngược lại
      return f.requester._id.toString() === userId ? f.recipient : f.requester;
    });

    res.status(200).json(friends);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 4. Lấy danh sách lời mời kết bạn (Pending) - Để hiển thị thông báo
export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    // Tìm các lời mời mà mình là người NHẬN (recipient) và status là 'pending'
    const requests = await Friendship.find({
      recipient: userId,
      status: "pending",
    }).populate("requester", "displayName avatar ratings");

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy danh sách mình đi gửi người ta (Pending)
export const getSentRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await Friendship.find({
      requester: userId,
      status: 'pending'
    }).populate('recipient', 'username displayName avatar ratings'); // Populate người nhận

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const unfriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.body;

    // Tìm và xóa record friendship (bất kể ai là người gửi)
    const deleted = await Friendship.findOneAndDelete({
      $or: [
        { requester: userId, recipient: targetUserId },
        { requester: targetUserId, recipient: userId },
      ],
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy quan hệ bạn bè." });
    }

    res.status(200).json({ message: "Đã hủy kết bạn/lời mời." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 5. Kiểm tra trạng thái bạn bè với 1 user cụ thể (Để hiện nút Kết bạn/Đã gửi/Bạn bè trên Profile người khác)
export const checkFriendshipStatus = async (req, res) => {
  try {
    const myId = req.user.id;
    const { targetUserId } = req.params;

    const friendship = await Friendship.findOne({
      $or: [
        { requester: myId, recipient: targetUserId },
        { requester: targetUserId, recipient: myId },
      ],
    });

    if (!friendship) return res.json({ status: "none" }); // Chưa kết bạn

    // Trả về status và role (để biết ai là người gửi nếu đang pending)
    res.json({
      status: friendship.status,
      isRequester: friendship.requester.toString() === myId,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};
