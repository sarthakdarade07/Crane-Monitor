import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, ArrowLeft, Lock, Ban, CheckCircle } from 'lucide-react';
import '../index.css';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/users');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users.');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBlockUser = async (userId, currentStatus) => {
    try {
      await axios.patch(`http://localhost:3001/api/users/${userId}/block`, {
        is_blocked: !currentStatus
      });
      setSuccess(`User status updated successfully.`);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user status.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleChangePassword = async (userId) => {
    const newPassword = window.prompt("Enter new password for this user:");
    if (!newPassword) return;

    try {
      await axios.patch(`http://localhost:3001/api/users/${userId}/password`, {
        new_password: newPassword
      });
      setSuccess(`Password updated successfully.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update password.');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Shield size={32} style={{ color: 'var(--status-error)' }} />
          <h1>Admin Control Panel</h1>
        </div>
        <button 
          className="refresh-button" 
          onClick={() => navigate('/dashboard')}
          style={{ padding: '0.5rem 1rem' }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </header>

      <div className="main-content" style={{ marginTop: '2rem' }}>
        {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className="login-error" style={{ marginBottom: '1rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', borderColor: 'rgba(34, 197, 94, 0.2)' }}>{success}</div>}

        <div className="card">
          <h2 className="card-title">
            <Users size={24} style={{ color: 'var(--accent-blue)' }} />
            Registered Users
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>ID</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Username</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Role</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>{user.id}</td>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{user.username}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: user.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: user.role === 'admin' ? 'var(--status-error)' : 'var(--accent-blue)',
                        textTransform: 'uppercase'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {user.is_blocked ? (
                        <span style={{ color: 'var(--status-error)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Ban size={14}/> Blocked</span>
                      ) : (
                        <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={14}/> Active</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="refresh-button" 
                        onClick={() => handleChangePassword(user.id)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        <Lock size={14} /> Password
                      </button>
                      {user.username !== 'admin' && (
                        <button 
                          className="refresh-button" 
                          onClick={() => handleBlockUser(user.id, user.is_blocked)}
                          style={{ 
                            padding: '0.25rem 0.5rem', 
                            fontSize: '0.75rem',
                            color: user.is_blocked ? '#4ade80' : 'var(--status-error)'
                          }}
                        >
                          {user.is_blocked ? 'Unblock' : 'Block'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
