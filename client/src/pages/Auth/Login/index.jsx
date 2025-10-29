import { useState } from "react";
import { useAuth } from "@/hooks/index";
import { useNavigate, Link } from "react-router";
import styles from "../Auth.module.scss";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate("/"); // Đăng nhập thành công -> về trang chủ
    } catch (err) {
      setError(err.message); // Hiển thị lỗi
    }
  };

  // Hàm xử lý Google Login (Bước 5)
  const handleGoogleLogin = () => {
    // Chuyển hướng đến API backend
    window.location.href = "http://localhost:8080/api/auth/google";
  };

  return(
    <div className={styles.wrapper}>
      <div className={styles.formBox}>
        <h2 className={styles.title}>Đăng nhập</h2>

        <p className={styles.error}>{error}</p>

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
              placeholder="Mật khẩu"
              required
              className={styles.input}
            />
          </div>
          <button type="submit" className={styles.buttonPrimary}>
            Đăng nhập
          </button>
        </form>

        <hr className={styles.separator} />

        <button onClick={handleGoogleLogin} className={styles.buttonGoogle}>
          Đăng nhập với Google
        </button>

        <p className={styles.footerText}>
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
