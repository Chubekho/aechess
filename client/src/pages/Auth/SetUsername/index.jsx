// client/src/pages/Auth/SetUsername/index.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import axiosClient from "@/utils/axiosConfig";
import styles from "../Auth.module.scss";

function SetUsername() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get("token");

  useEffect(() => {
     if (token) {
        // Lưu token tạm vào localStorage để axiosClient tự gắn vào header
        localStorage.setItem("accessToken", token);
     } else {
        navigate("/login"); // Không có token thì đá về login
     }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
       await axiosClient.post("http://localhost:8080/api/auth/set-username", { username });
       
       // Thành công -> Reload hoặc redirect về trang chủ (để App fetch lại user info mới nhất)
       window.location.href = "/"; 
    } catch (err) {
       setError(err.response?.data?.msg || "Lỗi cập nhật");
    }
  };

  return (
     <div className={styles.wrapper}>
        <div className={styles.formBox}>
           <h2>Chào mừng bạn mới!</h2>
           <p>Vui lòng chọn Username để hiển thị trong game.</p>
           {error && <p className={styles.error}>{error}</p>}
           
           <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                 <input 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    placeholder="Username..." 
                 />
              </div>
              <button type="submit" className={styles.buttonPrimary}>Hoàn tất</button>
           </form>
        </div>
     </div>
  );
}

export default SetUsername;