import { useEffect, useState } from "react";

import assessmentApi from "../api/assessmentApi";
import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AssessmentHistoryPage() {
  const [attempts, setAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAttempts = async () => {
      try {
        const data = await assessmentApi.getMyAttempts();
        setAttempts(data || []);
      } catch (loadError) {
        setError(loadError?.message || "Unable to load assessment history.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAttempts();
  }, []);

  const handleViewDetails = async (attemptId) => {
    setIsLoadingDetails(true);
    setError("");

    try {
      const data = await assessmentApi.getAttempt(attemptId);
      setSelectedAttempt(data);
    } catch (loadError) {
      setError(loadError?.message || "Unable to load attempt details.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading assessment history..." />;
  }

  return (
    <div>
      <h1>Assessment History</h1>
      {error ? <ErrorMessage message={error} /> : null}

      {!attempts.length ? (
        <EmptyState
          title="No assessment attempts yet"
          description="Complete an assessment to see your scores and attempt history here."
        />
      ) : (
        <div style={styles.layout}>
          <div style={styles.list}>
            {attempts.map((attempt) => (
              <article key={attempt.id} style={styles.card}>
                <div style={styles.headerRow}>
                  <h2 style={styles.title}>Assessment #{attempt.assessment_id}</h2>
                  <span style={styles.score}>{attempt.percentage}%</span>
                </div>
                <p style={styles.meta}>
                  Score: {attempt.score}/{attempt.total_questions}
                </p>
                <p style={styles.meta}>
                  Completed: {new Date(attempt.completed_at).toLocaleString()}
                </p>
                <button
                  type="button"
                  onClick={() => handleViewDetails(attempt.id)}
                  style={styles.button}
                  disabled={isLoadingDetails}
                >
                  {isLoadingDetails ? "Loading..." : "View Details"}
                </button>
              </article>
            ))}
          </div>

          {selectedAttempt ? (
            <section style={styles.detailCard}>
              <h2>Attempt Details</h2>
              <p style={styles.meta}>
                Score: {selectedAttempt.attempt.score}/{selectedAttempt.attempt.total_questions}
              </p>
              <div style={styles.answerList}>
                {selectedAttempt.answers.map((answer) => (
                  <div key={answer.id} style={styles.answerRow}>
                    <strong>Question {answer.question_id}</strong>
                    <span>{answer.selected_answer}</span>
                    <span style={answer.is_correct ? styles.correct : styles.incorrect}>
                      {answer.is_correct ? "Correct" : "Incorrect"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

const styles = {
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.8fr)",
    gap: "1rem",
    marginTop: "1.5rem",
    alignItems: "start",
  },
  list: {
    display: "grid",
    gap: "1rem",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "1.25rem",
  },
  detailCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "1.25rem",
    position: "sticky",
    top: "1rem",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
  },
  title: {
    margin: 0,
    fontSize: "1.1rem",
  },
  score: {
    color: "#166534",
    fontWeight: 800,
  },
  meta: {
    color: "#475569",
    margin: "0.5rem 0",
  },
  button: {
    marginTop: "0.75rem",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    padding: "0.65rem 0.85rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  answerList: {
    display: "grid",
    gap: "0.75rem",
    marginTop: "1rem",
  },
  answerRow: {
    display: "grid",
    gap: "0.25rem",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "0.75rem",
    color: "#334155",
  },
  correct: {
    color: "#166534",
    fontWeight: 700,
  },
  incorrect: {
    color: "#b91c1c",
    fontWeight: 700,
  },
};
