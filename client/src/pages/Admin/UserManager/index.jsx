// client/src/pages/Admin/UserManager/index.jsx
import React, { useState, useEffect } from "react";
import UserTable from "./components/UserTable";
import styles from "./UserManager.module.scss";
import axiosClient from "@/utils/axiosConfig";

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get("/admin/users");
        setUsers(response.users);
        setError(null);
      } catch (err) {
        setError(err.response?.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleToggleBan = async (userId) => {
    // --- Optimistic UI Update ---
    const originalUsers = [...users];
    const updatedUsers = users.map((user) =>
      user._id === userId ? { ...user, isActive: !user.isActive } : user
    );
    setUsers(updatedUsers);
    // --- End Optimistic UI Update ---

    try {
      await axiosClient.patch(`/admin/users/${userId}/ban`);
      // API call was successful, state is already updated
    } catch (err) {
      // --- Revert UI on API error ---
      setUsers(originalUsers);
      console.error("Failed to update user status", err);
      // Optionally, show a toast message here to inform the admin
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>User Management</h1>
        <input
          type="text"
          placeholder="Search users..."
          className={styles.searchInput}
        />
      </div>
      <UserTable users={users} onToggleBan={handleToggleBan} />
    </div>
  );
};

export default UserManager;