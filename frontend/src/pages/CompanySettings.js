import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const CompanySettings = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    currency: 'USD',
    tax_id: '',
    tax_percentage: 0,
    address: '',
    phone: '',
    email: '',
    logo_url: '',
    timezone: 'UTC'
  });

  const currencies = [
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
    { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
    { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD' },
    { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
    { code: 'OMR', name: 'Omani Rial', symbol: 'OMR' },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
    { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR' },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'SR' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  ];

  const countries = [
    { name: 'Afghanistan', currency: 'AFN' },
    { name: 'Argentina', currency: 'ARS' },
    { name: 'Australia', currency: 'AUD' },
    { name: 'Austria', currency: 'EUR' },
    { name: 'Bahrain', currency: 'BHD' },
    { name: 'Bangladesh', currency: 'BDT' },
    { name: 'Belgium', currency: 'EUR' },
    { name: 'Brazil', currency: 'BRL' },
    { name: 'Canada', currency: 'CAD' },
    { name: 'China', currency: 'CNY' },
    { name: 'Denmark', currency: 'DKK' },
    { name: 'Egypt', currency: 'EGP' },
    { name: 'Finland', currency: 'EUR' },
    { name: 'France', currency: 'EUR' },
    { name: 'Germany', currency: 'EUR' },
    { name: 'Greece', currency: 'EUR' },
    { name: 'Hong Kong', currency: 'HKD' },
    { name: 'India', currency: 'INR' },
    { name: 'Indonesia', currency: 'IDR' },
    { name: 'Ireland', currency: 'EUR' },
    { name: 'Israel', currency: 'ILS' },
    { name: 'Italy', currency: 'EUR' },
    { name: 'Japan', currency: 'JPY' },
    { name: 'Kuwait', currency: 'KWD' },
    { name: 'Malaysia', currency: 'MYR' },
    { name: 'Mexico', currency: 'MXN' },
    { name: 'Netherlands', currency: 'EUR' },
    { name: 'New Zealand', currency: 'NZD' },
    { name: 'Nigeria', currency: 'NGN' },
    { name: 'Norway', currency: 'NOK' },
    { name: 'Oman', currency: 'OMR' },
    { name: 'Pakistan', currency: 'PKR' },
    { name: 'Philippines', currency: 'PHP' },
    { name: 'Poland', currency: 'PLN' },
    { name: 'Portugal', currency: 'EUR' },
    { name: 'Qatar', currency: 'QAR' },
    { name: 'Russia', currency: 'RUB' },
    { name: 'Saudi Arabia', currency: 'SAR' },
    { name: 'Singapore', currency: 'SGD' },
    { name: 'South Africa', currency: 'ZAR' },
    { name: 'South Korea', currency: 'KRW' },
    { name: 'Spain', currency: 'EUR' },
    { name: 'Sweden', currency: 'SEK' },
    { name: 'Switzerland', currency: 'CHF' },
    { name: 'Thailand', currency: 'THB' },
    { name: 'Turkey', currency: 'TRY' },
    { name: 'United Arab Emirates', currency: 'AED' },
    { name: 'United Kingdom', currency: 'GBP' },
    { name: 'United States', currency: 'USD' },
    { name: 'Vietnam', currency: 'VND' },
  ];

  const timezones = [
    'UTC',
    'Africa/Cairo',
    'Africa/Johannesburg',
    'Africa/Lagos',
    'America/Anchorage',
    'America/Argentina/Buenos_Aires',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Mexico_City',
    'America/New_York',
    'America/Sao_Paulo',
    'America/Toronto',
    'America/Vancouver',
    'Asia/Bahrain',
    'Asia/Bangkok',
    'Asia/Colombo',
    'Asia/Dhaka',
    'Asia/Dubai',
    'Asia/Hong_Kong',
    'Asia/Jakarta',
    'Asia/Jerusalem',
    'Asia/Karachi',
    'Asia/Kolkata',
    'Asia/Kuala_Lumpur',
    'Asia/Kuwait',
    'Asia/Manila',
    'Asia/Muscat',
    'Asia/Qatar',
    'Asia/Riyadh',
    'Asia/Seoul',
    'Asia/Shanghai',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Melbourne',
    'Australia/Sydney',
    'Europe/Amsterdam',
    'Europe/Athens',
    'Europe/Berlin',
    'Europe/Brussels',
    'Europe/Copenhagen',
    'Europe/Dublin',
    'Europe/Helsinki',
    'Europe/Istanbul',
    'Europe/Lisbon',
    'Europe/London',
    'Europe/Madrid',
    'Europe/Moscow',
    'Europe/Oslo',
    'Europe/Paris',
    'Europe/Rome',
    'Europe/Stockholm',
    'Europe/Vienna',
    'Europe/Warsaw',
    'Europe/Zurich',
    'Pacific/Auckland',
    'Pacific/Fiji',
    'Pacific/Honolulu',
  ];

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchCompanies();
    } else {
      alert('Access denied. Admin only.');
      window.location.href = '/dashboard';
    }
  }, [user]);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data);
      if (response.data.length > 0) {
        setSelectedCompany(response.data[0]);
        setFormData(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'tax_percentage' ? parseFloat(value) || 0 : value
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (selectedCompany) {
        // Update existing company
        const response = await api.put(`/companies/${selectedCompany.id}`, formData);
        setSelectedCompany(response.data);
        alert('Company settings updated successfully!');
      } else {
        // Create new company
        const response = await api.post('/companies', formData);
        setCompanies([...companies, response.data]);
        setSelectedCompany(response.data);
        alert('Company created successfully!');
      }
      setIsEditing(false);
      fetchCompanies();
    } catch (error) {
      console.error('Error saving company:', error);
      alert('Failed to save company settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedCompany(null);
    setFormData({
      name: '',
      country: '',
      currency: 'USD',
      tax_id: '',
      tax_percentage: 0,
      address: '',
      phone: '',
      email: '',
      logo_url: '',
      timezone: 'UTC'
    });
    setIsEditing(true);
  };

  const handleSetDefault = async (companyId) => {
    try {
      await api.post(`/companies/${companyId}/set-default`);
      alert('Default company set successfully!');
      fetchCompanies(); // Refresh the list
      window.location.reload(); // Reload to update company branding
    } catch (error) {
      console.error('Error setting default company:', error);
      alert('Failed to set default company. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-sky-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-700 to-green-700 p-2 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-green-700 bg-clip-text text-transparent">
                ⚙️ Company Settings
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">{user?.role}</span>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Company Selector & Actions */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Manage Companies</h2>
              <p className="text-sm text-gray-600 mt-1">
                {companies.length} {companies.length === 1 ? 'company' : 'companies'} registered
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="bg-gradient-to-r from-blue-700 to-green-700 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-sky-600"
            >
              + Add New Company
            </button>
          </div>

          {companies.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {companies.map((company) => (
                <div
                  key={company.id}
                  onClick={() => {
                    setSelectedCompany(company);
                    setFormData(company);
                    setIsEditing(false);
                  }}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all relative ${
                    selectedCompany?.id === company.id
                      ? 'border-green-600 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  {company.is_default && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                        ⭐ DEFAULT
                      </span>
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{company.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{company.country}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {company.currency}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Tax: {company.tax_percentage}%
                        </span>
                      </div>
                      {!company.is_default && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(company.id);
                          }}
                          className="mt-2 text-xs text-green-600 hover:text-orange-700 font-semibold"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                    {company.logo_url && (
                      <img 
                        src={company.logo_url} 
                        alt="Logo" 
                        className="h-16 w-auto max-w-[120px] rounded object-contain border border-gray-200 bg-white p-1" 
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Company Details Form */}
        {(selectedCompany || isEditing) && (
          <div className="bg-white rounded-lg shadow">
            <div className="bg-gradient-to-r from-blue-700 to-green-700 px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-bold text-white">
                {selectedCompany && !isEditing ? 'Company Details' : 'Edit Company Settings'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Logo Upload */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Logo</label>
                <div className="flex items-center gap-4">
                  {formData.logo_url && (
                    <img 
                      src={formData.logo_url} 
                      alt="Logo Preview" 
                      className="h-24 w-auto max-w-[200px] rounded-lg object-contain border-2 border-gray-200 bg-white p-2" 
                    />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={!isEditing && selectedCompany}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-green-100 disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB. Recommended: 200x80px or wider for best visibility</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing && selectedCompany}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                    placeholder="e.g., Plugiins Technologies"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country *</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    disabled={!isEditing && selectedCompany}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="">Select Country</option>
                    {countries.map(country => (
                      <option key={country.name} value={country.name}>{country.name}</option>
                    ))}
                  </select>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Currency *</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    disabled={!isEditing && selectedCompany}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    {currencies.map(curr => (
                      <option key={curr.code} value={curr.code}>
                        {curr.code} - {curr.name} ({curr.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tax ID */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tax ID</label>
                  <input
                    type="text"
                    name="tax_id"
                    value={formData.tax_id}
                    onChange={handleInputChange}
                    disabled={!isEditing && selectedCompany}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                    placeholder="e.g., 123-45-6789"
                  />
                </div>

                {/* Tax Percentage */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Percentage (%)</label>
                  <input
                    type="number"
                    name="tax_percentage"
                    value={formData.tax_percentage}
                    onChange={handleInputChange}
                    disabled={!isEditing && selectedCompany}
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                    placeholder="e.g., 8.5"
                  />
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone *</label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    disabled={!isEditing && selectedCompany}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing && selectedCompany}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                    placeholder="e.g., +1-415-555-1234"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing && selectedCompany}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                    placeholder="e.g., contact@company.com"
                  />
                </div>

                {/* Address - Full Width */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing && selectedCompany}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                    placeholder="e.g., 123 Tech Street, San Francisco, CA 94105"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end mt-6 pt-6 border-t">
                {selectedCompany && !isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-gradient-to-r from-blue-700 to-green-700 text-white rounded-lg hover:from-orange-600 hover:to-sky-600"
                  >
                    ✏️ Edit Settings
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedCompany) {
                          setFormData(selectedCompany);
                          setIsEditing(false);
                        } else {
                          setSelectedCompany(companies[0] || null);
                          setFormData(companies[0] || {});
                          setIsEditing(false);
                        }
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-gradient-to-r from-blue-700 to-green-700 text-white rounded-lg hover:from-orange-600 hover:to-sky-600 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : selectedCompany ? 'Save Changes' : 'Create Company'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySettings;
