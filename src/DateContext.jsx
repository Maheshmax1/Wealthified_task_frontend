import React, { createContext, useContext, useState } from 'react';

const DateContext = createContext();

export function DateProvider({ children }) {
  const [startDate, setStartDate] = useState('2025-05-27');
  const [endDate, setEndDate] = useState('2026-05-31');

  const clearDates = () => {
    setStartDate('2025-05-27');
    setEndDate('2026-05-31');
  };

  return (
    <DateContext.Provider value={{ startDate, setStartDate, endDate, setEndDate, clearDates }}>
      {children}
    </DateContext.Provider>
  );
}

export function useDate() {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
}
