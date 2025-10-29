import { useState } from "react";
import { useAuth } from "@/hooks/index"; // Sửa đường dẫn nếu cần
import { useNavigate, Link } from "react-router";

import styles from "../Auth.module.scss"; 

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // Thêm để xác nhận pass
  const [error, setError] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // --- Kiểm tra phía Client (Front-end) ---
    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp.");
      return;
    }
    // (Bạn nên thêm các kiểm tra regex phức tạp hơn ở đây nếu cần)
    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    // --- Kết thúc kiểm tra ---

    try {
      await register(email, password);
      navigate("/"); // Đăng ký thành công -> về trang chủ
    } catch (err) {
      setError(err.message); // Hiển thị lỗi từ server
    }
  };
  
  // Xử lý Google Login (chuyển đến API backend)
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8080/api/auth/google";
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.formBox}>
        <h2 className={styles.title}>Đăng ký tài khoản</h2>
        
        {/* Hiển thị lỗi ở đây */}
        <p className={styles.error}>
          {error}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
            
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu (ít nhất 8 ký tự)"
              required
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Xác nhận Mật khẩu</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              required
              className={styles.input}
            />
          </div>
          <button type="submit" className={styles.buttonPrimary}>
            Đăng ký
          </button>
        </form>
        
        <hr className={styles.separator} />
        
        <button 
          onClick={handleGoogleLogin} 
          className={styles.buttonGoogle}
        >
          Đăng ký với Google
        </button>
        
        <p className={styles.footerText}>
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;