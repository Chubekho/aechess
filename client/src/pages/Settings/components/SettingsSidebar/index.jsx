import styles from "./SettingsSidebar.module.scss";

const tabs = [
  { id: "profile", label: "Hồ sơ", icon: "fa-solid fa-user" },
  { id: "account", label: "Tài khoản", icon: "fa-solid fa-lock" },
  { id: "appearance", label: "Giao diện", icon: "fa-solid fa-palette" },
];

const SettingsSidebar = ({ activeTab, onTabChange }) => {
  return (
    <div className={styles.sidebar}>
      <ul>
        {tabs.map((tab) => (
          <li
            key={tab.id}
            className={`${styles.tab} ${
              activeTab === tab.id ? styles.active : ""
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            <i className={tab.icon}></i>
            <span>{tab.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SettingsSidebar;
