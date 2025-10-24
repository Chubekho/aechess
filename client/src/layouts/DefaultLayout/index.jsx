import { Outlet } from "react-router";
import Header from "../components/Header";

import styles from "./DefaultLayout.module.scss";

function DefaultLayout() {
  return (
    <div className={styles.wrapper}>
      <Header />
      <div className={styles.body}>
        <Outlet />
      </div>
    </div>
  );
}

export default DefaultLayout;
