import { useState } from "react";
import SettingsSidebar from "./components/SettingsSidebar";
import BoardSettings from "./components/BoardSettings";
import AccountSettings from "./components/AccountSettings";
import ProfileSettings from "./components/ProfileSettings";
import styles from "./Settings.module.scss";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");

  const tabContent = {
    profile: <ProfileSettings />,
    account: <AccountSettings />,
    appearance: <BoardSettings />,
  };

  return (
    <div className={styles.settingsPage}>
      <div className={styles.sidebarContainer}>
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <div className={styles.contentContainer}>{tabContent[activeTab]}</div>
    </div>
  );
};

export default Settings;

