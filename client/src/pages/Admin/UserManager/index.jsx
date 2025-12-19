// client/src/pages/Admin/UserManager/index.jsx
import React, { useState, useEffect } from "react";
import UserTable from "./components/UserTable";
import styles from "./UserManager.module.scss";
import axios from "@/utils/axiosConfig"; // Using aliased path
import { useAuth } from "@/hooks/index";

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) {
        setLoading(false);
        setError("Authentication required.");
        return;
      }
      try {
        setLoading(true);
        const response = await axios.get("/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data.users);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  const handleToggleBan = async (userId) => {
    // --- Optimistic UI Update ---
    const originalUsers = [...users];
    const updatedUsers = users.map((user) =>
      user._id === userId ? { ...user, isActive: !user.isActive } : user
    );
    setUsers(updatedUsers);
    // --- End Optimistic UI Update ---

    try {
      await axios.patch(
        `/admin/users/${userId}/ban`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
