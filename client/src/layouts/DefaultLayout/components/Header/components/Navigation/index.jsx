import { NavLink } from "react-router";
import styles from "./Navigation.module.scss";

const navItems = [
  {
    title: "CHƠI",
    subItems: [
      {
        to: "/",
        title: "Chơi Online",
      },
      {
        to: "/play/ai",
        title: "Chơi với máy",
      },
      {
        to: "/play/friend",
        title: "Chơi với bạn",
      },
    ],
  },
  {
    title: "CÂU ĐỐ",
    subItems: [{ to: "/puzzle", title: "Câu đố" }],
  },
  {
    title: "CÔNG CỤ",
    subItems: [
      {
        to: "/analysis",
        title: "Phân tích",
      },
      {
        to: "/import",
        title: "Nhập PGN",
      },
    ],
  },
];

function Navigation() {
  return (
    <nav className={styles.wrapper}>
      <ul className={styles["nav-list"]}>
        {navItems.map((item, index) => (
          <li key={index} className={styles["nav-item"]}>
            {item.title}
            <ul className={styles["sub-list"]}>
              {item.subItems.map((subItem, index) => (
                <li key={index} className={styles["sub-item"]}>
                  <NavLink to={subItem.to}>{subItem.title}</NavLink>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navigation;
