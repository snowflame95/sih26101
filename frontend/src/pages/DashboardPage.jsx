import { useEffect, useState } from "react";

import assessmentApi from "../api/assessmentApi";
import competencyApi from "../api/competencyApi";
import ErrorMessage from "../components/ErrorMessage";
import learningApi from "../api/learningApi";
import { useAuth } from "../context/AuthContext";

const ROLE_DETAILS = {
  learner: {
    label: "Learner",
    summary: "Access learning modules, studies, and personal progress tracking.",
    permissions: [
      "Take assessments",
      "Track learning progress",
      "Review personal roadmap",
    ],
  },
  tester: {
    label: "Tester",
    summary:
      "Your tester workspace foundation is ready for assignment and review workflows.",
    permissions: [
      "Use authenticated learner features",
      "Maintain your profile",
      "Access tester assignment and review tools",
    ],
  },
  trainer: {
    label: "Trainer",
    summary:
      "Create learning content, assessments, and assignments for learners.",
    permissions: [
      "Use authenticated learner features",
      "Create and manage learning modules",
      "Create and manage assessments",
      "Assign assessments to learners",
    ],
  },
  admin: {
    label: "Admin",
    summary:
      "Manage platform users, content, assessments, and administrative workflows.",
    permissions: [
      "Use authenticated learner features",
      "Use authorized content and assessment APIs",
      "Manage platform roles through protected admin functionality",
    ],
  },
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const normalizedRole =
  user?.role?.toLowerCase() || "";
  const roleInfo = ROLE_DETAILS[normalizedRole] || ROLE_DETAILS.learner;

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [
          competencies,
          assessments,
          attempts,
          modules,
          progress,
          roadmap,
        ] = await Promise.all([
          competencyApi.getMyCompetencies(),
          assessmentApi.listAssessments(),
          assessmentApi.getMyAttempts(),
          learningApi.listModules(),
          learningApi.getMyProgress(),
          learningApi.getRoadmap(),
        ]);

        setSummary({
          competencies: competencies || [],
          assessments: assessments || [],
          attempts: attempts || [],
          modules: modules || [],
          progress: progress || [],
          roadmap: roadmap || [],
        });
      } catch (loadError) {
        setError(
          loadError?.message || "Unable to load dashboard summary."
        );
      }
    };

    loadSummary();
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1>Dashboard</h1>

        <p style={styles.subtitle}>
          Welcome to your skill intelligence workspace.
        </p>

        {error ? <ErrorMessage message={error} /> : null}

        <div style={styles.roleBadge}>{roleInfo.label}</div>

        <div style={styles.infoRow}>
          <strong>Email:</strong>
          <span>{user?.email || "No user loaded"}</span>
        </div>

        <div style={styles.infoRow}>
          <strong>Role:</strong>
          <span>{user?.role || "Unknown"}</span>
        </div>

        <div style={styles.permissionBox}>
          <strong>{roleInfo.summary}</strong>

          <ul style={styles.permissionList}>
            {roleInfo.permissions.map((permission) => (
              <li key={permission}>{permission}</li>
            ))}
          </ul>
        </div>

        {summary ? (
          <div style={styles.summaryGrid}>
            <div style={styles.summaryItem}>
              <strong>{summary.competencies.length}</strong>
              <span>Competencies</span>
            </div>

            <div style={styles.summaryItem}>
              <strong>{summary.assessments.length}</strong>
              <span>Available assessments</span>
            </div>

            <div style={styles.summaryItem}>
              <strong>{summary.attempts.length}</strong>
              <span>Attempts completed</span>
            </div>

            <div style={styles.summaryItem}>
              <strong>
                {
                  summary.progress.filter(
                    (item) => item.status === "completed"
                  ).length
                }
              </strong>
              <span>Modules completed</span>
            </div>

            <div style={styles.summaryItem}>
              <strong>
                {summary.progress.length}/{summary.modules.length}
              </strong>
              <span>Modules started</span>
            </div>

            <div style={styles.summaryItem}>
              <strong>{summary.roadmap.length}</strong>
              <span>Roadmap skills</span>
            </div>
          </div>
        ) : null}

        <button onClick={logout} style={styles.button}>
          Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "2rem 1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    width: "100%",
    maxWidth: "640px",
    background: "#ffffff",
    borderRadius: "14px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    padding: "2rem",
  },

  subtitle: {
    color: "#475569",
    marginBottom: "1.5rem",
  },

  roleBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.35rem 0.75rem",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 700,
    marginBottom: "1rem",
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "1rem",
    padding: "0.85rem 0",
    borderBottom: "1px solid #e2e8f0",
  },

  permissionBox: {
    marginTop: "1rem",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    background: "#f8fafc",
    padding: "1rem",
  },

  permissionList: {
    margin: "0.75rem 0 0 1.2rem",
    color: "#334155",
    display: "grid",
    gap: "0.45rem",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "0.75rem",
    marginTop: "1rem",
  },

  summaryItem: {
    display: "grid",
    gap: "0.25rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "0.85rem",
    color: "#475569",
  },

  button: {
    marginTop: "1.5rem",
    border: "none",
    borderRadius: "8px",
    background: "#dc2626",
    color: "#ffffff",
    padding: "0.8rem 1rem",
    fontWeight: 700,
    cursor: "pointer",
  },
};