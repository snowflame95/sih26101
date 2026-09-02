import { Navigate, Route, Routes } from "react-router-dom";

import authApi from "./api/authApi";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import AppLayout from "./layouts/AppLayout";
import AssessmentPage from "./pages/AssessmentPage";
import AssessmentHistoryPage from "./pages/AssessmentHistoryPage";
import AssignedAssessmentsPage from "./pages/AssignedAssessmentsPage";
import CompetenciesPage from "./pages/CompetenciesPage";
import DashboardPage from "./pages/DashboardPage";
import LearningPage from "./pages/LearningPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import RoadmapPage from "./pages/RoadmapPage";
import TrainerAssessmentsPage from "./pages/TrainerAssessmentsPage";
import TrainerAssignmentsPage from "./pages/TrainerAssignmentsPage";
import TrainerDashboardPage from "./pages/TrainerDashboardPage";
import TrainerModulesPage from "./pages/TrainerModulesPage";
import TesterAssignmentsPage from "./pages/TesterAssignmentsPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/competencies" element={<CompetenciesPage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/assessment-history" element={<AssessmentHistoryPage />} />
          <Route path="/assigned-assessments" element={<AssignedAssessmentsPage />} />
          <Route path="/learning" element={<LearningPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route
            path="/trainer"
            element={
              <ProtectedRoute allowedRoles={["trainer", "admin"]}>
                <TrainerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/modules"
            element={
              <ProtectedRoute allowedRoles={["trainer", "admin"]}>
                <TrainerModulesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/assessments"
            element={
              <ProtectedRoute allowedRoles={["trainer", "admin"]}>
                <TrainerAssessmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/assignments"
            element={
              <ProtectedRoute allowedRoles={["trainer", "admin"]}>
                <TrainerAssignmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tester"
            element={
              <ProtectedRoute allowedRoles={["tester"]}>
                <TesterAssignmentsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export const healthCheck = async () => {
  try {
    const response = await authApi.healthCheck();
    return response;
  } catch (error) {
    return { status: "disconnected", message: error.message };
  }
};

export default App;