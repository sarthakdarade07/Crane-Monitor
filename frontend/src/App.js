import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import RawData from './components/RawData';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

// Set up Axios Interceptor to add JWT token to every request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard Route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Protected Admin Route */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireRole="admin">
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
        {/* Protected Raw Data Route (All authenticated users) */}
        <Route 
          path="/data" 
          element={
            <ProtectedRoute>
              <RawData />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirect any unknown route to /dashboard (which redirects to /login if unauthorized) */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
