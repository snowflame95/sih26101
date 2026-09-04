import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


export default function RegisterPage() {
  const navigate = useNavigate();

  const { register } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      await register({
        email: form.email,
        password: form.password,
      });

      setSuccess(
        "Learner account created successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 800);

    } catch (err) {
      setError(
        err?.message ||
        "Registration failed"
      );

    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <h1 style={styles.title}>
          Create Account
        </h1>

        <p style={styles.subtitle}>
          Register as a learner
        </p>


        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}


        {success && (
          <div style={styles.success}>
            {success}
          </div>
        )}


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
            placeholder="you@example.com"
          />


          <label style={styles.label}>
            Password
          </label>

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
            style={styles.input}
            placeholder="Minimum 8 characters"
          />


          <div style={styles.info}>
            New accounts created here are
            <strong> Learner </strong>
            accounts.
          </div>


          <button
            type="submit"
            disabled={isSubmitting}
            style={styles.button}
          >
            {isSubmitting
              ? "Creating..."
              : "Create Learner Account"}
          </button>

        </form>


        <p style={styles.footer}>
          Already have an account?{" "}

          <Link
            to="/login"
            style={styles.link}
          >
            Login
          </Link>
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
    background: "#f8fafc",
    padding: "1rem",
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow:
      "0 10px 30px rgba(15, 23, 42, 0.08)",
    boxSizing: "border-box",
  },

  title: {
    marginBottom: "0.4rem",
  },

  subtitle: {
    color: "#64748b",
    marginTop: 0,
    marginBottom: "1.5rem",
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
    border:
      "1px solid #cbd5e1",
    borderRadius: "8px",
    boxSizing: "border-box",
  },

  info: {
    background: "#f1f5f9",
    padding: "0.8rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.9rem",
    color: "#475569",
  },

  button: {
    width: "100%",
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    padding: "0.8rem",
    borderRadius: "8px",
    fontWeight: 700,
    cursor: "pointer",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "0.75rem",
    borderRadius: "8px",
    marginBottom: "1rem",
  },

  success: {
    background: "#dcfce7",
    color: "#166534",
    padding: "0.75rem",
    borderRadius: "8px",
    marginBottom: "1rem",
  },

  footer: {
    marginTop: "1.5rem",
    textAlign: "center",
    color: "#64748b",
  },

  link: {
    fontWeight: 700,
    color: "#0f172a",
  },
};