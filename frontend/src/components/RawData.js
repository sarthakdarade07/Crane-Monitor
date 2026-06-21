import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { Database, ArrowLeft } from 'lucide-react';
import '../index.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const RawData = () => {
  const [readings, setReadings] = useState([]);
  const [error, setError] = useState('');
  
  // Filtering & Sorting State
  const [filterCrane, setFilterCrane] = useState('All');
  const [sortTemp, setSortTemp] = useState('none');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/readings/all`);
        setReadings(response.data);
      } catch (err) {
        setError('Failed to load readings.');
      }
    };
    fetchReadings();

    const socket = io(API_BASE_URL);
    socket.on('new_reading', (reading) => {
      setReadings((prev) => [reading, ...prev].slice(0, 200)); // Keep max 200 locally
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Derive filtered and sorted readings
  let displayReadings = [...readings];
  if (filterCrane !== 'All') {
    displayReadings = displayReadings.filter(r => r.crane_id === filterCrane);
  }
  if (sortTemp === 'asc') {
    displayReadings.sort((a, b) => a.motor_temp_c - b.motor_temp_c);
  } else if (sortTemp === 'desc') {
    displayReadings.sort((a, b) => b.motor_temp_c - a.motor_temp_c);
  }

  // Get unique cranes for dropdown
  const uniqueCranes = [...new Set(readings.map(r => r.crane_id))];

  return (
    <div className="dashboard-container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Database size={32} style={{ color: 'var(--accent-cyan)' }} />
          <h1>Raw Crane Data</h1>
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

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className="card-title" style={{ margin: 0 }}>
              Global Crane Telemetry (Latest 200)
            </h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select 
                value={filterCrane} 
                onChange={(e) => setFilterCrane(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '0.5rem', outline: 'none'
                }}
              >
                <option value="All">All Cranes</option>
                {uniqueCranes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select 
                value={sortTemp} 
                onChange={(e) => setSortTemp(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '0.5rem', outline: 'none'
                }}
              >
                <option value="none">Sort by Time (Default)</option>
                <option value="asc">Temp: Low to High</option>
                <option value="desc">Temp: High to Low</option>
              </select>
            </div>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 1 }}>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Timestamp</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Crane ID</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Load (kg)</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Temp (°C)</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Vibration (mm/s)</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayReadings.map((reading) => (
                  <tr key={reading.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem' }}>{new Date(reading.ts).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{reading.crane_id}</td>
                    <td style={{ padding: '0.75rem' }}>{reading.load_kg.toFixed(1)}</td>
                    <td style={{ padding: '0.75rem', color: reading.motor_temp_c > 80 ? 'var(--status-error)' : 'inherit', fontWeight: sortTemp !== 'none' ? 'bold' : 'normal' }}>
                      {reading.motor_temp_c.toFixed(1)}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{reading.vibration_mm_s.toFixed(1)}</td>
                    <td style={{ padding: '0.75rem' }}>{reading.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {readings.length === 0 && !error && (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading readings...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RawData;
