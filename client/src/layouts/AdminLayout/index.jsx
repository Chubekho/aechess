// client/src/layouts/AdminLayout/index.jsx
import React from "react";
import { Outlet } from "react-router";
import Sidebar from "./components/SideBar";
import styles from "./AdminLayout.module.scss";

const AdminLayout = () => {
  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <Sidebar />
      </aside>
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
