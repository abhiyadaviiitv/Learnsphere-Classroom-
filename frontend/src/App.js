import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentClassDetails from './pages/StudentClassDetails';
import StudentAssignments from './pages/StudentAssignments';
import TeacherClassDetails from './pages/TeacherClassDetails';
import AssignmentCreator from './pages/AssignmentCreator';
import Assignmentdisplay from './pages/Assignmentdisplay';
import TeacherAssignments from './pages/TeacherAssignments';
import StudentDashboard from './pages/StudentDashboard';
import StudentAnalytics from './pages/StudentAnalytics';
import StudentCalendar from './pages/StudentCalendar';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherAnalytics from './pages/TeacherAnalytics';
import TeacherSubmissionView from './pages/TeacherSubmissionView';
import RoleSelection from './pages/RoleSelection';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
};


const Dashboard = () => {
  const { role } = useAuth();

  if (role === 'TEACHER') {
    return <TeacherDashboard />;
  } else if (role === 'STUDENT') {
    return <StudentDashboard />;
  } else {
    // If role is null, 'USER', or anything else, redirect to selection
    return <Navigate to="/role-selection" replace />;
  }
};

const OAuth2Redirect = () => {
  const { setAuthToken, fetchUserProfileAndStore } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  React.useEffect(() => {
    const handleRedirect = async () => {
      if (token) {
        setAuthToken(token);

        try {
          // Fetch user profile to get role immediately
          const userData = await fetchUserProfileAndStore();

          if (userData && (userData.role === 'TEACHER' || userData.role === 'STUDENT')) {
            window.location.href = '/dashboard';
          } else {
            window.location.href = '/role-selection';
          }
        } catch (error) {
          console.error("Error fetching profile during OAuth redirect:", error);
          window.location.href = '/role-selection'; // Fallback
        }
      } else {
        window.location.href = '/login?error=oauth_failed';
      }
    };

    handleRedirect();
  }, [token, setAuthToken, fetchUserProfileAndStore]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/role-selection"
            element={
              <ProtectedRoute>
                <RoleSelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/calendar"
            element={
              <ProtectedRoute>
                <StudentCalendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Class Routes */}
          <Route
            path="/class/:classId"
            element={
              <ProtectedRoute>
                <StudentClassDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/class/:classId/assignments"
            element={
              <ProtectedRoute>
                <StudentAssignments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/class/:classId/analytics"
            element={
              <ProtectedRoute>
                <StudentAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/class/:classId"
            element={
              <ProtectedRoute>
                <TeacherClassDetails />
              </ProtectedRoute>
            }
          />

          {/* Assignment Routes */}
          <Route
            path="/assignment/:assignmentid"
            element={
              <ProtectedRoute>
                <Assignmentdisplay />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/class/:classId/assignments"
            element={
              <ProtectedRoute>
                <TeacherAssignments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/class/:classId/assignments/create"
            element={
              <ProtectedRoute>
                <AssignmentCreator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/class/:classId/assignments/:assignmentId"
            element={
              <ProtectedRoute>
                <Assignmentdisplay />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/class/:classId/assignments/:assignmentId/submissions"
            element={
              <ProtectedRoute>
                <TeacherSubmissionView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/class/:classId/analytics"
            element={
              <ProtectedRoute>
                <TeacherAnalytics />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

