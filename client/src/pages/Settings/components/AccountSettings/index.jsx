import { useState, useEffect, useRef } from "react";
import { useAuth, useToast} from "@/hooks/index";
import axiosClient from "@/utils/axiosConfig";
import ChangePasswordForm from "./ChangePasswordForm";
import SetPasswordForm from "./SetPasswordForm";
import styles from "./AccountSettings.module.scss";
import { FaPen } from "react-icons/fa";

const AccountSettings = () => {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({ displayName: "", username: "" });
  const [editState, setEditState] = useState({ displayName: false, username: false });

  const displayNameInputRef = useRef(null);
  const usernameInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        username: user.username || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (editState.displayName) {
      displayNameInputRef.current?.focus();
    }
    if (editState.username) {
      usernameInputRef.current?.focus();
    }
  }, [editState]);

  if (!user) {
    return <div>Loading...</div>;
  }

  const handleEdit = (field) => {
    setEditState((prev) => ({ ...prev, [field]: true }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        username: user.username || "",
      });
    }
    setEditState({ displayName: false, username: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosClient.patch("/users/change-username", formData);
      setUser({ ...user, ...response.data });
      toast.success("Cập nhật hồ sơ thành công!");
      setEditState({ displayName: false, username: false });
    } catch (error) {
      const errorMessage = error.response?.data?.msg || "Đã có lỗi xảy ra.";
      toast.error(errorMessage);
    }
  };

  const isChanged = user
    ? formData.displayName !== (user.displayName || "") || formData.username !== (user.username || "")
    : false;

  const showCancel = isChanged || Object.values(editState).some(Boolean);

  return (
    <div className={styles.accountSettings}>
      <form onSubmit={handleSubmit}>
        <div className={styles.infoSection}>
          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="text"
              value={user.email}
              readOnly
              disabled
              className={styles.inputReadOnly}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Display Name</label>
            <div className={styles.inputWrapper}>
              <input
                ref={displayNameInputRef}
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                disabled={!editState.displayName}
                className={editState.displayName ? styles.inputEditable : styles.inputReadOnly}
              />
              {!editState.displayName && (
                <button type="button" onClick={() => handleEdit('displayName')} className={styles.editIconBtn}>
                  <FaPen />
                </button>
              )}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Username</label>
            <div className={styles.inputWrapper}>
              <input
                ref={usernameInputRef}
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={!editState.username}
                className={editState.username ? styles.inputEditable : styles.inputReadOnly}
              />
              {!editState.username && (
                <button type="button" onClick={() => handleEdit('username')} className={styles.editIconBtn}>
                  <FaPen />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <button type="submit" className={styles.saveBtn} disabled={!isChanged}>
            Lưu thay đổi
          </button>
          {showCancel && (
            <button type="button" onClick={handleCancel} className={styles.cancelBtn}>
              Hủy
            </button>
          )}
        </div>
      </form>

      <hr className={styles.divider} />

      {user.hasPassword ? <ChangePasswordForm /> : <SetPasswordForm />}
    </div>
  );
};

export default AccountSettings;
