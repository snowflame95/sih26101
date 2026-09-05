import { useCallback, useEffect, useMemo, useState } from "react";

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

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return null;
  }

  return `${numericValue.toFixed(1)}%`;
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


function getGapLabel(gap) {
  if (gap >= 4) {
    return "Critical development gap";
  }

  if (gap >= 2) {
    return "Significant development gap";
  }

  if (gap === 1) {
    return "Minor development gap";
  }

  return "Competency aligned";
}


function getRecommendationTypeLabel(resourceType) {
  if (!resourceType) {
    return "LEARNING RESOURCE";
  }

  return resourceType
    .replaceAll("_", " ")
    .toUpperCase();
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

      const [
        analysisResponse,
        recommendationResponse,
      ] = await Promise.all([
        aiApi.analyseSkills(),
        aiApi.getRecommendations(),
      ]);

      setData(analysisResponse || null);

      setRecommendations(
        recommendationResponse?.recommendations || []
      );

      setRecommendationNote(
        recommendationResponse?.source_note || ""
      );
    } catch (err) {
      console.error(
        "Skill intelligence loading failed:",
        err
      );

      setError(
        err?.message ||
          "Unable to load skill intelligence. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);


  useEffect(() => {
    loadData();
  }, [loadData]);


  const items = data?.items || [];
  const aiAvailable = Boolean(data?.ai_available);


  const summary = useMemo(() => {
    const totalCompetencies = items.length;

    const totalSkillGap = items.reduce(
      (total, item) =>
        total + Number(item.gap || 0),
      0
    );

    const criticalGaps = items.filter(
      (item) =>
        item.priority?.toUpperCase() === "CRITICAL"
    ).length;

    const highPriorityGaps = items.filter(
      (item) => {
        const priority =
          item.priority?.toUpperCase();

        return (
          priority === "CRITICAL" ||
          priority === "HIGH"
        );
      }
    ).length;

    const alignedCompetencies = items.filter(
      (item) => Number(item.gap || 0) === 0
    ).length;

    const averageGap =
      totalCompetencies > 0
        ? (
            totalSkillGap /
            totalCompetencies
          ).toFixed(1)
        : "0.0";

    return {
      totalCompetencies,
      totalSkillGap,
      criticalGaps,
      highPriorityGaps,
      alignedCompetencies,
      averageGap,
    };
  }, [items]);


  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingSpinner} />

          <h1 style={styles.loadingTitle}>
            Analysing Your Skills
          </h1>

          <p style={styles.loadingText}>
            We are analysing your competency profile
            and preparing personalised learning
            recommendations.
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
            style={{
              ...styles.primaryButton,
              opacity: refreshing ? 0.7 : 1,
            }}
          >
            {refreshing
              ? "Retrying..."
              : "Try Again"}
          </button>

        </div>
      </div>
    );
  }


  return (
    <div style={styles.page}>

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <header style={styles.header}>

        <div style={styles.headerContent}>

          <div style={styles.eyebrow}>
            AI-POWERED SKILL INTELLIGENCE
          </div>

          <h1 style={styles.title}>
            Skill Intelligence
          </h1>

          <p style={styles.subtitle}>
            Understand your competency levels,
            identify skill gaps and discover
            personalised learning opportunities.
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

      </header>


      {/* =====================================================
          AI STATUS
      ===================================================== */}

      <section
        style={{
          ...styles.statusBanner,
          ...(aiAvailable
            ? styles.statusBannerAi
            : styles.statusBannerFallback),
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

        <div style={styles.statusContent}>

          <strong style={styles.statusTitle}>
            {aiAvailable
              ? "Gemini AI analysis is active"
              : "Explainable skill analysis is active"}
          </strong>

          <p style={styles.statusText}>
            {aiAvailable
              ? "Your profile is enriched with AI-generated interpretation, strengths, development areas and recommended focus."
              : "The platform is using deterministic skill-gap analysis because AI enrichment is currently unavailable."}
          </p>

        </div>

        <span style={styles.statusBadge}>
          {aiAvailable
            ? "AI ENABLED"
            : "FALLBACK MODE"}
        </span>

      </section>


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      {items.length > 0 && (
        <section style={styles.summaryGrid}>

          <div style={styles.summaryCard}>
            <span style={styles.summaryIcon}>
              ◈
            </span>

            <span style={styles.summaryLabel}>
              Competencies
            </span>

            <strong style={styles.summaryValue}>
              {summary.totalCompetencies}
            </strong>

            <span style={styles.summaryDescription}>
              Analysed competencies
            </span>
          </div>


          <div style={styles.summaryCard}>
            <span style={styles.summaryIcon}>
              Δ
            </span>

            <span style={styles.summaryLabel}>
              Average Gap
            </span>

            <strong style={styles.summaryValue}>
              {summary.averageGap}/5
            </strong>

            <span style={styles.summaryDescription}>
              Average development gap
            </span>
          </div>


          <div style={styles.summaryCard}>
            <span style={styles.summaryIcon}>
              !
            </span>

            <span style={styles.summaryLabel}>
              Critical Gaps
            </span>

            <strong style={styles.summaryValue}>
              {summary.criticalGaps}
            </strong>

            <span style={styles.summaryDescription}>
              Highest-priority competencies
            </span>
          </div>


          <div style={styles.summaryCard}>
            <span style={styles.summaryIcon}>
              ✓
            </span>

            <span style={styles.summaryLabel}>
              Competencies Aligned
            </span>

            <strong style={styles.summaryValue}>
              {summary.alignedCompetencies}
            </strong>

            <span style={styles.summaryDescription}>
              No identified skill gap
            </span>
          </div>

        </section>
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

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={styles.primaryButton}
          >
            {refreshing
              ? "Refreshing..."
              : "Check Again"}
          </button>

        </section>

      ) : (

        <>

          {/* =================================================
              SKILL ANALYSIS
          ================================================= */}

          <section>

            <div style={styles.sectionHeader}>

              <div>
                <div style={styles.sectionEyebrow}>
                  COMPETENCY PROFILE
                </div>

                <h2 style={styles.sectionTitle}>
                  Competency Analysis
                </h2>

                <p style={styles.sectionSubtitle}>
                  Your current capability compared with
                  the required competency level.
                </p>
              </div>

              <div style={styles.sectionMeta}>
                {summary.highPriorityGaps} high-priority
                {summary.highPriorityGaps === 1
                  ? " gap"
                  : " gaps"}
              </div>

            </div>


            <div style={styles.skillList}>

              {items.map((item) => {

                const priorityStyle =
                  getPriorityStyle(item.priority);

                const gap =
                  Number(item.gap || 0);

                const gapStyle =
                  getGapStyle(gap);

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

                    {/* =====================================
                        SKILL HEADER
                    ===================================== */}

                    <div style={styles.skillHeader}>

                      <div style={styles.skillHeaderMain}>

                        <div style={styles.skillNameRow}>

                          <h3 style={styles.skillName}>
                            {item.competency_name}
                          </h3>

                          {item.category && (
                            <span
                              style={styles.categoryBadge}
                            >
                              {item.category}
                            </span>
                          )}

                        </div>

                        <div style={styles.skillSubRow}>

                          <span
                            style={styles.statusTextBadge}
                          >
                            {formatStatus(item.status)}
                          </span>

                          <span style={styles.gapDescription}>
                            {getGapLabel(gap)}
                          </span>

                        </div>

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


                    {/* =====================================
                        LEVEL METRICS
                    ===================================== */}

                    <div style={styles.levelGrid}>

                      <div style={styles.levelCard}>

                        <div style={styles.metricTop}>
                          <span style={styles.metricLabel}>
                            Current Level
                          </span>

                          <strong
                            style={styles.metricValue}
                          >
                            {currentLevel}/5
                          </strong>
                        </div>

                        <div style={styles.progressTrack}>
                          <div
                            style={{
                              ...styles.progressCurrent,
                              width:
                                `${currentPercentage}%`,
                            }}
                          />
                        </div>

                      </div>


                      <div style={styles.levelCard}>

                        <div style={styles.metricTop}>
                          <span style={styles.metricLabel}>
                            Required Level
                          </span>

                          <strong
                            style={styles.metricValue}
                          >
                            {requiredLevel}/5
                          </strong>
                        </div>

                        <div style={styles.progressTrack}>
                          <div
                            style={{
                              ...styles.progressRequired,
                              width:
                                `${requiredPercentage}%`,
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
                            ...styles.gapValue,
                            ...gapStyle,
                          }}
                        >
                          {gap}
                        </strong>

                        <span style={styles.metricHint}>
                          Points to develop
                        </span>

                      </div>


                      <div style={styles.levelCard}>

                        <span style={styles.metricLabel}>
                          Status
                        </span>

                        <strong
                          style={styles.statusMetric}
                        >
                          {formatStatus(item.status)}
                        </strong>

                        <span style={styles.metricHint}>
                          Priority-based assessment
                        </span>

                      </div>

                    </div>


                    {/* =====================================
                        AI ANALYSIS
                    ===================================== */}

                    {item.analysis && (
                      <div style={styles.contentSection}>

                        <div style={styles.contentHeadingRow}>

                          <h4 style={styles.contentTitle}>
                            AI Analysis
                          </h4>

                          {item.ai_generated && (
                            <span style={styles.aiMiniBadge}>
                              AI
                            </span>
                          )}

                        </div>

                        <p style={styles.contentText}>
                          {item.analysis}
                        </p>

                      </div>
                    )}


                    {/* =====================================
                        STRENGTHS + DEVELOPMENT
                    ===================================== */}

                    {(item.strengths?.length > 0 ||
                      item.weaknesses?.length > 0) && (

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
                                    <span
                                      style={{
                                        ...styles.listMarker,
                                        color: "#15803d",
                                      }}
                                    >
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
                                    <span
                                      style={{
                                        ...styles.listMarker,
                                        color: "#c2410c",
                                      }}
                                    >
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
                    )}


                    {/* =====================================
                        RECOMMENDED FOCUS
                    ===================================== */}

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
                                <span
                                  style={styles.focusNumber}
                                >
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


                    {/* =====================================
                        ASSESSMENT PERFORMANCE
                    ===================================== */}

                    {item.assessment_performance && (

                      <div style={styles.performanceSection}>

                        <div style={styles.contentHeadingRow}>

                          <h4 style={styles.contentTitle}>
                            Assessment Performance
                          </h4>

                          <span
                            style={styles.performanceBadge}
                          >
                            Evidence
                          </span>

                        </div>

                        <div style={styles.performanceGrid}>

                          <div style={styles.performanceItem}>

                            <span
                              style={styles.performanceLabel}
                            >
                              Attempts
                            </span>

                            <strong
                              style={styles.performanceValue}
                            >
                              {item.assessment_performance.attempts}
                            </strong>

                          </div>


                          <div style={styles.performanceItem}>

                            <span
                              style={styles.performanceLabel}
                            >
                              Latest Score
                            </span>

                            <strong
                              style={styles.performanceValue}
                            >
                              {formatPercentage(
                                item.assessment_performance
                                  .latest_percentage
                              ) || "No attempt"}
                            </strong>

                          </div>


                          <div style={styles.performanceItem}>

                            <span
                              style={styles.performanceLabel}
                            >
                              Best Score
                            </span>

                            <strong
                              style={styles.performanceValue}
                            >
                              {formatPercentage(
                                item.assessment_performance
                                  .best_percentage
                              ) || "No attempt"}
                            </strong>

                          </div>


                          <div style={styles.performanceItem}>

                            <span
                              style={styles.performanceLabel}
                            >
                              Competency Accuracy
                            </span>

                            <strong
                              style={styles.performanceValue}
                            >
                              {formatPercentage(
                                item.assessment_performance
                                  .competency_accuracy
                              ) ||
                                "No competency-specific attempt"}
                            </strong>

                          </div>

                        </div>

                      </div>
                    )}


                    {/* =====================================
                        AI FOOTER
                    ===================================== */}

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
                <div style={styles.sectionEyebrow}>
                  PERSONALIZED LEARNING
                </div>

                <h2 style={styles.sectionTitle}>
                  Recommended Learning
                </h2>

                <p style={styles.sectionSubtitle}>
                  Learning resources selected according
                  to your identified skill gaps.
                </p>
              </div>

              {recommendations.length > 0 && (
                <div style={styles.sectionMeta}>
                  {recommendations.length} matched
                  {recommendations.length === 1
                    ? " resource"
                    : " resources"}
                </div>
              )}

            </div>


            {recommendations.length === 0 ? (

              <div style={styles.noRecommendationCard}>

                <div style={styles.noRecommendationIcon}>
                  i
                </div>

                <div>

                  <h3
                    style={styles.noRecommendationTitle}
                  >
                    No Learning Resources Matched
                  </h3>

                  <p
                    style={styles.noRecommendationText}
                  >
                    No resource in the current prototype
                    catalogue matched your identified
                    skill gaps.
                  </p>

                  {recommendationNote && (
                    <small style={styles.sourceNote}>
                      {recommendationNote}
                    </small>
                  )}

                </div>

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

                        <div
                          style={styles.recommendationTop}
                        >

                          <span
                            style={styles.resourceBadge}
                          >
                            {getRecommendationTypeLabel(
                              recommendation.resource_type
                            )}
                          </span>

                          <span
                            style={styles.resourceSource}
                          >
                            {recommendation.source}
                          </span>

                        </div>


                        <h3
                          style={
                            styles.recommendationTitle
                          }
                        >
                          {recommendation.title}
                        </h3>


                        {recommendation.competency_name && (
                          <div
                            style={styles.alignedSkill}
                          >
                            For competency:{" "}

                            <strong>
                              {recommendation.competency_name}
                            </strong>
                          </div>
                        )}


                        <p
                          style={
                            styles.recommendationReason
                          }
                        >
                          {recommendation.reason}
                        </p>


                        <a
                          href={recommendation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.resourceButton}
                        >
                          <span>
                            Open Learning Resource
                          </span>

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

  headerContent: {
    minWidth: 0,
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
    borderRadius: "12px",
    padding: "1rem 1.1rem",
    marginBottom: "1.5rem",
  },

  statusBannerAi: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
  },

  statusBannerFallback: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },

  statusDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    marginTop: "0.35rem",
    flexShrink: 0,
  },

  statusContent: {
    flex: 1,
    minWidth: 0,
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

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.3rem 0.55rem",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#475569",
    border: "1px solid #cbd5e1",
    fontSize: "0.65rem",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "0.9rem",
    marginBottom: "2rem",
  },

  summaryCard: {
    position: "relative",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1.1rem",
    boxShadow:
      "0 2px 8px rgba(15, 23, 42, 0.04)",
    overflow: "hidden",
  },

  summaryIcon: {
    position: "absolute",
    top: "0.85rem",
    right: "1rem",
    width: "28px",
    height: "28px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    background: "#eff6ff",
    color: "#2563eb",
    fontWeight: 800,
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "1rem",
    marginBottom: "1rem",
  },

  sectionEyebrow: {
    fontSize: "0.68rem",
    fontWeight: 800,
    letterSpacing: "0.07em",
    color: "#64748b",
    marginBottom: "0.25rem",
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

  sectionMeta: {
    color: "#64748b",
    fontSize: "0.78rem",
    fontWeight: 700,
    whiteSpace: "nowrap",
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

  skillHeaderMain: {
    minWidth: 0,
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

  skillSubRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "0.65rem",
    marginTop: "0.4rem",
  },

  statusTextBadge: {
    color: "#64748b",
    fontSize: "0.78rem",
  },

  gapDescription: {
    color: "#94a3b8",
    fontSize: "0.75rem",
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

  metricTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.5rem",
  },

  metricLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "0.75rem",
    fontWeight: 700,
  },

  metricValue: {
    color: "#0f172a",
    fontSize: "1.05rem",
  },

  gapValue: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "34px",
    padding: "0.25rem 0.55rem",
    borderRadius: "7px",
    fontSize: "1.15rem",
    fontWeight: 800,
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
    transition: "width 0.4s ease",
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

  contentHeadingRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.55rem",
  },

  contentTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "0.95rem",
  },

  contentText: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.65,
    fontSize: "0.9rem",
  },

  aiMiniBadge: {
    display: "inline-flex",
    padding: "0.2rem 0.4rem",
    borderRadius: "5px",
    background: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
    fontSize: "0.6rem",
    fontWeight: 800,
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

  performanceBadge: {
    display: "inline-flex",
    padding: "0.2rem 0.45rem",
    borderRadius: "5px",
    background: "#f1f5f9",
    color: "#64748b",
    fontSize: "0.62rem",
    fontWeight: 800,
  },

  performanceGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "0.7rem",
  },

  performanceItem: {
    padding: "0.7rem",
    borderRadius: "8px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
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
    display: "flex",
    alignItems: "flex-start",
    gap: "0.8rem",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1.25rem",
  },

  noRecommendationIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    background: "#f1f5f9",
    color: "#64748b",
    fontWeight: 800,
    flexShrink: 0,
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
    margin: "0.5rem auto 1.2rem",
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
};


export default SkillIntelligencePage;