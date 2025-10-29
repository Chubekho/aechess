import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router';
import { useAuth } from '@/hooks/index';
import clsx from 'clsx';
import styles from './User.module.scss'; 

function User({ user }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { logout } = useAuth();
  const dropdownRef = useRef(null); // Ref để bắt sự kiện click-outside

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false); // Đóng dropdown sau khi logout
  };

  // Logic xử lý click-outside
  useEffect(() => {
    function handleClickOutside(event) {
      // Nếu click ra ngoài component (dropdownRef) thì đóng dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    // Gắn event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Gỡ event listener khi component unmount
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    // Dùng chung class .navItem từ Navigation để đồng bộ style
    // Gắn ref vào đây để bắt click-outside
    <div className={styles.navItem} ref={dropdownRef}>
      
      {/* Nút bấm để toggle dropdown */}
      <button 
        className={clsx(styles.userButton, {
            [styles["userButton--active"]]: isDropdownOpen
        })}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)} // Toggle
      >
        <span>{user.displayName || user.email}</span>
        {/* Thêm icon mũi tên (lấy từ FontAwesome) */}
        <i className={clsx("fa-solid fa-caret-down", styles.caret, {
            [styles.caretActive]: isDropdownOpen 
          })}
        ></i>
      </button>

      {/* Dropdown (Sub-list) */}
      {/* Chỉ render khi isDropdownOpen là true */}
      {isDropdownOpen && (
        <ul className={styles.subList}>
          <li className={styles.subItem}>
            <NavLink to={`/profile/${user.id}`} onClick={() => setIsDropdownOpen(false)}>
              Hồ sơ
            </NavLink>
          </li>
          <li className={styles.subItem}>
            <NavLink to="/settings" onClick={() => setIsDropdownOpen(false)}>
              Tuỳ chỉnh
            </NavLink>
          </li>
          {/* Nút Đăng xuất */}
          <li className={clsx(styles.subItem, styles.logoutItem)}>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Đăng xuất
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

export default User;