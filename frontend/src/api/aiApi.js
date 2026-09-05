import apiClient from "./client";


const aiApi = {
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
};


export default aiApi;