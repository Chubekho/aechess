import { useState, useEffect } from "react";
import clsx from "clsx";
import axiosClient from "@/utils/axiosConfig";
import FriendActionBtn from "./FriendActionBtn";
import styles from "../Profile.module.scss";

// Sub-component hiển thị 1 dòng User (User Card)
const UserCard = ({ user, subText, action }) => {
  // Phòng hờ user bị null
  if (!user) return null;

  return (
    <div className={styles.friendCard}>
      <div className={styles.cardLeft}>
        <div className={styles.miniAvatar}>
          {/* Nếu có avatar thì hiện ảnh, không thì hiện icon */}
          {user.avatar ? (
            <img src={user.avatar} alt="avt" className={styles.imgAvatar} />
          ) : (
            <i className="fa-solid fa-user"></i>
          )}
        </div>
        <div className={styles.cardInfo}>
          <div className={styles.cardName}>
            {user.displayName}
            <span className={styles.flag}>
              <i className="fa-solid fa-flag"></i>
            </span>
          </div>
          <div className={styles.cardSub}>{subText || `@${user.username}`}</div>
        </div>
      </div>
      <div className={styles.cardRight}>
        {action ? (
          action
        ) : (
          <FriendActionBtn targetUserId={user._id || user.id} />
        )}
      </div>
    </div>
  );
};

function FriendsTab({ user, isMe }) {
  const [activeSubTab, setActiveSubTab] = useState("all");
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // Lấy ID chuẩn (ưu tiên _id của Mongo)
  const targetUserId = user?._id || user?.id;

  // Logic fetch data
  useEffect(() => {
    if (!targetUserId) return; // Nếu chưa có ID thì không fetch

    // Nếu xem profile người khác -> Force về tab 'all' (vì không xem được request của họ)
    if (!isMe && activeSubTab !== "all") {
      setActiveSubTab("all");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        let res;
        if (activeSubTab === "all") {
          // API lấy list bạn bè.
          // Nếu xem của người khác, cần truyền userId lên server
          // (Server cần update logic nhận query param userId, nếu chưa có thì mặc định lấy current user)
          res = await axiosClient.get(`/friends/list?userId=${targetUserId}`);
        } else if (activeSubTab === "requests") {
          res = await axiosClient.get("/friends/pending");
        } else if (activeSubTab === "sent") {
          res = await axiosClient.get("/friends/sent");
        }

        // Đảm bảo data luôn là mảng
        setDataList(Array.isArray(res) ? res : []);
      } catch (error) {
        console.error("Lỗi tải bạn bè", error);
        setDataList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeSubTab, isMe, targetUserId]);

  // Logic Search
  const filteredList = dataList.filter((item) => {
    if (!item) return false;

    // Normalize item tùy theo tab
    let targetUser = item;

    // Nếu là tab Requests/Sent, item là Friendship object, cần lấy user bên trong
    if (activeSubTab === "requests") targetUser = item.requester;
    if (activeSubTab === "sent") targetUser = item.recipient;

    if (!targetUser) return false;

    const name = targetUser.displayName || "";
    const username = targetUser.username || "";

    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className={styles.tabContent}>
      {/* Header Tab */}
      <div className={styles.subTabs}>
        <button
          className={clsx(styles.subTabBtn, {
            [styles.active]: activeSubTab === "all",
          })}
          onClick={() => setActiveSubTab("all")}
        >
          Bạn bè (
          {activeSubTab === "all"
            ? filteredList.length
            : isMe
            ? "0"
            : filteredList.length}
          )
        </button>

        {isMe && (
          <>
            <button
              className={clsx(styles.subTabBtn, {
                [styles.active]: activeSubTab === "requests",
              })}
              onClick={() => setActiveSubTab("requests")}
            >
              Lời mời kết bạn
            </button>
            <button
              className={clsx(styles.subTabBtn, {
                [styles.active]: activeSubTab === "sent",
              })}
              onClick={() => setActiveSubTab("sent")}
            >
              Đã gửi
            </button>
          </>
        )}
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <i className="fa-solid fa-magnifying-glass"></i>
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <i
            className={clsx("fa-solid fa-xmark", styles.clearBtn)}
            onClick={() => setSearchTerm("")}
          ></i>
        )}
      </div>

      {/* List Content */}
      <div className={styles.friendListContainer}>
        {loading ? (
          <div className={styles.loading}>Đang tải...</div>
        ) : filteredList.length === 0 ? (
          <div className={styles.emptyState}>Không tìm thấy kết quả nào.</div>
        ) : (
          filteredList.map((item, index) => {
            let u = item;
            let sub = `Bạn bè`;
            let actionBtn = null; // Default action logic

            // Xử lý data cho từng tab
            if (activeSubTab === "requests") {
              u = item.requester;
              sub = `Đã gửi lời mời: ${new Date(
                item.createdAt
              ).toLocaleDateString("vi-VN")}`;
              // Ở tab Requests, action là nút Chấp nhận/Từ chối (FriendActionBtn tự xử lý dựa trên status 'received')
            } else if (activeSubTab === "sent") {
              u = item.recipient;
              sub = `Đã gửi: ${new Date(item.createdAt).toLocaleDateString(
                "vi-VN"
              )}`;
              // Ở tab Sent, FriendActionBtn tự xử lý hiện 'Đã gửi'
            }

            // Key an toàn
            const key = u?._id || u?.id || index;

            return (
              <UserCard key={key} user={u} subText={sub} action={actionBtn} />
            );
          })
        )}
      </div>
    </div>
  );
}

export default FriendsTab;
