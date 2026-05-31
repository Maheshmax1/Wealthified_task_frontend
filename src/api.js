const API_BASE = 'http://localhost:8000';

function buildQuery(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    
    if (response.status === 204) {
      return config.method === 'DELETE' ? true : null;
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || `Request failed with status ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`API Error: ${error.message}`);
    throw error;
  }
}

export const api = {
  // Dashboard Metrics
  getFundsSummary: (params = {}) => request(`/api/dashboard/funds/summary${buildQuery(params)}`),
  getTopInvestors: (params = {}) => request(`/api/dashboard/investors${buildQuery(params)}`),
  getInvestorPurchases: (params = {}) => request(`/api/dashboard/investor-purchases${buildQuery(params)}`),
  getFundPurchases: (params = {}) => request(`/api/dashboard/fund-purchases${buildQuery(params)}`),

  // Investors CRUD
  getInvestors: (skip = 0, limit = 100) => request(`/api/investors?skip=${skip}&limit=${limit}`),
  getInvestor: (pan) => request(`/api/investors/${pan}`),
  createInvestor: (data) => request('/api/investors', { method: 'POST', body: data }),
  updateInvestor: (pan, data) => request(`/api/investors/${pan}`, { method: 'PUT', body: data }),
  deleteInvestor: (pan) => request(`/api/investors/${pan}`, { method: 'DELETE' }),

  // Mutual Funds CRUD
  getMutualFunds: (skip = 0, limit = 100) => request(`/api/mutual-funds?skip=${skip}&limit=${limit}`),
  getMutualFund: (prodcode) => request(`/api/mutual-funds/${prodcode}`),
  createMutualFund: (data) => request('/api/mutual-funds', { method: 'POST', body: data }),
  updateMutualFund: (prodcode, data) => request(`/api/mutual-funds/${prodcode}`, { method: 'PUT', body: data }),
  deleteMutualFund: (prodcode) => request(`/api/mutual-funds/${prodcode}`, { method: 'DELETE' }),

  // Transactions CRUD
  getTransactions: (skip = 0, limit = 100, startDate = '', endDate = '') =>
    request(`/api/transactions${buildQuery({ skip, limit, start_date: startDate, end_date: endDate })}`),
  getTransaction: (trxnNo) => request(`/api/transactions/${trxnNo}`),
  getTransactionsByInvestor: (pan, skip = 0, limit = 100) => request(`/api/transactions/investor/${pan}?skip=${skip}&limit=${limit}`),
  getTransactionsByFund: (prodcode, skip = 0, limit = 100) => request(`/api/transactions/fund/${prodcode}?skip=${skip}&limit=${limit}`),
  createTransaction: (data) => request('/api/transactions', { method: 'POST', body: data }),
  updateTransaction: (trxnNo, data) => request(`/api/transactions/${trxnNo}`, { method: 'PUT', body: data }),
  deleteTransaction: (trxnNo) => request(`/api/transactions/${trxnNo}`, { method: 'DELETE' }),
};
