import { useEffect, useState } from "react";

import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import learningApi from "../api/learningApi";

export default function LearningPage() {
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedModule, setSelectedModule] = useState(null);
  const [progress, setProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [moduleData, progressData] = await Promise.all([
        learningApi.listModules(),
        learningApi.getMyProgress(),
      ]);

      setModules(moduleData || []);
      setProgress(progressData || []);

      if (moduleData?.length) {
        setSelectedModuleId(String(moduleData[0].id));
      }
    } catch (loadError) {
      setError(loadError?.message || "Unable to load learning data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedModuleId) {
      setSelectedModule(null);
      return;
    }

    const fetchModule = async () => {
      try {
        const moduleData = await learningApi.getModule(Number(selectedModuleId));
        setSelectedModule(moduleData);
      } catch (loadError) {
        setError(loadError?.message || "Unable to load the selected module.");
      }
    };

    fetchModule();
  }, [selectedModuleId]);

  const currentProgress = progress.find((item) => item.learning_module_id === Number(selectedModuleId));

  const saveProgress = async (status, progressPercentage) => {
    if (!selectedModule) return;
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated = await learningApi.updateProgress(selectedModule.id, {
        status,
        progress_percentage: progressPercentage,
      });
      setProgress((previous) => [
        ...previous.filter((item) => item.learning_module_id !== updated.learning_module_id),
        updated,
      ]);
      setSuccess("Learning progress saved.");
    } catch (saveError) {
      setError(saveError?.message || "Unable to save learning progress.");
    } finally {
      setIsSaving(false);
    }
  };

  const startModule = async () => {
    if (!selectedModule) return;
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const started = await learningApi.startProgress(selectedModule.id);
      setProgress((previous) => [
        ...previous.filter((item) => item.learning_module_id !== started.learning_module_id),
        started,
      ]);
      setSuccess("Learning module started.");
    } catch (startError) {
      setError(startError?.message || "Unable to start learning module.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading learning modules..." />;
  }

  return (
    <div>
      <h1>Learning</h1>

      {error ? <ErrorMessage message={error} /> : null}
      {success ? <p style={styles.success}>{success}</p> : null}

      {!modules.length ? (
        <EmptyState title="No learning modules yet" description="New learning content will appear here." />
      ) : (
        <>
          <label style={styles.label}>
            Select module
            <select
              value={selectedModuleId}
              onChange={(event) => setSelectedModuleId(event.target.value)}
              style={styles.select}
            >
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.title}
                </option>
              ))}
            </select>
          </label>

          {selectedModule ? (
            <div style={styles.card}>
              <h2>{selectedModule.title}</h2>
              <p style={styles.meta}>Difficulty: {selectedModule.difficulty}</p>
              <p style={styles.meta}>Estimated hours: {selectedModule.estimated_hours}</p>
              <p style={styles.meta}>Module order: {selectedModule.module_order}</p>
              <p style={styles.description}>{selectedModule.description || "No module description available."}</p>

              {selectedModule.resources?.length ? (
                <div style={styles.resourcesBox}>
                  <h3>Learning resources</h3>
                  {selectedModule.resources.map((resource) => (
                    <a key={resource.id} href={resource.resource_url} target="_blank" rel="noreferrer" style={styles.resourceLink}>
                      {resource.title} ({resource.resource_type})
                    </a>
                  ))}
                </div>
              ) : null}

              {currentProgress ? (
                <div style={styles.progressBox}>
                  <strong>Status:</strong> {currentProgress.status}<br />
                  <strong>Progress:</strong> {currentProgress.progress_percentage}%
                  <div style={styles.progressActions}>
                    {currentProgress.status === "completed" ? (
                      <strong>Completed</strong>
                    ) : (
                      <>
                        <button type="button" onClick={() => saveProgress("in_progress", Math.min(currentProgress.progress_percentage + 25, 99))} disabled={isSaving} style={styles.button}>
                          {isSaving ? "Saving..." : "Continue Learning"}
                        </button>
                        <button type="button" onClick={() => saveProgress("completed", 100)} disabled={isSaving} style={styles.completeButton}>
                          Complete Module
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <button type="button" onClick={startModule} disabled={isSaving} style={styles.button}>
                  {isSaving ? "Starting..." : "Start Learning"}
                </button>
              )}
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
  card: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
  },
  meta: {
    margin: "0.4rem 0",
    color: "#475569",
  },
  description: {
    marginTop: "1rem",
    color: "#334155",
    lineHeight: 1.6,
  },
  progressBox: {
    marginTop: "1rem",
    background: "#eff6ff",
    borderRadius: "10px",
    padding: "1rem",
    color: "#1d4ed8",
  },
  resourcesBox: {
    marginTop: "1rem",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "1rem",
  },
  resourceLink: {
    display: "block",
    marginTop: "0.5rem",
    color: "#2563eb",
  },
  progressActions: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
    marginTop: "1rem",
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
  completeButton: {
    border: "none",
    borderRadius: "8px",
    background: "#15803d",
    color: "#ffffff",
    padding: "0.7rem 0.9rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  success: {
    color: "#166534",
    fontWeight: 600,
  },
};
