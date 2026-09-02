import apiClient from "./client";

export const competencyApi = {
  getAllCompetencies() {
    return apiClient.get("/api/competencies", { auth: true });
  },

  getMyCompetencies() {
    return apiClient.get("/api/competencies/me", { auth: true });
  },

  addMyCompetency(payload) {
    return apiClient.post("/api/competencies/me", payload, { auth: true });
  },

  updateMyCompetency(competencyId, payload) {
    return apiClient.put(`/api/competencies/me/${competencyId}`, payload, { auth: true });
  },

  deleteMyCompetency(competencyId) {
    return apiClient.delete(`/api/competencies/me/${competencyId}`, { auth: true });
  },
};

export default competencyApi;
