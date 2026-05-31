import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  ArrowLeftRight,
  BarChart2,
  Sun,
  Moon
} from 'lucide-react';

export default function Navigation({ theme, toggleTheme }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <TrendingUp size={28} className="sidebar-logo-icon" style={{ color: 'var(--accent)' }} />
        <span className="sidebar-logo-text">Wellfield Mutual</span>
      </div>

      <nav className="nav-links">
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/investors" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Users size={20} />
          <span>Investors</span>
        </NavLink>

        <NavLink 
          to="/funds" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <TrendingUp size={20} />
          <span>Mutual Funds</span>
        </NavLink>

        <NavLink 
          to="/transactions" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <ArrowLeftRight size={20} />
          <span>Transactions</span>
        </NavLink>

        <NavLink 
          to="/summary" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <BarChart2 size={20} />
          <span>Purchase Summary</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </aside>
  );
}
