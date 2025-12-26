import React, { useEffect, useState } from "react";
import Modal from 'react-modal';
import ActiveGameList from "./components/ActiveGameList";
import styles from "./GameMonitor.module.scss";
import axiosClient from "@/utils/axiosConfig";
import { useAuth } from "@/hooks/index";

const customModalStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    background: "var(--color-board-control)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    padding: "2rem",
    width: "90%",
    maxWidth: "450px",
    color: "var(--color-text-primary)",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    zIndex: 1000,
  },
};

const GameMonitor = () => {
  const [activeGames, setActiveGames] = useState([]);
  const { token } = useAuth();
  
  // State for modal and form
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [abortResult, setAbortResult] = useState('*');
  const [abortReason, setAbortReason] = useState('');

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

  const openModal = (gameId) => {
    setSelectedGameId(gameId);
    setAbortResult('*'); // Reset to default
    setAbortReason(''); // Reset to default
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedGameId(null);
  };

  const handleConfirmAbort = async () => {
    if (!selectedGameId) return;

    try {
      await axiosClient.patch(
        `/admin/games/${selectedGameId}/abort`,
        { result: abortResult, reason: abortReason },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setActiveGames((prevGames) =>
        prevGames.filter((game) => game._id !== selectedGameId)
      );
      closeModal();
    } catch (error) {
      console.error("Failed to abort game:", error);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Game Monitor</h1>
      <ActiveGameList games={activeGames} onAbort={openModal} />
      
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customModalStyles}
        contentLabel="Abort Game Modal"
      >
        <h2 className={styles.modalHeader}>Abort Game Control</h2>
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
          <button onClick={closeModal} className={styles.cancelButton}>
            Cancel
          </button>
          <button onClick={handleConfirmAbort} className={styles.confirmButton}>
            Confirm Abort
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default GameMonitor;
