// client/src/pages/Auth/ForgotPassword/index.jsx
import { useState } from "react";
import { Link } from "react-router";
import axiosClient from "@/utils/axiosConfig";
import { useToast } from "@/hooks";
import styles from "../Auth.module.scss";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await axiosClient.post("/auth/forgot-password", { email });
      toast.success(response.msg || "Link khôi phục mật khẩu đã được gửi đến email của bạn!");
      setEmail("");
    } catch (err) {
      const errorMessage = err.response?.data?.msg || "Đã có lỗi xảy ra. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.formBox}>
        <h2 className={styles.title}>Quên Mật Khẩu</h2>
        <p className={styles.error}>{error}</p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              required
              className={styles.input}
            />
          </div>
          <button type="submit" className={styles.buttonPrimary} disabled={isLoading}>
            {isLoading ? "Đang gửi..." : "Gửi Link Khôi Phục"}
          </button>
        </form>
        
        <p className={styles.footerText}>
          <Link to="/login">Quay lại Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
