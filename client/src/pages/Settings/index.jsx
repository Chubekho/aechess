import { useSearchParams } from "react-router";
import SettingsSidebar from "./components/SettingsSidebar";
import BoardSettings from "./components/BoardSettings";
import AccountSettings from "./components/AccountSettings";
import ProfileSettings from "./components/ProfileSettings";
import styles from "./Settings.module.scss";

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "profile";

  const tabContent = {
    profile: <ProfileSettings />,
    account: <AccountSettings />,
    appearance: <BoardSettings />,
  };

  const handleTabChange = (tabKey) => {
    setSearchParams({ tab: tabKey });
  };

  return (
    <div className={styles.settingsPage}>
      <div className={styles.sidebarContainer}>
        <SettingsSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>
      <div className={styles.contentContainer}>
        {tabContent[activeTab] || tabContent["profile"]}
      </div>
    </div>
  );
};

export default Settings;
