import mongoose from "mongoose";

const friendshipSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "blocked"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Index để query nhanh hơn: Đảm bảo 1 cặp user chỉ có 1 document quan hệ duy nhất
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export default mongoose.model("Friendship", friendshipSchema);
