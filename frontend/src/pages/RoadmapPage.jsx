import { useEffect, useState } from "react";

import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import learningApi from "../api/learningApi";

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRoadmap = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await learningApi.getRoadmap();
      setRoadmap(data || []);
    } catch (loadError) {
      setError(loadError?.message || "Unable to load roadmap.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoadmap();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Loading roadmap..." />;
  }

  return (
    <div>
      <h1>Roadmap</h1>

      {error ? <ErrorMessage message={error} /> : null}

      {!roadmap.length ? (
        <EmptyState title="No roadmap available" description="A personalized roadmap will appear here once your progress data is available." />
      ) : (
        <div style={styles.list}>
          {roadmap.map((item, index) => (
            <div key={`${item.competency?.id || index}-roadmap`} style={styles.card}>
              <h3>{item.competency?.name || "Competency"}</h3>
              <p style={styles.meta}>Current level: {item.current_level}</p>
              <p style={styles.meta}>Required level: {item.required_level}</p>
              <p style={styles.meta}>Skill gap: {item.skill_gap}</p>

              {item.modules?.length ? (
                <ul style={styles.moduleList}>
                  {item.modules.map((moduleItem) => {
                    const module = moduleItem.module;
                    const progress = moduleItem.progress;

                    return (
                      <li key={module.id} style={styles.moduleItem}>
                        <strong>{module.title}</strong>
                        <div style={styles.moduleMeta}>
                          {module.difficulty} • {module.estimated_hours}h • Status: {progress?.status || "not_started"}
                        </div>
                        <div style={styles.moduleMeta}>Progress: {progress?.progress_percentage ?? 0}%</div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p style={styles.empty}>No modules available for this competency.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  list: {
    display: "grid",
    gap: "1rem",
    marginTop: "1.5rem",
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
  moduleList: {
    marginTop: "1rem",
    paddingLeft: "1.2rem",
    display: "grid",
    gap: "0.75rem",
  },
  moduleItem: {
    color: "#334155",
  },
  moduleMeta: {
    color: "#475569",
    marginTop: "0.2rem",
  },
  empty: {
    color: "#475569",
    marginTop: "1rem",
  },
};
