import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import assessmentApi from "../api/assessmentApi";
import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AssessmentPage() {
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const requestedAssessmentId = searchParams.get("assessmentId");

  const loadAssessmentList = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await assessmentApi.listAssessments();
      setAssessments(data || []);

      if (data?.length) {
        const requested = data.find((item) => String(item.id) === requestedAssessmentId);
        setSelectedAssessmentId(String(requested?.id || data[0].id));
      }
    } catch (loadError) {
      setError(loadError?.message || "Unable to load assessments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssessmentList();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedAssessmentId) {
      setAssessment(null);
      return;
    }

    const fetchAssessment = async () => {
      try {
        const data = await assessmentApi.getAssessment(Number(selectedAssessmentId));
        setAssessment(data);
        setAnswers({});
        setResult(null);
      } catch (loadError) {
        setError(loadError?.message || "Unable to load assessment details.");
      }
    };

    fetchAssessment();
  }, [selectedAssessmentId]);

  const currentQuestionCount = assessment?.questions?.length || 0;

  const selectedAnswersCount = useMemo(
    () => Object.keys(answers).length,
    [answers]
  );

  const handleAnswerChange = (questionId, option) => {
    setAnswers((previous) => ({ ...previous, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (!assessment) {
      return;
    }

    const payload = {
      answers: assessment.questions.map((question) => ({
        question_id: question.id,
        selected_answer: answers[String(question.id)] || "",
      })),
    };

    if (payload.answers.some((answer) => !answer.selected_answer)) {
      setError("Please answer every question before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await assessmentApi.submitAssessment(assessment.id, payload);
      setResult(response);
    } catch (submitError) {
      setError(submitError?.message || "Unable to submit assessment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading assessments..." />;
  }

  return (
    <div>
      <h1>Assessment</h1>
      <p><Link to="/assessment-history">View previous attempts</Link></p>

      {error ? <ErrorMessage message={error} /> : null}

      {!assessments.length ? (
        <EmptyState
          title="No assessment available"
          description="There are no active assessments yet."
        />
      ) : (
        <>
          <label style={styles.label}>
            Select assessment
            <select
              value={selectedAssessmentId}
              onChange={(event) => setSelectedAssessmentId(event.target.value)}
              style={styles.select}
            >
              {assessments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>

          {assessment ? (
            <div style={styles.assessmentCard}>
              <h2>{assessment.title}</h2>
              <p>{assessment.description || "No description provided."}</p>

              {result ? (
                <div style={styles.resultBox}>
                  <h3>Assessment Result</h3>
                  <p>
                    Score: {result.score} / {result.total_questions}
                  </p>
                  <p>Percentage: {result.percentage}%</p>
                  <p>The backend has recorded this result and updated competency data where applicable.</p>
                </div>
              ) : null}

              {assessment.questions.map((question, index) => (
                <div key={question.id} style={styles.questionCard}>
                  <p style={styles.questionText}>
                    {index + 1}. {question.question_text}
                  </p>

                  <div style={styles.optionsList}>
                    {question.options.map((option) => (
                      <label key={option} style={styles.optionRow}>
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={answers[String(question.id)] === option}
                          onChange={() => handleAnswerChange(question.id, option)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                  {result && question.explanation ? (
                    <p style={styles.explanation}>Explanation: {question.explanation}</p>
                  ) : null}
                </div>
              ))}

              <div style={styles.footerRow}>
                <span>
                  {selectedAnswersCount}/{currentQuestionCount} answered
                </span>

                <button type="button" onClick={handleSubmit} disabled={isSubmitting} style={styles.submitButton}>
                  {isSubmitting ? "Submitting..." : "Submit Assessment"}
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

const styles = {
  label: {
    display: "grid",
    gap: "0.5rem",
    fontWeight: 600,
    marginBottom: "1rem",
  },
  select: {
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0.75rem 0.9rem",
    fontSize: "1rem",
  },
  assessmentCard: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
  },
  questionCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "1rem",
    marginTop: "1rem",
  },
  questionText: {
    fontWeight: 700,
    marginBottom: "0.9rem",
  },
  optionsList: {
    display: "grid",
    gap: "0.5rem",
  },
  optionRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    color: "#334155",
  },
  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "1.5rem",
    gap: "1rem",
    flexWrap: "wrap",
  },
  resultBox: {
    marginTop: "1rem",
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: "10px",
    padding: "1rem",
    color: "#14532d",
  },
  explanation: {
    marginTop: "0.8rem",
    color: "#475569",
    lineHeight: 1.5,
  },
  submitButton: {
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    padding: "0.85rem 1rem",
    fontWeight: 700,
    cursor: "pointer",
  },
};
