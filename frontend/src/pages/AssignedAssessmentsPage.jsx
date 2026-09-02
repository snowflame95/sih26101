import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import assessmentApi from "../api/assessmentApi";
import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AssignedAssessmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    assessmentApi.getMyAssignments()
      .then((data) => setAssignments(data || []))
      .catch((loadError) => setError(loadError?.message || "Unable to load assigned assessments."))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingSpinner message="Loading assigned assessments..." />;

  return (
    <div>
      <h1>Assigned Assessments</h1>
      {error ? <ErrorMessage message={error} /> : null}
      {!assignments.length ? <EmptyState title="No assigned assessments" description="Assigned assessments will appear here." /> : (
        <div style={styles.list}>
          {assignments.map((assignment) => (
            <article key={assignment.id} style={styles.card}>
              <h2>{assignment.assessment.title}</h2>
              <p>{assignment.assessment.description || "No description provided."}</p>
              <p>Status: <strong>{assignment.status}</strong></p>
              <p>Assigned: {new Date(assignment.assigned_at).toLocaleString()}</p>
              {assignment.due_at ? <p>Due: {new Date(assignment.due_at).toLocaleString()}</p> : null}
              {assignment.status === "assigned" ? <Link to={`/assessment?assessmentId=${assignment.assessment_id}`} style={styles.button}>Open Assessment</Link> : null}
              {assignment.attempt ? <p>Result: {assignment.attempt.score}/{assignment.attempt.total_questions} ({assignment.attempt.percentage}%)</p> : null}
              {assignment.feedback ? <p>Tester feedback: {assignment.feedback}</p> : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = { list: { display: "grid", gap: "1rem", marginTop: "1.5rem" }, card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.25rem" }, button: { display: "inline-block", background: "#2563eb", color: "#fff", borderRadius: "8px", padding: "0.7rem 0.9rem", textDecoration: "none", fontWeight: 700 } };
