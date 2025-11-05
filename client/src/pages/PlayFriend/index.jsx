import { useState, useEffect, useRef, useMemo } from "react";
import { useSocket } from "@/context/SocketContext";
import { useNavigate } from "react-router";
import { Chessboard } from "react-chessboard"; // Tùy chọn, để hiển thị
import clsx from "clsx";
import styles from "./PlayFriend.module.scss";

// Cấu trúc dữ liệu cho Khối 1 (Chọn thời gian)
const timeControls = [
  {
    category: "Bullet",
    icon: "fa-solid fa-rocket", // FontAwesome icon
    times: [
      { display: "1 min", value: { base: 1, inc: 0 } },
      { display: "1 | 1", value: { base: 1, inc: 1 } },
      { display: "2 | 1", value: { base: 2, inc: 1 } },
    ],
  },
  {
    category: "Blitz",
    icon: "fa-solid fa-bolt",
    times: [
      { display: "3 min", value: { base: 3, inc: 0 } },
      { display: "3 | 2", value: { base: 3, inc: 2 } },
      { display: "5 min", value: { base: 5, inc: 0 } },
    ],
  },
  {
    category: "Rapid",
    icon: "fa-regular fa-clock",
    times: [
      { display: "10 min", value: { base: 10, inc: 0 } },
      { display: "15 | 10", value: { base: 15, inc: 10 } },
      { display: "30 min", value: { base: 30, inc: 0 } },
    ],
  },
];

