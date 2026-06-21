import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { RefreshCw, LogOut, Shield, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CraneOverview from './CraneOverview';
import TrendChart from './TrendChart';
import AlertsList from './AlertsList';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_URL = `${API_BASE_URL}/api`;

const Dashboard = () => {
  const [latestReadings, setLatestReadings] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedCrane, setSelectedCrane] = useState('CR-101');
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const overviewRes = await axios.get(`${API_URL}/readings/latest`);
      setLatestReadings(overviewRes.data);

      if (overviewRes.data.length > 0 && !selectedCrane) {
        setSelectedCrane(overviewRes.data[0].crane_id);
      }

      const alertsRes = await axios.get(`${API_URL}/alerts`);
      setAlerts(alertsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (err.response && err.response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
      }
    }
  }, [selectedCrane, navigate]);

  const fetchTrendData = useCallback(async () => {
    if (!selectedCrane) return;
    try {
      const end = new Date('2026-12-31T23:59:59Z').toISOString();
      const start = new Date('2020-01-01T00:00:00Z').toISOString();
      
      const trendRes = await axios.get(`${API_URL}/readings/range`, {
        params: { crane_id: selectedCrane, start, end }
      });
      const recentPoints = trendRes.data.slice(-50);
      setTrendData(recentPoints);
    } catch (err) {
      console.error('Error fetching trend data:', err);
    }
  }, [selectedCrane]);

  useEffect(() => {
    fetchData();
    fetchTrendData();

    // Set up Socket.IO connection
    const socket = io(API_BASE_URL);

    socket.on('new_reading', (reading) => {
      // Update Latest Readings overview
      setLatestReadings((prev) => {
        const idx = prev.findIndex(r => r.crane_id === reading.crane_id);
        if (idx === -1) return [...prev, reading];
        const newArr = [...prev];
        newArr[idx] = reading;
        return newArr;
      });

      // Update Trend Chart if it matches selected crane
      setTrendData((prev) => {
        if (reading.crane_id !== selectedCrane) return prev;
        const newArr = [...prev, reading];
        if (newArr.length > 50) newArr.shift(); // Keep last 50 points
        return newArr;
      });
    });

    socket.on('new_alert', (alert) => {
      setAlerts((prev) => [alert, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchData, fetchTrendData, selectedCrane]);

  const handleRefresh = () => {
    fetchData();
    fetchTrendData();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>Crane Monitor</h1>
        <div className="header-actions">
          <div className="refresh-indicator">
            <div className="pulse"></div>
            <span>Live Updates</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {localStorage.getItem('role') === 'admin' && (
              <button className="refresh-button" onClick={() => navigate('/admin')} style={{ borderColor: 'var(--accent-blue)', color: 'var(--accent-cyan)' }}>
                <Shield size={16} />
                Admin Panel
              </button>
            )}
            <button className="refresh-button" onClick={() => navigate('/data')}>
              <Database size={16} />
              Raw Data
            </button>
            <button className="refresh-button" onClick={handleRefresh}>
              <RefreshCw size={16} />
              Refresh Now
            </button>
            <button className="refresh-button" onClick={handleLogout} style={{ color: 'var(--status-error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="grid-layout">
        <div className="main-content">
          <CraneOverview 
            latestReadings={latestReadings} 
            selectedCrane={selectedCrane} 
            onSelectCrane={setSelectedCrane} 
          />
          <TrendChart 
            data={trendData} 
            selectedCrane={selectedCrane}
            availableCranes={latestReadings.map(r => r.crane_id)}
            onSelectCrane={setSelectedCrane}
          />
        </div>
        <aside>
          <AlertsList alerts={alerts} />
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
