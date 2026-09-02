import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import assessmentApi from "../api/assessmentApi";
import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";

export default function TesterAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    assessmentApi.getAssignedReviews()
      .then((data) => setAssignments(data || []))
      .catch((loadError) => setError(loadError?.message || "Unable to load tester assignments."))
      .finally(() => setLoading(false));
  }, []);

  const openAssignment = async (id) => {
    try {
      const data = await assessmentApi.getAssignment(id);
      setSelected(data);
      setFeedback(data.feedback || "");
    } catch (loadError) {
      setError(loadError?.message || "Unable to load assignment.");
    }
  };

  const saveReview = async (event) => {
    event.preventDefault();
    if (!selected || !feedback.trim()) return;
    setSaving(true);
    setError("");
    try {
      const data = await assessmentApi.reviewAssignment(selected.id, { feedback });
      setSelected(data);
      setAssignments((previous) => previous.map((item) => item.id === data.id ? data : item));
      setSuccess("Review saved.");
    } catch (saveError) {
      setError(saveError?.message || "Unable to save review.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading tester workspace..." />;

  return (
    <div>
      <h1>Tester Dashboard</h1>
      <p><Link to="/dashboard">Back to dashboard</Link></p>
      {error ? <ErrorMessage message={error} /> : null}
      {success ? <p style={styles.success}>{success}</p> : null}
      {!assignments.length ? <EmptyState title="No assigned review work" description="Assignments created for learners will appear here." /> : (
        <div style={styles.layout}>
          <div style={styles.list}>
            {assignments.map((assignment) => (
              <article key={assignment.id} style={styles.card}>
                <h2>{assignment.assessment.title}</h2>
                <p>Learner: {assignment.learner_email}</p>
                <p>Status: {assignment.status}</p>
                {assignment.attempt ? <p>Score: {assignment.attempt.score}/{assignment.attempt.total_questions} ({assignment.attempt.percentage}%)</p> : <p>Awaiting learner submission</p>}
                <button type="button" onClick={() => openAssignment(assignment.id)} style={styles.button}>Review</button>
              </article>
            ))}
          </div>
          {selected ? <section style={styles.card}><h2>Review Assignment</h2><p>{selected.assessment.title}</p>{selected.answers.map((answer) => <p key={answer.id}>Question {answer.question_id}: {answer.selected_answer} ({answer.is_correct ? "Correct" : "Incorrect"})</p>)}<form onSubmit={saveReview}><textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Feedback" rows="5" required style={styles.textarea} /><button disabled={saving || !selected.attempt} style={styles.button}>{saving ? "Saving..." : "Save Review"}</button></form></section> : null}
        </div>
      )}
    </div>
  );
}

const styles = {
  layout: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.8fr)", gap: "1rem" },
  list: { display: "grid", gap: "1rem" },
  card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.25rem" },
  textarea: { width: "100%", boxSizing: "border-box", margin: "1rem 0", padding: "0.75rem", font: "inherit" },
  button: { border: "none", borderRadius: "8px", background: "#2563eb", color: "#fff", padding: "0.7rem 0.9rem", fontWeight: 700 },
  success: { color: "#166534", fontWeight: 600 },
};
