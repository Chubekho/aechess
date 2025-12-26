import React, { useEffect, useState } from "react";
import ActiveGameList from "./components/ActiveGameList";
import styles from "./GameMonitor.module.scss";
import axiosClient from "@/utils/axiosConfig";
import { useAuth } from "@/hooks/index";

const GameMonitor = () => {
  const [activeGames, setActiveGames] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    const fetchActiveGames = async () => {
      try {
        const response = await axiosClient.get("/admin/games/active", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setActiveGames(response.games || []);
      } catch (error) {
        console.error("Failed to fetch active games:", error);
      }
    };

    fetchActiveGames();
  }, [token]);

  const handleAbort = async (gameId) => {
    if (window.confirm("Are you sure you want to abort this game?")) {
      try {
        await axiosClient.patch(
          `/admin/games/${gameId}/abort`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setActiveGames((prevGames) =>
          prevGames.filter((game) => game._id !== gameId)
        );
      } catch (error) {
        console.error("Failed to abort game:", error);
      }
    }
  };

  return (
    <div className={styles.container}>
      <h1>Game Monitor</h1>
      <ActiveGameList games={activeGames} onAbort={handleAbort} />
    </div>
  );
};

export default GameMonitor;
