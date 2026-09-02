import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      await register(formData);
      setSuccess("Registration successful. Redirecting to login...");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 900);
    } catch (submitError) {
      setError(submitError?.message || "Unable to create account right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1>Create account</h1>
        <p style={styles.subtitle}>Start your skill learning journey</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="user@example.com"
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              minLength={8}
              required
              style={styles.input}
              placeholder="At least 8 characters"
            />
          </label>

          <p style={styles.roleNote}>New accounts are created as Learner accounts.</p>

          {error ? <p style={styles.error}>{error}</p> : null}
          {success ? <p style={styles.success}>{success}</p> : null}

          <button type="submit" disabled={isSubmitting} style={styles.button}>
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f4f6",
    padding: "1rem",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
    padding: "2rem",
  },
  subtitle: {
    marginTop: "0.5rem",
    marginBottom: "1.5rem",
    color: "#475569",
  },
  roleNote: {
    margin: 0,
    color: "#475569",
    fontSize: "0.95rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    fontWeight: 600,
    color: "#1f2937",
  },
  input: {
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "0.75rem 0.875rem",
    fontSize: "1rem",
  },
  button: {
    border: "none",
    borderRadius: "8px",
    background: "#0f766e",
    color: "#ffffff",
    padding: "0.85rem 1rem",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  error: {
    margin: 0,
    color: "#b91c1c",
    fontSize: "0.95rem",
  },
  success: {
    margin: 0,
    color: "#166534",
    fontSize: "0.95rem",
  },
  footerText: {
    marginTop: "1.25rem",
    textAlign: "center",
    color: "#475569",
  },
};
