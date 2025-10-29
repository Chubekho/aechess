import clsx from "clsx";
import { NavLink } from "react-router";

import styles from "./Header.module.scss";

import { useAuth } from "@/hooks/index";
import Navigation from "./components/Navigation";
import User from "./components/User";


function Header() {
  const { user, loading } = useAuth();

  const renderAuthSection = () => {
    // Nếu đang tải, không hiển thị gì cả
    if (loading) {
      return null;
    }

    // Nếu có user -> Render component User
    if (user) {
      return <User user={user} />;
    }
    
    // Nếu là khách, hiển thị nút Đăng nhập
    return (
      <NavLink to="/login" className={styles.loginButton}>
        Đăng nhập
      </NavLink>
    );
  };

  return (
    <header className={styles.header}>
      <div className={styles["header__nav"]}>
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

      {/* CẬP NHẬT: Phần xác thực */}
      <div className={styles["header__auth"]}>
        {renderAuthSection()}
      </div>
    </header>
  );
}

export default Header;
