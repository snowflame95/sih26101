import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import adminApi from "../api/adminApi";
import { useAuth } from "../context/AuthContext";


export default function AdminDashboardPage() {
  const { user } = useAuth();

  const [overview, setOverview] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [activity, setActivity] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");


  const loadDashboard = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [
        overviewData,
        usersData,
        assessmentsData,
        attemptsData,
        activityData,
      ] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getRecentUsers(8),
        adminApi.getAssessments(),
        adminApi.getAssessmentAttempts(),
        adminApi.getActivity(50),
      ]);

      setOverview(overviewData);
      setRecentUsers(usersData || []);
      setAssessments(
        assessmentsData || []
      );
      setAttempts(
        attemptsData || []
      );
      setActivity(
        activityData || []
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load admin dashboard."
      );
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    loadDashboard();
  }, []);


  if (isLoading) {
    return (
      <div>
        <h1>Admin Dashboard</h1>
        <p>
          Loading administrative data...
        </p>
      </div>
    );
  }


  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1>
            Admin Dashboard
          </h1>

          <p style={styles.subtitle}>
            Platform administration,
            monitoring and activity.
          </p>
        </div>

        <Link
          to="/admin/users"
          style={styles.primaryButton}
        >
          User Management
        </Link>
      </div>


      {error ? (
        <div style={styles.error}>
          {error}
        </div>
      ) : null}


      <div style={styles.welcomeCard}>
        <h2>
          Welcome, Administrator
        </h2>

        <p>
          {user?.email}
        </p>

        <p>
          Role:{" "}
          <strong>
            {user?.role}
          </strong>
        </p>
      </div>


      {overview ? (
        <>
          <h2 style={styles.sectionTitle}>
            Platform Overview
          </h2>

          <div style={styles.statsGrid}>
            <StatCard
              title="Total Users"
              value={
                overview.users.total
              }
            />

            <StatCard
              title="Learners"
              value={
                overview.users.learners
              }
            />

            <StatCard
              title="Trainers"
              value={
                overview.users.trainers
              }
            />

            <StatCard
              title="Active Users"
              value={
                overview.users.active
              }
            />

            <StatCard
              title="Assessments"
              value={
                overview.assessments.total
              }
            />

            <StatCard
              title="Assessment Attempts"
              value={
                overview.assessments.attempts
              }
            />

            <StatCard
              title="Assignments"
              value={
                overview.assignments.total
              }
            />

            <StatCard
              title="Completed Assignments"
              value={
                overview.assignments.completed
              }
            />

            <StatCard
              title="Learning Modules"
              value={
                overview.learning.modules
              }
            />

            <StatCard
              title="Learning Resources"
              value={
                overview.learning.resources
              }
            />

            <StatCard
              title="Completed Learning"
              value={
                overview.learning.completed
              }
            />
          </div>
        </>
      ) : null}


      {/* =====================================================
          ASSESSMENT ACTIVITY
      ====================================================== */}

      <section style={styles.section}>
        <div style={styles.cardHeader}>
          <h2>
            Assessment Activity
          </h2>
        </div>

        {attempts.length === 0 ? (
          <div style={styles.empty}>
            No assessment attempts yet.
          </div>
        ) : (
          <div style={styles.list}>
            {attempts.slice(0, 10).map(
              (attempt) => (
                <div
                  key={attempt.attempt_id}
                  style={styles.activityCard}
                >
                  <div>
                    <strong>
                      {attempt.assessment_title}
                    </strong>

                    <div
                      style={styles.muted}
                    >
                      Learner:{" "}
                      {attempt.learner_email}
                    </div>

                    <div
                      style={styles.muted}
                    >
                      Attempt #
                      {
                        attempt.attempt_number
                      }{" "}
                      ·{" "}
                      {formatDate(
                        attempt.completed_at
                      )}
                    </div>
                  </div>

                  <div
                    style={styles.scoreBox}
                  >
                    {attempt.percentage}%
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>


      {/* =====================================================
          ASSESSMENT LIBRARY
      ====================================================== */}

      <section style={styles.section}>
        <h2>
          Assessment Library
        </h2>

        {assessments.length === 0 ? (
          <div style={styles.empty}>
            No assessments found.
          </div>
        ) : (
          <div style={styles.list}>
            {assessments.slice(0, 10).map(
              (assessment) => (
                <div
                  key={assessment.id}
                  style={styles.activityCard}
                >
                  <div>
                    <strong>
                      {assessment.title}
                    </strong>

                    <div
                      style={styles.muted}
                    >
                      {
                        assessment.question_count
                      }{" "}
                      questions ·{" "}
                      {
                        assessment.attempt_count
                      }{" "}
                      attempts
                    </div>

                    {assessment.latest_score !==
                    null ? (
                      <div
                        style={styles.muted}
                      >
                        Latest:{" "}
                        {
                          assessment.latest_score
                        }%
                        {" · "}
                        Best:{" "}
                        {
                          assessment.best_score
                        }%
                      </div>
                    ) : (
                      <div
                        style={styles.muted}
                      >
                        No attempts yet
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>


      {/* =====================================================
          ADMIN ACTIVITY TIMELINE
      ====================================================== */}

      <section style={styles.section}>
        <div style={styles.cardHeader}>
          <h2>
            Recent Platform Activity
          </h2>

          <button
            type="button"
            onClick={loadDashboard}
            style={styles.refreshButton}
          >
            Refresh
          </button>
        </div>

        {activity.length === 0 ? (
          <div style={styles.empty}>
            No activity has been recorded yet.
          </div>
        ) : (
          <div style={styles.list}>
            {activity.map(
              (item) => (
                <div
                  key={item.id}
                  style={styles.timelineItem}
                >
                  <div
                    style={
                      styles.timelineDot
                    }
                  />

                  <div>
                    <strong>
                      {item.description}
                    </strong>

                    <div
                      style={styles.muted}
                    >
                      Actor:{" "}
                      {item.actor_email ||
                        "System"}
                      {item.target_email
                        ? ` · Target: ${item.target_email}`
                        : ""}
                    </div>

                    <div
                      style={styles.muted}
                    >
                      {formatDate(
                        item.created_at
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>


      {/* =====================================================
          RECENT USERS
      ====================================================== */}

      <section style={styles.section}>
        <div style={styles.cardHeader}>
          <h2>
            Recent Users
          </h2>

          <Link to="/admin/users">
            View all
          </Link>
        </div>

        <div style={styles.list}>
          {recentUsers.map(
            (item) => (
              <div
                key={item.id}
                style={styles.activityCard}
              >
                <div>
                  <strong>
                    {item.email}
                  </strong>

                  <div
                    style={styles.muted}
                  >
                    User ID: {item.id}
                  </div>
                </div>

                <span
                  style={styles.badge}
                >
                  {item.role}
                </span>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}


function StatCard({
  title,
  value,
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statTitle}>
        {title}
      </div>

      <div style={styles.statValue}>
        {value}
      </div>
    </div>
  );
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString();
}


const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    flexWrap: "wrap",
  },

  subtitle: {
    color: "#64748b",
  },

  primaryButton: {
    textDecoration: "none",
    background: "#0f172a",
    color: "#ffffff",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    fontWeight: 700,
  },

  welcomeCard: {
    background: "#ffffff",
    padding: "1.25rem",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    marginTop: "1rem",
  },

  sectionTitle: {
    marginTop: "1.5rem",
  },

  section: {
    marginTop: "1.5rem",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "1rem",
  },

  statCard: {
    background: "#ffffff",
    padding: "1rem",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },

  statTitle: {
    color: "#64748b",
    fontSize: "0.85rem",
    fontWeight: 600,
  },

  statValue: {
    fontSize: "1.8rem",
    fontWeight: 800,
    marginTop: "0.35rem",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    marginTop: "1rem",
  },

  activityCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "1rem",
  },

  timelineItem: {
    display: "flex",
    gap: "0.75rem",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "1rem",
  },

  timelineDot: {
    width: "10px",
    height: "10px",
    minWidth: "10px",
    borderRadius: "50%",
    background: "#2563eb",
    marginTop: "0.35rem",
  },

  scoreBox: {
    fontWeight: 800,
    fontSize: "1.25rem",
  },

  muted: {
    color: "#64748b",
    fontSize: "0.85rem",
    marginTop: "0.2rem",
  },

  badge: {
    padding: "0.3rem 0.6rem",
    borderRadius: "999px",
    background: "#e2e8f0",
    fontSize: "0.75rem",
    fontWeight: 700,
  },

  refreshButton: {
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    padding: "0.6rem 0.9rem",
    borderRadius: "8px",
    fontWeight: 700,
    cursor: "pointer",
  },

  empty: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "1rem",
    color: "#64748b",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "0.75rem",
    borderRadius: "8px",
    marginTop: "1rem",
  },
};