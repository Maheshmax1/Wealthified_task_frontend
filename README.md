# Wellfield Mutual - Frontend

A modern, responsive financial dashboard application built with React and Vite for managing mutual fund investments, tracking investor portfolios, and monitoring transaction history.

## 🎯 Features

- **Dashboard** - Overview of key financial metrics and performance indicators
- **Investors Management** - Comprehensive investor database and portfolio management
- **Mutual Funds** - Browse and manage mutual fund offerings
- **Purchase Summary** - Investor-wise and fund-wise purchase summaries with detailed analytics
- **Transactions** - Track all investment transactions with filtering and search capabilities
- **Date Range Filtering** - Filter data by custom date ranges across all modules
- **Responsive Design** - Fully responsive UI that works on desktop and tablet devices
- **Real-time Data** - Connected to backend API for live data updates

## 🛠️ Tech Stack

- **Frontend Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API (DateContext)
- **HTTP Client**: Axios (via api.js)
- **Code Quality**: ESLint
- **Package Manager**: npm/yarn

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Modal.jsx       # Modal dialog component
│   │   ├── StatCard.jsx    # Statistics card component
│   │   └── Toast.jsx       # Toast notification component
│   ├── Pages/              # Page components
│   │   ├── Dashboard.jsx   # Dashboard page
│   │   ├── Investors.jsx   # Investors management page
│   │   ├── Funds.jsx       # Mutual funds page
│   │   ├── Summary.jsx     # Purchase summary page
│   │   └── Transactions.jsx # Transactions page
│   ├── MainLayout/         # Layout components
│   │   ├── MainLayout.jsx  # Main layout wrapper
│   │   └── Navigation.jsx  # Navigation bar
│   ├── api.js              # API integration layer
│   ├── DateContext.jsx     # Date range state management
│   ├── App.jsx             # Root application component
│   ├── App.css             # Application styles
│   ├── index.css           # Global styles
│   └── main.jsx            # Entry point
├── public/                 # Static assets
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── eslint.config.js        # ESLint configuration
├── package.json            # Project dependencies
└── index.html              # HTML template
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone or navigate to the frontend directory**
   ```bash
   cd wellfeild_task/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure API endpoint**
   - Update the API base URL in `src/api.js` if needed to point to your backend server

4. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open in browser**
   - Navigate to `http://localhost:5173` (or the URL shown in terminal)

## 📦 Available Scripts

```bash
# Start development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## 🔧 Configuration

### Tailwind CSS
Customize your design system in `tailwind.config.js`

### Vite
Modify build and dev settings in `vite.config.js`

### ESLint
Code quality rules are configured in `eslint.config.js`

## 🌐 API Integration

The application connects to a backend API through the `src/api.js` module. Update the base URL to match your backend environment:

```javascript
// src/api.js
const API_BASE_URL = 'http://your-backend-url/api';
```

## 📊 Key Components

- **DateContext**: Global date range state for filtering data across pages
- **StatCard**: Displays key metrics with formatting
- **Modal**: Reusable modal dialog for user interactions
- **Toast**: Non-intrusive notifications for user feedback

## 🎨 Styling

The application uses Tailwind CSS for styling with a dark theme. Customize colors and spacing in `tailwind.config.js`.

## 🚢 Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your hosting provider (Vercel, Netlify, GitHub Pages, etc.)

## 📝 Notes

- The application uses React Context API for state management
- All API calls are centralized in `api.js` for easier maintenance
- Components are modular and reusable
- Date filtering is globally managed through DateContext

## 👨‍💻 Development Tips

- Use React DevTools for debugging component state
- Check browser console for API errors and debug logs
- Tailwind CSS IntelliSense extension recommended in VS Code
- Hot Module Replacement (HMR) is enabled for fast development

## 📄 License

Your license information here
