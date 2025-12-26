import { useState } from "react";
import { useAuth } from "@/hooks/index";
import { useNavigate, Link } from "react-router";

import styles from "../Auth.module.scss";

function Login() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(loginId, password);
      navigate("/"); // Đăng nhập thành công -> về trang chủ
    } catch (err) {
      setError(err.message); // Hiển thị lỗi
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8080/api/auth/google";
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.formBox}>
        <h2 className={styles.title}>Đăng nhập</h2>

        <p className={styles.error}>{error}</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="loginId">Email hoặc username</label>
            <input
              id="loginId"
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="Nhập email hoặc username"
              required
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <div className={styles.labelHeader}>
              <label htmlFor="password">Mật khẩu</label>
              <Link to="/forgot-password" className={styles.forgotLink}>
                Quên mật khẩu?
              </Link>
            </div>
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
          <i className="fa-brands fa-google"></i>
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
