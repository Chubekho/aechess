import { useState } from "react";
import axiosClient from "@/utils/axiosConfig";
import styles from "./AccountSettings.module.scss";
import { useToast } from "@/context/ToastContext";

const SetPasswordForm = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    try {
      await axiosClient.post("/users/set-password", { password });
      showToast("Password set successfully!", "success");
      // Optionally refresh user data or redirect
    } catch (err) {
      setError(err.response?.data?.msg || "An error occurred.");
      showToast(err.response?.data?.msg || "An error occurred.", "error");
    }
  };

  return (
    <div className={styles.formWrapper}>
      <h4>Tạo mật khẩu</h4>
      <p className={styles.formDescription}>
        Tài khoản của bạn chưa có mật khẩu. Tạo một mật khẩu để có thể đăng nhập bằng email và tên người dùng.
      </p>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="new-password">Mật khẩu mới</label>
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="confirm-password">Xác nhận mật khẩu</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.submitButton}>
          Tạo mật khẩu
        </button>
      </form>
    </div>
  );
};

export default SetPasswordForm;
