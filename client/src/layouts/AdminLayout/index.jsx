// client/src/layouts/AdminLayout/index.jsx
import React from "react";
import { Outlet } from "react-router";
import Sidebar from "./components/SideBar";
import styles from "./AdminLayout.module.scss";

const AdminLayout = () => {
  return (
    <div className={styles.adminLayout}>
      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <Sidebar />
        </aside>
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
