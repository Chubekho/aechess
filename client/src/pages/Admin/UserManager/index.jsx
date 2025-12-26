import React, { useState, useEffect, useMemo } from "react";
import Modal from "react-modal";
import UserTable from "./components/UserTable";
import styles from "./UserManager.module.scss";
import axiosClient from "@/utils/axiosConfig";
import { useToast } from "@/hooks/index";

const BAN_REASONS = [
  "Vi phạm quy tắc cộng đồng",
  "Gian lận (Sử dụng Engine)",
  "Ngôn từ không phù hợp",
  "Spam / Quảng cáo",
  "Khác",
];

const customModalStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "var(--color-bg-high)",
    border: "1px solid var(--color-border-light)",
    color: "var(--color-text-primary)",
    padding: "2rem",
    borderRadius: "8px",
    maxWidth: "500px",
    width: "90%",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
};

Modal.setAppElement("#root");

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  // Filter and Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modal State
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banReasonSelect, setBanReasonSelect] = useState(BAN_REASONS[0]);
  const [banReasonInput, setBanReasonInput] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get("/admin/users");
        setUsers(response.users);
        setError(null);
      } catch (err) {
        const errorMessage = err.response?.message || "Failed to fetch users";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [toast]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        user.username.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower);

      const matchesRole =
        filterRole === "all" || user.role === filterRole;

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && user.isActive) ||
        (filterStatus === "banned" && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, filterRole, filterStatus]);

  const openModal = (user) => {
    if (user.role === "admin") {
      toast.warning("Không thể cấm tài khoản của quản trị viên.");
      return;
    }
    setSelectedUser(user);
    setBanReasonSelect(BAN_REASONS[0]);
    setBanReasonInput("");
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedUser(null);
  };

  const handleConfirmAction = async () => {
    // ... (rest of the function is unchanged)
    if (!selectedUser) return;

    const isBanning = selectedUser.isActive;
    const action = isBanning ? "ban" : "unban";
    const url = `/admin/users/${selectedUser._id}/${action}`;

    let finalReason = null;
    let payload = {};
    if (isBanning) {
      finalReason =
        banReasonSelect === "Khác" ? banReasonInput.trim() : banReasonSelect;
      if (!finalReason) {
        toast.warning("Vui lòng cung cấp lý do cấm tài khoản.");
        return;
      }
      payload = { banReason: finalReason };
    }

    try {
      await axiosClient.patch(url, payload);

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === selectedUser._id
            ? { ...user, isActive: !user.isActive, banReason: finalReason }
            : user
        )
      );

      toast.success(
        `Tài khoản đã được ${isBanning ? "cấm" : "mở khóa"} thành công.`
      );
    } catch (err) {
      const errorMessage = err.response?.message || `Failed to ${action} user.`;
      console.error(`Failed to ${action} user`, err);
      toast.error(errorMessage);
    } finally {
      closeModal();
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  const isBanningAction = selectedUser ? selectedUser.isActive : false;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>User Management</h1>
      </div>

      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by username or email..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select
          className={styles.filterSelect}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      <UserTable users={filteredUsers} onToggleBan={openModal} />

      {selectedUser && (
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          style={customModalStyles}
          contentLabel="Confirm Action Modal"
        >
          {/* ... (Modal content is unchanged) */}
          {selectedUser.isActive ? (
            <div className={styles.modalForm}>
              <h2>Lý do cấm tài khoản: {selectedUser.username}</h2>
              <div className={styles.formGroup}>
                <label htmlFor="banReason">Lý do</label>
                <select
                  id="banReason"
                  className={styles.select}
                  value={banReasonSelect}
                  onChange={(e) => setBanReasonSelect(e.target.value)}
                >
                  {BAN_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>
              {banReasonSelect === "Khác" && (
                <div className={styles.formGroup}>
                  <label htmlFor="customReason">Lý do khác</label>
                  <input
                    type="text"
                    id="customReason"
                    className={styles.input}
                    value={banReasonInput}
                    onChange={(e) => setBanReasonInput(e.target.value)}
                    placeholder="Nhập lý do cấm..."
                  />
                </div>
              )}
            </div>
          ) : (
            <div className={styles.modalForm}>
              <h2>Xác nhận mở khóa</h2>
              <p>
                Bạn có chắc muốn mở khóa cho tài khoản{" "}
                <strong>{selectedUser.username}</strong>?
              </p>
            </div>
          )}
          <div className={styles.modalActions}>
            <button
              onClick={closeModal}
              className={`${styles.btn} ${styles.btnCancel}`}
            >
              Hủy
            </button>
            <button
              onClick={handleConfirmAction}
              className={`${styles.btn} ${
                isBanningAction ? styles.btnConfirmBan : styles.btnConfirmUnban
              }`}
            >
              Xác nhận
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManager;