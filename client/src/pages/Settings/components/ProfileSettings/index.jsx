import { useState } from "react";
import { useAuth, useToast } from "@/hooks/index";
import axiosClient from "@/utils/axiosConfig";
import { AVATAR_PRESETS } from "@/utils/avatarConfig";
import styles from "./ProfileSettings.module.scss";

const ProfileSettings = () => {
  const { user, setUser } = useAuth();

  const [bio, setBio] = useState(user?.bio || "");
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar);
  const [isSaving, setIsSaving] = useState(false);

  const toast = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await axiosClient.patch("/users/profile", {
        bio,
        avatar: selectedAvatar,
      });
      setUser(response.data); // Update user in context
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.profileSettings}>
      <h2>Profile Settings</h2>

      <div className={styles.formGroup}>
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength="200"
          placeholder="Tell everyone a little about yourself..."
        />
      </div>

      <div className={styles.formGroup}>
        <label>Avatar</label>
        <div className={styles.avatarGrid}>
          {AVATAR_PRESETS.map((src) => (
            <img
              key={src}
              src={src}
              alt={`Avatar option ${src}`}
              className={`${styles.avatarItem} ${
                selectedAvatar === src ? styles.selected : ""
              }`}
              onClick={() => setSelectedAvatar(src)}
            />
          ))}
        </div>
      </div>

      <button
        className={styles.saveButton}
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
};

export default ProfileSettings;
