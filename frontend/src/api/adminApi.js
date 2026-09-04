import apiClient from "./client";


const adminApi = {
  getOverview() {
    return apiClient.get(
      "/api/admin/overview",
      {
        auth: true,
      }
    );
  },

  getUsers() {
    return apiClient.get(
      "/api/admin/users",
      {
        auth: true,
      }
    );
  },

  getRecentUsers(limit = 10) {
    return apiClient.get(
      `/api/admin/users/recent?limit=${limit}`,
      {
        auth: true,
      }
    );
  },

  getAssessments() {
    return apiClient.get(
      "/api/admin/assessments",
      {
        auth: true,
      }
    );
  },

  updateUserRole(userId, role) {
    return apiClient.patch(
      `/api/auth/users/${userId}/role`,
      {
        role,
      },
      {
        auth: true,
      }
    );
  },
};


export default adminApi;