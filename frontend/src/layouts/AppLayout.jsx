import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


const NAV_ITEMS = [

  // ==========================================================
  // COMMON
  // ==========================================================

  {
    label: "Dashboard",
    to: "/dashboard",
  },

  {
    label: "My Profile",
    to: "/profile",
  },


  // ==========================================================
  // LEARNER
  // ==========================================================

  {
    label: "My Competencies",
    to: "/competencies",
    roles: ["learner"],
  },

  {
    label: "Skill Intelligence",
    to: "/skill-intelligence",
    roles: ["learner"],
  },

  {
    label: "Assessment",
    to: "/assessment",
    roles: ["learner"],
  },

  {
    label: "Assessment History",
    to: "/assessment-history",
    roles: ["learner"],
  },

  {
    label: "Assigned Assessments",
    to: "/assigned-assessments",
    roles: ["learner"],
  },

  {
    label: "Learning",
    to: "/learning",
    roles: ["learner"],
  },

  {
    label: "Roadmap",
    to: "/roadmap",
    roles: ["learner"],
  },


  // ==========================================================
  // TRAINER
  // ==========================================================

  {
    label: "Trainer Dashboard",
    to: "/trainer",
    roles: ["trainer"],
  },

  {
    label: "Learning Content",
    to: "/trainer/modules",
    roles: ["trainer"],
  },

  {
    label: "Assessment Authoring",
    to: "/trainer/assessments",
    roles: ["trainer"],
  },

  {
    label: "AI Quiz Generator",
    to: "/trainer/quiz-generator",
    roles: ["trainer"],
  },

  {
    label: "Assign Assessments",
    to: "/trainer/assignments",
    roles: ["trainer"],
  },


  // ==========================================================
  // TESTER
  // ==========================================================

  {
    label: "Tester Assignments",
    to: "/tester",
    roles: ["tester"],
  },


  // ==========================================================
  // ADMIN
  // ==========================================================

  {
    label: "Admin Dashboard",
    to: "/admin",
    roles: ["admin"],
  },

  {
    label: "User Management",
    to: "/admin/users",
    roles: ["admin"],
  },

];


const ROLE_LABELS = {
  learner: "Learner Workspace",
  tester: "Tester Workspace",
  trainer: "Trainer Workspace",
  admin: "Admin Workspace",
};


export default function AppLayout() {

  const {
    user,
    logout,
  } = useAuth();


  const normalizedRole =
    user?.role?.toLowerCase();


  const roleLabel =
    ROLE_LABELS[normalizedRole] ||
    "Workspace";


  const visibleNavItems =
    NAV_ITEMS.filter(
      (item) =>
        !item.roles ||
        item.roles.includes(
          normalizedRole
        )
    );


  return (
    <div style={styles.shell}>

      {/* ====================================================
          SIDEBAR
      ==================================================== */}

      <aside style={styles.sidebar}>

        <div style={styles.brandBlock}>

          <h2 style={styles.brand}>
            SIH26101
          </h2>

          <small style={styles.muted}>
            Skill Intelligence
          </small>

          <div style={styles.rolePill}>
            {roleLabel}
          </div>

        </div>


        <nav style={styles.nav}>

          {visibleNavItems.map(
            (item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  ...styles.navLink,
                  ...(isActive
                    ? styles.navLinkActive
                    : {}),
                })}
              >
                {item.label}
              </NavLink>
            )
          )}

        </nav>

      </aside>


      {/* ====================================================
          MAIN APPLICATION
      ==================================================== */}

      <main style={styles.main}>

        <header style={styles.header}>

          <div>

            <div style={styles.headerLabel}>
              Welcome back
            </div>

            <strong>
              {user?.email || "User"}
            </strong>

          </div>


          <button
            type="button"
            onClick={logout}
            style={styles.logoutButton}
          >
            Logout
          </button>

        </header>


        <div style={styles.content}>
          <Outlet />
        </div>

      </main>

    </div>
  );
}


const styles = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
  },

  sidebar: {
    width: "250px",
    background: "#0f172a",
    color: "#e2e8f0",
    padding: "1.5rem 1rem",
    boxSizing: "border-box",
    flexShrink: 0,
  },

  brandBlock: {
    paddingBottom: "1.5rem",
    borderBottom:
      "1px solid rgba(148, 163, 184, 0.2)",
    marginBottom: "1.5rem",
  },

  brand: {
    margin: 0,
    fontSize: "1.5rem",
  },

  muted: {
    color: "#94a3b8",
  },

  rolePill: {
    marginTop: "0.75rem",
    display: "inline-flex",
    padding: "0.35rem 0.7rem",
    borderRadius: "999px",
    background: "#1e293b",
    color: "#e2e8f0",
    fontSize: "0.75rem",
    fontWeight: 700,
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },

  navLink: {
    color: "#e2e8f0",
    textDecoration: "none",
    padding: "0.75rem 0.9rem",
    borderRadius: "8px",
    fontWeight: 600,
    transition:
      "background-color 0.15s ease, color 0.15s ease",
  },

  navLinkActive: {
    background: "#1e293b",
    color: "#ffffff",
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#ffffff",
    borderBottom:
      "1px solid #e2e8f0",
    padding: "1rem 1.5rem",
  },

  headerLabel: {
    fontSize: "0.8rem",
    color: "#64748b",
    marginBottom: "0.2rem",
  },

  logoutButton: {
    border: "none",
    background: "#dc2626",
    color: "#ffffff",
    padding: "0.7rem 1rem",
    borderRadius: "8px",
    fontWeight: 700,
    cursor: "pointer",
  },

  content: {
    padding: "1.5rem",
    flex: 1,
    minWidth: 0,
  },
};