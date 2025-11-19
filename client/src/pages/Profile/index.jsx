// pages/Profile/index.jsx
import { useAuth } from "@/hooks/index";
import GameHistory from "@/components/GameHistory"; // Import component
import styles from "./Profile.module.scss";
import clsx from "clsx";
import { Navigate } from "react-router"; // Dùng để đá về trang chủ nếu chưa login

function Profile() {
  const { user, loading } = useAuth();

  // Nếu đang check auth, hiển thị loading
  if (loading) {
    return <div className={styles.loading}>Đang tải...</div>;
  }

  // Nếu check xong mà không có user, đá về trang chủ
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.wrapper}>
      {/* Phần 1: Thông tin User */}
      <div className={styles.profileHeader}>
        <div className={styles.avatar}>
          {/* (Bạn có thể thêm ảnh avatar sau) */}
          <i className="fa-solid fa-user-astronaut"></i>
        </div>
        <div className={styles.userInfo}>
          <h1 className={styles.displayName}>{user.displayName}</h1>
          
          {/* Tái sử dụng layout 'ratingsRow' từ Lobby */}
          <div className={styles.ratingsRow}>
            <div className={styles.ratingItem}>
              <i className={clsx("fa-solid fa-rocket", styles.icon)}></i>
              <span>{user.ratings.bullet || 1200}</span>
            </div>
            <div className={styles.ratingItem}>
              <i className={clsx("fa-solid fa-bolt", styles.icon)}></i>
              <span>{user.ratings.blitz || 1200}</span>
            </div>
            <div className={styles.ratingItem}>
              <i className={clsx("fa-regular fa-clock", styles.icon)}></i>
              <span>{user.ratings.rapid || 1200}</span>
            </div>
            <div className={styles.ratingItem}>
              <i className={clsx("fa-solid fa-hourglass-half", styles.icon)}></i>
              <span>{user.ratings.classical || 1200}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Phần 2: Lịch sử đấu (Component tái sử dụng) */}
      <div className={styles.historyContainer}>
        {/* Truyền limit cao (ví dụ 50) để hiển thị nhiều hơn */}
        <GameHistory limit={50} />
      </div>
    </div>
  );
}

export default Profile;