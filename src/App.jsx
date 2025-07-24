import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Loading from './components/Common/Loading';
import Landing from './pages/Landing';
import StudentAuth from './pages/Auth/StudentAuth';
import StaffAuth from './pages/Auth/StaffAuth';
import StudentDashboard from './pages/Student/Dashboard';
import StaffDashboard from './pages/Staff/Dashboard';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    // If not logged in, redirect to the landing page
    return <Navigate to="/" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // If logged in but with the wrong role, redirect to the landing page
    return <Navigate to="/" replace />;
  }

  // If logged in and has the correct role (or no role is required), show the content
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Landing />} />
      <Route path="/auth/student" element={!user ? <StudentAuth /> : <Navigate to="/student/dashboard" replace />} />
      <Route path="/auth/staff" element={!user ? <StaffAuth /> : <Navigate to="/staff/dashboard" replace />} />
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/dashboard"
        element={
          <ProtectedRoute allowedRole="staff">
            <StaffDashboard />
          </ProtectedRoute>
        }
      />
      {/* Catch-all route to redirect any unknown URL to the landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-200">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
