// client/src/pages/Auth/ResetPassword/index.jsx
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import axiosClient from "@/utils/axiosConfig";
import { useToast } from "@/hooks/index";
import styles from "../Auth.module.scss";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();
  const  toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await axiosClient.put(`/auth/reset-password/${token}`, { password });
      toast.success(response.msg || "Mật khẩu đã được đặt lại thành công!");
      navigate("/login");
    } catch (err) {
      const errorMessage = err.response?.data?.msg || "Đã có lỗi xảy ra. Vui lòng thử lại.";
      // setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.formBox}>
        <h2 className={styles.title}>Đặt Lại Mật Khẩu</h2>
        <p className={styles.error}>{error}</p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Mật khẩu mới</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
              required
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Nhập lại mật khẩu</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              required
              className={styles.input}
            />
          </div>
          <button type="submit" className={styles.buttonPrimary} disabled={isLoading}>
            {isLoading ? "Đang xử lý..." : "Xác Nhận"}
          </button>
        </form>
         <p className={styles.footerText}>
          <Link to="/login">Quay lại Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