function PlayFriend() {
  const socket = useSocket();
  const navigate = useNavigate();

  // === State quản lý thiết lập ===
  const [selectedTime, setSelectedTime] = useState(timeControls[2].times[0]); // Default: 10 min
  const [selectedColor, setSelectedColor] = useState("random"); // 'w', 'b', 'random'

  // State cho Dropdown và Logic Game
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [createdGameId, setCreatedGameId] = useState(null); // Lưu ID game đã tạo

  // state cho "Xếp hạng"
  const [isRated, setIsRated] = useState(true);

  // === State quản lý phòng chờ ===
  const [isWaiting, setIsWaiting] = useState(false);
  const [gameLink, setGameLink] = useState("");
  const linkInputRef = useRef(null); // Để copy link

  // Tự động tìm thông tin Category (Bullet, Blitz,...)
  // Dựa trên 'selectedTime'
  const selectedCategoryInfo = useMemo(() => {
    for (const control of timeControls) {
      if (control.times.some((time) => time.display === selectedTime.display)) {
        return { category: control.category, icon: control.icon };
      }
    }
    return { category: "Rapid", icon: "fa-regular fa-clock" }; // Fallback
  }, [selectedTime]);

  // Logic chuyển trang
  useEffect(() => {
    if (!socket) return;

    const handleGameStart = (data) => {
      // Chỉ chuyển trang nếu gameId khớp với game BẠN đã tạo
      if (data.gameId === createdGameId) {
        navigate(`/game/${data.gameId}`);
      }
    };

    socket.on("gameStart", handleGameStart);
    return () => {
      socket.off("gameStart", handleGameStart);
    };
  }, [socket, createdGameId, navigate]);

  // === Xử lý tạo phòng ===
  const handleCreateRoom = () => {
    if (!socket) return alert("Chưa kết nối socket!");

    const roomConfig = {
      time: selectedTime.value,
      color: selectedColor,
      isRated: isRated,
    };

    socket.emit("createRoom", roomConfig, (response) => {
      if (response.gameId) {
        const fullLink = `${window.location.origin}/game/${response.gameId}`;
        setGameLink(fullLink);
        setCreatedGameId(response.gameId); // <-- 5. LƯU LẠI GAME ID
        setIsWaiting(true);
      } else {
        alert("Lỗi: Không thể tạo phòng.");
      }
    });
  };

  // Hàm xử lý khi chọn thời gian
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  // Sao chép link vào clipboard
  const handleCopyLink = () => {
    linkInputRef.current.select();
    document.execCommand("copy");
    alert("Đã sao chép link!");
  };

  // === JSX Cho phần Thiết Lập (Khi chưa tạo phòng) ===
  const renderSetupOptions = () => (
    <div className={styles["option-board"]}>
      {/* KHỐI 1: CHỌN THỜI GIAN */}
      <div className={styles.setupBlock}>
        <button
          className={styles.selectedTimeDisplay}
          onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)} // Toggle
        >
            <i
              className={clsx(selectedCategoryInfo.icon, styles.categoryIcon)}
            ></i>
            <span className={styles.selectedTimeText}>
              {selectedTime.display} ({selectedCategoryInfo.category})
            </span>
          <i
            className={clsx("fa-solid fa-chevron-up", styles.caret, {
              [styles.caretActive]: isTimeDropdownOpen,
            })}
          ></i>
        </button>

        {/* 2. Nội dung Dropdown (Chỉ hiển thị khi isTimeDropdownOpen = true) */}
        {isTimeDropdownOpen && (
          <div className={styles.timeDropdown}>
            {timeControls.map((control) => (
              <div key={control.category} className={styles.timeCategory}>
                <div className={styles.categoryHeader}>
                  <i className={clsx(control.icon, styles.categoryIcon)}></i>
                  <h3 className={styles.categoryTitle}>{control.category}</h3>
                </div>
                <div className={styles.timeGrid}>
                  {control.times.map((time) => (
                    <button
                      key={time.display}
                      className={clsx(styles.timeButton, {
                        [styles.active]: selectedTime.display === time.display,
                      })}
                      onClick={() => handleTimeSelect(time)}
                    >
                      {time.display}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KHỐI 2: TÙY CHỌN XẾP HẠNG */}
      <div className={clsx(styles.setupBlock, styles.ratedSelector)}>
        {/* Xóa class 'headingMarginTop' không cần thiết */}
        <h3>Xếp hạng</h3>
        <label className={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={isRated}
            onChange={() => setIsRated(!isRated)}
          />
          <span className={styles.slider}></span>
        </label>
        <span className={styles.ratedText}>
          {isRated ? "Ván cờ Xếp hạng" : "Ván cờ Thân thiện"}
        </span>
      </div>

      {/* KHỐI 3: CHỌN MÀU QUÂN */}
      <div className={styles.setupBlock}>
        {/* Xóa class 'headingMarginTop' */}
        <h3>Bạn cầm quân</h3>
        <div className={styles.colorSelector}>
          <button
            onClick={() => setSelectedColor("w")}
            className={clsx({ [styles.active]: selectedColor === "w" })}
          >
            <i className={clsx("fa-solid fa-chess-king", styles.iconWhite)}></i>
          </button>
          <button
            onClick={() => setSelectedColor("random")}
            className={clsx({ [styles.active]: selectedColor === "random" })}
          >
            <i
              className={clsx("fa-solid fa-chess-king", styles.iconRandom)}
            ></i>
          </button>
          <button
            onClick={() => setSelectedColor("b")}
            className={clsx({ [styles.active]: selectedColor === "b" })}
          >
            <i className={clsx("fa-solid fa-chess-king", styles.iconBlack)}></i>
          </button>
        </div>
      </div>
    </div>
  );

  // === JSX Cho phần Phòng Chờ (Sau khi tạo phòng) ===
  const renderWaitingRoom = () => (
    <div className={styles.waitingInfo}>
      <h4>Đang chờ bạn bè...</h4>
      <p>Gửi link này cho bạn bè của bạn để bắt đầu ván đấu:</p>
      <div className={styles.linkBox}>
        <input
          ref={linkInputRef}
          type="text"
          value={gameLink}
          readOnly
          className={styles.linkInput}
        />
        <button onClick={handleCopyLink} className={styles.copyButton}>
          <i className={clsx("fa-solid fa-copy")}></i>
        </button>
      </div>
      <p className={styles.infoText}>
        Ván đấu sẽ tự động bắt đầu khi bạn của bạn tham gia.
      </p>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      <div className={clsx("row", "gx-6", "justify-content-center")}>
        <div className={clsx("col-3")}>{/* Cột trái */}</div>
        {/* CẬP NHẬT: Đổi lại col-4 (tùy bạn) */}
        <div className={clsx("col-5")}>
          <div className={styles.board}>
            <Chessboard
              position={"start"}
              arePiecesDraggable={false}
              id="FriendGameSetup"
            />
          </div>
        </div>
        {/* Cột phải: Side-board */}
        <div
          className={clsx("col-3", "align-self-center", styles["side-board"])}
        >
          <div className={clsx("align-self-center", styles["container"])}>
            {/* Board header */}
            <div className={styles["board-heading"]}>
              <h2>{isWaiting ? "Phòng chờ" : "Thách đấu bạn bè"}</h2>
            </div>

            {/* Board body (Hiển thị 1 trong 2 state) */}
            <div className={styles["board-body"]}>
              {isWaiting ? renderWaitingRoom() : renderSetupOptions()}
            </div>

            {/* Board footer */}
            <div className={styles["board-footer"]}>
              {isWaiting ? (
                <button
                  onClick={() => setIsWaiting(false)} // Hủy phòng
                  className={styles.buttonCancel} // <--- Dùng class mới
                >
                  Hủy
                </button>
              ) : (
                <button
                  onClick={handleCreateRoom}
                  className={styles.buttonStart} // <--- Dùng style của PlayAI
                >
                  <i className={clsx("fa-solid fa-user-plus", styles.icon)}></i>
                  Tạo phòng
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayFriend;
