import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useDate } from '../DateContext';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Info,
  TrendingUp,
  Layers,
  Users,
  AlertTriangle
} from 'lucide-react';

export default function Funds() {
  const { startDate, endDate } = useDate();
  const [funds, setFunds] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState(null);
  const [fundHolders, setFundHolders] = useState([]);
  
  // Toast notifications
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [detailsError, setDetailsError] = useState(null);
  
  // Form State
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState({ prodcode: '', scheme_name: '', scheme_type: '' });
  const [formErrors, setFormErrors] = useState({});

  const fetchFunds = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMutualFunds(0, 500);
      setFunds(data || []);
    } catch (err) {
      showToast(err.message || 'Error loading mutual funds database.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.prodcode.trim()) {
      errors.prodcode = 'Product Code is required';
    }
    if (!form.scheme_name.trim()) {
      errors.scheme_name = 'Scheme Name is required';
    }
    if (!form.scheme_type.trim()) {
      errors.scheme_type = 'Scheme Type is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setForm({ prodcode: '', scheme_name: '', scheme_type: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (fund) => {
    setIsEditMode(true);
    setForm({
      prodcode: fund.prodcode,
      scheme_name: fund.scheme_name,
      scheme_type: fund.scheme_type
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (isEditMode) {
        // Update details (FastAPI updates scheme_name, scheme_type)
        await api.updateMutualFund(form.prodcode, {
          scheme_name: form.scheme_name,
          scheme_type: form.scheme_type
        });
        showToast('Mutual fund details updated successfully!');
      } else {
        // Create new
        await api.createMutualFund(form);
        showToast('New Mutual Fund added successfully!');
      }
      setIsModalOpen(false);
      fetchFunds();
    } catch (err) {
      showToast(err.message || 'Error saving mutual fund.', 'error');
    }
  };

  const handleDelete = async (prodcode) => {
    if (!window.confirm('Are you absolutely sure you want to delete this mutual fund? All transactions references will cascade.')) return;
    try {
      await api.deleteMutualFund(prodcode);
      showToast('Mutual fund deleted.');
      fetchFunds();
    } catch (err) {
      showToast(err.message || 'Error deleting mutual fund.', 'error');
    }
  };

  // Detailed Holders View — respects global date filter
  const handleOpenDetails = async (fund) => {
    setSelectedFund(fund);
    setIsDetailOpen(true);
    setFundHolders([]);
    setDetailsError(null);
    try {
      const params = { start_date: startDate, end_date: endDate };
      const allFundPurchases = await api.getFundPurchases(params);
      const match = allFundPurchases.find(p => p.prodcode === fund.prodcode);
      setFundHolders(match ? match.investors : []);
    } catch (err) {
      showToast('Could not fetch fund roster.', 'error');
    }
  };

  // Filters
  const filteredFunds = funds.filter(fund => 
    fund.scheme_name.toLowerCase().includes(search.toLowerCase()) ||
    fund.prodcode.toLowerCase().includes(search.toLowerCase()) ||
    fund.scheme_type.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Aggregate stats for details drawer
  const totalFundAUM = fundHolders.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalFundUnits = fundHolders.reduce((sum, item) => sum + Number(item.units), 0);
  const totalHoldersCount = fundHolders.length;

  return (
    <div className="funds-view animate-fade-in">
      {/* Toast notifications */}
      {toast.message && (
        <div className="toast-container">
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast({ message: '', type: 'success' })} 
          />
        </div>
      )}

      {/* Header controls */}
      <div className="actions-header glass-panel">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by Scheme Name, Product Code, or Category..." 
            className="form-control"
            value={search}
            onChange={handleSearch} 
          />
        </div>
        
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} />
          <span>Add Mutual Fund</span>
        </button>
      </div>

      {/* Data Table */}
      <div className="glass-panel">
        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Loading database entries...</p>
          </div>
        ) : filteredFunds.length > 0 ? (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Scheme Name</th>
                  <th>Product Code</th>
                  <th>Scheme Type</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFunds.map(fund => (
                  <tr key={fund.prodcode}>
                    <td style={{ fontWeight: 600 }}>{fund.scheme_name}</td>
                    <td>
                      <code style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                        {fund.prodcode}
                      </code>
                    </td>
                    <td>
                      <span className="badge badge-warning" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        {fund.scheme_type}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem' }}
                          title="View Investors Roster"
                          onClick={() => handleOpenDetails(fund)}
                        >
                          <Info size={16} />
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem' }}
                          title="Edit Scheme Details"
                          onClick={() => handleOpenEditModal(fund)}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '0.4rem' }}
                          title="Delete Scheme"
                          onClick={() => handleDelete(fund.prodcode)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p className="text-secondary">No mutual funds found. Click "Add Mutual Fund" to register a new scheme.</p>
          </div>
        )}
      </div>

      {/* CRUD Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Mutual Fund Details' : 'Register New Mutual Fund'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {isEditMode ? 'Save Changes' : 'Register Fund'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="form-prod">Product Code (Unique ID)</label>
            <input 
              type="text" 
              id="form-prod"
              className="form-control"
              placeholder="e.g. INF200K01018"
              value={form.prodcode}
              onChange={(e) => setForm({ ...form, prodcode: e.target.value.toUpperCase() })}
              disabled={isEditMode} 
            />
            {formErrors.prodcode && <span className="form-error">{formErrors.prodcode}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="form-scheme">Scheme Name</label>
            <input 
              type="text" 
              id="form-scheme"
              className="form-control"
              placeholder="e.g. Wellfield Growth Equity Fund"
              value={form.scheme_name}
              onChange={(e) => setForm({ ...form, scheme_name: e.target.value })} 
            />
            {formErrors.scheme_name && <span className="form-error">{formErrors.scheme_name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="form-type">Scheme Type / Category</label>
            <select
              id="form-type"
              className="form-control"
              value={form.scheme_type}
              onChange={(e) => setForm({ ...form, scheme_type: e.target.value })}
            >
              <option value="">Select Category</option>
              <option value="Equity">Equity (High Growth)</option>
              <option value="Debt">Debt (Stable Income)</option>
              <option value="Hybrid">Hybrid (Balanced Allocation)</option>
              <option value="Index">Index Fund (Passive Tracker)</option>
              <option value="Liquid">Liquid Fund (High Liquidity)</option>
            </select>
            {formErrors.scheme_type && <span className="form-error">{formErrors.scheme_type}</span>}
          </div>
        </form>
      </Modal>

      {/* Fund Holders Detail Drawer Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedFund ? `${selectedFund.scheme_name} Capital Roster` : 'Roster Details'}
        footer={<button className="btn btn-primary" onClick={() => setIsDetailOpen(false)}>Close Roster</button>}
      >
        {selectedFund && (
          <div className="drawer-container">
            {detailsError ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <AlertTriangle size={36} style={{ color: 'var(--warning)', marginBottom: '0.5rem', display: 'inline-block' }} />
                <p style={{ color: 'var(--text-secondary)' }}>{detailsError}</p>
              </div>
            ) : (
              <>
                {/* Stat Row */}
                <div className="drawer-header-summary">
              <div className="drawer-stat">
                <span className="drawer-stat-label">Total Assets Invested</span>
                <span className="drawer-stat-value">{formatCurrency(totalFundAUM)}</span>
              </div>
              <div className="drawer-stat" style={{ textAlign: 'right' }}>
                <span className="drawer-stat-label">Active Investors</span>
                <span className="drawer-stat-value" style={{ color: 'var(--accent)' }}>{totalHoldersCount} Holders</span>
              </div>
            </div>
            
            <div className="drawer-header-summary" style={{ marginTop: '-0.75rem', background: 'rgba(255,255,255,0.01)' }}>
              <div className="drawer-stat">
                <span className="drawer-stat-label">Total NAV Units Distributed</span>
                <span className="drawer-stat-value" style={{ color: '#fbbf24' }}>{totalFundUnits.toLocaleString()} Units</span>
              </div>
            </div>

            {/* Investor list */}
            <div>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9375rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Client Shareholdings
              </h4>
              {fundHolders.length > 0 ? (
                <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="custom-table" style={{ fontSize: '0.8125rem' }}>
                    <thead>
                      <tr>
                        <th>Investor Name</th>
                        <th>PAN</th>
                        <th>Units Owned</th>
                        <th style={{ textAlign: 'right' }}>Holdings Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fundHolders.map((holder, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{holder.inv_name}</td>
                          <td><code>{holder.pan}</code></td>
                          <td>{Number(holder.units).toLocaleString()} Units</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>
                            {formatCurrency(Number(holder.amount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-secondary" style={{ fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                  No investors hold units in this mutual fund scheme yet.
                </p>
              )}
            </div>
          </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
