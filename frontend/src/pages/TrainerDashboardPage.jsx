import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import assessmentApi from "../api/assessmentApi";
import competencyApi from "../api/competencyApi";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import learningApi from "../api/learningApi";

export default function TrainerDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      learningApi.listModules(),
      assessmentApi.listManageAssessments(),
      competencyApi.getAllCompetencies(),
    ])
      .then(([modules, assessments, competencies]) => setSummary({ modules, assessments, competencies }))
      .catch((loadError) => setError(loadError?.message || "Unable to load trainer dashboard."));
  }, []);

  if (!summary && !error) return <LoadingSpinner message="Loading trainer workspace..." />;

  return (
    <div>
      <h1>Trainer Dashboard</h1>
      {error ? <ErrorMessage message={error} /> : null}
      {summary ? (
        <>
          <div style={styles.actions}>
            <Link to="/trainer/modules" style={styles.primary}>Create Module</Link>
            <Link to="/trainer/assessments" style={styles.secondary}>Create Assessment</Link>
            <Link to="/trainer/assignments" style={styles.primary}>Assign Assessment</Link>
          </div>
          <div style={styles.grid}>
            <div style={styles.card}><strong>{summary.modules.length}</strong><span>Learning modules</span></div>
            <div style={styles.card}><strong>{summary.assessments.length}</strong><span>Assessments</span></div>
            <div style={styles.card}><strong>{summary.competencies.length}</strong><span>Competencies</span></div>
          </div>
          <p style={styles.note}>Trainer content is shared with learners through the existing learning and assessment areas.</p>
        </>
      ) : null}
    </div>
  );
}

const styles = {
  actions: { display: "flex", gap: "0.75rem", flexWrap: "wrap", margin: "1.5rem 0" },
  primary: { background: "#2563eb", color: "#fff", padding: "0.75rem 1rem", borderRadius: "8px", textDecoration: "none", fontWeight: 700 },
  secondary: { background: "#0f766e", color: "#fff", padding: "0.75rem 1rem", borderRadius: "8px", textDecoration: "none", fontWeight: 700 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" },
  card: { display: "grid", gap: "0.4rem", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.25rem", color: "#475569" },
  note: { marginTop: "1.5rem", color: "#475569" },
};
