import { useEffect, useState } from "react";

import competencyApi from "../api/competencyApi";
import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";

const levelLabels = {
  1: "Beginner",
  2: "Basic",
  3: "Intermediate",
  4: "Advanced",
  5: "Expert",
};

export default function CompetenciesPage() {
  const [items, setItems] = useState([]);
  const [available, setAvailable] = useState([]);
  const [selectedCompetencyId, setSelectedCompetencyId] = useState("");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [requiredLevel, setRequiredLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCompetencies = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [myData, availableData] = await Promise.all([
        competencyApi.getMyCompetencies(),
        competencyApi.getAllCompetencies(),
      ]);
      setItems(myData || []);
      setAvailable(availableData || []);
    } catch (loadError) {
      setError(loadError?.message || "Unable to load competencies.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompetencies();
  }, []);

  const addCompetency = async (event) => {
    event.preventDefault();
    if (!selectedCompetencyId) return;
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      await competencyApi.addMyCompetency({
        competency_id: Number(selectedCompetencyId),
        current_level: Number(currentLevel),
        required_level: Number(requiredLevel),
      });
      setSuccess("Competency added successfully.");
      setSelectedCompetencyId("");
      await loadCompetencies();
    } catch (saveError) {
      setError(saveError?.message || "Unable to add competency.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateCompetency = async (item, field, value) => {
    const nextValue = Number(value);
    if (nextValue < 1 || nextValue > 5) return;
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      await competencyApi.updateMyCompetency(item.competency_id, {
        current_level: field === "current_level" ? nextValue : item.current_level,
        required_level: field === "required_level" ? nextValue : item.required_level,
      });
      setSuccess("Competency level updated successfully.");
      await loadCompetencies();
    } catch (saveError) {
      setError(saveError?.message || "Unable to update competency.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading competencies..." />;
  }

  return (
    <div>
      <h1>My Competencies</h1>

      {error ? <ErrorMessage message={error} /> : null}
      {success ? <p style={styles.success}>{success}</p> : null}

      <form onSubmit={addCompetency} style={styles.addForm}>
        <strong>Add competency</strong>
        <select
          value={selectedCompetencyId}
          onChange={(event) => setSelectedCompetencyId(event.target.value)}
          style={styles.select}
          required
        >
          <option value="">Select available competency</option>
          {available
            .filter((option) => !items.some((item) => item.competency_id === option.id))
            .map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
        </select>
        <select value={currentLevel} onChange={(event) => setCurrentLevel(event.target.value)} style={styles.select}>
          {[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>Current: {levelLabels[level]}</option>)}
        </select>
        <select value={requiredLevel} onChange={(event) => setRequiredLevel(event.target.value)} style={styles.select}>
          {[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>Target: {levelLabels[level]}</option>)}
        </select>
        <button type="submit" disabled={isSaving || !selectedCompetencyId} style={styles.button}>
          {isSaving ? "Saving..." : "Add Competency"}
        </button>
      </form>

      {!items.length ? (
        <EmptyState
          title="No competencies yet"
          description="Your competency progress will appear here once connected to your profile and learning journey."
        />
      ) : (
        <div style={styles.grid}>
          {items.map((item) => (
            <div key={item.id} style={styles.card}>
              <div style={styles.headerRow}>
                <h3 style={styles.title}>{item.competency?.name || "Competency"}</h3>
                <span style={styles.badge}>{levelLabels[item.current_level] || "Level " + item.current_level}</span>
              </div>

              <p style={styles.meta}>Category: {item.competency?.category || "General"}</p>
              <label style={styles.levelControl}>Current level
                <select value={item.current_level} onChange={(event) => updateCompetency(item, "current_level", event.target.value)} disabled={isSaving} style={styles.select}>
                  {[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{levelLabels[level]}</option>)}
                </select>
              </label>
              <label style={styles.levelControl}>Required level
                <select value={item.required_level} onChange={(event) => updateCompetency(item, "required_level", event.target.value)} disabled={isSaving} style={styles.select}>
                  {[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{levelLabels[level]}</option>)}
                </select>
              </label>
              <p style={styles.meta}>Skill gap: {Math.max(item.required_level - item.current_level, 0)}</p>
              <p style={styles.description}>{item.competency?.description || "No description available."}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "1rem",
    marginTop: "1.5rem",
  },
  card: {
    background: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    padding: "1.25rem",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
  },
  addForm: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr 1fr auto",
    gap: "0.75rem",
    alignItems: "center",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "1rem",
    margin: "1.25rem 0",
  },
  select: {
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0.65rem 0.75rem",
    fontSize: "0.95rem",
  },
  levelControl: {
    display: "grid",
    gap: "0.35rem",
    color: "#475569",
    fontWeight: 600,
    marginTop: "0.75rem",
  },
  success: {
    color: "#166534",
    fontWeight: 600,
  },
  button: {
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    padding: "0.7rem 0.9rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "0.75rem",
  },
  title: {
    margin: 0,
  },
  badge: {
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: "999px",
    padding: "0.35rem 0.7rem",
    fontSize: "0.78rem",
    fontWeight: 700,
  },
  meta: {
    color: "#475569",
    margin: "0.2rem 0",
  },
  description: {
    marginTop: "0.8rem",
    color: "#334155",
  },
};
