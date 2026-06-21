import React from 'react';
import { AlertTriangle } from 'lucide-react';

const AlertsList = ({ alerts }) => {
  return (
    <div className="card" style={{ height: '100%', overflowY: 'auto', maxHeight: '800px' }}>
      <h2 className="card-title">
        <AlertTriangle size={24} style={{ color: 'var(--status-warning)' }} />
        Recent Alerts
      </h2>
      <div className="alerts-list">
        {alerts.length > 0 ? (
          alerts.map(alert => {
            const date = new Date(alert.created_at);
            return (
              <div key={alert.id} className="alert-item">
                <AlertTriangle size={20} className="alert-icon" />
                <div className="alert-content">
                  <p><strong>{alert.crane_id}</strong>: {alert.message}</p>
                  <span className="alert-time">
                    {date.toLocaleDateString()} {date.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
            No alerts triggered.
          </p>
        )}
      </div>
    </div>
  );
};

export default AlertsList;
