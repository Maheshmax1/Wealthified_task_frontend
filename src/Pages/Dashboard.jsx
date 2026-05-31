import React, { useState, useEffect, useCallback } from 'react';
import { useDate } from '../DateContext';
import { api } from '../api';
import StatCard from '../components/StatCard';
import { 
  DollarSign, 
  Users, 
  Layers, 
  FileText,
  TrendingUp,
  AlertTriangle,
  Award
} from 'lucide-react';

export default function Dashboard() {
  const { startDate, endDate } = useDate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Dashboard states
  const [fundsSummary, setFundsSummary] = useState([]);
  const [topInvestors, setTopInvestors] = useState([]);
  const [metrics, setMetrics] = useState({
    totalAUM: 0,
    totalInvestors: 0,
    totalSchemes: 0,
    totalTransactions: 0
  });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { start_date: startDate, end_date: endDate };
      
      // Fetch summaries in parallel
      const [summaryData, topInvData] = await Promise.all([
        api.getFundsSummary(params),
        api.getTopInvestors(params)
      ]);
      
      setFundsSummary(summaryData || []);
      setTopInvestors(topInvData || []);
      
      // Calculate dashboard metrics
      const aum = (summaryData || []).reduce((acc, curr) => acc + Number(curr.total_amount_invested_all_investors), 0);
      const schemes = (summaryData || []).length;
      const investors = (topInvData || []).length;
      
      // We can get transaction count from fetching transactions or summing units
      // Let's get count from the summary of all transactions if possible, or just sum total units as an indicator, or calculate total count.
      const txnList = await api.getTransactions(0, 1000, startDate, endDate);
      const txnFilteredCount = txnList ? txnList.length : 0;
      
      setMetrics({
        totalAUM: aum,
        totalInvestors: investors,
        totalSchemes: schemes,
        totalTransactions: txnFilteredCount
      });
    } catch (err) {
      console.error(err);
      setError('Could not establish secure database connection. Please verify the backend API is online.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Format currency helper
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p className="text-secondary">Crunching portfolio database entries...</p>
      </div>
    );
  }

  if (error) {
    const isMissingDates = !startDate || !endDate;
    return (
      <div className="glass-panel animate-fade-in" style={{ borderColor: isMissingDates ? 'var(--warning)' : 'var(--danger)', padding: '2rem', textAlign: 'center' }}>
        <AlertTriangle size={48} style={{ color: isMissingDates ? 'var(--warning)' : 'var(--danger)', marginBottom: '1rem' }} />
        <h3 style={{ marginBottom: '0.5rem' }}>{isMissingDates ? 'Date Range Required' : 'Connection Failed'}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
        {!isMissingDates && (
          <button className="btn btn-primary" onClick={fetchDashboardData}>
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  // Calculate allocation percentages
  const allocationBreakdown = fundsSummary.map(fund => {
    const amt = Number(fund.total_amount_invested_all_investors);
    const pct = metrics.totalAUM > 0 ? (amt / metrics.totalAUM) * 100 : 0;
    return {
      name: fund.scheme_name,
      amount: amt,
      percentage: pct.toFixed(1)
    };
  }).sort((a, b) => b.amount - a.amount);

  return (
    <div className="dashboard-view animate-fade-in">
      {/* Metrics Row */}
      <div className="dashboard-grid">
        <StatCard 
          title="Assets Under Management" 
          value={formatCurrency(metrics.totalAUM)} 
          icon={DollarSign}
          subtitle="Aggregate assets filtered by date"
        />
        <StatCard 
          title="Active Investors" 
          value={metrics.totalInvestors} 
          icon={Users}
          subtitle="Unique client accounts"
        />
        <StatCard 
          title="Active Schemes" 
          value={metrics.totalSchemes} 
          icon={Layers}
          subtitle="Mutual fund offerings"
        />
        <StatCard 
          title="Processed Ledgers" 
          value={metrics.totalTransactions} 
          icon={FileText}
          subtitle="System transactions recorded"
        />
      </div>

      {/* Visual Charts & Rankings Row */}
      <div className="chart-cards-row">
        {/* CSS Asset Allocation Bar Graph */}
        <div className="glass-panel">
          <h3 className="chart-container-title">
            <TrendingUp size={18} style={{ color: 'var(--accent)' }} />
            <span>Asset Allocation by Scheme</span>
          </h3>
          <div className="css-pie-chart-wrapper">
            {allocationBreakdown.length > 0 ? (
              allocationBreakdown.map((item, idx) => (
                <div key={idx} className="css-bar-row">
                  <div className="css-bar-info">
                    <span style={{ maxWidth: '70%', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </span>
                    <span className="text-secondary">{item.percentage}% ({formatCurrency(item.amount)})</span>
                  </div>
                  <div className="css-bar-track">
                    <div className="css-bar-fill" style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', padding: '2rem' }}>No allocation records found in date range.</p>
            )}
          </div>
        </div>

        {/* Top Investors Ranking */}
        <div className="glass-panel">
          <h3 className="chart-container-title">
            <Award size={18} style={{ color: 'var(--warning)' }} />
            <span>Top Investors</span>
          </h3>
          <div className="leaderboard-list">
            {topInvestors.length > 0 ? (
              topInvestors.slice(0, 5).map((investor, idx) => (
                <div key={investor.pan} className="leaderboard-item">
                  <div className={`leaderboard-rank rank-${idx + 1}`}>{idx + 1}</div>
                  <div className="leaderboard-info">
                    <div className="leaderboard-name">{investor.investor_name}</div>
                    <div className="leaderboard-meta">PAN: {investor.pan}</div>
                  </div>
                  <div className="leaderboard-amount">
                    {formatCurrency(Number(investor.total_amount_invested))}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', padding: '2rem' }}>No top investor records found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Macro Funds Summary Table */}
      <div className="glass-panel">
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} style={{ color: 'var(--accent)' }} />
          <span>Macro Mutual Funds Summary</span>
        </h3>
        
        {fundsSummary.length > 0 ? (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Scheme Name</th>
                  <th>Total Amount Invested</th>
                  <th>Total Units Purchased</th>
                  <th>Avg NAV Price</th>
                </tr>
              </thead>
              <tbody>
                {fundsSummary.map((fund, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{fund.scheme_name}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                      {formatCurrency(Number(fund.total_amount_invested_all_investors))}
                    </td>
                    <td>{Number(fund.total_nav_units_purchased).toLocaleString()}</td>
                    <td>{formatCurrency(Number(fund.average_nav_price))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: 'center', padding: '2rem' }}>No mutual fund activities within selected date ranges.</p>
        )}
      </div>
    </div>
  );
}
