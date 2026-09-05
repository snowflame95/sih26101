import { useCallback, useEffect, useState } from "react";

import aiApi from "../api/aiApi";


function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}


function formatPriority(priority) {
  if (!priority) {
    return "Unknown";
  }

  return priority
    .replaceAll("_", " ")
    .toUpperCase();
}


function formatPercentage(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return `${value}%`;
}


function getPriorityStyle(priority) {
  const normalizedPriority = priority?.toUpperCase();

  if (normalizedPriority === "CRITICAL") {
    return {
      background: "#fee2e2",
      color: "#b91c1c",
      border: "1px solid #fecaca",
    };
  }

  if (normalizedPriority === "HIGH") {
    return {
      background: "#ffedd5",
      color: "#c2410c",
      border: "1px solid #fed7aa",
    };
  }

  if (normalizedPriority === "MEDIUM") {
    return {
      background: "#fef9c3",
      color: "#a16207",
      border: "1px solid #fde68a",
    };
  }

  return {
    background: "#dcfce7",
    color: "#15803d",
    border: "1px solid #bbf7d0",
  };
}


function getGapStyle(gap) {
  if (gap >= 4) {
    return {
      background: "#fee2e2",
      color: "#b91c1c",
    };
  }

  if (gap >= 2) {
    return {
      background: "#ffedd5",
      color: "#c2410c",
    };
  }

  if (gap === 1) {
    return {
      background: "#fef9c3",
      color: "#a16207",
    };
  }

  return {
    background: "#dcfce7",
    color: "#15803d",
  };
}


function SkillIntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationNote, setRecommendationNote] = useState("");


  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [analysisResponse, recommendationResponse] =
        await Promise.all([
          aiApi.analyseSkills(),
          aiApi.getRecommendations(),
        ]);

      /*
       * apiClient returns the parsed response body directly.
       *
       * Therefore:
       *   analysisResponse.items
       *   recommendationResponse.recommendations
       *
       * are used instead of:
       *   analysisResponse.data
       *   recommendationResponse.data
       */
      setData(analysisResponse || null);

      setRecommendations(
        recommendationResponse?.recommendations || []
      );

      setRecommendationNote(
        recommendationResponse?.source_note || ""
      );
    } catch (err) {
      console.error("Skill intelligence loading failed:", err);

      const message =
        err?.message ||
        "Unable to load skill intelligence. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);


  useEffect(() => {
    loadData();
  }, [loadData]);


  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingSpinner} />

          <h1 style={styles.loadingTitle}>
            Analysing Your Skills
          </h1>

          <p style={styles.loadingText}>
            We are analysing your competency profile and
            preparing personalised learning recommendations.
          </p>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>
            !
          </div>

          <h1 style={styles.errorTitle}>
            Unable to Load Skill Intelligence
          </h1>

          <p style={styles.errorText}>
            {error}
          </p>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={styles.primaryButton}
          >
            {refreshing ? "Retrying..." : "Try Again"}
          </button>
        </div>
      </div>
    );
  }


  const items = data?.items || [];
  const aiAvailable = Boolean(data?.ai_available);

  const totalCompetencies = items.length;

  const totalSkillGap = items.reduce(
    (total, item) => total + Number(item.gap || 0),
    0
  );

  const criticalGaps = items.filter(
    (item) =>
      item.priority?.toUpperCase() === "CRITICAL"
  ).length;

  const averageGap =
    totalCompetencies > 0
      ? (
          totalSkillGap / totalCompetencies
        ).toFixed(1)
      : "0.0";


  return (
    <div style={styles.page}>

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>
            AI-POWERED SKILL INTELLIGENCE
          </div>

          <h1 style={styles.title}>
            Skill Intelligence
          </h1>

          <p style={styles.subtitle}>
            Understand your current competency levels,
            identify skill gaps and discover personalised
            learning opportunities.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          style={{
            ...styles.refreshButton,
            opacity: refreshing ? 0.7 : 1,
          }}
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh Analysis"}
        </button>
      </div>


      {/* =====================================================
          AI STATUS
      ===================================================== */}

      <div
        style={{
          ...styles.statusBanner,
          background: aiAvailable
            ? "#ecfdf5"
            : "#f8fafc",
          border: aiAvailable
            ? "1px solid #a7f3d0"
            : "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            ...styles.statusDot,
            background: aiAvailable
              ? "#10b981"
              : "#64748b",
          }}
        />

        <div>
          <strong style={styles.statusTitle}>
            {aiAvailable
              ? "Gemini AI analysis is active"
              : "Explainable backend analysis is active"}
          </strong>

          <p style={styles.statusText}>
            {aiAvailable
              ? "Your skill analysis includes AI-generated interpretation, strengths, weaknesses and recommended focus areas."
              : "The platform is using deterministic skill-gap analysis because AI enrichment is currently unavailable."}
          </p>
        </div>
      </div>


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      {items.length > 0 && (
        <div style={styles.summaryGrid}>

          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>
              Competencies
            </span>

            <strong style={styles.summaryValue}>
              {totalCompetencies}
            </strong>

            <span style={styles.summaryDescription}>
              Analysed competencies
            </span>
          </div>


          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>
              Average Gap
            </span>

            <strong style={styles.summaryValue}>
              {averageGap}/5
            </strong>

            <span style={styles.summaryDescription}>
              Across identified competencies
            </span>
          </div>


          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>
              Critical Gaps
            </span>

            <strong style={styles.summaryValue}>
              {criticalGaps}
            </strong>

            <span style={styles.summaryDescription}>
              Requiring highest priority
            </span>
          </div>


          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>
              Recommendations
            </span>

            <strong style={styles.summaryValue}>
              {recommendations.length}
            </strong>

            <span style={styles.summaryDescription}>
              Learning resources matched
            </span>
          </div>

        </div>
      )}


      {/* =====================================================
          NO COMPETENCIES
      ===================================================== */}

      {items.length === 0 ? (
        <section style={styles.emptyCard}>

          <div style={styles.emptyIcon}>
            +
          </div>

          <h2 style={styles.emptyTitle}>
            No Competencies Available
          </h2>

          <p style={styles.emptyText}>
            Add competencies to your profile before
            generating skill intelligence.
          </p>

        </section>
      ) : (
        <>
          {/* =================================================
              SKILL ANALYSIS
          ================================================= */}

          <section>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>
                  Competency Analysis
                </h2>

                <p style={styles.sectionSubtitle}>
                  Your current capability compared with
                  the required competency level.
                </p>
              </div>
            </div>


            <div style={styles.skillList}>

              {items.map((item) => {
                const priorityStyle =
                  getPriorityStyle(item.priority);

                const gapStyle =
                  getGapStyle(Number(item.gap || 0));

                const currentLevel =
                  Number(item.current_level || 0);

                const requiredLevel =
                  Number(item.required_level || 0);

                const currentPercentage =
                  Math.min(
                    Math.max(
                      (currentLevel / 5) * 100,
                      0
                    ),
                    100
                  );

                const requiredPercentage =
                  Math.min(
                    Math.max(
                      (requiredLevel / 5) * 100,
                      0
                    ),
                    100
                  );

                return (
                  <article
                    key={item.competency_id}
                    style={styles.skillCard}
                  >

                    {/* =======================================
                        SKILL HEADER
                    ======================================= */}

                    <div style={styles.skillHeader}>

                      <div>
                        <div style={styles.skillNameRow}>
                          <h3 style={styles.skillName}>
                            {item.competency_name}
                          </h3>

                          {item.category && (
                            <span style={styles.categoryBadge}>
                              {item.category}
                            </span>
                          )}
                        </div>

                        <span style={styles.statusTextBadge}>
                          {formatStatus(item.status)}
                        </span>
                      </div>


                      <span
                        style={{
                          ...styles.priorityBadge,
                          ...priorityStyle,
                        }}
                      >
                        {formatPriority(item.priority)}
                      </span>

                    </div>


                    {/* =======================================
                        LEVEL METRICS
                    ======================================= */}

                    <div style={styles.levelGrid}>

                      <div style={styles.levelCard}>
                        <span style={styles.metricLabel}>
                          Current Level
                        </span>

                        <strong style={styles.metricValue}>
                          {currentLevel}/5
                        </strong>

                        <div style={styles.progressTrack}>
                          <div
                            style={{
                              ...styles.progressCurrent,
                              width: `${currentPercentage}%`,
                            }}
                          />
                        </div>
                      </div>


                      <div style={styles.levelCard}>
                        <span style={styles.metricLabel}>
                          Required Level
                        </span>

                        <strong style={styles.metricValue}>
                          {requiredLevel}/5
                        </strong>

                        <div style={styles.progressTrack}>
                          <div
                            style={{
                              ...styles.progressRequired,
                              width: `${requiredPercentage}%`,
                            }}
                          />
                        </div>
                      </div>


                      <div style={styles.levelCard}>
                        <span style={styles.metricLabel}>
                          Skill Gap
                        </span>

                        <strong
                          style={{
                            ...styles.metricValue,
                            ...gapStyle,
                            padding: "0.2rem 0.55rem",
                            borderRadius: "7px",
                            display: "inline-flex",
                            width: "fit-content",
                          }}
                        >
                          {item.gap}
                        </strong>

                        <span style={styles.metricHint}>
                          Points to develop
                        </span>
                      </div>


                      <div style={styles.levelCard}>
                        <span style={styles.metricLabel}>
                          Status
                        </span>

                        <strong style={styles.statusMetric}>
                          {formatStatus(item.status)}
                        </strong>

                        <span style={styles.metricHint}>
                          Priority-based assessment
                        </span>
                      </div>

                    </div>


                    {/* =======================================
                        AI ANALYSIS
                    ======================================= */}

                    {item.analysis && (
                      <div style={styles.contentSection}>

                        <h4 style={styles.contentTitle}>
                          AI Analysis
                        </h4>

                        <p style={styles.contentText}>
                          {item.analysis}
                        </p>

                      </div>
                    )}


                    {/* =======================================
                        STRENGTHS + WEAKNESSES
                    ======================================= */}

                    <div style={styles.twoColumnGrid}>

                      {item.strengths?.length > 0 && (
                        <div style={styles.listSection}>

                          <h4 style={styles.contentTitle}>
                            Strengths
                          </h4>

                          <ul style={styles.list}>
                            {item.strengths.map(
                              (strength, index) => (
                                <li
                                  key={`${item.competency_id}-strength-${index}`}
                                  style={styles.listItem}
                                >
                                  <span style={styles.listMarker}>
                                    ✓
                                  </span>

                                  <span>
                                    {strength}
                                  </span>
                                </li>
                              )
                            )}
                          </ul>

                        </div>
                      )}


                      {item.weaknesses?.length > 0 && (
                        <div style={styles.listSection}>

                          <h4 style={styles.contentTitle}>
                            Development Areas
                          </h4>

                          <ul style={styles.list}>
                            {item.weaknesses.map(
                              (weakness, index) => (
                                <li
                                  key={`${item.competency_id}-weakness-${index}`}
                                  style={styles.listItem}
                                >
                                  <span style={styles.listMarker}>
                                    →
                                  </span>

                                  <span>
                                    {weakness}
                                  </span>
                                </li>
                              )
                            )}
                          </ul>

                        </div>
                      )}

                    </div>


                    {/* =======================================
                        RECOMMENDED FOCUS
                    ======================================= */}

                    {item.recommended_focus?.length > 0 && (
                      <div style={styles.focusSection}>

                        <h4 style={styles.contentTitle}>
                          Recommended Focus
                        </h4>

                        <div style={styles.focusList}>

                          {item.recommended_focus.map(
                            (focus, index) => (
                              <div
                                key={`${item.competency_id}-focus-${index}`}
                                style={styles.focusItem}
                              >
                                <span style={styles.focusNumber}>
                                  {index + 1}
                                </span>

                                <span>
                                  {focus}
                                </span>
                              </div>
                            )
                          )}

                        </div>

                      </div>
                    )}


                    {/* =======================================
                        ASSESSMENT PERFORMANCE
                    ======================================= */}

                    {item.assessment_performance && (
                      <div style={styles.performanceSection}>

                        <h4 style={styles.contentTitle}>
                          Assessment Performance
                        </h4>

                        <div style={styles.performanceGrid}>

                          <div>
                            <span style={styles.performanceLabel}>
                              Attempts
                            </span>

                            <strong style={styles.performanceValue}>
                              {item.assessment_performance.attempts}
                            </strong>
                          </div>


                          <div>
                            <span style={styles.performanceLabel}>
                              Latest Score
                            </span>

                            <strong style={styles.performanceValue}>
                              {formatPercentage(
                                item.assessment_performance
                                  .latest_percentage
                              ) || "No attempt"}
                            </strong>
                          </div>


                          <div>
                            <span style={styles.performanceLabel}>
                              Best Score
                            </span>

                            <strong style={styles.performanceValue}>
                              {formatPercentage(
                                item.assessment_performance
                                  .best_percentage
                              ) || "No attempt"}
                            </strong>
                          </div>


                          <div>
                            <span style={styles.performanceLabel}>
                              Competency Accuracy
                            </span>

                            <strong style={styles.performanceValue}>
                              {formatPercentage(
                                item.assessment_performance
                                  .competency_accuracy
                              ) || "No competency-specific attempt"}
                            </strong>
                          </div>

                        </div>

                      </div>
                    )}


                    {/* =======================================
                        AI LABEL
                    ======================================= */}

                    {item.ai_generated && (
                      <div style={styles.aiFooter}>
                        <span style={styles.aiDot} />

                        <span>
                          Gemini-assisted interpretation
                        </span>
                      </div>
                    )}

                  </article>
                );
              })}

            </div>
          </section>


          {/* =================================================
              LEARNING RECOMMENDATIONS
          ================================================= */}

          <section style={styles.recommendationSection}>

            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>
                  Recommended Learning
                </h2>

                <p style={styles.sectionSubtitle}>
                  Learning resources selected according
                  to your identified skill gaps.
                </p>
              </div>
            </div>


            {recommendations.length === 0 ? (
              <div style={styles.noRecommendationCard}>

                <h3 style={styles.noRecommendationTitle}>
                  No Learning Resources Matched
                </h3>

                <p style={styles.noRecommendationText}>
                  No resource in the current prototype
                  catalogue matched your identified skill
                  gaps.
                </p>

                {recommendationNote && (
                  <small style={styles.sourceNote}>
                    {recommendationNote}
                  </small>
                )}

              </div>
            ) : (
              <>
                <div style={styles.recommendationGrid}>

                  {recommendations.map(
                    (recommendation, index) => (
                      <article
                        key={`${recommendation.title}-${index}`}
                        style={styles.recommendationCard}
                      >

                        <div style={styles.recommendationTop}>

                          <span style={styles.resourceBadge}>
                            {recommendation.resource_type
                              ?.replaceAll("_", " ")
                              .toUpperCase() ||
                              "LEARNING RESOURCE"}
                          </span>

                          <span style={styles.resourceSource}>
                            {recommendation.source}
                          </span>

                        </div>


                        <h3 style={styles.recommendationTitle}>
                          {recommendation.title}
                        </h3>


                        {recommendation.competency_name && (
                          <div style={styles.alignedSkill}>
                            For competency:{" "}
                            <strong>
                              {recommendation.competency_name}
                            </strong>
                          </div>
                        )}


                        <p style={styles.recommendationReason}>
                          {recommendation.reason}
                        </p>


                        <a
                          href={recommendation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.resourceButton}
                        >
                          Open Learning Resource
                          <span>
                            ↗
                          </span>
                        </a>

                      </article>
                    )
                  )}

                </div>


                {recommendationNote && (
                  <p style={styles.sourceNote}>
                    {recommendationNote}
                  </p>
                )}
              </>
            )}

          </section>

        </>
      )}

    </div>
  );
}


