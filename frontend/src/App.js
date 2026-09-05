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
import SkillIntelligencePage from "./pages/SkillIntelligencePage";

import TrainerAssessmentsPage from "./pages/TrainerAssessmentsPage";
import TrainerAssignmentsPage from "./pages/TrainerAssignmentsPage";
import TrainerDashboardPage from "./pages/TrainerDashboardPage";
import TrainerModulesPage from "./pages/TrainerModulesPage";
import TrainerQuizGeneratorPage from "./pages/TrainerQuizGeneratorPage";

import TesterAssignmentsPage from "./pages/TesterAssignmentsPage";

import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";


function App() {
  return (
    <AuthProvider>

      <Routes>

        {/* =====================================================
            PUBLIC
        ===================================================== */}

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />


        {/* =====================================================
            AUTHENTICATED APPLICATION
        ===================================================== */}

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >

          {/* =================================================
              COMMON
          ================================================= */}

          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/profile"
            element={<ProfilePage />}
          />


          {/* =================================================
              LEARNER
          ================================================= */}

          <Route
            path="/competencies"
            element={
              <ProtectedRoute
                allowedRoles={["learner"]}
              >
                <CompetenciesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assessment"
            element={
              <ProtectedRoute
                allowedRoles={["learner"]}
              >
                <AssessmentPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assessment-history"
            element={
              <ProtectedRoute
                allowedRoles={["learner"]}
              >
                <AssessmentHistoryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assigned-assessments"
            element={
              <ProtectedRoute
                allowedRoles={["learner"]}
              >
                <AssignedAssessmentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/learning"
            element={
              <ProtectedRoute
                allowedRoles={["learner"]}
              >
                <LearningPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/roadmap"
            element={
              <ProtectedRoute
                allowedRoles={["learner"]}
              >
                <RoadmapPage />
              </ProtectedRoute>
            }
          />


          {/* =================================================
              AI SKILL INTELLIGENCE
          ================================================= */}

          <Route
            path="/skill-intelligence"
            element={
              <ProtectedRoute
                allowedRoles={["learner"]}
              >
                <SkillIntelligencePage />
              </ProtectedRoute>
            }
          />


          {/* =================================================
              TRAINER ONLY
          ================================================= */}

          <Route
            path="/trainer"
            element={
              <ProtectedRoute
                allowedRoles={["trainer"]}
              >
                <TrainerDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/trainer/modules"
            element={
              <ProtectedRoute
                allowedRoles={["trainer"]}
              >
                <TrainerModulesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/trainer/assessments"
            element={
              <ProtectedRoute
                allowedRoles={["trainer"]}
              >
                <TrainerAssessmentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/trainer/assignments"
            element={
              <ProtectedRoute
                allowedRoles={["trainer"]}
              >
                <TrainerAssignmentsPage />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              AI QUIZ GENERATOR
          ================================================= */}

          <Route
            path="/trainer/quiz-generator"
            element={
              <ProtectedRoute
                allowedRoles={["trainer"]}
              >
                <TrainerQuizGeneratorPage />
              </ProtectedRoute>
            }
          />


          {/* =================================================
              TESTER ONLY
          ================================================= */}

          <Route
            path="/tester"
            element={
              <ProtectedRoute
                allowedRoles={["tester"]}
              >
                <TesterAssignmentsPage />
              </ProtectedRoute>
            }
          />


          {/* =================================================
              ADMIN ONLY
          ================================================= */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
              >
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
              >
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />

        </Route>


        {/* =====================================================
            DEFAULT
        ===================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    </AuthProvider>
  );
}


/* =============================================================
   BACKEND HEALTH CHECK
============================================================= */

export const healthCheck = async () => {
  try {
    const response =
      await authApi.healthCheck();

    return response;

  } catch (error) {

    return {
      status: "disconnected",
      message: error.message,
    };

  }
};


export default App;