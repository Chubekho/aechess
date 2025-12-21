import { useAuth } from "@/context/AuthContext";
import ChangePasswordForm from "./ChangePasswordForm";
import SetPasswordForm from "./SetPasswordForm";
import styles from "./AccountSettings.module.scss";

const AccountSettings = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.accountSettings}>
      <h3>Tài khoản</h3>
      <div className={styles.userInfo}>
        <div className={styles.infoItem}>
          <strong>Email:</strong>
          <span>{user.email}</span>
        </div>
        <div className={styles.infoItem}>
          <strong>Username:</strong>
          <span>{user.username}</span>
        </div>
      </div>

      <hr className={styles.divider} />

      {user.hasPassword ? <ChangePasswordForm /> : <SetPasswordForm />}
    </div>
  );
};

export default AccountSettings;
