import { useEffect } from "react";
// 1. SỬA: Dùng 'react-router' theo yêu cầu của bạn
import { useNavigate, useLocation } from "react-router"; 
// 2. SỬA: Import và dùng useAuth
import { useAuth } from "@/hooks/index"; // Sửa đường dẫn nếu cần

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  // 3. SỬA: Lấy hàm manualSetToken từ context
  const { manualSetToken } = useAuth(); 

  useEffect(() => {
    // Lấy token từ URL (e.g., /auth-callback?token=...)
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      // 4. SỬA: Dùng cách "React" (mượt mà hơn)
      
      // 1. Gọi hàm để set token vào context
      // AuthContext sẽ tự động lưu vào localStorage và fetch user
      manualSetToken(token);
      
      // 2. Chuyển hướng về trang chủ (client-side)
      navigate("/");

    } else {
      // Lỗi, về trang login
      navigate("/login?error=google_failed");
    }
  // 5. SỬA: Thêm manualSetToken vào dependencies
  }, [location, navigate, manualSetToken]); 

  return <div>Đang xử lý đăng nhập...</div>;
}

export default AuthCallback;