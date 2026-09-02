import { useEffect, useState } from "react";

import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import profileApi from "../api/profileApi";

const emptyProfile = {
  full_name: "",
  designation: "",
  department: "",
  experience_years: 0,
  education: "",
  previous_training: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isCreateMode, setIsCreateMode] = useState(false);

  const loadProfile = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await profileApi.getProfile();
      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        designation: data.designation || "",
        department: data.department || "",
        experience_years: data.experience_years ?? 0,
        education: data.education || "",
        previous_training: data.previous_training || "",
      });
      setIsCreateMode(false);
    } catch (loadError) {
      if (loadError?.message?.includes("404") || loadError?.message?.includes("Profile not found")) {
        setProfile(null);
        setFormData(emptyProfile);
        setIsCreateMode(true);
        return;
      }

      setError(loadError?.message || "Unable to load profile.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: name === "experience_years" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      if (isCreateMode) {
        const created = await profileApi.createProfile(formData);
        setProfile(created);
        setIsCreateMode(false);
      } else {
        const updated = await profileApi.updateProfile(formData);
        setProfile(updated);
      }
    } catch (submitError) {
      setError(submitError?.message || "Unable to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1>{profile ? "My Profile" : "Create Profile"}</h1>

        {error ? <ErrorMessage message={error} /> : null}

        {!profile && !isCreateMode ? (
          <EmptyState
            title="No profile yet"
            description="Create a profile to describe your role, experience, and skills."
          />
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>
              Full Name
              <input name="full_name" value={formData.full_name} onChange={handleChange} required style={styles.input} />
            </label>

            <label style={styles.label}>
              Designation
              <input name="designation" value={formData.designation} onChange={handleChange} required style={styles.input} />
            </label>

            <label style={styles.label}>
              Department
              <input name="department" value={formData.department} onChange={handleChange} required style={styles.input} />
            </label>

            <label style={styles.label}>
              Experience Years
              <input name="experience_years" type="number" min="0" value={formData.experience_years} onChange={handleChange} style={styles.input} />
            </label>

            <label style={styles.label}>
              Education
              <input name="education" value={formData.education} onChange={handleChange} style={styles.input} />
            </label>

            <label style={styles.label}>
              Previous Training
              <textarea name="previous_training" value={formData.previous_training} onChange={handleChange} rows={4} style={styles.textarea} />
            </label>

            <button type="submit" disabled={isSaving} style={styles.button}>
              {isSaving ? "Saving..." : profile ? "Save Changes" : "Create Profile"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: "720px",
    background: "#ffffff",
    borderRadius: "12px",
    padding: "2rem",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
  },
  form: {
    display: "grid",
    gap: "1rem",
    marginTop: "1.5rem",
  },
  label: {
    display: "grid",
    gap: "0.5rem",
    fontWeight: 600,
    color: "#0f172a",
  },
  input: {
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0.75rem 0.9rem",
    fontSize: "1rem",
  },
  textarea: {
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0.75rem 0.9rem",
    fontSize: "1rem",
    resize: "vertical",
  },
  button: {
    marginTop: "0.5rem",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    padding: "0.85rem 1rem",
    fontWeight: 700,
    cursor: "pointer",
  },
};
