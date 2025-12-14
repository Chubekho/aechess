import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/index";

import clsx from "clsx";
import axiosClient from "@/utils/axiosConfig";

import FriendActionBtn from "./components/FriendActionBtn";
import OverviewTab from "./components/OverviewTab";
import FriendsTab from "./components/FriendsTab";
import styles from "./Profile.module.scss";

// Định nghĩa các Tabs
const TABS = [
  { id: "overview", label: "Tổng quan", icon: "fa-solid fa-chart-pie" },
  { id: "friends", label: "Bạn bè", icon: "fa-solid fa-user-group" },
  { id: "clubs", label: "Các câu lạc bộ", icon: "fa-solid fa-users" },
];

function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  // const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const friendCount = 0;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        // Gọi API với username
        const res = await axiosClient.get(`/users/${username}`);
        setProfileUser(res.data);
      } catch (err) {
        // Xử lý lỗi 404 nếu gõ sai username
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchUser();
  }, [username]);

  if (loading) return <div className={styles.loading}>Đang tải...</div>;
  if (!profileUser)
    return <div className={styles.loading}>Không tìm thấy người chơi</div>;

  const isMe = currentUser && profileUser.id === currentUser.id;

  // --- RENDER CONTENT THEO TAB ---
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab user={profileUser} />;
      case "friends":
        return <FriendsTab user={profileUser} isMe={isMe} />;
      case "clubs":
        return <div className={styles.placeholder}>Clubs Coming Soon</div>;
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
            <h1 className={styles.username}>{profileUser.username}</h1>
            <p className={styles.displayName}>{profileUser.displayName}</p>
          </div>

          <div className={styles.metaRow}>
            <div className={styles.metaItem} title="Ngày tham gia">
              <i className="fa-regular fa-calendar-days"></i>
              <span>
                {new Date(profileUser.createdAt).toLocaleDateString("vi-VN")}
              </span>
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
              {profileUser && <FriendActionBtn targetUserId={profileUser.id} />}
            </div>
          )}
        </div>
      </div>

      {/* --- NAVIGATION TABS --- */}
      <div className={styles.navTabs}>
        {TABS.map((tab) => (
          <div
            key={tab.id}
            className={clsx(styles.tabItem, {
              [styles.active]: activeTab === tab.id,
            })}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={tab.icon}></i>
            <span>{tab.label}</span>
          </div>
        ))}
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className={styles.mainContent}>{renderTabContent()}</div>
    </div>
  );
}

export default Profile;
