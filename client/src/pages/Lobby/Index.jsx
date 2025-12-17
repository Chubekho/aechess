// client/src/pages/Lobby/index.jsx
import { useAuth, useSocket, useToast} from "@/hooks/index";
import { useNavigate, Link } from "react-router";
import { useEffect, useState, useRef } from "react";
import Modal from "react-modal";
import clsx from "clsx";
import styles from "./Lobby.module.scss";

import GameHistory from "@/components/GameHistory";

// Cấu trúc dữ liệu cho các ô Time Control
const timePools = [
  { display: "1+0", category: "Bullet", timeControl: "1+0" },
  { display: "1+1", category: "Bullet", timeControl: "1+1" },
  { display: "2+1", category: "Bullet", timeControl: "2+1" },
  { display: "3+0", category: "Blitz", timeControl: "3+0" },
  { display: "3+2", category: "Blitz", timeControl: "3+2" },
  { display: "5+0", category: "Blitz", timeControl: "5+0" },
  { display: "10+0", category: "Rapid", timeControl: "10+0" },
  { display: "10+5", category: "Rapid", timeControl: "10+5" },
  { display: "15+10", category: "Rapid", timeControl: "15+10" },
  { display: "30+0", category: "Classical", timeControl: "30+0" },
  { display: "30+20", category: "Classical", timeControl: "30+20" },
  { display: "Tùy chỉnh", category: "Custom", timeControl: "custom" },
];

// Style cho Modal (custom)
const customModalStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    background: "#3c3934",
    border: "1px solid #555",
    borderRadius: "8px",
    padding: "0",
    width: "400px",
    overflow: "visible", // Tắt overflow
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)", // Overlay mờ
  },
};

