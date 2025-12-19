// client/src/layouts/AdminLayout/components/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router";
import styles from "./Sidebar.module.scss";

const Sidebar = () => {
  return (
    <nav>
      <ul className={styles.sidebarNav}>
        <li className={styles.navItem}>
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ""}`
            }
          >
            Dashboard
          </NavLink>
        </li>
        <li className={styles.navItem}>
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ""}`
            }
          >
            Users
          </NavLink>
        </li>
        <li className={styles.navItem}>
          <NavLink
            to="/admin/games"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ""}`
            }
          >
            Games
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
