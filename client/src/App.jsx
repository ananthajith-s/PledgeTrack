import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Pledges from './pages/Pledges';
import PledgeForm from './pages/PledgeForm';
import './App.css';

// Home router redirects based on role or auth state
const HomeRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/pledges" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Home redirect */}
              <Route path="/" element={<HomeRedirect />} />

              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Admin only routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Donor only routes */}
              <Route
                path="/pledges"
                element={
                  <ProtectedRoute allowedRoles={['donor']}>
                    <Pledges />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pledges/new"
                element={
                  <ProtectedRoute allowedRoles={['donor']}>
                    <PledgeForm />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
