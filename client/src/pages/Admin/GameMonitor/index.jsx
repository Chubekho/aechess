import React, { useEffect, useState, useMemo } from "react";
import Modal from "react-modal";
import ActiveGameList from "./components/ActiveGameList";
import styles from "./GameMonitor.module.scss";
import axiosClient from "@/utils/axiosConfig";
import { useToast } from "@/hooks/index";

const customModalStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "var(--color-bg-high)",
    border: "1px solid var(--color-card-border)",
    borderRadius: "8px",
    padding: "2rem",
    width: "90%",
    maxWidth: "450px",
    color: "var(--color-text-primary)",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    zIndex: 1000,
  },
};

Modal.setAppElement("#root");

const getTimeCategory = (timeControl) => {
  if (!timeControl) return "custom";
  const [baseMinutes, _] = timeControl.split("+").map(Number);
  const baseSeconds = baseMinutes * 60;

  if (baseSeconds < 180) return "bullet";
  if (baseSeconds < 600) return "blitz";
  if (baseSeconds < 1800) return "rapid";
  return "classical";
};

const GameMonitor = () => {
  const [activeGames, setActiveGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Filter and Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Modal State
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [abortResult, setAbortResult] = useState("*");
  const [abortReason, setAbortReason] = useState("");

  useEffect(() => {
    const fetchActiveGames = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get("/admin/games/active");
        setActiveGames(response.games || []);
      } catch (error) {
        toast.error("Failed to fetch active games.");
        console.error("Failed to fetch active games:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveGames();
  }, [toast]);

  const filteredGames = useMemo(() => {
    return activeGames.filter((game) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        game.whitePlayer.username.toLowerCase().includes(searchLower) ||
        game.blackPlayer.username.toLowerCase().includes(searchLower);

      const matchesCategory =
        filterCategory === "all" ||
        getTimeCategory(game.timeControl) === filterCategory;

      return matchesSearch && matchesCategory;
    });
  }, [activeGames, searchTerm, filterCategory]);

  const openModal = (gameId) => {
    setSelectedGameId(gameId);
    setAbortResult("*");
    setAbortReason("");
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedGameId(null);
  };

  const handleConfirmAbort = async () => {
    if (!selectedGameId) return;

    try {
      await axiosClient.patch(`/admin/games/${selectedGameId}/abort`, {
        result: abortResult,
        reason: abortReason,
      });
      setActiveGames((prevGames) =>
        prevGames.filter((game) => game._id !== selectedGameId)
      );
      toast.success("Game aborted successfully.");
      closeModal();
    } catch (error) {
      toast.error("Failed to abort game.");
      console.error("Failed to abort game:", error);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Game Monitor</h1>

      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search players..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="bullet">Bullet</option>
          <option value="blitz">Blitz</option>
          <option value="rapid">Rapid</option>
          <option value="classical">Classical</option>
        </select>
      </div>

      {loading ? (
        <div>Loading games...</div>
      ) : (
        <ActiveGameList games={filteredGames} onAbort={openModal} />
      )}

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customModalStyles}
        contentLabel="Abort Game Modal"
      >
        <div className={styles.modalForm}>
          <h2>Abort Game Control</h2>
          <div className={styles.formGroup}>
            <label htmlFor="abortResult">Outcome:</label>
            <select
              id="abortResult"
              value={abortResult}
              onChange={(e) => setAbortResult(e.target.value)}
              className={styles.select}
            >
              <option value="*">Void Game (No Result)</option>
              <option value="1-0">White Won (Penalty)</option>
              <option value="0-1">Black Won (Penalty)</option>
              <option value="1/2-1/2">Draw (Force)</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="abortReason">Reason (Optional):</label>
            <input
              type="text"
              id="abortReason"
              value={abortReason}
              onChange={(e) => setAbortReason(e.target.value)}
              placeholder="e.g., Cheating detected"
              className={styles.input}
            />
          </div>
          <div className={styles.modalActions}>
            <button onClick={closeModal} className={styles.btnCancel}>
              Cancel
            </button>
            <button onClick={handleConfirmAbort} className={styles.btnConfirm}>
              Confirm Abort
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GameMonitor;