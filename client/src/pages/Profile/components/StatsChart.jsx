import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Doughnut, Radar } from "react-chartjs-2";
import axiosClient from "@/utils/axiosConfig"; // Đảm bảo import đúng đường dẫn
import styles from "../Profile.module.scss";

// Đăng ký các thành phần Chart.js
ChartJS.register(
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
);

function StatsChart({ user }) {
  const [stats, setStats] = useState({ win: 0, loss: 0, draw: 0 });
  const [loading, setLoading] = useState(true);

  // 1. Fetch lịch sử đấu và tính toán Stats
  useEffect(() => {
    if (!user?.id) return;

    const calculateStats = async () => {
      try {
        setLoading(true);
        // Lấy 100 game gần nhất để tính tỷ lệ cho chính xác
        const res = await axiosClient.get(
          `/games/history?limit=100&userId=${user.id}`
        );
        const games = res;

        // --- FIX: Verify Array Safety ---
        if (!Array.isArray(games)) {
          console.error("API did not return an array for game history.");
          return; // Dừng thực thi nếu không phải mảng
        }

        let win = 0;
        let loss = 0;
        let draw = 0;

        games.forEach((game) => {
          // --- FIX: Add defensive checks for players ---
          // Bỏ qua game nếu whitePlayer hoặc blackPlayer bị null (do user bị xóa)
          if (!game.whitePlayer || !game.blackPlayer) {
            return; 
          }

          // Xác định xem user hiện tại là Trắng hay Đen
          const whiteId = game.whitePlayer._id || game.whitePlayer;
          const isMeWhite = whiteId.toString() === user.id.toString();

          const result = game.result; // "1-0", "0-1", "1/2-1/2"

          if (result === "1/2-1/2") {
            draw++;
          } else if (result === "1-0") {
            // Trắng thắng
            if (isMeWhite) win++;
            else loss++;
          } else if (result === "0-1") {
            // Đen thắng
            if (!isMeWhite) win++;
            else loss++;
          }
        });

        setStats({ win, loss, draw });
      } catch (err) {
        console.error("Lỗi tính toán stats:", err);
      } finally {
        setLoading(false);
      }
    };

    calculateStats();
  }, [user?.id]); // Thêm user?.id để an toàn hơn

  // 2. Data cho Radar Chart (Lấy từ User Model Ratings)
  const radarData = {
    labels: ["Bullet", "Blitz", "Rapid"],
    datasets: [
      {
        label: "Rating",
        // Fallback về 1200 nếu chưa có rating
        data: [
          user.ratings?.bullet || 1200,
          user.ratings?.blitz || 1200,
          user.ratings?.rapid || 1200,
        ],
        backgroundColor: "rgba(118, 150, 86, 0.2)", // Màu xanh Chess
        borderColor: "#769656",
        borderWidth: 2,
        pointBackgroundColor: "#fff",
        pointBorderColor: "#769656",
      },
    ],
  };

  const radarOptions = {
    scales: {
      r: {
        beginAtZero: false,
        ticks: { display: false },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        angleLines: { color: "rgba(255, 255, 255, 0.1)" },
        pointLabels: { color: "#ccc", font: { size: 12 } },
      },
    },
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
  };

  // 3. Data cho Doughnut Chart (Lấy từ Stats đã tính)
  const totalGames = stats.win + stats.loss + stats.draw;
  const hasGames = totalGames > 0;

  const doughnutData = {
    labels: ["Thắng", "Thua", "Hòa"],
    datasets: [
      {
        data: hasGames ? [stats.win, stats.loss, stats.draw] : [0, 0, 1],
        backgroundColor: hasGames
          ? ["#81b64c", "#ca3431", "#a7a6a2"] // Xanh (Thắng), Đỏ (Thua), Xám (Hòa)
          : ["transparent", "transparent", "#403e3c"],
        borderColor: "#262522",
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    cutout: "70%",
    plugins: {
      legend: {
        display: hasGames, // Hide legend if no games
        position: "right",
        labels: { color: "#ccc", boxWidth: 12, padding: 10 },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className={styles.chartsContainer}>
      {/* Chart 1: Kỹ năng (Rating) */}
      <div className={styles.chartBox}>
        <h4>Biểu đồ kỹ năng</h4>
        <div className={styles.chartWrapper}>
          <Radar data={radarData} options={radarOptions} />
        </div>
      </div>

      {/* Chart 2: Thống kê trận đấu (Win/Loss) */}
      <div className={styles.chartBox}>
        <h4>Tỉ lệ thắng (100 ván gần nhất)</h4>
        <div className={styles.chartWrapper}>
          {loading ? (
            <div style={{ color: "#888", fontSize: "12px" }}>
              Đang tính toán...
            </div>
          ) : (
            <>
              <div className={styles.doughnutInner}>
                {hasGames ? (
                  <>
                    <span className={styles.winRateNum}>
                      {Math.round((stats.win / totalGames) * 100)}%
                    </span>
                    <span className={styles.winRateLabel}>Thắng</span>
                  </>
                ) : (
                  <span className={styles.noDataText}>Chưa có ván đấu nào.</span>
                )}
              </div>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatsChart;
