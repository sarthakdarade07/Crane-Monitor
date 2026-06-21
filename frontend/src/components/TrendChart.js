import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--border-color)',
        color: 'var(--text-main)',
        borderRadius: '0.5rem',
        padding: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
      }}>
        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>Time: {new Date(data.ts).toLocaleTimeString()}</p>
        <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}><strong>Motor Temp:</strong> {data.motor_temp_c}°C</p>
        <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}><strong>Load:</strong> {data.load_kg} kg</p>
        <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}><strong>Vibration:</strong> {data.vibration_mm_s} mm/s</p>
        <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}><strong>Status:</strong> {data.status}</p>
      </div>
    );
  }
  return null;
};

const TrendChart = ({ data, selectedCrane, availableCranes = [], onSelectCrane }) => {
  // Format the timestamp for the X-axis
  const formattedData = data.map(item => {
    const date = new Date(item.ts);
    return {
      ...item,
      time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    };
  });

  return (
    <div className="card">
      <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={24} style={{ color: 'var(--accent-cyan)' }} />
          Motor Temperature Trend
        </div>
        {availableCranes.length > 0 && (
          <select 
            value={selectedCrane} 
            onChange={(e) => onSelectCrane(e.target.value)}
            style={{
              backgroundColor: 'var(--bg-dark)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {availableCranes.map(crane => (
              <option key={crane} value={crane}>{crane}</option>
            ))}
          </select>
        )}
      </div>
      <div className="chart-container">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="var(--text-muted)" 
                tick={{ fill: 'var(--text-muted)' }}
                tickMargin={10}
              />
              <YAxis 
                stroke="var(--text-muted)" 
                tick={{ fill: 'var(--text-muted)' }}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={80} stroke="var(--status-error)" strokeDasharray="3 3" label={{ position: 'top', value: '80°C Limit', fill: 'var(--status-error)', fontSize: 12 }} />
              <Line 
                type="monotone" 
                dataKey="motor_temp_c" 
                stroke="var(--accent-cyan)" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: 'var(--accent-blue)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
            No trend data available.
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendChart;
