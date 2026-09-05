import { useEffect, useState } from "react";

import aiApi from "../api/aiApi";


function SkillIntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);


  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [analysisResponse, recommendationResponse] =
        await Promise.all([
          aiApi.analyseSkills(),
          aiApi.getRecommendations(),
        ]);

      setData(analysisResponse.data);

      setRecommendations(
        recommendationResponse.data?.recommendations || []
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load skill intelligence."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);


  if (loading) {
    return (
      <div className="page-container">
        <h1>Skill Intelligence</h1>
        <p>
          Analysing your competency profile...
        </p>
      </div>
    );
  }


  if (error) {
    return (
      <div className="page-container">
        <h1>Skill Intelligence</h1>

        <div className="error-message">
          {error}
        </div>

        <button onClick={loadData}>
          Retry
        </button>
      </div>
    );
  }


  const items = data?.items || [];


  return (
    <div className="page-container">

      <div className="page-header">
        <div>
          <h1>Skill Intelligence</h1>

          <p>
            Understand your current competency,
            skill gaps and areas for development.
          </p>
        </div>

        <button onClick={loadData}>
          Refresh Analysis
        </button>
      </div>


      {data?.ai_available ? (
        <div className="info-message">
          Gemini-assisted skill analysis is active.
        </div>
      ) : (
        <div className="info-message">
          Explainable backend skill analysis is active.
          AI enrichment is currently unavailable.
        </div>
      )}


      {items.length === 0 ? (
        <div className="empty-state">
          <h2>No competencies available</h2>

          <p>
            Add competencies to your profile before
            generating skill intelligence.
          </p>
        </div>
      ) : (
        <div className="skill-analysis-list">

          {items.map((item) => (
            <section
              key={item.competency_id}
              className="skill-analysis-card"
            >

              <div className="skill-analysis-header">

                <div>
                  <h2>
                    {item.competency_name}
                  </h2>

                  {item.category && (
                    <span>
                      {item.category}
                    </span>
                  )}
                </div>

                <strong>
                  {item.priority.toUpperCase()}
                </strong>

              </div>


              <div className="skill-level-grid">

                <div>
                  <small>
                    Current Level
                  </small>

                  <strong>
                    {item.current_level}/5
                  </strong>
                </div>


                <div>
                  <small>
                    Required Level
                  </small>

                  <strong>
                    {item.required_level}/5
                  </strong>
                </div>


                <div>
                  <small>
                    Skill Gap
                  </small>

                  <strong>
                    {item.gap}
                  </strong>
                </div>


                <div>
                  <small>
                    Status
                  </small>

                  <strong>
                    {item.status.replaceAll(
                      "_",
                      " "
                    )}
                  </strong>
                </div>

              </div>


              <div className="skill-analysis-section">

                <h3>
                  Analysis
                </h3>

                <p>
                  {item.analysis}
                </p>

              </div>


              {item.strengths?.length > 0 && (
                <div className="skill-analysis-section">

                  <h3>
                    Strengths
                  </h3>

                  <ul>
                    {item.strengths.map(
                      (strength, index) => (
                        <li key={index}>
                          {strength}
                        </li>
                      )
                    )}
                  </ul>

                </div>
              )}


              {item.weaknesses?.length > 0 && (
                <div className="skill-analysis-section">

                  <h3>
                    Development Areas
                  </h3>

                  <ul>
                    {item.weaknesses.map(
                      (weakness, index) => (
                        <li key={index}>
                          {weakness}
                        </li>
                      )
                    )}
                  </ul>

                </div>
              )}


              {item.recommended_focus?.length > 0 && (
                <div className="skill-analysis-section">

                  <h3>
                    Recommended Focus
                  </h3>

                  <ul>
                    {item.recommended_focus.map(
                      (focus, index) => (
                        <li key={index}>
                          {focus}
                        </li>
                      )
                    )}
                  </ul>

                </div>
              )}


              <div className="assessment-performance">

                <h3>
                  Assessment Performance
                </h3>

                <p>
                  Attempts:{" "}
                  {item.assessment_performance.attempts}
                </p>

                <p>
                  Latest Overall Score:{" "}
                  {item.assessment_performance
                    .latest_percentage !== null
                    ? `${item.assessment_performance.latest_percentage}%`
                    : "No attempt"}
                </p>

                <p>
                  Best Overall Score:{" "}
                  {item.assessment_performance
                    .best_percentage !== null
                    ? `${item.assessment_performance.best_percentage}%`
                    : "No attempt"}
                </p>

                <p>
                  Competency Accuracy:{" "}
                  {item.assessment_performance
                    .competency_accuracy !== null
                    ? `${item.assessment_performance.competency_accuracy}%`
                    : "No competency-specific attempt"}
                </p>

              </div>


              {item.ai_generated && (
                <small>
                  Gemini-assisted interpretation
                </small>
              )}

            </section>
          ))}

        </div>
      )}


      {recommendations.length > 0 && (
        <section className="recommendations-section">

          <div className="page-header">
            <div>
              <h2>
                Recommended Learning
              </h2>

              <p>
                Learning resources selected based
                on identified skill gaps.
              </p>
            </div>
          </div>


          <div className="recommendation-list">

            {recommendations.map(
              (recommendation, index) => (
                <article
                  key={`${recommendation.title}-${index}`}
                  className="recommendation-card"
                >

                  <h3>
                    {recommendation.title}
                  </h3>

                  <p>
                    {recommendation.reason}
                  </p>

                  <small>
                    Source:{" "}
                    {recommendation.source}
                  </small>

                  <div>
                    <a
                      href={recommendation.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Resource
                    </a>
                  </div>

                </article>
              )
            )}

          </div>

        </section>
      )}

    </div>
  );
}


export default SkillIntelligencePage;