import api from './api';

// Currency symbols mapping
const currencySymbols = {
  'AED': 'د.إ',
  'AUD': 'A$',
  'BDT': '৳',
  'BHD': 'BD',
  'BRL': 'R$',
  'CAD': 'C$',
  'CHF': 'CHF',
  'CNY': '¥',
  'EGP': 'E£',
  'EUR': '€',
  'GBP': '£',
  'HKD': 'HK$',
  'IDR': 'Rp',
  'ILS': '₪',
  'INR': '₹',
  'JPY': '¥',
  'KRW': '₩',
  'KWD': 'KD',
  'MXN': 'Mex$',
  'MYR': 'RM',
  'NGN': '₦',
  'NOK': 'kr',
  'NZD': 'NZ$',
  'OMR': 'OMR',
  'PHP': '₱',
  'PKR': '₨',
  'PLN': 'zł',
  'QAR': 'QR',
  'RUB': '₽',
  'SAR': 'SR',
  'SEK': 'kr',
  'SGD': 'S$',
  'THB': '฿',
  'TRY': '₺',
  'USD': '$',
  'VND': '₫',
  'ZAR': 'R',
};

// Cache for company settings
let companySettingsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch company settings from API
 */
export const fetchCompanySettings = async () => {
  try {
    // Check if cache is valid
    if (companySettingsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      return companySettingsCache;
    }

    // Fetch from API
    const response = await api.get('/companies/current/settings');
    companySettingsCache = response.data;
    cacheTimestamp = Date.now();
    return companySettingsCache;
  } catch (error) {
    console.error('Error fetching company settings:', error);
    // Return default settings if API fails
    return {
      currency: 'USD',
      tax_percentage: 0,
      name: 'Company'
    };
  }
};

/**
 * Get currency symbol for a given currency code
 */
export const getCurrencySymbol = (currencyCode) => {
  return currencySymbols[currencyCode] || currencyCode;
};

/**
 * Format amount with company currency
 */
export const formatCurrency = async (amount, options = {}) => {
  const settings = await fetchCompanySettings();
  const symbol = getCurrencySymbol(settings.currency);
  const showSymbol = options.showSymbol !== false;
  
  if (!amount && amount !== 0) {
    return showSymbol ? `${symbol}0` : '0';
  }
  
  const formattedAmount = parseFloat(amount).toLocaleString(undefined, {
    minimumFractionDigits: options.decimals || 2,
    maximumFractionDigits: options.decimals || 2
  });
  
  return showSymbol ? `${symbol}${formattedAmount}` : formattedAmount;
};

/**
 * Calculate tax amount based on company tax percentage
 */
export const calculateTax = async (amount) => {
  const settings = await fetchCompanySettings();
  const taxPercentage = settings.tax_percentage || 0;
  return (parseFloat(amount) * taxPercentage) / 100;
};

/**
 * Calculate total with tax
 */
export const calculateTotal = async (amount) => {
  const taxAmount = await calculateTax(amount);
  return parseFloat(amount) + taxAmount;
};

/**
 * Get formatted tax breakdown
 */
export const getTaxBreakdown = async (amount) => {
  const settings = await fetchCompanySettings();
  const baseAmount = parseFloat(amount) || 0;
  const taxAmount = await calculateTax(baseAmount);
  const total = baseAmount + taxAmount;
  
  return {
    baseAmount,
    taxAmount,
    taxPercentage: settings.tax_percentage || 0,
    total,
    currency: settings.currency
  };
};

/**
 * Clear cache (useful when company settings are updated)
 */
export const clearCompanyCache = () => {
  companySettingsCache = null;
  cacheTimestamp = null;
};

/**
 * Sync format - for use in components (returns Promise)
 * Usage: formatCurrencySync(1000).then(formatted => console.log(formatted))
 */
export const formatCurrencySync = formatCurrency;

/**
 * Get company settings synchronously from cache
 */
export const getCompanySettingsFromCache = () => {
  return companySettingsCache || { currency: 'USD', tax_percentage: 0 };
};
