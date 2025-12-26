// client/src/pages/Admin/UserManager/components/UserTable/index.jsx
import React from "react";
import styles from "./UserTable.module.scss";

const UserTable = ({ users = [], onToggleBan }) => {
  return (
    <table className={styles.userTable}>
      <thead>
        <tr>
          <th>Username</th>
          <th>Email</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user._id}>
            <td>{user.username}</td>
            <td>{user.email}</td>
            <td>
              <div className={styles.status}>
                <span
                  className={`${styles.dot} ${
                    user.isActive ? styles.active : styles.banned
                  }`}
                ></span>
                {user.isActive ? "Active" : "Banned"}
              </div>
            </td>
            <td>
              {user.role === 'admin' ? (
                <button
                  className={`${styles.actionButton} ${styles.disabled}`}
                  disabled
                >
                  Admin
                </button>
              ) : (
                <button
                  className={`${styles.actionButton} ${
                    user.isActive ? styles.ban : styles.unban
                  }`}
                  onClick={() => onToggleBan(user)}
                >
                  {user.isActive ? "Ban" : "Unban"}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UserTable;
