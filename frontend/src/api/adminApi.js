import apiClient from "./client";


const adminApi = {
  getOverview() {
    return apiClient.get(
      "/api/admin/overview",
      { auth: true }
    );
  },

  getUsers() {
    return apiClient.get(
      "/api/admin/users",
      { auth: true }
    );
  },

  getRecentUsers(limit = 10) {
    return apiClient.get(
      `/api/admin/users/recent?limit=${limit}`,
      { auth: true }
    );
  },

  getAssessments() {
    return apiClient.get(
      "/api/admin/assessments",
      { auth: true }
    );
  },

  getAssessmentAttempts() {
    return apiClient.get(
      "/api/admin/assessment-attempts",
      { auth: true }
    );
  },

  getAssignments() {
    return apiClient.get(
      "/api/admin/assignments",
      { auth: true }
    );
  },

  getLearningActivity() {
    return apiClient.get(
      "/api/admin/learning",
      { auth: true }
    );
  },

  getActivity(limit = 100) {
    return apiClient.get(
      `/api/admin/activity?limit=${limit}`,
      { auth: true }
    );
  },

  updateUserRole(userId, role) {
    return apiClient.patch(
      `/api/auth/users/${userId}/role`,
      { role },
      { auth: true }
    );
  },

  updateUserStatus(userId, isActive) {
    return apiClient.patch(
      `/api/admin/users/${userId}/status?is_active=${isActive}`,
      null,
      { auth: true }
    );
  },
};


export default adminApi;