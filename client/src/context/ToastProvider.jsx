// client/src/context/ToastProvider.jsx
import { useState, useCallback } from "react";
import clsx from "clsx";

// Import Context đã tạo ở bước 1
import { ToastContext } from "./ToastContext";

// Import styles từ components
import styles from "@/components/ToastMessage/ToastMessage.module.scss";

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Hàm xóa toast (có animation)
  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isHiding: true } : t))
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  // Hàm thêm toast
  const addToast = useCallback(
    (message, type = "info", duration = 3000) => {
      const id = Date.now().toString() + Math.random().toString();
      setToasts((prev) => [
        ...prev,
        { id, message, type, duration, isHiding: false },
      ]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  // Object giá trị context
  const toastValues = {
    success: (msg, time) => addToast(msg, "success", time),
    error: (msg, time) => addToast(msg, "error", time),
    info: (msg, time) => addToast(msg, "info", time),
    warning: (msg, time) => addToast(msg, "warning", time),
  };

  return (
    <ToastContext.Provider value={toastValues}>
      {children}

      {/* Render UI Toast tại đây */}
      <div className={styles.toastContainer}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={clsx(styles.toast, styles[t.type], {
              [styles.hiding]: t.isHiding,
            })}
          >
            {t.type === "success" && (
              <i className="fa-solid fa-check-circle"></i>
            )}
            {t.type === "error" && (
              <i className="fa-solid fa-circle-exclamation"></i>
            )}
            {t.type === "info" && <i className="fa-solid fa-circle-info"></i>}
            {t.type === "warning" && (
              <i className="fa-solid fa-triangle-exclamation"></i>
            )}

            <span className={styles.message}>{t.message}</span>

            <button
              className={styles.closeBtn}
              onClick={() => removeToast(t.id)}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <style jsx>{`
              .${styles.toast}:last-child::after {
                animation-duration: ${t.duration}ms;
              }
            `}</style>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
