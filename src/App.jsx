import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from './MainLayout/MainLayout';
import Dashboard from './Pages/Dashboard';
import Investors from './Pages/Investors';
import Funds from './Pages/Funds';
import Transactions from './Pages/Transactions';
import Summary from './Pages/Summary';
import { DateProvider } from './DateContext';
import './App.css';

export default function App() {
  const [theme, setTheme] = useState('dark');

  // Sync theme changes with CSS design tokens
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Define Routing
  const router = createBrowserRouter([
    {
      path: '/',
      element: <MainLayout theme={theme} toggleTheme={toggleTheme} />,
      children: [
        {
          index: true,
          element: <Dashboard />
        },
        {
          path: 'index.html',
          element: <Dashboard />
        },
        {
          path: 'investors',
          element: <Investors />
        },
        {
          path: 'funds',
          element: <Funds />
        },
        {
          path: 'transactions',
          element: <Transactions />
        },
        {
          path: 'summary',
          element: <Summary />
        }
      ]
    }
  ]);

  return (
    <DateProvider>
      <RouterProvider router={router} />
    </DateProvider>
  );
}
