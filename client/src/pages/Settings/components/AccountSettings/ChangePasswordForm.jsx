import { useState } from "react";
import axiosClient from "@/utils/axiosConfig";
import styles from "./AccountSettings.module.scss";
import { useToast } from "@/hooks/index";

const ChangePasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setError("");
    try {
      await axiosClient.post("/users/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success("Thay đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.msg || "An error occurred.");
      toast.error(err.response?.data?.msg || "Đã xảy ra lỗi!.");
    }
  };

  return (
    <div className={styles.formWrapper}>
      <h4>Đổi mật khẩu</h4>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="current-password">Mật khẩu hiện tại</label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="new-password">Mật khẩu mới</label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="confirm-new-password">Xác nhận mật khẩu mới</label>
          <input
            id="confirm-new-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.submitButton}>
          Đổi mật khẩu
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordForm;
