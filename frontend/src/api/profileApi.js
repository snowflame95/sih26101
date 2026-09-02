import apiClient from "./client";

export const profileApi = {
  getProfile() {
    return apiClient.get("/api/profile", { auth: true });
  },

  createProfile(profileData) {
    return apiClient.post("/api/profile", profileData, { auth: true });
  },

  updateProfile(profileData) {
    return apiClient.put("/api/profile", profileData, { auth: true });
  },
};

export default profileApi;
