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

  const [expandedAssignmentId, setExpandedAssignmentId] =
    useState(null);

  const [assignmentDetails, setAssignmentDetails] =
    useState({});

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([
      assessmentApi.listManageAssessments(),
      assessmentApi.getAssignedReviews(),
    ])
      .then(([assessmentData, assignmentData]) => {
        setAssessments(assessmentData || []);
        setAssignments(assignmentData || []);

        if (assessmentData?.length) {
          setAssessmentId(
            String(assessmentData[0].id)
          );
        }
      })
      .catch((loadError) => {
        setError(
          loadError?.message ||
            "Unable to load assignments."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const assign = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!assessmentId || !learnerId) {
      setError(
        "Please select an assessment and enter a learner ID."
      );
      return;
    }

    try {
      const created =
        await assessmentApi.createAssignment({
          assessment_id: Number(assessmentId),
          learner_id: Number(learnerId),
        });

      setAssignments((previous) => [
        created,
        ...previous,
      ]);

      setLearnerId("");

      setSuccess(
        "Assessment assigned to learner."
      );
    } catch (assignError) {
      setError(
        assignError?.message ||
          "Unable to assign assessment."
      );
    }
  };

  const toggleAssignment = async (assignment) => {
    setError("");

    if (
      expandedAssignmentId === assignment.id
    ) {
      setExpandedAssignmentId(null);
      return;
    }

    setExpandedAssignmentId(assignment.id);

    if (assignmentDetails[assignment.id]) {
      return;
    }

    if (!assignment.attempt) {
      return;
    }

    setDetailsLoading(true);

    try {
      /*
       * Use the trainer's management endpoint because
       * it includes the correct answer and complete
       * authoring information.
       *
       * The learner's selected answer and correctness
       * come from assignment.answers.
       */
      const assessment =
        await assessmentApi.getManageAssessment(
          assignment.assessment_id
        );

      setAssignmentDetails((previous) => ({
        ...previous,
        [assignment.id]: {
          assessment,
        },
      }));
    } catch (detailsError) {
      setError(
        detailsError?.message ||
          "Unable to load assessment questions."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        message="Loading trainer assignments..."
      />
    );
  }

  return (
    <div>
      <h1>Assessment Assignments</h1>

      <p>
        <Link to="/trainer">
          Trainer Dashboard
        </Link>
      </p>

      {error ? (
        <ErrorMessage message={error} />
      ) : null}

      {success ? (
        <p style={styles.success}>
          {success}
        </p>
      ) : null}

      <form
        onSubmit={assign}
        style={styles.form}
      >
        <h2>Assign an assessment</h2>

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
          {assessments.map((assessment) => (
            <option
              key={assessment.id}
              value={assessment.id}
            >
              {assessment.title}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="1"
          placeholder="Learner user ID"
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
          style={styles.button}
        >
          Assign Assessment
        </button>

        <p style={styles.note}>
          A dedicated learner directory belongs
          to the admin phase.
        </p>
      </form>

      <section style={styles.section}>
        <h2>My Assigned Assessments</h2>

        {assignments.length === 0 ? (
          <div style={styles.empty}>
            No assessment assignments found.
          </div>
        ) : (
          <div style={styles.list}>
            {assignments.map((assignment) => {
              const attempt =
                assignment.attempt;

              const details =
                assignmentDetails[
                  assignment.id
                ];

              const questions =
                details?.assessment?.questions ||
                [];

              const answers =
                assignment.answers || [];

              const answerMap =
                new Map(
                  answers.map((answer) => [
                    answer.question_id,
                    answer,
                  ])
                );

              const isExpanded =
                expandedAssignmentId ===
                assignment.id;

              return (
                <article
                  key={assignment.id}
                  style={styles.card}
                >
                  <div style={styles.cardHeader}>
                    <div>
                      <h3
                        style={
                          styles.cardTitle
                        }
                      >
                        {assignment.assessment
                          ?.title ||
                          "Assessment"}
                      </h3>

                      <div
                        style={
                          styles.cardMeta
                        }
                      >
                        Learner:{" "}
                        <strong>
                          {
                            assignment.learner_email
                          }
                        </strong>
                      </div>

                      <div
                        style={
                          styles.cardMeta
                        }
                      >
                        Status:{" "}
                        <strong>
                          {assignment.status}
                        </strong>
                      </div>
                    </div>

                    {attempt ? (
                      <div
                        style={
                          styles.scoreBox
                        }
                      >
                        <strong>
                          {attempt.score}/
                          {
                            attempt.total_questions
                          }
                        </strong>

                        <span>
                          {
                            attempt.percentage
                          }
                          %
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div
                    style={
                      styles.assignmentInfo
                    }
                  >
                    <span>
                      Assigned:{" "}
                      {formatDate(
                        assignment.assigned_at
                      )}
                    </span>

                    {assignment.completed_at ? (
                      <span>
                        Completed:{" "}
                        {formatDate(
                          assignment.completed_at
                        )}
                      </span>
                    ) : null}

                    {assignment.due_at ? (
                      <span>
                        Due:{" "}
                        {formatDate(
                          assignment.due_at
                        )}
                      </span>
                    ) : null}
                  </div>

                  {attempt ? (
                    <button
                      type="button"
                      onClick={() =>
                        toggleAssignment(
                          assignment
                        )
                      }
                      style={
                        styles.secondaryButton
                      }
                    >
                      {isExpanded
                        ? "Hide Attempt"
                        : "View Attempt"}
                    </button>
                  ) : (
                    <p style={styles.pending}>
                      Learner has not completed
                      this assessment yet.
                    </p>
                  )}

                  {isExpanded ? (
                    <div
                      style={
                        styles.attemptPanel
                      }
                    >
                      <div
                        style={
                          styles.resultSummary
                        }
                      >
                        <div
                          style={
                            styles.summaryItem
                          }
                        >
                          <span>
                            Score
                          </span>

                          <strong>
                            {attempt.score}/
                            {
                              attempt.total_questions
                            }
                          </strong>
                        </div>

                        <div
                          style={
                            styles.summaryItem
                          }
                        >
                          <span>
                            Percentage
                          </span>

                          <strong>
                            {
                              attempt.percentage
                            }
                            %
                          </strong>
                        </div>
                      </div>

                      {detailsLoading &&
                      !details ? (
                        <LoadingSpinner
                          message="Loading questions..."
                        />
                      ) : null}

                      {!detailsLoading &&
                      questions.length === 0 ? (
                        <p
                          style={
                            styles.note
                          }
                        >
                          Assessment questions could
                          not be loaded.
                        </p>
                      ) : null}

                      {questions.map(
                        (
                          question,
                          index
                        ) => {
                          const answer =
                            answerMap.get(
                              question.id
                            );

                          return (
                            <div
                              key={
                                question.id
                              }
                              style={
                                styles.questionCard
                              }
                            >
                              <div
                                style={
                                  styles.questionHeader
                                }
                              >
                                <strong>
                                  Question{" "}
                                  {index + 1}
                                </strong>

                                {answer ? (
                                  <span
                                    style={{
                                      ...styles.resultBadge,
                                      ...(answer.is_correct
                                        ? styles.correct
                                        : styles.incorrect),
                                    }}
                                  >
                                    {answer.is_correct
                                      ? "Correct"
                                      : "Incorrect"}
                                  </span>
                                ) : (
                                  <span
                                    style={
                                      styles.unanswered
                                    }
                                  >
                                    Not answered
                                  </span>
                                )}
                              </div>

                              <p
                                style={
                                  styles.questionText
                                }
                              >
                                {
                                  question.question_text
                                }
                              </p>

                              <div
                                style={
                                  styles.answerBlock
                                }
                              >
                                <span
                                  style={
                                    styles.answerLabel
                                  }
                                >
                                  Learner's Answer
                                </span>

                                <strong>
                                  {answer
                                    ?.selected_answer ||
                                    "Not answered"}
                                </strong>
                              </div>

                              <div
                                style={
                                  styles.answerBlock
                                }
                              >
                                <span
                                  style={
                                    styles.answerLabel
                                  }
                                >
                                  Correct Answer
                                </span>

                                <strong>
                                  {
                                    question.correct_answer
                                  }
                                </strong>
                              </div>

                              {question.explanation ? (
                                <div
                                  style={
                                    styles.explanation
                                  }
                                >
                                  <strong>
                                    Explanation:
                                  </strong>

                                  <span>
                                    {
                                      question.explanation
                                    }
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
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

const styles = {
  form: {
    display: "grid",
    gap: "0.75rem",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "1.25rem",
    margin: "1.25rem 0",
  },

  input: {
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0.7rem",
    font: "inherit",
  },

  button: {
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    padding: "0.7rem 0.9rem",
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
    marginTop: "0.9rem",
  },

  note: {
    color: "#475569",
    margin: 0,
  },

  success: {
    color: "#166534",
    fontWeight: 600,
  },

  section: {
    marginTop: "1.5rem",
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

  cardTitle: {
    margin: 0,
    marginBottom: "0.5rem",
  },

  cardMeta: {
    color: "#475569",
    marginTop: "0.25rem",
  },

  scoreBox: {
    display: "grid",
    gap: "0.15rem",
    textAlign: "right",
    padding: "0.65rem 0.85rem",
    borderRadius: "8px",
    background: "#eff6ff",
    color: "#1d4ed8",
  },

  assignmentInfo: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
    marginTop: "0.9rem",
    color: "#64748b",
    fontSize: "0.9rem",
  },

  pending: {
    color: "#92400e",
    background: "#fffbeb",
    borderRadius: "8px",
    padding: "0.7rem",
    marginTop: "0.9rem",
  },

  attemptPanel: {
    marginTop: "1.25rem",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "1.25rem",
  },

  resultSummary: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
    marginBottom: "1rem",
  },

  summaryItem: {
    display: "grid",
    gap: "0.25rem",
    minWidth: "120px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "0.75rem",
  },

  questionCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "1rem",
    marginTop: "0.75rem",
  },

  questionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
  },

  questionText: {
    fontWeight: 600,
    lineHeight: 1.5,
  },

  resultBadge: {
    padding: "0.3rem 0.6rem",
    borderRadius: "999px",
    fontSize: "0.8rem",
    fontWeight: 700,
  },

  correct: {
    background: "#dcfce7",
    color: "#166534",
  },

  incorrect: {
    background: "#fee2e2",
    color: "#991b1b",
  },

  unanswered: {
    color: "#64748b",
    fontSize: "0.85rem",
  },

  answerBlock: {
    display: "grid",
    gap: "0.35rem",
    background: "#f8fafc",
    borderRadius: "8px",
    padding: "0.85rem",
    marginTop: "0.75rem",
  },

  answerLabel: {
    color: "#64748b",
    fontSize: "0.8rem",
    fontWeight: 700,
    textTransform: "uppercase",
  },

  explanation: {
    display: "grid",
    gap: "0.3rem",
    marginTop: "0.75rem",
    color: "#475569",
  },
};