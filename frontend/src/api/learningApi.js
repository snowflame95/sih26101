import apiClient from "./client";

export const learningApi = {
  listModules(competencyId) {
    const query = competencyId ? `?competency_id=${competencyId}` : "";
    return apiClient.get(`/api/learning/modules${query}`, { auth: true });
  },

  getModule(moduleId) {
    return apiClient.get(`/api/learning/modules/${moduleId}`, { auth: true });
  },

  createModule(payload) {
    return apiClient.post("/api/learning/modules", payload, { auth: true });
  },

  updateModule(moduleId, payload) {
    return apiClient.put(`/api/learning/modules/${moduleId}`, payload, { auth: true });
  },

  deleteModule(moduleId) {
    return apiClient.delete(`/api/learning/modules/${moduleId}`, { auth: true });
  },

  listResources(moduleId) {
    return apiClient.get(`/api/learning/modules/${moduleId}/resources`, { auth: true });
  },

  createResource(moduleId, payload) {
    return apiClient.post(`/api/learning/modules/${moduleId}/resources`, payload, { auth: true });
  },

  updateResource(resourceId, payload) {
    return apiClient.put(`/api/learning/resources/${resourceId}`, payload, { auth: true });
  },

  deleteResource(resourceId) {
    return apiClient.delete(`/api/learning/resources/${resourceId}`, { auth: true });
  },

  getMyProgress() {
    return apiClient.get("/api/learning/progress/me", { auth: true });
  },

  startProgress(moduleId) {
    return apiClient.post(`/api/learning/modules/${moduleId}/progress`, null, { auth: true });
  },

  updateProgress(moduleId, payload) {
    return apiClient.put(`/api/learning/modules/${moduleId}/progress`, payload, { auth: true });
  },

  getRoadmap() {
    return apiClient.get("/api/learning/roadmap/me", { auth: true });
  },
};

export default learningApi;
