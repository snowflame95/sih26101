import apiClient from "./client";


const assessmentApi = {

  // ==========================================================
  // LEARNER ASSESSMENTS
  // ==========================================================

  listAssessments() {
    return apiClient.get(
      "/api/assessments",
      {
        auth: true,
      }
    );
  },


  getAssessment(assessmentId) {
    return apiClient.get(
      `/api/assessments/${assessmentId}`,
      {
        auth: true,
      }
    );
  },


  getMyAttempts() {
    return apiClient.get(
      "/api/assessments/my-attempts",
      {
        auth: true,
      }
    );
  },


  getAttempt(attemptId) {
    return apiClient.get(
      `/api/assessments/attempts/${attemptId}`,
      {
        auth: true,
      }
    );
  },


  submitAssessment(
    assessmentId,
    payload
  ) {
    return apiClient.post(
      `/api/assessments/${assessmentId}/submit`,
      payload,
      {
        auth: true,
      }
    );
  },


  // ==========================================================
  // TRAINER / CONTENT MANAGER
  // ==========================================================

  listManageAssessments() {
    return apiClient.get(
      "/api/assessments/manage",
      {
        auth: true,
      }
    );
  },


  getManageAssessment(
    assessmentId
  ) {
    return apiClient.get(
      `/api/assessments/manage/${assessmentId}`,
      {
        auth: true,
      }
    );
  },


  createAssessment(
    payload
  ) {
    return apiClient.post(
      "/api/assessments/",
      payload,
      {
        auth: true,
      }
    );
  },


  updateAssessment(
    assessmentId,
    payload
  ) {
    return apiClient.put(
      `/api/assessments/manage/${assessmentId}`,
      payload,
      {
        auth: true,
      }
    );
  },


  deleteAssessment(
    assessmentId
  ) {
    return apiClient.delete(
      `/api/assessments/manage/${assessmentId}`,
      {
        auth: true,
      }
    );
  },


  addQuestion(
    assessmentId,
    payload
  ) {
    return apiClient.post(
      `/api/assessments/manage/${assessmentId}/questions`,
      payload,
      {
        auth: true,
      }
    );
  },


  // ==========================================================
  // ASSESSMENT ASSIGNMENTS
  // ==========================================================

  createAssignment(
    payload
  ) {
    return apiClient.post(
      "/api/assessments/assignments",
      payload,
      {
        auth: true,
      }
    );
  },


  getMyAssignments() {
    return apiClient.get(
      "/api/assessments/assignments/my",
      {
        auth: true,
      }
    );
  },


  getAssignedReviews() {
    return apiClient.get(
      "/api/assessments/assignments/assigned",
      {
        auth: true,
      }
    );
  },


  getAssignment(
    assignmentId
  ) {
    return apiClient.get(
      `/api/assessments/assignments/${assignmentId}`,
      {
        auth: true,
      }
    );
  },


  reviewAssignment(
    assignmentId,
    payload
  ) {
    return apiClient.post(
      `/api/assessments/assignments/${assignmentId}/review`,
      payload,
      {
        auth: true,
      }
    );
  },


  // ==========================================================
  // AI QUIZ GENERATION
  // ==========================================================
  //
  // These methods will be connected after the backend
  // AI quiz-generation endpoint is implemented.
  //
  // The AI generator will NOT replace the existing
  // assessment system.
  //
  // Flow:
  //
  // Trainer
  //   ↓
  // Upload document
  //   ↓
  // AI generates questions
  //   ↓
  // Preview / review
  //   ↓
  // Existing createAssessment()
  //
  // ==========================================================

  generateQuiz(
    formData
  ) {
    return apiClient.post(
      "/api/ai/generate-quiz",
      formData,
      {
        auth: true,
      }
    );
  },


  createGeneratedAssessment(
    payload
  ) {
    return apiClient.post(
      "/api/assessments/",
      payload,
      {
        auth: true,
      }
    );
  },

};


export default assessmentApi;