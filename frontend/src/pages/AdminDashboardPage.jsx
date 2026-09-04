import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import adminApi from "../api/adminApi";
import { useAuth } from "../context/AuthContext";


export default function AdminDashboardPage() {
  const { user } = useAuth();

  const [overview, setOverview] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentAssessments, setRecentAssessments] = useState([]);

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
      ] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getRecentUsers(8),
        adminApi.getAssessments(),
      ]);

      setOverview(overviewData);
      setRecentUsers(usersData);
      setRecentAssessments(
        assessmentsData.slice(0, 8)
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
        <p>Loading administrative data...</p>
      </div>
    );
  }


  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1>Admin Dashboard</h1>

          <p style={styles.subtitle}>
            Platform administration and system intelligence.
          </p>
        </div>

        <Link
          to="/admin/users"
          style={styles.primaryButton}
        >
          User Management
        </Link>
      </div>


      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}


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


      {overview && (
        <>
          <h2 style={styles.sectionTitle}>
            Platform Overview
          </h2>

          <div style={styles.statsGrid}>
            <StatCard
              title="Total Users"
              value={overview.users.total}
            />

            <StatCard
              title="Learners"
              value={overview.users.learners}
            />

            <StatCard
              title="Trainers"
              value={overview.users.trainers}
            />

            <StatCard
              title="Admins"
              value={overview.users.admins}
            />

            <StatCard
              title="Active Users"
              value={overview.users.active}
            />

            <StatCard
              title="Assessments"
              value={overview.assessments.total}
            />

            <StatCard
              title="Assessment Attempts"
              value={overview.assessments.attempts}
            />

            <StatCard
              title="Average Score"
              value={`${overview.assessments.average_score}%`}
            />

            <StatCard
              title="Assignments"
              value={overview.assignments.total}
            />

            <StatCard
              title="Completed Assignments"
              value={overview.assignments.completed}
            />
          </div>
        </>
      )}


      <div style={styles.twoColumn}>
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h2>Recent Users</h2>

            <Link to="/admin/users">
              View all
            </Link>
          </div>

          {recentUsers.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <div style={styles.list}>
              {recentUsers.map((item) => (
                <div
                  key={item.id}
                  style={styles.listItem}
                >
                  <div>
                    <strong>
                      {item.email}
                    </strong>

                    <div style={styles.muted}>
                      User ID: {item.id}
                    </div>
                  </div>

                  <div style={styles.badge}>
                    {item.role}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>


        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h2>Assessments</h2>
          </div>

          {recentAssessments.length === 0 ? (
            <p>No assessments found.</p>
          ) : (
            <div style={styles.list}>
              {recentAssessments.map(
                (assessment) => (
                  <div
                    key={assessment.id}
                    style={styles.listItem}
                  >
                    <div>
                      <strong>
                        {assessment.title}
                      </strong>

                      <div style={styles.muted}>
                        {assessment.question_count} questions
                        {" · "}
                        {assessment.attempt_count} attempts
                      </div>
                    </div>

                    <div style={styles.score}>
                      {assessment.average_score}%
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}


function StatCard({ title, value }) {
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

  twoColumn: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "1rem",
    marginTop: "1rem",
  },

  card: {
    background: "#ffffff",
    padding: "1.25rem",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
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

  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    padding: "0.75rem 0",
    borderBottom: "1px solid #e2e8f0",
  },

  muted: {
    color: "#64748b",
    fontSize: "0.8rem",
    marginTop: "0.2rem",
  },

  badge: {
    padding: "0.3rem 0.6rem",
    borderRadius: "999px",
    background: "#e2e8f0",
    fontSize: "0.75rem",
    fontWeight: 700,
  },

  score: {
    fontWeight: 800,
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "0.75rem",
    borderRadius: "8px",
    marginTop: "1rem",
  },
};