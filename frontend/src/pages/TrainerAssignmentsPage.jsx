import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import assessmentApi from "../api/assessmentApi";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";

export default function TrainerAssignmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assessmentId, setAssessmentId] = useState("");
  const [learnerId, setLearnerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([assessmentApi.listManageAssessments(), assessmentApi.getAssignedReviews()])
      .then(([assessmentData, assignmentData]) => {
        setAssessments(assessmentData || []);
        setAssignments(assignmentData || []);
        if (assessmentData?.length) setAssessmentId(String(assessmentData[0].id));
      })
      .catch((loadError) => setError(loadError?.message || "Unable to load assignments."))
      .finally(() => setLoading(false));
  }, []);

  const assign = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      const created = await assessmentApi.createAssignment({ assessment_id: Number(assessmentId), learner_id: Number(learnerId) });
      setAssignments((previous) => [created, ...previous]);
      setLearnerId("");
      setSuccess("Assessment assigned to learner.");
    } catch (assignError) {
      setError(assignError?.message || "Unable to assign assessment.");
    }
  };

  if (loading) return <LoadingSpinner message="Loading trainer assignments..." />;

  return (
    <div>
      <h1>Assessment Assignments</h1>
      <p><Link to="/trainer">Trainer Dashboard</Link></p>
      {error ? <ErrorMessage message={error} /> : null}
      {success ? <p style={styles.success}>{success}</p> : null}
      <form onSubmit={assign} style={styles.form}>
        <h2>Assign an assessment</h2>
        <select value={assessmentId} onChange={(event) => setAssessmentId(event.target.value)} required style={styles.input}>
          {assessments.map((assessment) => <option key={assessment.id} value={assessment.id}>{assessment.title}</option>)}
        </select>
        <input type="number" min="1" placeholder="Learner user ID" value={learnerId} onChange={(event) => setLearnerId(event.target.value)} required style={styles.input} />
        <button style={styles.button}>Assign Assessment</button>
        <p style={styles.note}>A dedicated learner directory belongs to the admin phase.</p>
      </form>
      <div style={styles.list}>{assignments.map((assignment) => <article key={assignment.id} style={styles.card}><strong>{assignment.assessment.title}</strong><span>Learner: {assignment.learner_email}</span><span>Status: {assignment.status}</span></article>)}</div>
    </div>
  );
}

const styles = { form: { display: "grid", gap: "0.75rem", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.25rem", margin: "1.25rem 0" }, input: { border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0.7rem", font: "inherit" }, button: { border: "none", borderRadius: "8px", background: "#2563eb", color: "#fff", padding: "0.7rem 0.9rem", fontWeight: 700 }, note: { color: "#475569" }, list: { display: "grid", gap: "0.75rem" }, card: { display: "grid", gap: "0.4rem", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem" }, success: { color: "#166534", fontWeight: 600 } };
