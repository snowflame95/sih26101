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
  const [assigning, setAssigning] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        assessmentData,
        assignmentData,
      ] = await Promise.all([
        assessmentApi.listManageAssessments(),
        assessmentApi.getAssignedReviews(),
      ]);

      const loadedAssessments =
        assessmentData || [];

      setAssessments(loadedAssessments);
      setAssignments(
        assignmentData || []
      );

      if (
        loadedAssessments.length > 0 &&
        !assessmentId
      ) {
        setAssessmentId(
          String(
            loadedAssessments[0].id
          )
        );
      }
    } catch (loadError) {
      setError(
        loadError?.message ||
          "Unable to load assessment assignments."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const assignAssessment = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!assessmentId) {
      setError(
        "Please select an assessment."
      );
      return;
    }

    if (!learnerId) {
      setError(
        "Please enter a learner user ID."
      );
      return;
    }

    const parsedLearnerId =
      Number(learnerId);

    if (
      !Number.isInteger(
        parsedLearnerId
      ) ||
      parsedLearnerId <= 0
    ) {
      setError(
        "Learner user ID must be a valid positive number."
      );
      return;
    }

    setAssigning(true);

    try {
      const created =
        await assessmentApi.createAssignment(
          {
            assessment_id:
              Number(assessmentId),
            learner_id:
              parsedLearnerId,
          }
        );

      setAssignments((previous) => [
        created,
        ...previous,
      ]);

      setLearnerId("");

      setSuccess(
        "Assessment assigned successfully to the learner."
      );
    } catch (assignError) {
      setError(
        assignError?.message ||
          "Unable to assign assessment."
      );
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        message="Loading assessment assignments..."
      />
    );
  }

  return (
    <div>
      <h1>Assign Assessments</h1>

      <p>
        <Link to="/trainer">
          Trainer Dashboard
        </Link>
      </p>

      <div style={styles.infoBox}>
        <strong>Assessment Assignment</strong>

        <p>
          Select an existing assessment and
          assign it to a specific learner.
          Assessment creation and question
          authoring are handled separately in
          Assessment Authoring.
        </p>
      </div>

      {error ? (
        <ErrorMessage message={error} />
      ) : null}

      {success ? (
        <p style={styles.success}>
          {success}
        </p>
      ) : null}

      {/* =====================================================
          ASSIGN ASSESSMENT
      ====================================================== */}

      <form
        onSubmit={assignAssessment}
        style={styles.form}
      >
        <h2>Assign an Assessment</h2>

        <label style={styles.label}>
          Select Assessment
        </label>

        <select
          value={assessmentId}
          onChange={(event) =>
            setAssessmentId(
              event.target.value
            )
          }
          required
          style={styles.input}
        >
          <option value="" disabled>
            Select an assessment
          </option>

          {assessments.map(
            (assessment) => (
              <option
                key={assessment.id}
                value={assessment.id}
              >
                {assessment.title}
              </option>
            )
          )}
        </select>

        <label style={styles.label}>
          Learner User ID
        </label>

        <input
          type="number"
          min="1"
          placeholder="Enter learner user ID"
          value={learnerId}
          onChange={(event) =>
            setLearnerId(
              event.target.value
            )
          }
          required
          style={styles.input}
        />

        <button
          type="submit"
          disabled={assigning}
          style={styles.primaryButton}
        >
          {assigning
            ? "Assigning..."
            : "Assign Assessment"}
        </button>

        <p style={styles.note}>
          Learner directory/user discovery can
          be added through the admin phase. For
          the current MVP, the trainer uses the
          learner user ID.
        </p>
      </form>

      {/* =====================================================
          ASSIGNMENT TRACKING
      ====================================================== */}

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2>Assigned Assessments</h2>

          <button
            type="button"
            onClick={load}
            style={styles.secondaryButton}
          >
            Refresh
          </button>
        </div>

        {assignments.length === 0 ? (
          <div style={styles.empty}>
            No assessment assignments found.
          </div>
        ) : (
          <div style={styles.list}>
            {assignments.map(
              (assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                />
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function AssignmentCard({
  assignment,
}) {
  const attempt = assignment.attempt;

  return (
    <article style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <h3 style={styles.noMargin}>
            {assignment.assessment?.title ||
              "Assessment"}
          </h3>

          <p style={styles.meta}>
            Learner:{" "}
            <strong>
              {assignment.learner_email ||
                `User #${assignment.learner_id}`}
            </strong>
          </p>

          <p style={styles.meta}>
            Status:{" "}
            <strong>
              {assignment.status}
            </strong>
          </p>
        </div>

        <span
          style={getStatusStyle(
            assignment.status
          )}
        >
          {assignment.status}
        </span>
      </div>

      <div style={styles.details}>
        <span>
          Assigned:{" "}
          {formatDate(
            assignment.assigned_at
          )}
        </span>

        {assignment.due_at ? (
          <span>
            Due:{" "}
            {formatDate(
              assignment.due_at
            )}
          </span>
        ) : null}

        {assignment.completed_at ? (
          <span>
            Completed:{" "}
            {formatDate(
              assignment.completed_at
            )}
          </span>
        ) : null}
      </div>

      {attempt ? (
        <div style={styles.resultBox}>
          <strong>
            Score: {attempt.score}/
            {attempt.total_questions}
          </strong>

          <span>
            Percentage:{" "}
            {attempt.percentage}%
          </span>
        </div>
      ) : (
        <p style={styles.pending}>
          Learner has not completed this
          assessment yet.
        </p>
      )}

      {assignment.feedback ? (
        <div style={styles.feedbackBox}>
          <strong>
            Feedback
          </strong>

          <p>
            {assignment.feedback}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function getStatusStyle(status) {
  const normalized =
    String(status || "").toLowerCase();

  if (
    normalized === "completed"
  ) {
    return styles.completedBadge;
  }

  if (
    normalized === "in_progress" ||
    normalized === "in progress"
  ) {
    return styles.progressBadge;
  }

  return styles.assignedBadge;
}

const styles = {
  infoBox: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "10px",
    padding: "1rem",
    margin: "1rem 0",
    color: "#1e3a8a",
  },

  form: {
    display: "grid",
    gap: "0.75rem",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "1.25rem",
    margin: "1.25rem 0",
  },

  label: {
    fontWeight: 700,
    color: "#334155",
  },

  input: {
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0.7rem",
    font: "inherit",
    width: "100%",
    boxSizing: "border-box",
  },

  primaryButton: {
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    padding: "0.75rem 1rem",
    fontWeight: 700,
    cursor: "pointer",
  },

  secondaryButton: {
    border: "1px solid #2563eb",
    borderRadius: "8px",
    background: "#fff",
    color: "#2563eb",
    padding: "0.65rem 0.9rem",
    fontWeight: 700,
    cursor: "pointer",
  },

  success: {
    color: "#166534",
    fontWeight: 600,
  },

  note: {
    color: "#475569",
    margin: 0,
  },

  section: {
    marginTop: "1.5rem",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
  },

  empty: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "1.25rem",
    color: "#64748b",
  },

  list: {
    display: "grid",
    gap: "1rem",
  },

  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "1.1rem",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
  },

  noMargin: {
    margin: 0,
  },

  meta: {
    color: "#475569",
    margin: "0.35rem 0",
  },

  details: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
    marginTop: "0.9rem",
    color: "#64748b",
    fontSize: "0.9rem",
  },

  resultBox: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
    marginTop: "1rem",
    padding: "0.85rem",
    borderRadius: "8px",
    background: "#eff6ff",
    color: "#1d4ed8",
  },

  pending: {
    marginTop: "1rem",
    padding: "0.75rem",
    borderRadius: "8px",
    background: "#fffbeb",
    color: "#92400e",
  },

  feedbackBox: {
    marginTop: "1rem",
    padding: "0.85rem",
    borderRadius: "8px",
    background: "#f8fafc",
    color: "#334155",
  },

  assignedBadge: {
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: "999px",
    padding: "0.35rem 0.65rem",
    fontWeight: 700,
  },

  progressBadge: {
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: "999px",
    padding: "0.35rem 0.65rem",
    fontWeight: 700,
  },

  completedBadge: {
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "999px",
    padding: "0.35rem 0.65rem",
    fontWeight: 700,
  },
};