function Lobby() {
  const socket = useSocket();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  // MỚI: State quản lý 3 trạng thái
  const [searchState, setSearchState] = useState("idle"); // idle, searching, found
  const [foundMatchData, setFoundMatchData] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0); // State hiển thị thời gian trôi qua (để render UI)
  const startTimeRef = useRef(null); // Ref lưu thời điểm BẮT ĐẦU tìm kiếm (Timestamp)
  const intervalRef = useRef(null); // Ref lưu ID của interval để cleanup
  const timerRef = useRef(null);

  // === Xử lý Socket Events ===
  useEffect(() => {
    if (!socket) return;

    // 1. Server báo "TÌM THẤY TRẬN"
    const onMatchFound = (data) => {
      console.log("Match Found:", data);
      setFoundMatchData(data); // Lưu data (matchId, opponent)
      setSearchState("found_modal");

      // Hủy timer "đang tìm"
      if (timerRef.current) clearInterval(timerRef.current);
    };

    // 2. Server báo "GAME BẮT ĐẦU" (sau khi cả 2 chấp nhận)
    const onGameStart = (data) => {
      console.log("Game Starting:", data.gameId);
      // Đóng tất cả modal và chuyển trang
      setSearchState("idle");
      navigate(`/game/${data.gameId}`);
    };

    // 3. Server báo "TRẬN HỦY" (đối thủ từ chối / hết giờ)
    const onMatchAborted = () => {
      console.log("Match Aborted");
      setFoundMatchData(null);
      if (searchState !== "declined") {
        toast.error("Trận đấu đã bị hủy (hết giờ / đối thủ từ chối)", 3000);
      }
      setSearchState("idle");
    };

    socket.on("matchFound", onMatchFound);
    socket.on("gameStart", onGameStart);
    socket.on("matchAborted", onMatchAborted);

    return () => {
      socket.off("matchFound", onMatchFound);
      socket.off("gameStart", onGameStart);
      socket.off("matchAborted", onMatchAborted);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, navigate, searchState]);

  // === useEffect cho Timer "Đang tìm" ===
  useEffect(() => {
    // Chỉ chạy timer khi đang ở trạng thái tìm kiếm
    const isSearching =
      searchState === "searching_modal" || searchState === "searching_panel";

    if (isSearching) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
        setElapsedTime(0);
      }
      // Tạo interval cập nhật UI mỗi giây
      intervalRef.current = setInterval(() => {
        // Tính thời gian dựa trên độ chênh lệch hiện tại - lúc bắt đầu
        const now = Date.now();
        const secondsPassed = Math.floor((now - startTimeRef.current) / 1000);
        setElapsedTime(secondsPassed);
      }, 1000);
    } else {
      // Nếu không tìm nữa (idle, found...), reset mọi thứ
      if (intervalRef.current) clearInterval(intervalRef.current);
      startTimeRef.current = null;
      setElapsedTime(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [searchState]);

  useEffect(() => {
    if (searchState === "declined") {
      // Đặt hẹn giờ 10s (bằng thời gian animation) để tự đóng modal
      const closeTimer = setTimeout(() => {
        if (searchState === "declined") {
          // Check lạiเผื่อ user tự tắt
          setSearchState("idle");
        }
      }, 10000); // 10 giây

      return () => clearTimeout(closeTimer);
    }
  }, [searchState]);

  // === Event Handlers ===
  const handleFindMatch = (timeControl) => {
    if (!socket) return alert("Chưa kết nối server!");
    if (timeControl === "custom") return toast.error("Chế độ chưa hỗ trợ !", 3000);


    // Reset timer thủ công trước khi bắt đầu tìm mới (để chắc chắn)
    startTimeRef.current = null;
    setElapsedTime(0);

    socket.emit("findMatch", { timeControl, isRated: true });
    setSearchState("searching_modal");
  };

  // 8. Xử lý click overlay của modal "Searching"
  const handleCloseSearchingModal = () => {
    setSearchState("searching_panel");
  };

  const handleCancelSearch = () => {
    if (!socket) return;
    socket.emit("cancelFindMatch");
    setSearchState("idle");
  };

  const handleAcceptMatch = () => {
    if (!socket) return;
    socket.emit("acceptMatch", { matchId: foundMatchData.matchId });
    setSearchState("accepted_modal");
  };

  const handleDeclineMatch = () => {
    if (!socket) return;
    socket.emit("declineMatch", { matchId: foundMatchData.matchId });
    setSearchState("idle");
  };

  // Format MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // === Render Functions ===

  // State 1: Chọn trận
  // Render Pool chọn trận (luôn ở cột giữa)
  const renderPoolGrid = () => (
    <div className={styles.poolGrid}>
      {timePools.map((pool) => (
        <button
          key={pool.display}
          className={styles.poolButton}
          onClick={() => handleFindMatch(pool.timeControl)}
        >
          <span className={styles.poolTime}>{pool.display}</span>
          <span className={styles.poolCategory}>{pool.category}</span>
        </button>
      ))}
    </div>
  );

  // State 2: Đang tìm
  // Render Box "Đang tìm" (dùng cho cả Modal và Panel)
  const renderSearchingBox = (isMinimized = false) => (
    <div
      className={clsx(styles.searchingBox, { [styles.minimized]: isMinimized })}
    >
      <div className={styles.searchingAnimation}></div>
      <h3>Đang tìm trận...</h3>
      {/* Hiển thị elapsedTime thay vì searchTime */}
      <div className={styles.searchingTimer}>{formatTime(elapsedTime)}</div>
      <button onClick={handleCancelSearch} className={styles.cancelButton}>
        Hủy
      </button>
    </div>
  );

  // State 3: Tìm thấy trận
  // Render Box "Tìm thấy trận" (chỉ dùng cho Modal)
  const renderMatchFoundState = (isDeclined = false) => (
    <div className={styles.matchFoundBox}>
      <h3>{isDeclined ? "Đã từ chối" : "Đã tìm thấy trận!"}</h3>

      {/* Thanh duration 10s */}
      <div className={styles.durationBar}>
        {/* Thêm class 'declinedBar' nếu 'isDeclined' = true */}
        <div
          className={clsx(styles.durationProgress, {
            [styles.declinedBar]: isDeclined,
          })}
        ></div>
      </div>
      <div className={styles.matchActions}>
        <button
          className={clsx(styles.actionButton, styles.decline)}
          onClick={handleDeclineMatch}
          disabled={isDeclined} // Vô hiệu hóa nút
        >
          Hủy
        </button>
        <button
          className={clsx(styles.actionButton, styles.accept)}
          onClick={handleAcceptMatch}
          disabled={isDeclined} // Vô hiệu hóa nút
        >
          Chơi
        </button>
      </div>
    </div>
  );

  // State 4: Đã chấp nhận
  // Render Box "Đã chấp nhận" (chỉ dùng cho Modal)
  const renderAcceptedState = () => (
    <div className={styles.searchingBox}>
      <h3>Đã chấp nhận!</h3>
      <p>Đang chờ đối thủ...</p>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      <div className={clsx("row", "gx-6", "justify-content-center")}>
        <div className="col-2" />
        <div className="col-7">
          {/* Cột giữa (main) */}
          <div className={styles.mainContent}>
            {renderPoolGrid()}
            {/* Lịch sử đấu sẽ được thêm vào ĐÂY (Bước 4) */}
            <GameHistory limit={5} />
          </div>
        </div>
        <div className="col-3">
          {/* CỘT PHẢI*/}
          {searchState === "searching_panel" && (
            <div className={styles.minimizedSearchContainer}>
              {renderSearchingBox(true)}
            </div>
          )}
          <div className={styles.infoPanel}>
            <div className={styles.playerInfo}>
              {user ? (
                <>
                  <Link
                    to={`/profile/${user.username}`}
                    className={styles.playerInfoLink}
                  >
                    <h4>{user.username}</h4>
                  </Link>

                  <div className={styles.ratingsRow}>
                    {/* Bullet */}
                    <div className={styles.ratingItem}>
                      <i
                        className={clsx("fa-solid fa-rocket", styles.icon)}
                      ></i>
                      <span>{user.ratings.bullet || 1200}</span>
                    </div>
                    {/* Blitz */}
                    <div className={styles.ratingItem}>
                      <i className={clsx("fa-solid fa-bolt", styles.icon)}></i>
                      <span>{user.ratings.blitz || 1200}</span>
                    </div>
                    {/* Rapid */}
                    <div className={styles.ratingItem}>
                      <i
                        className={clsx("fa-regular fa-clock", styles.icon)}
                      ></i>
                      <span>{user.ratings.rapid || 1200}</span>
                    </div>
                    {/* Classical */}
                    <div className={styles.ratingItem}>
                      <i
                        className={clsx(
                          "fa-solid fa-hourglass-half",
                          styles.icon
                        )}
                      ></i>
                      <span>{user.ratings.classical || 1200}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p>Đang tải thông tin...</p>
              )}
            </div>
            {/* (Khu vực bạn bè online) */}
          </div>
        </div>
      </div>

      {/* --- 12. MỚI: KHU VỰC MODAL --- */}

      {/* Modal 1: Đang tìm trận */}
      <Modal
        isOpen={searchState === "searching_modal"}
        onRequestClose={handleCloseSearchingModal} // Click overlay -> chạy hàm này
        style={customModalStyles}
        contentLabel="Đang tìm trận"
      >
        {renderSearchingBox(false)} {/* false = phiên bản lớn */}
      </Modal>

      {/* Modal 2: Tìm thấy trận / Đã chấp nhận */}
      <Modal
        isOpen={
          searchState === "found_modal" ||
          searchState === "accepted_modal" ||
          searchState === "declined" // <-- Thêm state 'declined'
        }
        shouldCloseOnOverlayClick={false} // KHÔNG cho đóng
        style={customModalStyles}
        contentLabel="Đã tìm thấy trận"
      >
        {searchState === "found_modal" && renderMatchFoundState(false)}
        {searchState === "accepted_modal" && renderAcceptedState()}
        {searchState === "declined" && renderMatchFoundState(true)}
      </Modal>
    </div>
  );
}

export default Lobby;
