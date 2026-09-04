import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div>

      <h1>
        Admin Dashboard
      </h1>

      <p style={styles.subtitle}>
        System administration and user management workspace.
      </p>


      <div style={styles.card}>

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


      <div style={styles.grid}>

        <Link
          to="/admin/users"
          style={styles.link}
        >
          <div style={styles.card}>

            <h3>
              User Management
            </h3>

            <p>
              Manage learner, trainer and admin
              accounts.
            </p>

          </div>
        </Link>


        <div style={styles.card}>

          <h3>
            Platform Administration
          </h3>

          <p>
            Administrative intelligence and
            system controls will be available
            here.
          </p>

        </div>

      </div>

    </div>
  );
}


const styles = {
  subtitle: {
    color: "#64748b",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1rem",
    marginTop: "1rem",
  },

  card: {
    background: "#ffffff",
    padding: "1.25rem",
    borderRadius: "10px",
    border:
      "1px solid #e2e8f0",
  },

  link: {
    textDecoration: "none",
    color: "inherit",
  },
};