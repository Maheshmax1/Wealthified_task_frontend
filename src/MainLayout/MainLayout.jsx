import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import { useDate } from '../DateContext';
import { Calendar, X } from 'lucide-react';

export default function MainLayout({ theme, toggleTheme }) {
  const { startDate, setStartDate, endDate, setEndDate, clearDates } = useDate();
  const location = useLocation();

  // Determine title and subtitle based on current route
  const getHeaderInfo = () => {
    switch (location.pathname) {
      case '/':
        return {
          title: 'Analytics Dashboard',
          subtitle: 'AUM, investor behavior, and fund performance macro metrics.'
        };
      case '/investors':
        return {
          title: 'Investors Registry',
          subtitle: 'Manage client accounts, view asset distribution, and transaction histories.'
        };
      case '/funds':
        return {
          title: 'Mutual Funds Catalog',
          subtitle: 'Define schemes, track macro investments, and explore active client rosters.'
        };
      case '/transactions':
        return {
          title: 'Transaction Ledger',
          subtitle: 'Comprehensive ledger of all capital entries, redemptions, and asset prices.'
        };
      case '/summary':
        return {
          title: 'Purchase Summary',
          subtitle: 'Investor-wise & fund-wise purchase summaries, investor list, and fund macro totals — filtered by date.'
        };
      default:
        return {
          title: 'Mutual Fund Analytics',
          subtitle: 'Premium wealth management analytics engine.'
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="app-container">
      {/* Sidebar Nav */}
      <Navigation theme={theme} toggleTheme={toggleTheme} />

      {/* Main Page Area */}
      <main className="main-content">
        <header className="app-header">
          <div className="page-title-area">
            <h1>{headerInfo.title}</h1>
            <p>{headerInfo.subtitle}</p>
          </div>

          {/* Global Date Filters */}
          <div className="filter-bar">
            <div className="filter-input-group">
              <Calendar size={14} className="text-muted" />
              <label htmlFor="start-date">From</label>
              <input 
                type="date" 
                id="start-date"
                className="filter-date-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
            
            <span className="filter-divider">|</span>
            
            <div className="filter-input-group">
              <Calendar size={14} className="text-muted" />
              <label htmlFor="end-date">To</label>
              <input 
                type="date" 
                id="end-date"
                className="filter-date-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>

            {(startDate || endDate) && (
              <>
                <span className="filter-divider">|</span>
                <button className="btn-clear-filters" onClick={clearDates}>
                  <X size={14} />
                  <span>Clear</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Dynamic Inner Page */}
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
