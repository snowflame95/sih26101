import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


function getRoleDestination(role) {
  const normalizedRole = role?.toLowerCase();

  switch (normalizedRole) {
    case "admin":
      return "/admin";

    case "trainer":
      return "/trainer";

    case "tester":
      return "/tester";

    case "learner":
    default:
      return "/dashboard";
  }
}


export default function LoginPage() {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);


  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const currentUser = await login(
        formData
      );

      const destination =
        getRoleDestination(
          currentUser?.role
        );

      navigate(
        destination,
        {
          replace: true,
        }
      );

    } catch (submitError) {
      setError(
        submitError?.message ||
        "Invalid email or password. Please try again."
      );

    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div style={styles.page}>

      <div style={styles.card}>

        <h1>Sign in</h1>

        <p style={styles.subtitle}>
          SIH26101 – AI Skill Intelligence Platform
        </p>


        <form
          onSubmit={handleSubmit}
          style={styles.form}
        >

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
              autoComplete="email"
            />
          </label>


          <label style={styles.label}>
            Password

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </label>


          {error ? (
            <p style={styles.error}>
              {error}
            </p>
          ) : null}


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
              ? "Signing in..."
              : "Login"}
          </button>

        </form>


        <p style={styles.footerText}>
          Need an account?{" "}
          <Link to="/register">
            Create one
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
    background: "#f3f4f6",
    padding: "1rem",
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "12px",
    boxShadow:
      "0 8px 24px rgba(15, 23, 42, 0.08)",
    padding: "2rem",
  },

  subtitle: {
    marginTop: "0.5rem",
    marginBottom: "1.5rem",
    color: "#475569",
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
    background: "#2563eb",
    color: "#ffffff",
    padding: "0.85rem 1rem",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
  },

  buttonDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },

  error: {
    margin: 0,
    color: "#b91c1c",
    fontSize: "0.95rem",
  },

  footerText: {
    marginTop: "1.25rem",
    textAlign: "center",
    color: "#475569",
  },
};