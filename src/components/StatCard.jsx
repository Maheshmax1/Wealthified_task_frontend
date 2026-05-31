import React from 'react';

export default function StatCard({ title, value, icon: Icon, subtitle }) {
  return (
    <div className="glass-panel metric-card">
      <div className="metric-card-header">
        <span className="metric-card-title">{title}</span>
        {Icon && (
          <div className="metric-card-icon-wrapper">
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="metric-card-value">{value}</div>
      {subtitle && <div className="metric-card-subtitle">{subtitle}</div>}
    </div>
  );
}
