import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requireRole }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  if (requireRole && role !== requireRole) {
    // Logged in but insufficient role. We can redirect to a not-authorized page or just dashboard.
    // For now, if they don't have the role, just let them see the dashboard but maybe hide admin features.
    // If a route explicitly requires 'admin' and they are 'viewer', boot them to dashboard.
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
