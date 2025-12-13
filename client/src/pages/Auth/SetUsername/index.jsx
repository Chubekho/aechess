// client/src/pages/Auth/SetUsername/index.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import axiosClient from "@/utils/axiosConfig";
import { useAuth } from "@/hooks/index";
import { validateUsername } from "@/utils/validators"; 
import styles from "../Auth.module.scss";

function SetUsername() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Lấy token từ Context (nếu đăng ký thường)
  const { token: contextToken, manualSetToken } = useAuth();
  
  // Lấy token từ URL (nếu Google login)
  const urlToken = searchParams.get("token");

  // Token thực tế để sử dụng
  const effectiveToken = urlToken || contextToken;

  useEffect(() => {
     // Nếu là luồng Google (có urlToken), cần lưu vào Context/Storage thủ công
     if (urlToken) {
        localStorage.setItem("accessToken", urlToken);
        manualSetToken(urlToken);
     }
     
     // Nếu không tìm thấy token ở đâu cả -> Đá về login
     if (!effectiveToken) {
        navigate("/login");
     }
  }, [urlToken, effectiveToken, navigate, manualSetToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 1. VALIDATE CLIENT
    if (!validateUsername(username)) {
        setError("Username phải từ 3-20 ký tự, không dấu, không khoảng trắng.");
        return;
    }

    try {
       // 2. GỌI API (Dùng đường dẫn tương đối, axiosClient tự gắn token)
       await axiosClient.post("/auth/set-username", { username });
       
       // 3. THÀNH CÔNG
       // Refresh lại trang để App fetch lại thông tin user (lúc này user đã có username chuẩn)
       window.location.href = "/"; 
    } catch (err) {
       console.error(err);
       setError(err.response?.data?.msg || "Lỗi cập nhật username");
    }
  };

  return (
     <div className={styles.wrapper}>
        <div className={styles.formBox}>
           <h2 className={styles.title}>Chọn Username</h2>
           <p>Tạo danh tính của bạn trên sàn đấu!</p>
           {error && <p className={styles.error}>{error}</p>}
           
           <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                 <input 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    placeholder="Ví dụ: h4rdz_99" 
                    required 
                    className={styles.input}
                 />
              </div>
              <button type="submit" className={styles.buttonPrimary}>Hoàn tất</button>
           </form>
        </div>
     </div>
  );
}

export default SetUsername;