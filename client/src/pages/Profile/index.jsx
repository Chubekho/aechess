import { useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/index";

import clsx from "clsx";
import axiosClient from "@/utils/axiosConfig";

import GameHistory from "@/components/GameHistory";
import styles from "./Profile.module.scss";

// Định nghĩa các Tabs
const TABS = [
  { id: "overview", label: "Tổng quan", icon: "fa-solid fa-chart-pie" },
  { id: "friends", label: "Bạn bè", icon: "fa-solid fa-user-group" },
  { id: "clubs", label: "Các câu lạc bộ", icon: "fa-solid fa-users" },
];

function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Giả lập số liệu bạn bè/views (vì API user hiện tại chưa có, sau này populate sau)
  const friendCount = 0; 

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        let userIdToFetch = id;
        if (!id && currentUser) userIdToFetch = currentUser.id;
        else if (!id && !currentUser) return navigate("/login");

        // Gọi API lấy thông tin user
        const res = await axiosClient.get(`/users/${userIdToFetch}`);
        setProfileUser(res.data);
      } catch (error) {
        console.error("Lỗi tải profile:", error);
        // navigate("/"); // Tạm thời comment để debug nếu lỗi
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, currentUser, navigate]);

  if (loading) return <div className={styles.loading}>Đang tải...</div>;
  if (!profileUser) return <div className={styles.loading}>Không tìm thấy người chơi</div>;

  const isMe = currentUser && (profileUser._id === currentUser.id || profileUser.id === currentUser.id);

  // --- RENDER CONTENT THEO TAB ---
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className={styles.tabContent}>
            {/* Hàng 1: Các chỉ số Rating */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <i className="fa-solid fa-bolt" style={{color: '#ffce47'}}></i> Blitz
                </div>
                <div className={styles.statValue}>{profileUser.ratings?.blitz || 1200}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <i className="fa-solid fa-rocket" style={{color: '#a7d8de'}}></i> Bullet
                </div>
                <div className={styles.statValue}>{profileUser.ratings?.bullet || 1200}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <i className="fa-solid fa-stopwatch" style={{color: '#769656'}}></i> Rapid
                </div>
                <div className={styles.statValue}>{profileUser.ratings?.rapid || 1200}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <i className="fa-solid fa-puzzle-piece" style={{color: '#d64f00'}}></i> Puzzle
                </div>
                <div className={styles.statValue}>{Math.floor(profileUser.puzzleStats?.rating) || 1500}</div>
              </div>
            </div>

            {/* Hàng 2: Lịch sử đấu (Tái sử dụng Component cũ) */}
            <div className={styles.sectionBlock}>
                <GameHistory limit={10} userId={profileUser.id} />
            </div>
          </div>
        );
      
      
      case "friends":
        return (
            <div className={styles.tabContent}>
                <div className={styles.friendsHeader}>
                    <h3>Bạn bè ({friendCount})</h3>
                    {isMe && (
                        <div className={styles.friendActions}>
                            <button className={styles.btnSecondary}><i className="fa-solid fa-user-plus"></i> Tìm bạn bè</button>
                            <button className={styles.btnSecondary}><i className="fa-solid fa-envelope"></i> Lời mời kết bạn</button>
                        </div>
                    )}
                </div>
                {/* List bạn bè sẽ render ở đây */}
                <div className={styles.placeholder}>Chưa có bạn bè nào.</div>
            </div>
        );

      case "clubs":
        return <div className={styles.placeholder}>Danh sách câu lạc bộ (Coming Soon)</div>;

      default:
        return null;
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* --- HEADER PROFILE (Giống Chess.com) --- */}
      <div className={styles.profileHeader}>
        {/* Cột 1: Avatar */}
        <div className={styles.avatarCol}>
            <div className={styles.avatar}>
               {/* Thay bằng ảnh thật nếu có profileUser.avatar */}
               <i className="fa-solid fa-user"></i> 
            </div>
        </div>

        {/* Cột 2: Info & Stats */}
        <div className={styles.infoCol}>
            <div className={styles.nameRow}>
                <h1 className={styles.displayName}>{profileUser.displayName}</h1>
                {/* Có thể thêm cờ quốc gia ở đây nếu muốn */}
            </div>
            
            <div className={styles.metaRow}>
                <div className={styles.metaItem} title="Ngày tham gia">
                    <i className="fa-regular fa-calendar-days"></i>
                    <span>{new Date(profileUser.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
                <div className={styles.metaItem} title="Số bạn bè">
                    <i className="fa-solid fa-user-group"></i>
                    <span>{friendCount} bạn bè</span>
                </div>
            </div>
        </div>

        {/* Cột 3: Actions (Nút bấm) */}
        <div className={styles.actionCol}>
            {isMe ? (
                <button className={styles.btnEdit}>
                    <i className="fa-solid fa-pen-to-square"></i> Chỉnh sửa hồ sơ
                </button>
            ) : (
                <div className={styles.btnGroup}>
                    <button className={styles.btnChallenge}>
                        <i className="fa-solid fa-chess-board"></i> Thách đấu
                    </button>
                    <button className={styles.btnAddFriend}>
                        <i className="fa-solid fa-user-plus"></i> Thêm bạn
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* --- NAVIGATION TABS --- */}
      <div className={styles.navTabs}>
        {TABS.map((tab) => (
            <div 
                key={tab.id}
                className={clsx(styles.tabItem, { [styles.active]: activeTab === tab.id })}
                onClick={() => setActiveTab(tab.id)}
            >
                {/* <i className={tab.icon}></i> Ẩn icon cho gọn giống chess.com web */}
                <span>{tab.label}</span>
            </div>
        ))}
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className={styles.mainContent}>
         {renderTabContent()}
      </div>

    </div>
  );
}

export default Profile;