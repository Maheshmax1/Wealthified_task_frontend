import React, { useState, useEffect, useCallback } from 'react';
import { useDate } from '../DateContext';
import { api } from '../api';
import {
  Users,
  Layers,
  BarChart2,
  BookOpen,
  ChevronDown,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

export default function Summary() {
  const { startDate, endDate } = useDate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Requirement 1: Investor-wise Purchase Summary per Mutual Fund
  const [investorPurchases, setInvestorPurchases] = useState([]);
  // Requirement 2: Mutual Fund-wise Summary per Investor
  const [fundPurchases, setFundPurchases] = useState([]);
  // Requirement 3: Investor List with Purchase Details
  const [investorList, setInvestorList] = useState([]);
  // Requirement 4: Mutual Fund Summary
  const [fundSummary, setFundSummary] = useState([]);

  // Accordion expand state
  const [expandedInvestor, setExpandedInvestor] = useState(null);
  const [expandedFund, setExpandedFund] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { start_date: startDate, end_date: endDate };
      const [invPurchases, fundPurch, invList, fSummary] = await Promise.all([
        api.getInvestorPurchases(params),
        api.getFundPurchases(params),
        api.getTopInvestors(params),
        api.getFundsSummary(params),
      ]);
      setInvestorPurchases(invPurchases || []);
      setFundPurchases(fundPurch || []);
      setInvestorList(invList || []);
      setFundSummary(fSummary || []);
    } catch (err) {
      setError('Failed to load summary data. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);

  const formatUnits = (val) =>
    Number(val).toLocaleString('en-IN', { maximumFractionDigits: 4 });

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p className="text-secondary">Loading purchase summaries...</p>
      </div>
    );
  }

  if (error) {
    const isMissingDates = !startDate || !endDate;
    return (
      <div className="glass-panel animate-fade-in" style={{ borderColor: isMissingDates ? 'var(--warning)' : 'var(--danger)', padding: '2rem', textAlign: 'center' }}>
        <AlertTriangle size={48} style={{ color: isMissingDates ? 'var(--warning)' : 'var(--danger)', marginBottom: '1rem' }} />
        <h3 style={{ marginBottom: '0.5rem' }}>{isMissingDates ? 'Date Range Required' : 'Error'}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
        {!isMissingDates && (
          <button className="btn btn-primary" onClick={fetchAll}>Retry</button>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Section 1: Investor-wise Purchase Summary per Mutual Fund ── */}
      <div className="glass-panel">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Users size={18} style={{ color: 'var(--accent)' }} />
          Investor-wise Purchase Summary per Mutual Fund
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Total purchase amount &amp; NAV units bought by each investor, grouped by mutual fund. Click a row to expand.
        </p>
        {investorPurchases.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
            No purchase records found in the selected date range.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {investorPurchases.map((inv) => {
              const isOpen = expandedInvestor === inv.pan;
              const totalAmt = inv.funds.reduce((s, f) => s + Number(f.total_amount), 0);
              const totalUnits = inv.funds.reduce((s, f) => s + Number(f.total_units), 0);
              return (
                <div key={inv.pan} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  {/* Accordion header */}
                  <div
                    onClick={() => setExpandedInvestor(isOpen ? null : inv.pan)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.75rem 1rem', cursor: 'pointer',
                      background: isOpen ? 'rgba(99,102,241,0.08)' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span style={{ fontWeight: 600 }}>{inv.inv_name}</span>
                      <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                        {inv.pan}
                      </code>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {inv.funds.length} fund{inv.funds.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', textAlign: 'right' }}>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Total Invested</div>
                        <div style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(totalAmt)}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Total Units</div>
                        <div style={{ fontWeight: 700, color: '#fbbf24' }}>{formatUnits(totalUnits)}</div>
                      </div>
                    </div>
                  </div>
                  {/* Expanded table */}
                  {isOpen && (
                    <div className="table-container" style={{ margin: '0 1rem 1rem' }}>
                      <table className="custom-table" style={{ fontSize: '0.8125rem' }}>
                        <thead>
                          <tr>
                            <th>Mutual Fund Scheme</th>
                            <th>Product Code</th>
                            <th>Total Purchase Amount</th>
                            <th style={{ textAlign: 'right' }}>Total NAV Units</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inv.funds.map((fund) => (
                            <tr key={fund.prodcode}>
                              <td style={{ fontWeight: 600 }}>{fund.scheme_name}</td>
                              <td><code style={{ fontSize: '0.75rem' }}>{fund.prodcode}</code></td>
                              <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(Number(fund.total_amount))}</td>
                              <td style={{ textAlign: 'right', color: '#fbbf24' }}>{formatUnits(fund.total_units)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 2: Mutual Fund-wise Summary per Investor ── */}
      <div className="glass-panel">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <BarChart2 size={18} style={{ color: '#fbbf24' }} />
          Mutual Fund-wise Summary per Investor
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Amount &amp; NAV units purchased by each investor per mutual fund. Click a row to expand.
        </p>
        {fundPurchases.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
            No purchase records found in the selected date range.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {fundPurchases.map((fund) => {
              const isOpen = expandedFund === fund.prodcode;
              const totalAmt = fund.investors.reduce((s, i) => s + Number(i.amount), 0);
              const totalUnits = fund.investors.reduce((s, i) => s + Number(i.units), 0);
              return (
                <div key={fund.prodcode} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <div
                    onClick={() => setExpandedFund(isOpen ? null : fund.prodcode)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.75rem 1rem', cursor: 'pointer',
                      background: isOpen ? 'rgba(251,191,36,0.06)' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span style={{ fontWeight: 600 }}>{fund.scheme_name}</span>
                      <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                        {fund.prodcode}
                      </code>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {fund.investors.length} investor{fund.investors.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', textAlign: 'right' }}>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Total Amount</div>
                        <div style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(totalAmt)}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Total Units</div>
                        <div style={{ fontWeight: 700, color: '#fbbf24' }}>{formatUnits(totalUnits)}</div>
                      </div>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="table-container" style={{ margin: '0 1rem 1rem' }}>
                      <table className="custom-table" style={{ fontSize: '0.8125rem' }}>
                        <thead>
                          <tr>
                            <th>Investor Name</th>
                            <th>PAN</th>
                            <th>Amount Purchased</th>
                            <th style={{ textAlign: 'right' }}>NAV Units</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fund.investors.map((inv) => (
                            <tr key={inv.pan}>
                              <td style={{ fontWeight: 600 }}>{inv.inv_name}</td>
                              <td><code style={{ fontSize: '0.75rem' }}>{inv.pan}</code></td>
                              <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(Number(inv.amount))}</td>
                              <td style={{ textAlign: 'right', color: '#fbbf24' }}>{formatUnits(inv.units)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 3: Investor List with Purchase Details ── */}
      <div className="glass-panel">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <BookOpen size={18} style={{ color: 'var(--success)' }} />
          Investor List with Purchase Details
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Each investor's PAN and total amount invested within the selected date range.
        </p>
        {investorList.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
            No investor records found in the selected date range.
          </p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Investor Name</th>
                  <th>PAN Number</th>
                  <th style={{ textAlign: 'right' }}>Total Amount Invested</th>
                </tr>
              </thead>
              <tbody>
                {investorList.map((inv, idx) => (
                  <tr key={inv.pan}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{inv.investor_name}</td>
                    <td>
                      <code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                        {inv.pan}
                      </code>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                      {formatCurrency(Number(inv.total_amount_invested))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)' }}>
                  <td colSpan={3} style={{ fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Grand Total
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--accent)', fontSize: '1rem' }}>
                    {formatCurrency(investorList.reduce((s, i) => s + Number(i.total_amount_invested), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Section 4: Mutual Fund Summary ── */}
      <div className="glass-panel">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Layers size={18} style={{ color: 'var(--accent)' }} />
          Mutual Fund Summary
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Total amount invested across all investors, total NAV units purchased, and average NAV price — per mutual fund.
        </p>
        {fundSummary.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
            No fund activities found in the selected date range.
          </p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Scheme Name</th>
                  <th>Total Amount Invested (All Investors)</th>
                  <th>Total NAV Units Purchased</th>
                  <th style={{ textAlign: 'right' }}>Avg NAV Price</th>
                </tr>
              </thead>
              <tbody>
                {fundSummary.map((fund, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{fund.scheme_name}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                      {formatCurrency(Number(fund.total_amount_invested_all_investors))}
                    </td>
                    <td style={{ color: '#fbbf24' }}>
                      {formatUnits(fund.total_nav_units_purchased)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(Number(fund.average_nav_price))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)' }}>
                  <td style={{ fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Grand Total
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1rem' }}>
                    {formatCurrency(fundSummary.reduce((s, f) => s + Number(f.total_amount_invested_all_investors), 0))}
                  </td>
                  <td style={{ color: '#fbbf24', fontWeight: 700 }}>
                    {formatUnits(fundSummary.reduce((s, f) => s + Number(f.total_nav_units_purchased), 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
