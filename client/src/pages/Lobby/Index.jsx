// client/src/pages/Lobby/index.jsx
import { useAuth, useSocket, useToast } from "@/hooks/index";
import { useNavigate, Link } from "react-router";
import { useEffect, useState, useRef } from "react";
import Modal from "react-modal";
import clsx from "clsx";
import styles from "./Lobby.module.scss";

import GameHistory from "@/components/GameHistory";

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

// --- CẬP NHẬT: Responsive cho Modal ---
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
    width: "90%", // Mobile: chiếm 90% màn hình
    maxWidth: "400px", // Desktop: tối đa 400px
    overflow: "visible",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    zIndex: 1000, // Đảm bảo đè lên mọi thứ
  },
};

function Lobby() {
  const socket = useSocket();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [searchState, setSearchState] = useState("idle");
  const [foundMatchData, setFoundMatchData] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);

  // ... (Giữ nguyên logic useEffect và Event Handlers không thay đổi) ...
  // Để tiết kiệm không gian câu trả lời, mình ẩn phần logic Socket/Timer đi vì nó giữ nguyên
  // Bạn hãy copy lại phần logic từ code cũ vào đây nhé
  
  // === Logic Socket & Timer (GIỮ NGUYÊN) ===
   useEffect(() => {
    if (!socket) return;
    const onMatchFound = (data) => {
      console.log("Match Found:", data);
      setFoundMatchData(data);
      setSearchState("found_modal");
      if (timerRef.current) clearInterval(timerRef.current);
    };
    const onGameStart = (data) => {
      setSearchState("idle");
      navigate(`/game/${data.gameId}`);
    };
    const onMatchAborted = () => {
      setFoundMatchData(null);
      if (searchState !== "declined") {
        toast.error("Trận đấu đã bị hủy", 3000);
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
  }, [socket, navigate, searchState, toast]);

  useEffect(() => {
    const isSearching =
      searchState === "searching_modal" || searchState === "searching_panel";
    if (isSearching) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
        setElapsedTime(0);
      }
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const secondsPassed = Math.floor((now - startTimeRef.current) / 1000);
        setElapsedTime(secondsPassed);
      }, 1000);
    } else {
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
      const closeTimer = setTimeout(() => {
        if (searchState === "declined") setSearchState("idle");
      }, 10000);
      return () => clearTimeout(closeTimer);
    }
  }, [searchState]);

  const handleFindMatch = (timeControl) => {
    if (!socket) return alert("Chưa kết nối server!");
    if (timeControl === "custom") return toast.error("Chế độ chưa hỗ trợ !", 3000);
    startTimeRef.current = null;
    setElapsedTime(0);
    socket.emit("findMatch", { timeControl, isRated: true });
    setSearchState("searching_modal");
  };

  const handleCloseSearchingModal = () => setSearchState("searching_panel");
  
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // === Render Components ===

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

  const renderSearchingBox = (isMinimized = false) => (
    <div className={clsx(styles.searchingBox, { [styles.minimized]: isMinimized })}>
      <div className={styles.searchingAnimation}></div>
      <h3>Đang tìm trận...</h3>
      <div className={styles.searchingTimer}>{formatTime(elapsedTime)}</div>
      <button onClick={handleCancelSearch} className={styles.cancelButton}>
        Hủy
      </button>
    </div>
  );

  const renderMatchFoundState = (isDeclined = false) => (
    <div className={styles.matchFoundBox}>
      <h3>{isDeclined ? "Đã từ chối" : "Đã tìm thấy trận!"}</h3>
      <div className={styles.durationBar}>
        <div className={clsx(styles.durationProgress, { [styles.declinedBar]: isDeclined })}></div>
      </div>
      <div className={styles.matchActions}>
        <button className={clsx(styles.actionButton, styles.decline)} onClick={handleDeclineMatch} disabled={isDeclined}>
          Hủy
        </button>
        <button className={clsx(styles.actionButton, styles.accept)} onClick={handleAcceptMatch} disabled={isDeclined}>
          Chơi
        </button>
      </div>
    </div>
  );

  const renderAcceptedState = () => (
    <div className={styles.searchingBox}>
      <h3>Đã chấp nhận!</h3>
      <p>Đang chờ đối thủ...</p>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      {/* --- CẬP NHẬT: Layout mới sử dụng CSS Grid --- */}
      <div className={styles.lobbyContainer}>
        
        {/* Khu vực Chính: Chọn trận & Lịch sử */}
        <main className={styles.mainSection}>
           {/* Tiêu đề Mobile (Optional) */}
           <div className={styles.mobileHeader}>
              <h2>Play Chess</h2>
           </div>

           {renderPoolGrid()}
           <div className={styles.historySection}>
              <GameHistory limit={5} userId={user._id}/>
           </div>
        </main>

        {/* Khu vực Bên phải (Sidebar): Info User & Tìm kiếm thu nhỏ */}
        <aside className={styles.sideSection}>
          {searchState === "searching_panel" && (
            <div className={styles.minimizedSearchContainer}>
              {renderSearchingBox(true)}
            </div>
          )}
          
          <div className={styles.infoPanel}>
            <div className={styles.playerInfo}>
              {user ? (
                <>
                  <Link to={`/profile/${user.username}`} className={styles.playerInfoLink}>
                    <h4>{user.username}</h4>
                  </Link>
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
                </>
              ) : (
                <p>Đang tải...</p>
              )}
            </div>
          </div>
        </aside>

      </div>

      {/* --- Modals --- */}
      <Modal
        isOpen={searchState === "searching_modal"}
        onRequestClose={handleCloseSearchingModal}
        style={customModalStyles}
        contentLabel="Searching"
      >
        {renderSearchingBox(false)}
      </Modal>

      <Modal
        isOpen={["found_modal", "accepted_modal", "declined"].includes(searchState)}
        shouldCloseOnOverlayClick={false}
        style={customModalStyles}
        contentLabel="Match Found"
      >
        {searchState === "found_modal" && renderMatchFoundState(false)}
        {searchState === "accepted_modal" && renderAcceptedState()}
        {searchState === "declined" && renderMatchFoundState(true)}
      </Modal>
    </div>
  );
}

export default Lobby;