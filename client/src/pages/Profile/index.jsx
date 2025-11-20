// pages/Profile/index.jsx
import { useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";

import clsx from "clsx";
import axios from "axios";

import { useAuth } from "@/hooks/index";

import GameHistory from "@/components/GameHistory";
import styles from "./Profile.module.scss";

function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Trường hợp 1: Xem profile của chính mình
        if (currentUser && (id === currentUser.id || id === currentUser._id)) {
          setProfileUser(currentUser);
        }
        // Trường hợp 2: Xem profile người khác (Cần gọi API)
        else {
          // Bạn cần tạo thêm API get user by ID ở backend
          const res = await axios.get(`/api/users/${id}`);
          setProfileUser(res.data);
        }
      } catch (error) {
        console.error("Lỗi tải profile:", error);
        navigate("/"); // Đá về trang chủ nếu lỗi (ví dụ: không tìm thấy user)
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [id, currentUser, navigate]);

  // Nếu đang check auth, hiển thị loading
  if (loading) {
    return <div className={styles.loading}>Đang tải...</div>;
  }

  // Nếu check xong mà không có user, đá về trang chủ
  if (!profileUser) {
    return (
      <div className={styles.wrapper}>
        <h2 style={{ textAlign: "center" }}>Không tìm thấy người chơi này.</h2>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={() => navigate("/")}
            style={{ padding: "10px 20px", cursor: "pointer" }}
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* Phần 1: Thông tin User */}
      <div className={styles.profileHeader}>
        <div className={styles.avatar}>
          <i className="fa-solid fa-user-astronaut"></i>
        </div>
        <div className={styles.userInfo}>
          <h1 className={styles.displayName}>{profileUser.displayName}</h1>
          <p style={{ color: "#888", fontSize: "1.4rem" }}>
            Tham gia:{" "}
            {new Date(profileUser.createdAt).toLocaleDateString("vi-VN")}
          </p>

          <div className={styles.ratingsRow}>
            <div className={styles.ratingItem}>
              <i className={clsx("fa-solid fa-rocket", styles.icon)}></i>
              <span>{profileUser.ratings?.bullet || 1200}</span>
            </div>
            <div className={styles.ratingItem}>
              <i className={clsx("fa-solid fa-bolt", styles.icon)}></i>
              <span>{profileUser.ratings?.blitz || 1200}</span>
            </div>
            <div className={styles.ratingItem}>
              <i className={clsx("fa-regular fa-clock", styles.icon)}></i>
              <span>{profileUser.ratings?.rapid || 1200}</span>
            </div>
            <div className={styles.ratingItem}>
              <i
                className={clsx("fa-solid fa-hourglass-half", styles.icon)}
              ></i>
              <span>{profileUser.ratings?.classical || 1200}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Phần 2: Lịch sử đấu */}
      <div className={styles.historyContainer}>
        <GameHistory limit={50} userId={profileUser.id} />
      </div>
    </div>
  );
}

export default Profile;
