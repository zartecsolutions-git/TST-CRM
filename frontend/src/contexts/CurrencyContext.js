import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchCompanySettings, getCurrencySymbol } from '../utils/currency';
import api from '../utils/api';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [companySettings, setCompanySettings] = useState({
    currency: 'USD',
    tax_percentage: 0,
    name: 'Company'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    try {
      let settings;
      try {
        // Try to get current user's company settings (authenticated endpoint)
        const response = await api.get('/companies/current/settings');
        settings = response.data;
      } catch (error) {
        console.log('No user company found, fetching default company via public endpoint...');
        // If that fails, use the public branding endpoint (no auth required)
        try {
          const response = await api.get('/companies/default/branding');
          settings = response.data;
          console.log('Loaded default company via public endpoint:', settings.name);
        } catch (publicError) {
          console.log('Could not fetch default company branding, using defaults');
          settings = {
            currency: 'USD',
            tax_percentage: 0,
            name: 'CRM System'
          };
        }
      }
      setCompanySettings(settings);
    } catch (error) {
      console.error('Error loading company settings:', error);
      // Fallback to defaults
      setCompanySettings({
        currency: 'USD',
        tax_percentage: 0,
        name: 'CRM System'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount, options = {}) => {
    const symbol = getCurrencySymbol(companySettings.currency);
    const showSymbol = options.showSymbol !== false;
    
    if (!amount && amount !== 0) {
      return showSymbol ? `${symbol}0` : '0';
    }
    
    const formattedAmount = parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: options.decimals !== undefined ? options.decimals : 2,
      maximumFractionDigits: options.decimals !== undefined ? options.decimals : 2
    });
    
    return showSymbol ? `${symbol}${formattedAmount}` : formattedAmount;
  };

  const calculateTax = (amount) => {
    const taxPercentage = companySettings.tax_percentage || 0;
    return (parseFloat(amount || 0) * taxPercentage) / 100;
  };

  const calculateTotal = (amount) => {
    const baseAmount = parseFloat(amount || 0);
    const taxAmount = calculateTax(baseAmount);
    return baseAmount + taxAmount;
  };

  const getTaxBreakdown = (amount) => {
    const baseAmount = parseFloat(amount || 0);
    const taxAmount = calculateTax(baseAmount);
    const total = baseAmount + taxAmount;
    
    return {
      baseAmount,
      taxAmount,
      taxPercentage: companySettings.tax_percentage || 0,
      total,
      currency: companySettings.currency,
      currencySymbol: getCurrencySymbol(companySettings.currency)
    };
  };

  const value = {
    companySettings,
    loading,
    formatAmount,
    calculateTax,
    calculateTotal,
    getTaxBreakdown,
    currencySymbol: getCurrencySymbol(companySettings.currency),
    refreshSettings: loadCompanySettings
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
