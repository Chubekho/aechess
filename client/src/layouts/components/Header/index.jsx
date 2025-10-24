import clsx from "clsx";

import Navigation from "../Navigation";

import styles from "./Header.module.scss";
import { NavLink } from "react-router";

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles["header__left"]}>
        <NavLink to="/" className={styles.logo}>
          <i
            className={clsx("fa-solid", "fa-chess-rook", styles["logo-icon"])}
          ></i>
          <span className={styles["logo-text"]}>aechess</span>
        </NavLink>
        <div className={styles.navigation}>
          <Navigation />
        </div>
      </div>
      <div className="header__right"></div>
    </header>
  );
}

export default Header;
