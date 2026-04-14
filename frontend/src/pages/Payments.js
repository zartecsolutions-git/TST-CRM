import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Payments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    invoice_number: '',
    customer_name: '',
    invoice_amount: 0,
    received_amount: 0,
    received_date: new Date().toISOString().split('T')[0],
    payment_mode: 'Cash',
    payment_status: 'Full',
    balance_amount: 0
  });

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/payments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPayments(response.data || []);
      } catch (error) {
      }
    };

    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/sales/invoices`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Filter invoices based on user role
        let filteredInvoices = response.data || [];
        if (user?.role === 'sales' || user?.role === 'support') {
          // Show only their own invoices
          filteredInvoices = filteredInvoices.filter(inv => inv.sales_rep_id === user.id);
        }
        setInvoices(filteredInvoices);
      } catch (error) {
      }
    };

    fetchPayments();
    fetchInvoices();
  }, [user]);

  const handleInvoiceSelect = (invoice) => {
    const invoiceAmount = invoice.total_amount || 0;
    const receivedAmount = formData.received_amount || 0;
    const balance = invoiceAmount - receivedAmount;
    
    setFormData({
      ...formData,
      invoice_number: invoice.invoice_number,
      customer_name: invoice.customer_name,
      invoice_amount: invoiceAmount,
      balance_amount: balance,
      payment_status: balance <= 0 ? 'Full' : 'Partial'
    });
    setInvoiceSearch(invoice.invoice_number);
    setShowInvoiceDropdown(false);
  };

  const handleReceivedAmountChange = (value) => {
    const received = parseFloat(value) || 0;
    const balance = formData.invoice_amount - received;
    
    setFormData({
      ...formData,
      received_amount: received,
      balance_amount: balance,
      payment_status: balance <= 0 ? 'Full' : 'Partial'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/payments`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Payment recorded successfully!');
      await fetchPayments();  // Await to ensure state updates
      setShowForm(false);
      setFormData({
        invoice_number: '', customer_name: '', invoice_amount: 0, received_amount: 0,
        received_date: new Date().toISOString().split('T')[0], payment_mode: 'Cash',
        payment_status: 'Full', balance_amount: 0
      });
      setInvoiceSearch('');
    } catch (error) {
      alert('Error recording payment: ' + error.response?.data?.detail);
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.invoice_number.toString().toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    inv.customer_name.toLowerCase().includes(invoiceSearch.toLowerCase())
  ).filter(inv => inv.payment_status !== 'Paid');  // Only show unpaid/partially paid invoices

  const filteredPayments = payments.filter(payment => {
    // Role-based filtering: Sales/Support see only payments for their invoices
    if (user?.role === 'sales' || user?.role === 'support') {
      const userInvoiceNumbers = invoices.map(inv => inv.invoice_number);
      if (!userInvoiceNumbers.includes(payment.invoice_number)) {
        return false;
      }
    }
    
    // Search filter
    return (
      payment.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">💳 {user?.role === 'admin' ? 'Payments' : 'My Invoice Payments'}</h1>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Record Payment
          </button>
        )}
      </div>

      {/* Payment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Record Payment</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                {/* Invoice Number - Searchable Dropdown */}
                <div className="col-span-2 relative">
                  <label className="block text-sm font-medium mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="Search invoice number..."
                    value={invoiceSearch}
                    onChange={(e) => {
                      setInvoiceSearch(e.target.value);
                      setShowInvoiceDropdown(true);
                    }}
                    onFocus={() => setShowInvoiceDropdown(true)}
                    className="w-full border rounded px-3 py-2"
                  />
                  {showInvoiceDropdown && filteredInvoices.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                      {filteredInvoices.map(inv => (
                        <div
                          key={inv.invoice_number}
                          onClick={() => handleInvoiceSelect(inv)}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b"
                        >
                          <div className="font-medium">#{inv.invoice_number}</div>
                          <div className="text-sm text-gray-600">
                            {inv.customer_name} • BHD {inv.total_amount.toFixed(2)} • {inv.payment_status}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Customer Name - Auto-filled */}
                <div>
                  <label className="block text-sm font-medium mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    readOnly
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                  />
                </div>

                {/* Invoice Amount - Auto-filled */}
                <div>
                  <label className="block text-sm font-medium mb-1">Invoice Amount (BHD)</label>
                  <input
                    type="number"
                    value={formData.invoice_amount}
                    readOnly
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                  />
                </div>

                {/* Received Amount */}
                <div>
                  <label className="block text-sm font-medium mb-1">Received Amount (BHD) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.received_amount}
                    onChange={(e) => handleReceivedAmountChange(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                {/* Received Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">Received Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.received_date}
                    onChange={(e) => setFormData({...formData, received_date: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Mode *</label>
                  <select
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({...formData, payment_mode: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                {/* Payment Status - Auto-set */}
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Status</label>
                  <input
                    type="text"
                    value={formData.payment_status}
                    readOnly
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                  />
                </div>

                {/* Balance Amount - Auto-calculated */}
                <div>
                  <label className="block text-sm font-medium mb-1">Balance Amount (BHD)</label>
                  <input
                    type="number"
                    value={formData.balance_amount.toFixed(2)}
                    readOnly
                    className="w-full border rounded px-3 py-2 bg-gray-100 font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Save Payment
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="🔍 Search payments..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4"
      />

      {/* Payments List */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium">Invoice #</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Customer</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Invoice Amt</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Received</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Balance</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Date</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Mode</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredPayments.map(payment => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-blue-600">#{payment.invoice_number}</td>
                <td className="px-4 py-2">{payment.customer_name}</td>
                <td className="px-4 py-2">BHD {payment.invoice_amount.toFixed(2)}</td>
                <td className="px-4 py-2 font-semibold text-green-600">BHD {payment.received_amount.toFixed(2)}</td>
                <td className="px-4 py-2 font-semibold text-red-600">BHD {payment.balance_amount.toFixed(2)}</td>
                <td className="px-4 py-2">{payment.received_date}</td>
                <td className="px-4 py-2">{payment.payment_mode}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${payment.payment_status === 'Full' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {payment.payment_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
