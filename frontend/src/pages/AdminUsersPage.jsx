import { useState } from "react";
import apiClient from "../api/client";

export default function AdminUsersPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "trainer",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      await apiClient.post(
        "/api/auth/users",
        {
          email: form.email,
          password: form.password,
          role: form.role,
        },
        {
          auth: true,
        }
      );

      setMessage(`${form.role} account created successfully.`);

      setForm({
        email: "",
        password: "",
        role: "trainer",
      });
    } catch (err) {
      setError(
        err?.message ||
          "Unable to create account"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1>User Management</h1>

      <p style={styles.subtitle}>
        Create privileged Trainer or Admin accounts.
      </p>

      {message && (
        <div style={styles.success}>
          {message}
        </div>
      )}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      <div style={styles.card}>
        <h2>Create Privileged Account</h2>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>
            Email
          </label>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="Enter email address"
          />

          <label style={styles.label}>
            Password
          </label>

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            required
            style={styles.input}
            placeholder="Minimum 8 characters"
          />

          <label style={styles.label}>
            Role
          </label>

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="trainer">
              Trainer
            </option>

            <option value="admin">
              Admin
            </option>
          </select>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.button,
              ...(isSubmitting
                ? styles.buttonDisabled
                : {}),
            }}
          >
            {isSubmitting
              ? "Creating..."
              : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  subtitle: {
    color: "#64748b",
    marginBottom: "1rem",
  },

  card: {
    maxWidth: "600px",
    background: "#ffffff",
    padding: "1.5rem",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    marginTop: "1rem",
  },

  label: {
    display: "block",
    marginBottom: "0.4rem",
    fontWeight: 600,
  },

  input: {
    width: "100%",
    padding: "0.75rem",
    marginBottom: "1rem",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    boxSizing: "border-box",
    background: "#ffffff",
  },

  button: {
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    fontWeight: 700,
    cursor: "pointer",
  },

  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  success: {
    background: "#dcfce7",
    color: "#166534",
    padding: "0.75rem",
    borderRadius: "8px",
    marginBottom: "1rem",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "0.75rem",
    borderRadius: "8px",
    marginBottom: "1rem",
  },
};