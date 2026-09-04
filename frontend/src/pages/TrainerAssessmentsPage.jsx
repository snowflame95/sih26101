import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import assessmentApi from "../api/assessmentApi";
import competencyApi from "../api/competencyApi";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";

const createEmptyQuestion = (competencyId = "") => ({
  competency_id: competencyId,
  question_text: "",
  options: "",
  correct_answer: "",
  difficulty: "medium",
  explanation: "",
});

export default function TrainerAssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [competencies, setCompetencies] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [questions, setQuestions] = useState([
    createEmptyQuestion(),
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        assessmentData,
        competencyData,
      ] = await Promise.all([
        assessmentApi.listManageAssessments(),
        competencyApi.getAllCompetencies(),
      ]);

      const loadedAssessments = assessmentData || [];
      const loadedCompetencies = competencyData || [];

      setAssessments(loadedAssessments);
      setCompetencies(loadedCompetencies);

      setQuestions((previous) => {
        const hasUserEnteredQuestion = previous.some(
          (question) =>
            question.question_text.trim() ||
            question.options.trim()
        );

        if (hasUserEnteredQuestion) {
          return previous;
        }

        return [
          createEmptyQuestion(
            loadedCompetencies[0]?.id || ""
          ),
        ];
      });
    } catch (loadError) {
      setError(
        loadError?.message ||
          "Unable to load assessment authoring data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateQuestion = (
    questionIndex,
    field,
    value
  ) => {
    setQuestions((previous) =>
      previous.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              [field]: value,
            }
          : question
      )
    );
  };

  const addQuestion = () => {
    setQuestions((previous) => [
      ...previous,
      createEmptyQuestion(
        competencies[0]?.id || ""
      ),
    ]);

    setError("");
    setSuccess("");
  };

  const removeQuestion = (questionIndex) => {
    if (questions.length === 1) {
      setError(
        "An assessment must contain at least one question."
      );
      return;
    }

    setQuestions((previous) =>
      previous.filter(
        (_, index) => index !== questionIndex
      )
    );

    setError("");
    setSuccess("");
  };

  const validateQuestions = () => {
    if (!title.trim()) {
      return "Enter an assessment title.";
    }

    if (!questions.length) {
      return "Add at least one question.";
    }

    for (
      let index = 0;
      index < questions.length;
      index += 1
    ) {
      const question = questions[index];
      const questionNumber = index + 1;

      if (!question.competency_id) {
        return `Select a competency for Question ${questionNumber}.`;
      }

      if (!question.question_text.trim()) {
        return `Enter the question text for Question ${questionNumber}.`;
      }

      const options = question.options
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (options.length < 2) {
        return `Question ${questionNumber} must have at least two options.`;
      }

      if (new Set(options).size !== options.length) {
        return `Question ${questionNumber} contains duplicate options.`;
      }

      if (!question.correct_answer.trim()) {
        return `Enter the correct answer for Question ${questionNumber}.`;
      }

      if (
        !options.includes(
          question.correct_answer.trim()
        )
      ) {
        return `The correct answer for Question ${questionNumber} must exactly match one of its options.`;
      }
    }

    return "";
  };

  const createAssessment = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError =
      validateQuestions();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      title: title.trim(),
      description:
        description.trim() || null,

      questions: questions.map(
        (question) => ({
          competency_id: Number(
            question.competency_id
          ),

          question_text:
            question.question_text.trim(),

          options: question.options
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),

          correct_answer:
            question.correct_answer.trim(),

          difficulty: question.difficulty,

          explanation:
            question.explanation.trim() ||
            null,
        })
      ),
    };

    setSaving(true);

    try {
      await assessmentApi.createAssessment(
        payload
      );

      setTitle("");
      setDescription("");

      setQuestions([
        createEmptyQuestion(
          competencies[0]?.id || ""
        ),
      ]);

      setSuccess(
        `Assessment created successfully with ${payload.questions.length} question${
          payload.questions.length === 1
            ? ""
            : "s"
        }.`
      );

      await load();
    } catch (saveError) {
      setError(
        saveError?.message ||
          "Unable to create assessment."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleAssessment = async (
    assessment
  ) => {
    setError("");
    setSuccess("");

    try {
      const updated =
        await assessmentApi.updateAssessment(
          assessment.id,
          {
            is_active:
              !assessment.is_active,
          }
        );

      setAssessments((previous) =>
        previous.map((item) =>
          item.id === updated.id
            ? updated
            : item
        )
      );

      setSuccess(
        updated.is_active
          ? "Assessment activated."
          : "Assessment deactivated."
      );
    } catch (updateError) {
      setError(
        updateError?.message ||
          "Unable to update assessment."
      );
    }
  };

  const deleteAssessment = async (
    assessmentId
  ) => {
    const confirmed = window.confirm(
      "Delete this assessment? Assessments with learner attempts cannot be deleted."
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await assessmentApi.deleteAssessment(
        assessmentId
      );

      setAssessments((previous) =>
        previous.filter(
          (item) =>
            item.id !== assessmentId
        )
      );

      setSuccess(
        "Assessment deleted successfully."
      );
    } catch (deleteError) {
      setError(
        deleteError?.message ||
          "Unable to delete assessment."
      );
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        message="Loading assessment authoring..."
      />
    );
  }

  return (
    <div>
      <h1>Assessment Authoring</h1>

      <p>
        <Link to="/trainer">
          Trainer Dashboard
        </Link>
      </p>

      <div style={styles.infoBox}>
        <strong>Assessment Authoring</strong>

        <p>
          Create and manage assessment content
          here. Learner assignments are handled
          separately from the Assign Assessments
          page.
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
          CREATE ASSESSMENT
      ====================================================== */}

      <form
        onSubmit={createAssessment}
        style={styles.form}
      >
        <h2>Create Assessment</h2>

        <input
          type="text"
          placeholder="Assessment title"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          required
          style={styles.input}
        />

        <textarea
          placeholder="Assessment description"
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value
            )
          }
          style={styles.textarea}
        />

        <div style={styles.sectionHeader}>
          <h3 style={styles.noMargin}>
            Questions ({questions.length})
          </h3>

          <button
            type="button"
            onClick={addQuestion}
            style={styles.secondaryButton}
          >
            + Add Question
          </button>
        </div>

        {questions.map(
          (question, index) => (
            <div
              key={`question-${index}`}
              style={styles.questionForm}
            >
              <div
                style={
                  styles.sectionHeader
                }
              >
                <h3
                  style={styles.noMargin}
                >
                  Question {index + 1}
                </h3>

                {questions.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      removeQuestion(index)
                    }
                    style={styles.dangerButton}
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <label style={styles.label}>
                Competency
              </label>

              <select
                value={
                  question.competency_id
                }
                onChange={(event) =>
                  updateQuestion(
                    index,
                    "competency_id",
                    event.target.value
                  )
                }
                required
                style={styles.input}
              >
                <option value="" disabled>
                  Select competency
                </option>

                {competencies.map(
                  (competency) => (
                    <option
                      key={competency.id}
                      value={competency.id}
                    >
                      {competency.name}
                    </option>
                  )
                )}
              </select>

              <label style={styles.label}>
                Question
              </label>

              <textarea
                placeholder="Enter question text"
                value={
                  question.question_text
                }
                onChange={(event) =>
                  updateQuestion(
                    index,
                    "question_text",
                    event.target.value
                  )
                }
                required
                style={styles.textarea}
              />

              <label style={styles.label}>
                Options
              </label>

              <input
                type="text"
                placeholder="Option A, Option B, Option C, Option D"
                value={question.options}
                onChange={(event) =>
                  updateQuestion(
                    index,
                    "options",
                    event.target.value
                  )
                }
                required
                style={styles.input}
              />

              <label style={styles.label}>
                Correct Answer
              </label>

              <input
                type="text"
                placeholder="Must exactly match one option"
                value={
                  question.correct_answer
                }
                onChange={(event) =>
                  updateQuestion(
                    index,
                    "correct_answer",
                    event.target.value
                  )
                }
                required
                style={styles.input}
              />

              <label style={styles.label}>
                Difficulty
              </label>

              <select
                value={question.difficulty}
                onChange={(event) =>
                  updateQuestion(
                    index,
                    "difficulty",
                    event.target.value
                  )
                }
                style={styles.input}
              >
                <option value="easy">
                  Easy
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="hard">
                  Hard
                </option>
              </select>

              <label style={styles.label}>
                Explanation
              </label>

              <textarea
                placeholder="Optional explanation for the correct answer"
                value={
                  question.explanation
                }
                onChange={(event) =>
                  updateQuestion(
                    index,
                    "explanation",
                    event.target.value
                  )
                }
                style={styles.textarea}
              />
            </div>
          )
        )}

        <button
          type="submit"
          disabled={saving}
          style={styles.primaryButton}
        >
          {saving
            ? "Creating Assessment..."
            : "Create Assessment"}
        </button>
      </form>

      {/* =====================================================
          ASSESSMENT LIBRARY
      ====================================================== */}

      <section style={styles.section}>
        <h2>Assessment Library</h2>

        {assessments.length === 0 ? (
          <div style={styles.empty}>
            No assessments created yet.
          </div>
        ) : (
          <div style={styles.list}>
            {assessments.map(
              (assessment) => (
                <article
                  key={assessment.id}
                  style={styles.card}
                >
                  <div
                    style={
                      styles.cardHeader
                    }
                  >
                    <div>
                      <h3
                        style={
                          styles.noMargin
                        }
                      >
                        {assessment.title}
                      </h3>

                      <p
                        style={
                          styles.description
                        }
                      >
                        {assessment.description ||
                          "No description"}
                      </p>
                    </div>

                    <span
                      style={
                        assessment.is_active
                          ? styles.activeBadge
                          : styles.inactiveBadge
                      }
                    >
                      {assessment.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  <p style={styles.meta}>
                    {assessment.questions.length}{" "}
                    question
                    {assessment.questions
                      .length === 1
                      ? ""
                      : "s"}
                  </p>

                  <div
                    style={styles.actionRow}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        toggleAssessment(
                          assessment
                        )
                      }
                      style={
                        styles.secondaryButton
                      }
                    >
                      {assessment.is_active
                        ? "Deactivate"
                        : "Activate"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteAssessment(
                          assessment.id
                        )
                      }
                      style={
                        styles.dangerButton
                      }
                    >
                      Delete
                    </button>
                  </div>

                  <div
                    style={
                      styles.questionsList
                    }
                  >
                    {assessment.questions.map(
                      (
                        question,
                        questionIndex
                      ) => (
                        <div
                          key={question.id}
                          style={
                            styles.questionCard
                          }
                        >
                          <strong>
                            Q
                            {questionIndex +
                              1}
                            .{" "}
                            {
                              question.question_text
                            }
                          </strong>

                          <span>
                            Options:{" "}
                            {question.options.join(
                              ", "
                            )}
                          </span>

                          <span>
                            Correct answer:{" "}
                            {
                              question.correct_answer
                            }
                          </span>

                          <span>
                            Difficulty:{" "}
                            {
                              question.difficulty
                            }
                          </span>

                          {question.explanation ? (
                            <span>
                              Explanation:{" "}
                              {
                                question.explanation
                              }
                            </span>
                          ) : null}
                        </div>
                      )
                    )}
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
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

  input: {
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0.7rem",
    font: "inherit",
    width: "100%",
    boxSizing: "border-box",
  },

  textarea: {
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0.7rem",
    font: "inherit",
    width: "100%",
    minHeight: "90px",
    boxSizing: "border-box",
    resize: "vertical",
  },

  label: {
    fontWeight: 700,
    color: "#334155",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
  },

  noMargin: {
    margin: 0,
  },

  questionForm: {
    display: "grid",
    gap: "0.65rem",
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "1rem",
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

  dangerButton: {
    border: "1px solid #dc2626",
    borderRadius: "8px",
    background: "#fff",
    color: "#dc2626",
    padding: "0.65rem 0.9rem",
    fontWeight: 700,
    cursor: "pointer",
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
    padding: "1rem",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
  },

  description: {
    color: "#475569",
    margin: "0.4rem 0",
  },

  meta: {
    color: "#64748b",
  },

  activeBadge: {
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "999px",
    padding: "0.35rem 0.65rem",
    fontWeight: 700,
  },

  inactiveBadge: {
    background: "#f1f5f9",
    color: "#475569",
    borderRadius: "999px",
    padding: "0.35rem 0.65rem",
    fontWeight: 700,
  },

  actionRow: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
    margin: "0.75rem 0",
  },

  questionsList: {
    display: "grid",
    gap: "0.75rem",
  },

  questionCard: {
    display: "grid",
    gap: "0.3rem",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "0.75rem",
    color: "#334155",
  },
};