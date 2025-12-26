// client/src/pages/Profile/index.jsx
import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/index";
import { FaBan } from 'react-icons/fa';

import clsx from "clsx";
import axiosClient from "@/utils/axiosConfig";

import FriendActionBtn from "./components/FriendActionBtn";
import OverviewTab from "./components/OverviewTab";
import FriendsTab from "./components/FriendsTab";
import styles from "./Profile.module.scss";

// Define Tabs
const TABS = [
  { id: "overview", label: "Overview", icon: "fa-solid fa-chart-pie" },
  { id: "friends", label: "Friends", icon: "fa-solid fa-user-group" },
  { id: "clubs", label: "Clubs", icon: "fa-solid fa-users" },
];

function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();
  const friendCount = 0;

  useEffect(() => {
    // 1. Reset state immediately when username changes
    setProfileUser(null);
    setLoading(true);

    // 2. Check if username is undefined (from a broken link)
    if (!username || username === "undefined" || username === "null") {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await axiosClient.get(`/users/${username}`);
        setProfileUser(res);
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username]);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!profileUser)
    return <div className={styles.loading}>Player not found</div>;

  const isMe = currentUser && profileUser._id === currentUser._id;

  // --- RENDER CONTENT BY TAB ---
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
      {/* --- BANNER FOR DEACTIVATED ACCOUNT --- */}
      {!profileUser.isActive && (
        <div className={styles.banBanner}>
          <FaBan />
          <div>
            <p>This account has been deactivated.</p>
            <span>Reason: {profileUser.banReason || 'Terms of service violation'}</span>
          </div>
        </div>
      )}
      
      {/* --- PROFILE HEADER (Chess.com style) --- */}
      <div className={styles.profileHeader}>
        {/* Column 1: Avatar */}
        <div className={styles.avatarCol}>
          <div className={styles.avatar}>
            <img
              src={profileUser?.avatar || "/avatars/jerry1.jpg"}
              alt={profileUser?.username}
              className={styles.avatarImg}
            />
          </div>
        </div>

        {/* Column 2: Info & Stats */}
        <div className={styles.infoCol}>
          <div className={styles.nameRow}>
            <h1 className={styles.username}>{profileUser.username}</h1>
            <p className={styles.displayName}>{profileUser.displayName}</p>
          </div>
          {profileUser.bio && (
            <p className={styles.userBio}>{profileUser.bio}</p>
          )}

          <div className={styles.metaRow}>
            <div className={styles.metaItem} title="Date joined">
              <i className="fa-regular fa-calendar-days"></i>
              <span>
                {new Date(profileUser.createdAt).toLocaleDateString("en-US")}
              </span>
            </div>
            <div className={styles.metaItem} title="Number of friends">
              <i className="fa-solid fa-user-group"></i>
              <span>{friendCount} friends</span>
            </div>
          </div>
        </div>

        {/* Column 3: Actions (Buttons) */}
        <div className={styles.actionCol}>
          {isMe ? (
            <button
              className={styles.btnEdit}
              onClick={() => navigate("/settings")}
            >
              <i className="fa-solid fa-pen-to-square"></i> Edit Profile
            </button>
          ) : (
            <div className={styles.btnGroup}>
              <button className={styles.btnChallenge}>
                <i className="fa-solid fa-chess-board"></i> Challenge
              </button>
              {profileUser && <FriendActionBtn targetUserId={profileUser._id} />}
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
