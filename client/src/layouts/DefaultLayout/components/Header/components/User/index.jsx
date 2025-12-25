//client/src/layouts/DefaultLayout/components/Header/components/User/index.jsx
import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router';
import { useAuth } from '@/hooks/index';
import clsx from 'clsx';
import styles from './User.module.scss'; 

function User({ user }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { logout } = useAuth();
  const dropdownRef = useRef(null); // Ref to catch click-outside events

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false); // Close dropdown after logout
  };

  // Click-outside handling logic
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className={styles.navItem} ref={dropdownRef}>
      
      {/* Button to toggle dropdown */}
      <button 
        className={clsx(styles.userButton, {
            [styles["userButton--active"]]: isDropdownOpen
        })}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <img 
          src={user.avatar || '/avatars/PepetheFrog.jpg'} 
          alt={user.username} 
          className={styles.avatar}
        />
        <span>{user.username || user.email}</span>
        <i className={clsx("fa-solid fa-caret-down", styles.caret, {
            [styles.caretActive]: isDropdownOpen 
          })}
        ></i>
      </button>

      {/* Dropdown (Sub-list) */}
      {isDropdownOpen && (
        <ul className={styles.subList}>
          <li className={styles.subItem}>
            <NavLink to={`/profile/${user?.username}`} onClick={() => setIsDropdownOpen(false)}>
              Hồ sơ
            </NavLink>
          </li>
          <li className={styles.subItem}>
            <NavLink to="/settings" onClick={() => setIsDropdownOpen(false)}>
              Tuỳ chỉnh
            </NavLink>
          </li>
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
