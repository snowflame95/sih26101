import apiClient from "./client";


const aiApi = {
  // ==========================================================
  // SKILL INTELLIGENCE
  // ==========================================================

  /**
   * Analyse the authenticated user's skills.
   *
   * If competencyId is null, all user competencies
   * are analysed.
   */
  analyseSkills(competencyId = null) {
    const payload =
      competencyId === null
        ? {}
        : {
            competency_id: competencyId,
          };

    return apiClient.post(
      "/api/ai/skill-analysis",
      payload,
      {
        auth: true,
      }
    );
  },


  /**
   * Get learning recommendations for the
   * authenticated user's skill gaps.
   *
   * Recommendations are generated from the
   * backend learning catalogue.
   */
  getRecommendations(competencyId = null) {
    const payload =
      competencyId === null
        ? {}
        : {
            competency_id: competencyId,
          };

    return apiClient.post(
      "/api/ai/recommendations",
      payload,
      {
        auth: true,
      }
    );
  },


  // ==========================================================
  // AI QUIZ GENERATION
  // ==========================================================

  /**
   * Generate an MCQ quiz from an uploaded document.
   *
   * The backend accepts multipart/form-data containing:
   *
   * - file
   * - question_count
   * - difficulty
   * - competency_name
   *
   * The returned quiz is only a generated preview.
   * Publishing is handled separately through the
   * existing assessment API.
   */
  generateQuiz(formData) {
    return apiClient.post(
      "/api/ai/generate-quiz",
      formData,
      {
        auth: true,
      }
    );
  },
};


export default aiApi;