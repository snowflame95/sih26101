import apiClient from "./client";

export const authApi = {
  healthCheck() {
    return apiClient.get("/health");
  },

  login(credentials) {
    return apiClient.post("/api/auth/login", credentials);
  },

  register(userData) {
    return apiClient.post("/api/auth/register", userData);
  },

  getCurrentUser() {
    return apiClient.get("/api/auth/me", { auth: true });
  },
};

export default authApi;
