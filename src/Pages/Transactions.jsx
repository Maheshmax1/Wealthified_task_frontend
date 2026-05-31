import React, { useState, useEffect, useCallback } from 'react';
import { useDate } from '../DateContext';
import { api } from '../api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function Transactions() {
  const { startDate, endDate } = useDate();
  const [transactions, setTransactions] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [funds, setFunds] = useState([]);
  
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const limit = 20;

  // Modals & Toast
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Form State
  const [form, setForm] = useState({
    trxn_no: '',
    pan: '',
    prodcode: '',
    trxn_type: 'Purchase',
    trad_date: '',
    pur_price: '',
    units: '',
    amount: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Dropdown searchable states
  const [investorSearch, setInvestorSearch] = useState('');
  const [isInvestorDropdownOpen, setIsInvestorDropdownOpen] = useState(false);
  const [fundSearch, setFundSearch] = useState('');
  const [isFundDropdownOpen, setIsFundDropdownOpen] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const skip = page * limit;
      const data = await api.getTransactions(skip, limit, startDate, endDate);
      setTransactions(data || []);
    } catch (err) {
      setError(err.message || 'Error loading transaction ledger.');
      showToast(err.message || 'Error loading transaction ledger.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate]);

  const fetchDependencies = useCallback(async () => {
    try {
      const [investorList, fundList] = await Promise.all([
        api.getInvestors(0, 1000),
        api.getMutualFunds(0, 1000)
      ]);
      setInvestors(investorList || []);
      setFunds(fundList || []);
    } catch (err) {
      console.error('Failed to load dependency items', err);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  // Recalculate transaction amount whenever price or units change
  useEffect(() => {
    const price = Number(form.pur_price);
    const units = Number(form.units);
    if (!isNaN(price) && !isNaN(units) && price > 0 && units > 0) {
      setForm(prev => ({ ...prev, amount: (price * units).toFixed(2) }));
    }
  }, [form.pur_price, form.units]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const validateForm = () => {
    const errors = {};
    if (!isEditMode && !form.trxn_no) {
      errors.trxn_no = 'Transaction number is required';
    } else if (!isEditMode && (isNaN(Number(form.trxn_no)) || Number(form.trxn_no) <= 0)) {
      errors.trxn_no = 'Must be a positive integer';
    }
    if (!form.pan) {
      errors.pan = 'Investor registration is required';
    }
    if (!form.prodcode) {
      errors.prodcode = 'Mutual fund scheme selection is required';
    }
    if (!form.trad_date) {
      errors.trad_date = 'Trade date is required';
    }
    if (!form.pur_price || Number(form.pur_price) <= 0) {
      errors.pur_price = 'Purchase price must be positive';
    }
    if (!form.units || Number(form.units) <= 0) {
      errors.units = 'Units must be positive';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    
    // Set random or sequential transaction number as default suggestion
    const randomTrxn = Math.floor(100000 + Math.random() * 900000);
    
    setForm({
      trxn_no: randomTrxn.toString(),
      pan: '',
      prodcode: '',
      trxn_type: 'Purchase',
      trad_date: new Date().toISOString().split('T')[0],
      pur_price: '',
      units: '',
      amount: ''
    });
    setInvestorSearch('');
    setFundSearch('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (txn) => {
    setIsEditMode(true);
    
    const matchedInv = investors.find(i => i.pan === txn.pan);
    const matchedFund = funds.find(f => f.prodcode === txn.prodcode);
    
    setForm({
      trxn_no: txn.trxn_no,
      pan: txn.pan,
      prodcode: txn.prodcode,
      trxn_type: txn.trxn_type,
      trad_date: txn.trad_date.split('T')[0],
      pur_price: txn.pur_price,
      units: txn.units,
      amount: txn.amount
    });
    
    setInvestorSearch(matchedInv ? matchedInv.inv_name : txn.pan);
    setFundSearch(matchedFund ? matchedFund.scheme_name : txn.prodcode);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        ...form,
        trxn_no: Number(form.trxn_no),
        pur_price: Number(form.pur_price),
        units: Number(form.units),
        amount: Number(form.amount),
        trad_date: new Date(form.trad_date).toISOString()
      };

      if (isEditMode) {
        await api.updateTransaction(form.trxn_no, {
          trxn_type: form.trxn_type,
          trad_date: payload.trad_date,
          pur_price: payload.pur_price,
          units: payload.units,
          amount: payload.amount
        });
        showToast('Transaction details adjusted.');
      } else {
        await api.createTransaction(payload);
        showToast('New Transaction recorded successfully.');
      }
      setIsModalOpen(false);
      fetchTransactions();
    } catch (err) {
      showToast(err.message || 'Transaction validation failed.', 'error');
    }
  };

  const handleDelete = async (trxnNo) => {
    if (!window.confirm(`Delete transaction #${trxnNo} permanently?`)) return;
    try {
      await api.deleteTransaction(trxnNo);
      showToast('Transaction ledger deleted.');
      fetchTransactions();
    } catch (err) {
      showToast(err.message || 'Deletion failed.', 'error');
    }
  };

  // Find names helpers
  const getInvestorName = (pan) => {
    const inv = investors.find(i => i.pan === pan);
    return inv ? inv.inv_name : pan;
  };

  const getFundName = (prodcode) => {
    const fund = funds.find(f => f.prodcode === prodcode);
    return fund ? fund.scheme_name : prodcode;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  // Search local filtering
  const filteredTransactions = transactions.filter(txn => {
    const invName = getInvestorName(txn.pan).toLowerCase();
    const fName = getFundName(txn.prodcode).toLowerCase();
    const pan = txn.pan.toLowerCase();
    const prod = txn.prodcode.toLowerCase();
    const query = search.toLowerCase();
    return invName.includes(query) || fName.includes(query) || pan.includes(query) || prod.includes(query) || txn.trxn_no.toString().includes(query);
  });

  // Searchable select options
  const filteredInvestorOptions = investors.filter(i => 
    i.inv_name.toLowerCase().includes(investorSearch.toLowerCase()) ||
    i.pan.toLowerCase().includes(investorSearch.toLowerCase())
  );

  const filteredFundOptions = funds.filter(f => 
    f.scheme_name.toLowerCase().includes(fundSearch.toLowerCase()) ||
    f.prodcode.toLowerCase().includes(fundSearch.toLowerCase())
  );

  return (
    <div className="transactions-view animate-fade-in">
      {/* Toast Alert */}
      {toast.message && (
        <div className="toast-container">
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast({ message: '', type: 'success' })} 
          />
        </div>
      )}

      {/* Header operations */}
      <div className="actions-header glass-panel">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by Transaction ID, PAN, Client Name, or Scheme Code..." 
            className="form-control"
            value={search}
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} />
          <span>Record Transaction</span>
        </button>
      </div>

      {/* Table Data */}
      <div className="glass-panel">
        {error ? (
          <div className="animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
            <AlertTriangle size={48} style={{ color: !startDate || !endDate ? 'var(--warning)' : 'var(--danger)', marginBottom: '1rem', display: 'inline-block' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>{!startDate || !endDate ? 'Date Range Required' : 'Connection Failed'}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
            {(!startDate || !endDate) ? null : (
              <button className="btn btn-primary" onClick={fetchTransactions}>
                Retry Connection
              </button>
            )}
          </div>
        ) : loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Loading database entries...</p>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="table-container">
            <table className="custom-table" style={{ fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th>Trxn ID</th>
                  <th>Trade Date</th>
                  <th>Investor (PAN)</th>
                  <th>Mutual Fund Scheme</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Units</th>
                  <th>Net Value</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(txn => (
                  <tr key={txn.trxn_no}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{txn.trxn_no}</td>
                    <td>{new Date(txn.trad_date).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{getInvestorName(txn.pan)}</span>
                        <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{txn.pan}</code>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '240px' }}>
                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={getFundName(txn.prodcode)}>
                          {getFundName(txn.prodcode)}
                        </span>
                        <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{txn.prodcode}</code>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${txn.trxn_type === 'Purchase' ? 'badge-success' : 'badge-danger'}`}>
                        {txn.trxn_type}
                      </span>
                    </td>
                    <td>{formatCurrency(Number(txn.pur_price))}</td>
                    <td>{Number(txn.units).toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                    <td style={{ fontWeight: 700, color: txn.trxn_type === 'Purchase' ? 'var(--success)' : 'var(--danger)' }}>
                      {formatCurrency(Number(txn.amount))}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem' }}
                          title="Adjust Ledger"
                          onClick={() => handleOpenEditModal(txn)}
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '0.4rem' }}
                          title="Delete Ledger"
                          onClick={() => handleDelete(txn.trxn_no)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination block */}
            <div className="pagination-controls">
              <span>Showing Page {page + 1} of Ledger List</span>
              <div className="pagination-buttons">
                <button 
                  className="btn btn-secondary btn-page" 
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
                <button 
                  className="btn btn-secondary btn-page" 
                  disabled={transactions.length < limit}
                  onClick={() => setPage(p => p + 1)}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p className="text-secondary">No recorded transactions. Click "Record Transaction" to post a capital action.</p>
          </div>
        )}
      </div>

      {/* Record Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? `Edit Transaction Ledger #${form.trxn_no}` : 'Record Capital Transaction'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {isEditMode ? 'Save Adjustments' : 'Commit Transaction'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {/* Transaction Number */}
          <div className="form-group">
            <label className="form-label" htmlFor="form-trxn">Transaction Reference Number</label>
            <input 
              type="text" 
              id="form-trxn"
              className="form-control"
              placeholder="e.g. 50403"
              value={form.trxn_no}
              onChange={(e) => setForm({ ...form, trxn_no: e.target.value })}
              disabled={isEditMode} 
            />
            {formErrors.trxn_no && <span className="form-error">{formErrors.trxn_no}</span>}
          </div>

          {/* Searchable Select Investor */}
          <div className="form-group">
            <label className="form-label">Select Client Investor</label>
            <div className="searchable-select-container">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search registered investor name/PAN..."
                value={investorSearch}
                onChange={(e) => {
                  setInvestorSearch(e.target.value);
                  setIsInvestorDropdownOpen(true);
                }}
                onFocus={() => setIsInvestorDropdownOpen(true)}
                disabled={isEditMode} 
              />
              {isInvestorDropdownOpen && !isEditMode && (
                <div className="searchable-select-dropdown">
                  {filteredInvestorOptions.length > 0 ? (
                    filteredInvestorOptions.map(inv => (
                      <div 
                        key={inv.pan} 
                        className="searchable-select-option"
                        onClick={() => {
                          setForm({ ...form, pan: inv.pan });
                          setInvestorSearch(`${inv.inv_name} (${inv.pan})`);
                          setIsInvestorDropdownOpen(false);
                        }}
                      >
                        {inv.inv_name} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({inv.pan})</span>
                      </div>
                    ))
                  ) : (
                    <div className="searchable-select-no-results">No active clients match.</div>
                  )}
                </div>
              )}
            </div>
            {formErrors.pan && <span className="form-error">{formErrors.pan}</span>}
          </div>

          {/* Searchable Select Mutual Fund */}
          <div className="form-group">
            <label className="form-label">Select Mutual Fund Scheme</label>
            <div className="searchable-select-container">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search mutual fund scheme name..."
                value={fundSearch}
                onChange={(e) => {
                  setFundSearch(e.target.value);
                  setIsFundDropdownOpen(true);
                }}
                onFocus={() => setIsFundDropdownOpen(true)}
                disabled={isEditMode} 
              />
              {isFundDropdownOpen && !isEditMode && (
                <div className="searchable-select-dropdown">
                  {filteredFundOptions.length > 0 ? (
                    filteredFundOptions.map(fund => (
                      <div 
                        key={fund.prodcode} 
                        className="searchable-select-option"
                        onClick={() => {
                          setForm({ ...form, prodcode: fund.prodcode });
                          setFundSearch(`${fund.scheme_name} (${fund.prodcode})`);
                          setIsFundDropdownOpen(false);
                        }}
                      >
                        {fund.scheme_name} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({fund.prodcode})</span>
                      </div>
                    ))
                  ) : (
                    <div className="searchable-select-no-results">No active funds match.</div>
                  )}
                </div>
              )}
            </div>
            {formErrors.prodcode && <span className="form-error">{formErrors.prodcode}</span>}
          </div>

          {/* Row layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Transaction Type */}
            <div className="form-group">
              <label className="form-label" htmlFor="form-type">Ledger Action</label>
              <select
                id="form-type"
                className="form-control"
                value={form.trxn_type}
                onChange={(e) => setForm({ ...form, trxn_type: e.target.value })}
              >
                <option value="Purchase">Purchase (Capital In)</option>
                <option value="Redemption">Redemption (Capital Out)</option>
              </select>
            </div>

            {/* Trade Date */}
            <div className="form-group">
              <label className="form-label" htmlFor="form-date">Trade date</label>
              <input 
                type="date" 
                id="form-date"
                className="form-control"
                value={form.trad_date}
                onChange={(e) => setForm({ ...form, trad_date: e.target.value })} 
              />
              {formErrors.trad_date && <span className="form-error">{formErrors.trad_date}</span>}
            </div>
          </div>

          {/* Numeric stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* NAV price */}
            <div className="form-group">
              <label className="form-label" htmlFor="form-price">NAV Purchase Price (₹)</label>
              <input 
                type="number" 
                id="form-price"
                step="any"
                className="form-control"
                placeholder="0.00"
                value={form.pur_price}
                onChange={(e) => setForm({ ...form, pur_price: e.target.value })} 
              />
              {formErrors.pur_price && <span className="form-error">{formErrors.pur_price}</span>}
            </div>

            {/* Units */}
            <div className="form-group">
              <label className="form-label" htmlFor="form-units">Units Count</label>
              <input 
                type="number" 
                id="form-units"
                step="any"
                className="form-control"
                placeholder="0.00"
                value={form.units}
                onChange={(e) => setForm({ ...form, units: e.target.value })} 
              />
              {formErrors.units && <span className="form-error">{formErrors.units}</span>}
            </div>
          </div>

          {/* Amount (Auto-Calculated) */}
          <div className="form-group" style={{ background: 'rgba(99, 102, 241, 0.04)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-glow)', marginTop: '0.5rem' }}>
            <label className="form-label" style={{ color: 'var(--accent)' }}>Calculated Capital Amount (INR)</label>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
              {form.amount ? formatCurrency(Number(form.amount)) : '₹0.00'}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automatically calculated based on: Price × Units</span>
          </div>
        </form>
      </Modal>
    </div>
  );
}
