import React from 'react';
import { Activity, Thermometer, Weight } from 'lucide-react';

const CraneOverview = ({ latestReadings, selectedCrane, onSelectCrane }) => {
  return (
    <div className="card">
      <h2 className="card-title">
        <Activity size={24} className="alert-icon" style={{ color: 'var(--accent-blue)' }} />
        Crane Overview
      </h2>
      <div className="crane-grid">
        {latestReadings.map((reading) => {
          const isWarningTemp = reading.motor_temp_c >= 75 && reading.motor_temp_c <= 80;
          const isDangerTemp = reading.motor_temp_c > 80;

          return (
            <div 
              key={reading.crane_id} 
              className={`crane-card ${selectedCrane === reading.crane_id ? 'selected' : ''}`}
              onClick={() => onSelectCrane(reading.crane_id)}
            >
              <div className="crane-header">
                <span className="crane-id">{reading.crane_id}</span>
                <span className={`status-badge status-${reading.status}`}>
                  {reading.status}
                </span>
              </div>
              
              <div className="metric">
                <span className="metric-label"><Weight size={14} style={{display:'inline', marginRight: 4}}/> Load</span>
                <span className="metric-value">{reading.load_kg.toFixed(1)} kg</span>
              </div>
              
              <div className="metric">
                <span className="metric-label"><Thermometer size={14} style={{display:'inline', marginRight: 4}}/> Motor Temp</span>
                <span className={`metric-value ${isWarningTemp ? 'warning' : ''} ${isDangerTemp ? 'danger' : ''}`}>
                  {reading.motor_temp_c.toFixed(1)} °C
                </span>
              </div>

              <div className="metric">
                <span className="metric-label"><Activity size={14} style={{display:'inline', marginRight: 4}}/> Vibration</span>
                <span className="metric-value">{reading.vibration_mm_s.toFixed(1)} mm/s</span>
              </div>
            </div>
          );
        })}
        {latestReadings.length === 0 && <p>No data available</p>}
      </div>
    </div>
  );
};

export default CraneOverview;
