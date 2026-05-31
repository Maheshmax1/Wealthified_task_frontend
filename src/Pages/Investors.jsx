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
  DollarSign,
  TrendingUp,
  Briefcase,
  AlertTriangle
} from 'lucide-react';

export default function Investors() {
  const { startDate, endDate } = useDate();
  const [investors, setInvestors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [investorHoldings, setInvestorHoldings] = useState([]);
  const [investorTransactions, setInvestorTransactions] = useState([]);
  
  // Toast notifications
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [detailsError, setDetailsError] = useState(null);
  
  // Form State
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState({ pan: '', inv_name: '', tax_status: '' });
  const [formErrors, setFormErrors] = useState({});

  const fetchInvestors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getInvestors(0, 500);
      setInvestors(data || []);
    } catch (err) {
      showToast(err.message || 'Error loading investors database.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvestors();
  }, [fetchInvestors]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.pan.trim()) {
      errors.pan = 'PAN is required';
    } else if (form.pan.trim().length !== 10) {
      errors.pan = 'PAN must be exactly 10 characters';
    }
    if (!form.inv_name.trim()) {
      errors.inv_name = 'Investor Name is required';
    }
    if (!form.tax_status.trim()) {
      errors.tax_status = 'Tax Status is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setForm({ pan: '', inv_name: '', tax_status: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (investor) => {
    setIsEditMode(true);
    setForm({
      pan: investor.pan,
      inv_name: investor.inv_name,
      tax_status: investor.tax_status
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (isEditMode) {
        // Update details (FastAPI updates inv_name, tax_status)
        await api.updateInvestor(form.pan, {
          inv_name: form.inv_name,
          tax_status: form.tax_status
        });
        showToast('Investor details updated successfully!');
      } else {
        // Create new
        await api.createInvestor(form);
        showToast('New Investor added successfully!');
      }
      setIsModalOpen(false);
      fetchInvestors();
    } catch (err) {
      showToast(err.message || 'Error saving investor.', 'error');
    }
  };

  const handleDelete = async (pan) => {
    if (!window.confirm('Are you absolutely sure you want to delete this investor? This action is permanent and may cascade.')) return;
    try {
      await api.deleteInvestor(pan);
      showToast('Investor record deleted.');
      fetchInvestors();
    } catch (err) {
      showToast(err.message || 'Error deleting investor.', 'error');
    }
  };

  // Detailed Portfolio View
  const handleOpenDetails = async (investor) => {
    setSelectedInvestor(investor);
    setIsDetailOpen(true);
    setInvestorHoldings([]);
    setInvestorTransactions([]);
    setDetailsError(null);
    try {
      const params = { start_date: startDate, end_date: endDate };
      // 1. Fetch Transactions
      const txns = await api.getTransactionsByInvestor(investor.pan);
      setInvestorTransactions(txns || []);
      
      // 2. Fetch Investor Purchases summary (which groups mutual funds per investor)
      const allInvestorPurchases = await api.getInvestorPurchases(params);
      const clientData = allInvestorPurchases.find(p => p.pan === investor.pan);
      setInvestorHoldings(clientData ? clientData.funds : []);
    } catch (err) {
      showToast('Could not fetch portfolio metrics.', 'error');
    }
  };

  // Filters
  const filteredInvestors = investors.filter(inv => 
    inv.inv_name.toLowerCase().includes(search.toLowerCase()) ||
    inv.pan.toLowerCase().includes(search.toLowerCase()) ||
    inv.tax_status.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Aggregate stats for details drawer
  const totalInvested = investorHoldings.reduce((sum, item) => sum + Number(item.total_amount), 0);
  const uniqueFunds = investorHoldings.length;

  return (
    <div className="investors-view animate-fade-in">
      {/* Toast Notification Container */}
      {toast.message && (
        <div className="toast-container">
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast({ message: '', type: 'success' })} 
          />
        </div>
      )}

      {/* Header Panel */}
      <div className="actions-header glass-panel">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by Name, PAN, or Tax status..." 
            className="form-control"
            value={search}
            onChange={handleSearch} 
          />
        </div>
        
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} />
          <span>Add Investor</span>
        </button>
      </div>

      {/* Table Data */}
      <div className="glass-panel">
        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Loading database entries...</p>
          </div>
        ) : filteredInvestors.length > 0 ? (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Investor Name</th>
                  <th>PAN Number</th>
                  <th>Tax Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvestors.map(investor => (
                  <tr key={investor.pan}>
                    <td style={{ fontWeight: 600 }}>{investor.inv_name}</td>
                    <td><code style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{investor.pan}</code></td>
                    <td>
                      <span className="badge badge-success">{investor.tax_status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem' }}
                          title="View Portfolio Summary"
                          onClick={() => handleOpenDetails(investor)}
                        >
                          <Info size={16} />
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem' }}
                          title="Edit Details"
                          onClick={() => handleOpenEditModal(investor)}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '0.4rem' }}
                          title="Delete Record"
                          onClick={() => handleDelete(investor.pan)}
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
            <p className="text-secondary">No investor records found. Click "Add Investor" to register a new account.</p>
          </div>
        )}
      </div>

      {/* CRUD Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Investor Details' : 'Register New Investor'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {isEditMode ? 'Save Changes' : 'Register Client'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="form-pan">PAN Number (Permanent Account Number)</label>
            <input 
              type="text" 
              id="form-pan"
              className="form-control"
              placeholder="e.g. ABCDE1234F"
              value={form.pan}
              onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
              disabled={isEditMode} 
            />
            {formErrors.pan && <span className="form-error">{formErrors.pan}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="form-name">Investor Full Name</label>
            <input 
              type="text" 
              id="form-name"
              className="form-control"
              placeholder="e.g. Mahesh M"
              value={form.inv_name}
              onChange={(e) => setForm({ ...form, inv_name: e.target.value })} 
            />
            {formErrors.inv_name && <span className="form-error">{formErrors.inv_name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="form-tax">Tax Status</label>
            <select
              id="form-tax"
              className="form-control"
              value={form.tax_status}
              onChange={(e) => setForm({ ...form, tax_status: e.target.value })}
            >
              <option value="">Select Status</option>
              <option value="Individual">Individual</option>
              <option value="Non-Resident Indian (NRI)">NRI (Non-Resident Indian)</option>
              <option value="Corporate">Corporate</option>
              <option value="Trust">Trust</option>
              <option value="HUF">HUF (Hindu Undivided Family)</option>
            </select>
            {formErrors.tax_status && <span className="form-error">{formErrors.tax_status}</span>}
          </div>
        </form>
      </Modal>

      {/* Portfolio Detail Drawer Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedInvestor ? `${selectedInvestor.inv_name}'s Portfolio` : 'Portfolio Summary'}
        footer={<button className="btn btn-primary" onClick={() => setIsDetailOpen(false)}>Close Portfolio</button>}
      >
        {selectedInvestor && (
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
                <span className="drawer-stat-value">{formatCurrency(totalInvested)}</span>
              </div>
              <div className="drawer-stat" style={{ textAlign: 'right' }}>
                <span className="drawer-stat-label">Allocated Schemes</span>
                <span className="drawer-stat-value" style={{ color: 'var(--accent)' }}>{uniqueFunds} Schemes</span>
              </div>
            </div>

            {/* Scheme holdings list */}
            <div>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9375rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Mutual Fund Allocation
              </h4>
              {investorHoldings.length > 0 ? (
                <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <table className="custom-table" style={{ fontSize: '0.8125rem' }}>
                    <thead>
                      <tr>
                        <th>Scheme</th>
                        <th>Units</th>
                        <th style={{ textAlign: 'right' }}>Capital Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investorHoldings.map((hold, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{hold.scheme_name}</td>
                          <td>{Number(hold.total_units).toLocaleString()} Units</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>
                            {formatCurrency(Number(hold.total_amount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>No active fund holdings for this client.</p>
              )}
            </div>

            {/* Recent transactions */}
            <div>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9375rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Transaction History
              </h4>
              {investorTransactions.length > 0 ? (
                <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <table className="custom-table" style={{ fontSize: '0.8125rem' }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>NAV</th>
                        <th>Units</th>
                        <th style={{ textAlign: 'right' }}>Net Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investorTransactions.map(txn => (
                        <tr key={txn.trxn_no}>
                          <td>{new Date(txn.trad_date).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge ${txn.trxn_type === 'Purchase' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.625rem', padding: '0.1rem 0.3rem' }}>
                              {txn.trxn_type}
                            </span>
                          </td>
                          <td>{formatCurrency(Number(txn.pur_price))}</td>
                          <td>{Number(txn.units).toLocaleString()}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: txn.trxn_type === 'Purchase' ? 'var(--success)' : 'var(--danger)' }}>
                            {formatCurrency(Number(txn.amount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>No transaction history found.</p>
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
