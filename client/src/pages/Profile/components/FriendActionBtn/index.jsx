import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import axiosClient from "@/utils/axiosConfig";
import { useAuth } from "@/hooks/index";
import styles from "./FriendActionBtn.module.scss";

function FriendActionBtn({ targetUserId }) {
  const { user: currentUser } = useAuth();
  const [status, setStatus] = useState("loading"); // none, pending, accepted, sent
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // 1. Fetch trạng thái ban đầu
  useEffect(() => {
    const checkStatus = async () => {
      if (!currentUser || !targetUserId) return;
      try {
        const res = await axiosClient.get(`/friends/status/${targetUserId}`);
        const { status, isRequester } = res;
        if (status === "none") setStatus("none");
        else if (status === "accepted") setStatus("accepted");
        else if (status === "pending") {
          // Nếu đang pending: Mình là người gửi (sent) hay người nhận (received)?
          setStatus(isRequester ? "sent" : "received");
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkStatus();
  }, [currentUser, targetUserId]);

  // 2. Xử lý click outside để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- ACTIONS ---

  const handleSendRequest = async () => {
    try {
      await axiosClient.post("/friends/request", { recipientId: targetUserId });
      setStatus("sent");
    } catch (err) {
      console.log(err);
      alert("Lỗi gửi lời mời");
    }
  };

  const handleUnfriend = async () => {
    if (!confirm("Bạn chắc chắn muốn hủy kết bạn?")) return;
    try {
      await axiosClient.post("/friends/unfriend", { targetUserId });
      setStatus("none");
      setShowDropdown(false);
    } catch (err) {
      console.log(err);
      alert("Lỗi xử lý");
    }
  };

  const handleAccept = async () => {
    try {
      // Gọi API mới sửa
      await axiosClient.post("/friends/accept", { requesterId: targetUserId });

      // Cập nhật UI ngay lập tức
      setStatus("accepted");

      // (Tùy chọn) Có thể reload lại list bạn bè nếu cần
    } catch (err) {
      console.error(err);
      alert("Lỗi chấp nhận kết bạn");
    }
  };

  // --- RENDER UI ---

  // Case 1: Đã là bạn bè -> Hiện nút User Check + Dropdown
  if (status === "accepted") {
    return (
      <div className={styles.container} ref={dropdownRef}>
        <button
          className={clsx(styles.btn, styles.btnFriend)}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <i className="fa-solid fa-user-check"></i> Bạn bè
          <i className={clsx("fa-solid fa-caret-down", styles.caret)}></i>
        </button>

        {showDropdown && (
          <div className={styles.dropdown}>
            <div
              className={clsx(styles.item, styles.danger)}
              onClick={handleUnfriend}
            >
              <i className="fa-solid fa-user-xmark"></i> Hủy kết bạn
            </div>
          </div>
        )}
      </div>
    );
  }

  // Case 2: Đã gửi lời mời (Chờ đối phương đồng ý)
  if (status === "sent") {
    return (
      <button
        className={clsx(styles.btn, styles.btnGray)}
        onClick={handleUnfriend}
      >
        <i className="fa-solid fa-user-clock"></i> Đã gửi lời mời
      </button>
    );
  }

  // Case 3: Nhận được lời mời (Chờ mình đồng ý)
  if (status === "received") {
    return (
      <div className={styles.btnGroup}>
        <button
          className={clsx(styles.btn, styles.btnGreen)}
          onClick={handleAccept}
        >
          Chấp nhận
        </button>
        <button
          className={clsx(styles.btn, styles.btnGray)}
          onClick={handleUnfriend}
        >
          Từ chối
        </button>
      </div>
    );
  }

  // Case 4: Chưa là bạn bè -> Nút Thêm bạn
  return (
    <button
      className={clsx(styles.btn, styles.btnAdd)}
      onClick={handleSendRequest}
    >
      <i className="fa-solid fa-user-plus"></i> Thêm bạn
    </button>
  );
}

export default FriendActionBtn;