const styles = {
  page: {
    width: "100%",
    maxWidth: "1280px",
    margin: "0 auto",
    boxSizing: "border-box",
    paddingBottom: "3rem",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1.5rem",
    marginBottom: "1.5rem",
  },

  eyebrow: {
    fontSize: "0.72rem",
    fontWeight: 800,
    letterSpacing: "0.08em",
    color: "#2563eb",
    marginBottom: "0.4rem",
  },

  title: {
    margin: 0,
    fontSize: "2rem",
    lineHeight: 1.2,
    color: "#0f172a",
  },

  subtitle: {
    margin: "0.65rem 0 0",
    maxWidth: "760px",
    color: "#64748b",
    lineHeight: 1.6,
  },

  refreshButton: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "0.75rem 1rem",
    borderRadius: "9px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  statusBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    borderRadius: "10px",
    padding: "1rem",
    marginBottom: "1.5rem",
  },

  statusDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    marginTop: "0.35rem",
    flexShrink: 0,
  },

  statusTitle: {
    display: "block",
    color: "#0f172a",
    marginBottom: "0.2rem",
  },

  statusText: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.5,
    fontSize: "0.9rem",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "0.9rem",
    marginBottom: "2rem",
  },

  summaryCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1.1rem",
    boxShadow:
      "0 2px 8px rgba(15, 23, 42, 0.04)",
  },

  summaryLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "0.8rem",
    fontWeight: 700,
    marginBottom: "0.35rem",
  },

  summaryValue: {
    display: "block",
    color: "#0f172a",
    fontSize: "1.7rem",
    lineHeight: 1.2,
  },

  summaryDescription: {
    display: "block",
    marginTop: "0.3rem",
    color: "#94a3b8",
    fontSize: "0.75rem",
  },

  sectionHeader: {
    marginBottom: "1rem",
  },

  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "1.35rem",
  },

  sectionSubtitle: {
    margin: "0.35rem 0 0",
    color: "#64748b",
    lineHeight: 1.5,
  },

  skillList: {
    display: "grid",
    gap: "1rem",
  },

  skillCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "1.25rem",
    boxShadow:
      "0 3px 12px rgba(15, 23, 42, 0.04)",
  },

  skillHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
    marginBottom: "1.25rem",
  },

  skillNameRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "0.6rem",
  },

  skillName: {
    margin: 0,
    color: "#0f172a",
    fontSize: "1.2rem",
  },

  categoryBadge: {
    display: "inline-flex",
    padding: "0.25rem 0.55rem",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "0.72rem",
    fontWeight: 700,
  },

  statusTextBadge: {
    display: "inline-block",
    marginTop: "0.4rem",
    color: "#64748b",
    fontSize: "0.78rem",
  },

  priorityBadge: {
    display: "inline-flex",
    padding: "0.4rem 0.7rem",
    borderRadius: "999px",
    fontSize: "0.7rem",
    fontWeight: 800,
    letterSpacing: "0.03em",
    whiteSpace: "nowrap",
  },

  levelGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "0.75rem",
    marginBottom: "1.25rem",
  },

  levelCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "0.9rem",
    background: "#f8fafc",
  },

  metricLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "0.75rem",
    fontWeight: 700,
    marginBottom: "0.35rem",
  },

  metricValue: {
    display: "block",
    color: "#0f172a",
    fontSize: "1.25rem",
    marginBottom: "0.5rem",
  },

  metricHint: {
    display: "block",
    color: "#94a3b8",
    fontSize: "0.72rem",
    marginTop: "0.35rem",
  },

  statusMetric: {
    display: "block",
    color: "#334155",
    fontSize: "0.95rem",
    lineHeight: 1.35,
  },

  progressTrack: {
    height: "7px",
    background: "#e2e8f0",
    borderRadius: "999px",
    overflow: "hidden",
  },

  progressCurrent: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "999px",
  },

  progressRequired: {
    height: "100%",
    background: "#64748b",
    borderRadius: "999px",
  },

  contentSection: {
    borderTop: "1px solid #e2e8f0",
    paddingTop: "1rem",
    marginTop: "0.5rem",
  },

  contentTitle: {
    margin: "0 0 0.55rem",
    color: "#0f172a",
    fontSize: "0.95rem",
  },

  contentText: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.65,
    fontSize: "0.9rem",
  },

  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1rem",
    borderTop: "1px solid #e2e8f0",
    marginTop: "1rem",
    paddingTop: "1rem",
  },

  listSection: {
    minWidth: 0,
  },

  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gap: "0.55rem",
  },

  listItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.55rem",
    color: "#475569",
    fontSize: "0.88rem",
    lineHeight: 1.5,
  },

  listMarker: {
    flexShrink: 0,
    fontWeight: 800,
    color: "#2563eb",
  },

  focusSection: {
    borderTop: "1px solid #e2e8f0",
    marginTop: "1rem",
    paddingTop: "1rem",
  },

  focusList: {
    display: "grid",
    gap: "0.55rem",
  },

  focusItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.65rem",
    padding: "0.65rem 0.75rem",
    borderRadius: "8px",
    background: "#f8fafc",
    color: "#334155",
    fontSize: "0.88rem",
    lineHeight: 1.5,
  },

  focusNumber: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "0.72rem",
    fontWeight: 800,
    flexShrink: 0,
  },

  performanceSection: {
    borderTop: "1px solid #e2e8f0",
    marginTop: "1rem",
    paddingTop: "1rem",
  },

  performanceGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "0.7rem",
  },

  performanceLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "0.72rem",
    marginBottom: "0.25rem",
  },

  performanceValue: {
    color: "#0f172a",
    fontSize: "0.95rem",
  },

  aiFooter: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    marginTop: "1rem",
    paddingTop: "0.85rem",
    borderTop: "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: "0.72rem",
    fontWeight: 600,
  },

  aiDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#10b981",
  },

  recommendationSection: {
    marginTop: "2.5rem",
  },

  recommendationGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1rem",
  },

  recommendationCard: {
    display: "flex",
    flexDirection: "column",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1.1rem",
    boxShadow:
      "0 3px 12px rgba(15, 23, 42, 0.04)",
  },

  recommendationTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.6rem",
    flexWrap: "wrap",
    marginBottom: "0.8rem",
  },

  resourceBadge: {
    display: "inline-flex",
    padding: "0.3rem 0.55rem",
    borderRadius: "6px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "0.65rem",
    fontWeight: 800,
  },

  resourceSource: {
    color: "#64748b",
    fontSize: "0.72rem",
    fontWeight: 600,
  },

  recommendationTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "1rem",
    lineHeight: 1.4,
  },

  alignedSkill: {
    marginTop: "0.55rem",
    color: "#64748b",
    fontSize: "0.75rem",
  },

  recommendationReason: {
    margin: "0.75rem 0 1rem",
    color: "#475569",
    fontSize: "0.85rem",
    lineHeight: 1.55,
    flex: 1,
  },

  resourceButton: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.5rem",
    textDecoration: "none",
    background: "#2563eb",
    color: "#ffffff",
    padding: "0.7rem 0.8rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 700,
  },

  sourceNote: {
    margin: "1rem 0 0",
    color: "#64748b",
    fontSize: "0.75rem",
    lineHeight: 1.5,
  },

  noRecommendationCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1.25rem",
  },

  noRecommendationTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "1rem",
  },

  noRecommendationText: {
    margin: "0.45rem 0 0",
    color: "#64748b",
    lineHeight: 1.5,
    fontSize: "0.85rem",
  },

  emptyCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "3rem 1.5rem",
    textAlign: "center",
  },

  emptyIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#eff6ff",
    color: "#2563eb",
    fontSize: "1.5rem",
    fontWeight: 700,
  },

  emptyTitle: {
    margin: "1rem 0 0",
    color: "#0f172a",
    fontSize: "1.2rem",
  },

  emptyText: {
    margin: "0.5rem auto 0",
    maxWidth: "500px",
    color: "#64748b",
    lineHeight: 1.5,
  },

  loadingCard: {
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },

  loadingSpinner: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    border: "4px solid #dbeafe",
    borderTopColor: "#2563eb",
    animation: "spin 1s linear infinite",
  },

  loadingTitle: {
    margin: "1rem 0 0",
    color: "#0f172a",
    fontSize: "1.3rem",
  },

  loadingText: {
    maxWidth: "500px",
    margin: "0.5rem 0 0",
    color: "#64748b",
    lineHeight: 1.5,
  },

  errorCard: {
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "2rem",
  },

  errorIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "#fee2e2",
    color: "#b91c1c",
    fontSize: "1.3rem",
    fontWeight: 800,
  },

  errorTitle: {
    margin: "1rem 0 0",
    color: "#0f172a",
    fontSize: "1.3rem",
  },

  errorText: {
    maxWidth: "550px",
    margin: "0.5rem 0 1.2rem",
    color: "#64748b",
    lineHeight: 1.5,
  },

  primaryButton: {
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    padding: "0.75rem 1.1rem",
    borderRadius: "8px",
    fontWeight: 700,
    cursor: "pointer",
  },

  page: {
    width: "100%",
    maxWidth: "1280px",
    margin: "0 auto",
    boxSizing: "border-box",
    paddingBottom: "3rem",
  },
};


export default SkillIntelligencePage;