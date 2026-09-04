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

const createEmptyForm = (competencyId = "") => ({
  title: "",
  description: "",
  questions: [createEmptyQuestion(competencyId)],
});

export default function TrainerAssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [form, setForm] = useState(createEmptyForm());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setIsLoading(true);

    try {
      const [assessmentData, competencyData] = await Promise.all([
        assessmentApi.listManageAssessments(),
        competencyApi.getAllCompetencies(),
      ]);

      const loadedAssessments = assessmentData || [];
      const loadedCompetencies = competencyData || [];

      setAssessments(loadedAssessments);
      setCompetencies(loadedCompetencies);

      setForm((previous) => {
        if (
          previous.questions.length > 0 &&
          previous.questions.some((question) => question.question_text || question.options)
        ) {
          return previous;
        }

        const defaultCompetencyId = previous.questions[0]?.competency_id
          || loadedCompetencies[0]?.id
          || "";

        return {
          ...previous,
          questions: [
            createEmptyQuestion(defaultCompetencyId),
          ],
        };
      });
    } catch (loadError) {
      setError(
        loadError?.message || "Unable to load trainer assessments."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeAssessmentField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const changeQuestionField = (questionIndex, event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      questions: previous.questions.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              [name]: value,
            }
          : question
      ),
    }));
  };

  const addQuestion = () => {
    const defaultCompetencyId = competencies[0]?.id || "";

    setForm((previous) => ({
      ...previous,
      questions: [
        ...previous.questions,
        createEmptyQuestion(defaultCompetencyId),
      ],
    }));

    setError("");
    setSuccess("");
  };

  const removeQuestion = (questionIndex) => {
    if (form.questions.length === 1) {
      setError("An assessment must contain at least one question.");
      return;
    }

    setForm((previous) => ({
      ...previous,
      questions: previous.questions.filter(
        (_, index) => index !== questionIndex
      ),
    }));

    setError("");
    setSuccess("");
  };

  const validateQuestions = () => {
    for (let index = 0; index < form.questions.length; index += 1) {
      const question = form.questions[index];

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

      const correctAnswer = question.correct_answer.trim();

      if (!correctAnswer) {
        return `Enter the correct answer for Question ${questionNumber}.`;
      }

      if (!options.includes(correctAnswer)) {
        return `The correct answer for Question ${questionNumber} must exactly match one of its options.`;
      }
    }

    return "";
  };

  const create = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Enter an assessment title.");
      return;
    }

    const validationError = validateQuestions();

    if (validationError) {
      setError(validationError);
      return;
    }

    const questions = form.questions.map((question) => ({
      competency_id: Number(question.competency_id),
      question_text: question.question_text.trim(),
      options: question.options
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      correct_answer: question.correct_answer.trim(),
      difficulty: question.difficulty,
      explanation: question.explanation.trim() || null,
    }));

    setIsSaving(true);

    try {
      await assessmentApi.createAssessment({
        title: form.title.trim(),
        description: form.description.trim() || null,
        questions,
      });

      const defaultCompetencyId = competencies[0]?.id || "";

      setForm(createEmptyForm(defaultCompetencyId));

      setSuccess(
        `Assessment created successfully with ${questions.length} question${
          questions.length === 1 ? "" : "s"
        }.`
      );

      await load();
    } catch (saveError) {
      setError(
        saveError?.message || "Unable to create assessment."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggle = async (assessment) => {
    setError("");
    setSuccess("");

    try {
      const updated = await assessmentApi.updateAssessment(
        assessment.id,
        {
          is_active: !assessment.is_active,
        }
      );

      setAssessments((previous) =>
        previous.map((item) =>
          item.id === updated.id ? updated : item
        )
      );

      setSuccess(
        updated.is_active
          ? "Assessment activated."
          : "Assessment deactivated."
      );
    } catch (updateError) {
      setError(
        updateError?.message || "Unable to update assessment."
      );
    }
  };

  const remove = async (assessmentId) => {
    if (
      !window.confirm(
        "Delete this assessment? Assessments with learner attempts cannot be deleted."
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await assessmentApi.deleteAssessment(assessmentId);

      setAssessments((previous) =>
        previous.filter((item) => item.id !== assessmentId)
      );

      setSuccess("Assessment deleted.");
    } catch (deleteError) {
      setError(
        deleteError?.message || "Unable to delete assessment."
      );
    }
  };

  if (isLoading) {
    return (
      <LoadingSpinner message="Loading trainer assessments..." />
    );
  }

  return (
    <div>
      <h1>Assessment Authoring</h1>

      <p>
        <Link to="/trainer">Trainer Dashboard</Link>
      </p>

      {error ? <ErrorMessage message={error} /> : null}

      {success ? (
        <p style={styles.success}>{success}</p>
      ) : null}

      <form onSubmit={create} style={styles.form}>
        <h2>Create assessment</h2>

        <input
          name="title"
          placeholder="Assessment title"
          value={form.title}
          onChange={changeAssessmentField}
          required
          style={styles.input}
        />

        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={changeAssessmentField}
          style={styles.input}
        />

        <div style={styles.questionsHeader}>
          <h3 style={styles.questionsTitle}>
            Questions ({form.questions.length})
          </h3>

          <button
            type="button"
            onClick={addQuestion}
            style={styles.addQuestionButton}
          >
            + Add Question
          </button>
        </div>

        {form.questions.map((question, questionIndex) => (
          <div
            key={`question-${questionIndex}`}
            style={styles.questionForm}
          >
            <div style={styles.questionHeader}>
              <h3 style={styles.questionTitle}>
                Question {questionIndex + 1}
              </h3>

              {form.questions.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeQuestion(questionIndex)}
                  style={styles.removeQuestionButton}
                >
                  Remove
                </button>
              ) : null}
            </div>

            <select
              name="competency_id"
              value={question.competency_id}
              onChange={(event) =>
                changeQuestionField(questionIndex, event)
              }
              required
              style={styles.input}
            >
              <option value="" disabled>
                Select competency
              </option>

              {competencies.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <textarea
              name="question_text"
              placeholder="Question text"
              value={question.question_text}
              onChange={(event) =>
                changeQuestionField(questionIndex, event)
              }
              required
              style={styles.input}
            />

            <input
              name="options"
              placeholder="Options separated by commas"
              value={question.options}
              onChange={(event) =>
                changeQuestionField(questionIndex, event)
              }
              required
              style={styles.input}
            />

            <input
              name="correct_answer"
              placeholder="Correct answer"
              value={question.correct_answer}
              onChange={(event) =>
                changeQuestionField(questionIndex, event)
              }
              required
              style={styles.input}
            />

            <select
              name="difficulty"
              value={question.difficulty}
              onChange={(event) =>
                changeQuestionField(questionIndex, event)
              }
              style={styles.input}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <textarea
              name="explanation"
              placeholder="Optional explanation"
              value={question.explanation}
              onChange={(event) =>
                changeQuestionField(questionIndex, event)
              }
              style={styles.input}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addQuestion}
          style={styles.secondaryAddButton}
        >
          + Add Another Question
        </button>

        <button
          type="submit"
          disabled={isSaving}
          style={styles.button}
        >
          {isSaving ? "Saving..." : "Create Assessment"}
        </button>
      </form>

      <div style={styles.list}>
        {assessments.map((assessment) => (
          <article
            key={assessment.id}
            style={styles.card}
          >
            <h2>{assessment.title}</h2>

            <p>
              {assessment.description || "No description"}
            </p>

            <p>
              {assessment.questions.length} question(s) •{" "}
              {assessment.is_active ? "Active" : "Inactive"}
            </p>

            <div style={styles.row}>
              <button
                type="button"
                onClick={() => toggle(assessment)}
                style={styles.secondary}
              >
                {assessment.is_active
                  ? "Deactivate"
                  : "Activate"}
              </button>

              <button
                type="button"
                onClick={() => remove(assessment.id)}
                style={styles.danger}
              >
                Delete
              </button>
            </div>

            {assessment.questions.map((question) => (
              <div
                key={question.id}
                style={styles.question}
              >
                <strong>
                  {question.question_text}
                </strong>

                <span>
                  Correct answer: {question.correct_answer}
                </span>

                <span>
                  Options: {question.options.join(", ")}
                </span>

                {question.difficulty ? (
                  <span>
                    Difficulty: {question.difficulty}
                  </span>
                ) : null}

                {question.explanation ? (
                  <span>
                    Explanation: {question.explanation}
                  </span>
                ) : null}
              </div>
            ))}
          </article>
        ))}
      </div>
    </div>
  );
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
    width: "100%",
    boxSizing: "border-box",
  },

  questionsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    marginTop: "0.5rem",
  },

  questionsTitle: {
    margin: 0,
  },

  questionForm: {
    display: "grid",
    gap: "0.75rem",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "1rem",
    background: "#f8fafc",
  },

  questionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
  },

  questionTitle: {
    margin: 0,
  },

  addQuestionButton: {
    border: "none",
    borderRadius: "8px",
    background: "#0f766e",
    color: "#fff",
    padding: "0.65rem 0.9rem",
    fontWeight: 700,
    cursor: "pointer",
  },

  secondaryAddButton: {
    border: "1px solid #2563eb",
    borderRadius: "8px",
    background: "#fff",
    color: "#2563eb",
    padding: "0.7rem 0.9rem",
    fontWeight: 700,
    cursor: "pointer",
  },

  removeQuestionButton: {
    border: "none",
    borderRadius: "8px",
    background: "#dc2626",
    color: "#fff",
    padding: "0.55rem 0.8rem",
    fontWeight: 700,
    cursor: "pointer",
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

  secondary: {
    border: "1px solid #94a3b8",
    borderRadius: "8px",
    background: "#fff",
    padding: "0.65rem 0.85rem",
    fontWeight: 700,
    cursor: "pointer",
  },

  danger: {
    border: "none",
    borderRadius: "8px",
    background: "#dc2626",
    color: "#fff",
    padding: "0.65rem 0.85rem",
    fontWeight: 700,
    cursor: "pointer",
    marginLeft: "0.5rem",
  },

  list: {
    display: "grid",
    gap: "1rem",
  },

  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "1.25rem",
  },

  row: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
  },

  question: {
    display: "grid",
    gap: "0.25rem",
    marginTop: "1rem",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "0.75rem",
    color: "#475569",
  },

  success: {
    color: "#166534",
    fontWeight: 600,
  },
};