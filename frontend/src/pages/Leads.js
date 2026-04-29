import React, { useState, useEffect } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import api from '../utils/api';

export default function Leads() {
  const { formatAmount, calculateTotal, companySettings } = useCurrency();
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    customer_id: '', lead_title: '', description: '', lead_source: 'Website',
    status: 'new', priority: 'medium', estimated_value: '', 
    quote_ref: '', quote_value: '', quote_date: '', expected_close_date: '', notes: ''
  });
  const [updateData, setUpdateData] = useState({
    status: '', quote_ref: '', quote_value: '', quote_date: '', notes: '', 
    update_note: '', lost_reason: '', update_date: '', project_value: ''
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchLeads = async () => {
    try {
      const response = await api.get('/leads');
      setLeads(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { 
    fetchLeads();
    fetchCustomers();
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getUserName = (userId) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? foundUser.name : 'Unknown';
  };

  // Calculate overall statistics (base values without tax)
  const totalQuoteValue = leads.reduce((sum, lead) => sum + (lead.quote_value || 0), 0);
  const totalProjectValue = leads
    .filter(lead => lead.status === 'closed_won')
    .reduce((sum, lead) => sum + (lead.project_value || 0), 0);
  
  // Calculate active pipeline value (all leads except closed_won and closed_lost)
  const activePipelineValue = leads
    .filter(lead => !['closed_won', 'closed_lost'].includes(lead.status))
    .reduce((sum, lead) => sum + (lead.quote_value || lead.estimated_value || 0), 0);

  // Calculate sales rep-wise statistics
  const salesRepStats = {};
  leads.forEach(lead => {
    const repId = lead.created_by;
    if (!salesRepStats[repId]) {
      salesRepStats[repId] = {
        name: getUserName(repId),
        totalLeads: 0,
        totalQuoteValue: 0,
        totalProjectValue: 0
      };
    }
    salesRepStats[repId].totalLeads += 1;
    // Base values without tax
    salesRepStats[repId].totalQuoteValue += (lead.quote_value || 0);
    if (lead.status === 'closed_won') {
      salesRepStats[repId].totalProjectValue += (lead.project_value || 0);
    }
  });

  // Convert to array and sort by total leads
  const salesRepArray = Object.values(salesRepStats).sort((a, b) => b.totalLeads - a.totalLeads);

  // Enhanced search - includes customer name, title, status, quote ref, AND sales rep
  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const customerName = customers.find(c => c.id === lead.customer_id)?.name?.toLowerCase() || '';
    const salesRepName = getUserName(lead.created_by).toLowerCase();
    
    return (
      lead.lead_title?.toLowerCase().includes(query) ||
      lead.status?.toLowerCase().includes(query) ||
      lead.quote_ref?.toLowerCase().includes(query) ||
      customerName.includes(query) ||
      salesRepName.includes(query)
    );
  }).sort((a, b) => {
    // Sort by created_at descending (newest first)
    const dateA = new Date(a.created_at || a.updated_at || 0);
    const dateB = new Date(b.created_at || b.updated_at || 0);
    return dateB - dateA;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Clean up form data - remove empty datetime fields
      const submitData = { ...formData };
      if (!submitData.expected_close_date) delete submitData.expected_close_date;
      if (!submitData.quote_date) delete submitData.quote_date;
      if (!submitData.estimated_value) delete submitData.estimated_value;
      if (!submitData.quote_value) delete submitData.quote_value;

      await api.post('/leads', submitData);
      alert('Lead created successfully!');
      fetchLeads();
      setShowForm(false);
      setFormData({ customer_id: '', lead_title: '', description: '', lead_source: 'Website',
        status: 'new', priority: 'medium', estimated_value: '', 
        quote_ref: '', quote_value: '', quote_date: '', expected_close_date: '', notes: '' });
    } catch (error) {
      alert(error.response?.data?.detail || 'Error saving lead');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // Clean up update data - remove empty fields
      const submitData = { ...updateData };
      if (!submitData.quote_date) delete submitData.quote_date;
      if (!submitData.quote_value) delete submitData.quote_value;
      if (!submitData.quote_ref) delete submitData.quote_ref;
      if (!submitData.lost_reason) delete submitData.lost_reason;
      if (!submitData.project_value || submitData.project_value === '') delete submitData.project_value;

      await api.put(`/leads/${selectedLead.id}`, submitData);

      alert('Lead updated successfully!');
      fetchLeads();
      setShowUpdateModal(false);
      setSelectedLead(null);
    } catch (error) {
      
      // Better error message extraction
      let errorMessage = 'Error updating lead';
      if (error.response) {
        // Server responded with error
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Error: ${error.response.status} - ${error.response.statusText}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  const openUpdateModal = (lead) => {
    setSelectedLead(lead);
    setUpdateData({
      status: lead.status,
      quote_ref: lead.quote_ref || '',
      quote_value: lead.quote_value || '',
      quote_date: lead.quote_date ? new Date(lead.quote_date).toISOString().split('T')[0] : '',
      notes: lead.notes || '',
      update_note: '',
      lost_reason: lead.lost_reason || '',
      update_date: new Date().toISOString().split('T')[0],
      project_value: lead.project_value || ''
    });
    setShowUpdateModal(true);
  };

  const openDetailModal = (lead) => {
    setSelectedLead(lead);
    setShowDetailModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      'new': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-purple-100 text-purple-800',
      'qualified': 'bg-cyan-100 text-cyan-800',
      'proposal': 'bg-yellow-100 text-yellow-800',
      'hold': 'bg-gray-100 text-gray-800',
      'negotiation': 'bg-green-100 text-green-800',
      'closed_won': 'bg-green-100 text-green-800',
      'closed_lost': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>;

  return (
    <div className="w-screen max-w-full overflow-x-hidden overflow-y-auto p-2 sm:p-4 lg:p-6">
      <div className="w-full max-w-full overflow-x-hidden">
        {/* Desktop Only: Header with Back Button */}
        <div className="hidden lg:flex lg:items-center lg:justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            🎯 Leads Management
          </h1>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            Back to Dashboard
          </button>
        </div>
        
        {/* Mobile Only: Add Lead Button */}
        <div className="lg:hidden mb-3">
          {(user.role === 'admin' || user.role === 'super_admin' || user.role === 'sales' || user.role === 'data_entry') && (
            <button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-700 to-green-700 text-white px-3 py-1.5 rounded-lg w-auto text-base font-bold hover:shadow-lg transition-shadow">+ Add Lead</button>
          )}
        </div>
        
        {/* Desktop Only: Add Lead Button */}
        <div className="hidden lg:block mb-4">
          {(user.role === 'admin' || user.role === 'super_admin' || user.role === 'sales' || user.role === 'data_entry') && (
            <button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-700 to-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold hover:shadow-lg transition-shadow">+ Add Lead</button>
          )}
        </div>

        {/* Statistics Cards - Mobile Responsive */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6 border-l-4 border-blue-500">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase mb-1 sm:mb-2">Total Leads</h3>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{leads.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6 border-l-4 border-green-600">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase mb-1 sm:mb-2">Total Quote</h3>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{formatAmount(totalQuoteValue)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6 border-l-4 border-amber-500">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase mb-1 sm:mb-2">Pipeline</h3>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-600">{formatAmount(activePipelineValue)}</p>
            <p className="text-xs text-gray-500 mt-1">Excluding closed</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6 border-l-4 border-green-500">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase mb-1 sm:mb-2">Project Value</h3>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{formatAmount(totalProjectValue)}</p>
            <p className="text-xs text-gray-500 mt-1">Closed won</p>
          </div>
        </div>

        {/* Sales Rep-wise Performance Table - Admin Only */}
        {user.role === 'admin' && (
          <div className="mobile-table-wrapper bg-white rounded-lg shadow mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-blue-700 to-green-700 px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-lg sm:text-xl font-bold text-white">📊 Sales Rep Performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Sales Rep</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Total Leads</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Total Quote Value</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Total Project Value</th>
                  </tr>
                </thead>
                <tbody>
                  {salesRepArray.length > 0 ? (
                    salesRepArray.map((rep) => (
                      <tr key={rep.id || rep.name} className="border-b hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-sky-400 flex items-center justify-center text-white font-bold mr-3">
                              {rep.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-900">{rep.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-bold">
                            {rep.totalLeads}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-semibold text-green-600 text-lg">
                            {formatAmount(rep.totalQuoteValue)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-semibold text-green-600 text-lg">
                            {formatAmount(rep.totalProjectValue)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No sales rep data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Search leads by customer, title, status, quote ref, or sales rep..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full m-4 my-8">
              <h2 className="text-2xl font-bold mb-4">Add New Lead</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm mb-1">Customer *</label>
                    <select required value={formData.customer_id} onChange={(e) => setFormData({...formData, customer_id: e.target.value})} className="w-full border rounded px-3 py-2">
                      <option value="">Select Customer</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm mb-1">Lead Title *</label>
                    <input type="text" required value={formData.lead_title} onChange={(e) => setFormData({...formData, lead_title: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="e.g., Product Demo Request" />
                  </div>
                  <div><label className="block text-sm mb-1">Lead Source</label>
                    <select value={formData.lead_source} onChange={(e) => setFormData({...formData, lead_source: e.target.value})} className="w-full border rounded px-3 py-2">
                      <option>Website</option><option>Referral</option><option>Cold Call</option><option>Trade Show</option><option>Social Media</option>
                    </select>
                  </div>
                  <div><label className="block text-sm mb-1">Priority</label>
                    <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full border rounded px-3 py-2">
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                    </select>
                  </div>
                  <div><label className="block text-sm mb-1">Estimated Value ({companySettings?.currency || 'USD'})</label>
                    <input type="number" value={formData.estimated_value} onChange={(e) => setFormData({...formData, estimated_value: e.target.value})} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div><label className="block text-sm mb-1">Expected Close Date</label>
                    <input type="date" value={formData.expected_close_date} onChange={(e) => setFormData({...formData, expected_close_date: e.target.value})} className="w-full border rounded px-3 py-2" />
                  </div>
                </div>
                <div><label className="block text-sm mb-1">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border rounded px-3 py-2" rows="2" />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-700 to-green-700 text-white rounded">Create Lead</button>
                </div>
              </form>
            </div>
          </div>
        )}


        {/* Detail Modal - Click lead to view */}
        {showDetailModal && selectedLead && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full m-4 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">📋 Lead Details: {selectedLead.lead_title}</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
              </div>
              
              {/* Lead Information Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gradient-to-br from-orange-50 to-sky-100 rounded-lg">
                <div className="space-y-3">
                  <div><span className="font-semibold text-gray-700">Customer:</span> <span className="text-gray-900">{customers.find(c => c.id === selectedLead.customer_id)?.name || 'Unknown'}</span></div>
                  <div><span className="font-semibold text-gray-700">Sales Rep:</span> <span className="text-blue-600 font-semibold">👤 {getUserName(selectedLead.created_by)}</span></div>
                  <div><span className="font-semibold text-gray-700">Status:</span> <span className={`ml-2 px-3 py-1 rounded text-sm font-semibold ${getStatusColor(selectedLead.status)}`}>{selectedLead.status.replace('_', ' ').toUpperCase()}</span></div>
                  <div><span className="font-semibold text-gray-700">Priority:</span> <span className={`ml-2 px-2 py-1 rounded text-sm font-semibold ${selectedLead.priority === 'high' ? 'bg-red-100 text-red-800' : selectedLead.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{selectedLead.priority?.toUpperCase()}</span></div>
                  <div><span className="font-semibold text-gray-700">Lead Source:</span> <span className="text-gray-900">{selectedLead.lead_source || '-'}</span></div>
                  <div><span className="font-semibold text-gray-700">Estimated Value:</span> <span className="text-green-600 font-semibold">{selectedLead.estimated_value ? formatAmount(selectedLead.estimated_value) : '-'}</span></div>
                </div>
                <div className="space-y-3">
                  <div><span className="font-semibold text-gray-700">Quote Reference:</span> <span className="text-gray-900 font-mono">{selectedLead.quote_ref || '-'}</span></div>
                  <div><span className="font-semibold text-gray-700">Quote Value:</span> <span className="text-green-600 font-semibold">{selectedLead.quote_value ? formatAmount(selectedLead.quote_value) : '-'}</span></div>
                  <div><span className="font-semibold text-gray-700">Quote Date:</span> <span className="text-gray-900">{selectedLead.quote_date ? new Date(selectedLead.quote_date).toLocaleDateString() : '-'}</span></div>
                  <div><span className="font-semibold text-gray-700">Expected Close Date:</span> <span className="text-gray-900">{selectedLead.expected_close_date ? new Date(selectedLead.expected_close_date).toLocaleDateString() : '-'}</span></div>
                  <div><span className="font-semibold text-gray-700">Created:</span> <span className="text-gray-600 text-sm">{new Date(selectedLead.created_at).toLocaleString()}</span></div>
                </div>
              </div>

              {/* Closed Won Details - Show for closed won leads */}
              {selectedLead.status === 'closed_won' && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
                  <h3 className="font-bold text-lg text-green-700 mb-3 flex items-center">
                    <span className="mr-2">🎉</span> Deal Closed!
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">💰 Project Value (Base):</span>
                        <span className="text-xl font-bold text-gray-800">
                          {selectedLead.project_value ? formatAmount(parseFloat(selectedLead.project_value)) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">📊 Tax ({companySettings?.tax_percentage || 0}%):</span>
                        <span className="text-xl font-bold text-amber-600">
                          {selectedLead.project_value ? formatAmount(parseFloat(selectedLead.project_value) * ((companySettings?.tax_percentage || 0) / 100)) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t-2 border-green-300">
                        <span className="font-bold text-gray-800">💵 Total Amount:</span>
                        <span className="text-2xl font-bold text-green-700">
                          {selectedLead.project_value ? formatAmount(calculateTotal(parseFloat(selectedLead.project_value))) : '-'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">📅 Closed Date:</span>
                      <span className="ml-2 text-lg font-semibold text-green-700 block mt-1">
                        {selectedLead.closed_at ? new Date(selectedLead.closed_at).toLocaleDateString() : 'Not recorded'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedLead.description && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">📝 Description:</h3>
                  <p className="text-gray-800">{selectedLead.description}</p>
                </div>
              )}

              {/* Notes */}
              {selectedLead.notes && (
                <div className="mb-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <h3 className="font-semibold text-gray-700 mb-2">📌 Notes:</h3>
                  <p className="text-gray-800">{selectedLead.notes}</p>
                </div>
              )}

              {/* Update History */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3 flex items-center">
                  <span className="mr-2">🕐</span> Update History 
                  <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {selectedLead.updates_history?.length || 0} update{selectedLead.updates_history?.length !== 1 ? 's' : ''}
                  </span>
                </h3>
                {selectedLead.updates_history && selectedLead.updates_history.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {[...selectedLead.updates_history].reverse().map((update, idx) => (
                      <div key={`upd-${update.updated_at}-${idx}`} className="border-l-4 border-blue-500 pl-4 py-2 bg-gradient-to-r from-blue-50 to-white rounded">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-blue-700">Update #{selectedLead.updates_history.length - idx}</span>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">{new Date(update.updated_at).toLocaleString()}</div>
                            {update.update_date && <div className="text-xs text-blue-600 font-medium">Update Date: {update.update_date}</div>}
                          </div>
                        </div>
                        {update.note && (
                          <div className="mb-2 bg-white p-2 rounded">
                            <p className="text-sm text-gray-700"><strong className="text-blue-600">Note:</strong> {update.note}</p>
                          </div>
                        )}
                        {update.changes && Object.keys(update.changes).length > 0 && (
                          <div className="text-xs text-gray-600 flex flex-wrap gap-2">
                            <strong>Changes:</strong>
                            {update.changes.status && <span className="bg-purple-100 px-2 py-1 rounded">Status → <strong>{update.changes.status}</strong></span>}
                            {update.changes.quote_ref && <span className="bg-green-100 px-2 py-1 rounded">Quote Ref → <strong>{update.changes.quote_ref}</strong></span>}
                            {update.changes.quote_value && <span className="bg-green-100 px-2 py-1 rounded">Quote Value → <strong>{formatAmount(update.changes.quote_value)}</strong></span>}
                            {update.changes.quote_date && <span className="bg-green-100 px-2 py-1 rounded">Quote Date → <strong>{update.changes.quote_date}</strong></span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic p-4 bg-gray-50 rounded">No updates recorded yet</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button onClick={() => setShowDetailModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Close
                </button>
                {selectedLead.status !== 'closed_won' && (
                  <button onClick={() => { setShowDetailModal(false); openUpdateModal(selectedLead); }} className="px-6 py-2 bg-gradient-to-r from-blue-700 to-green-700 text-white rounded-lg hover:from-blue-700 hover:to-green-700 flex items-center">
                    <span className="mr-2">✏️</span> Edit Lead
                  </button>
                )}
                {selectedLead.status === 'closed_won' && (
                  <div className="px-6 py-2 bg-gray-300 text-gray-500 rounded-lg flex items-center cursor-not-allowed">
                    <span className="mr-2">🔒</span> Deal Closed - Cannot Edit
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showUpdateModal && selectedLead && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 my-8">
              <h2 className="text-2xl font-bold mb-4">Update Lead: {selectedLead.lead_title}</h2>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm mb-1">Status *</label>
                    <select value={updateData.status} onChange={(e) => setUpdateData({...updateData, status: e.target.value})} className="w-full border rounded px-3 py-2">
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal">Proposal</option>
                      <option value="hold">On Hold</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="closed_won">Closed Won</option>
                      <option value="closed_lost">Closed Lost</option>
                    </select>
                  </div>
                  <div><label className="block text-sm mb-1">Quote Reference</label>
                    <input type="text" value={updateData.quote_ref} onChange={(e) => setUpdateData({...updateData, quote_ref: e.target.value})} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div><label className="block text-sm mb-1">Quote Value ({companySettings?.currency || 'USD'})</label>
                    <input type="number" value={updateData.quote_value} onChange={(e) => setUpdateData({...updateData, quote_value: e.target.value})} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div><label className="block text-sm mb-1">Quote Date</label>
                    <input type="date" value={updateData.quote_date} onChange={(e) => setUpdateData({...updateData, quote_date: e.target.value})} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div><label className="block text-sm mb-1">Update Date *</label>
                    <input type="date" required value={updateData.update_date} onChange={(e) => setUpdateData({...updateData, update_date: e.target.value})} className="w-full border rounded px-3 py-2" />
                  </div>
                </div>
                {updateData.status === 'closed_won' && (
                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-500">
                    <label className="block text-sm font-semibold mb-2 text-green-700">💰 Project Value * (Final Won Value)</label>
                    <input
                      type="number"
                      value={updateData.project_value}
                      onChange={(e) => setUpdateData({...updateData, project_value: e.target.value})}
                      className="w-full border rounded px-3 py-2 border-green-500 focus:ring-2 focus:ring-green-500"
                      placeholder="Enter final project value"
                      required={updateData.status === 'closed_won'}
                    />
                    <p className="text-xs text-green-600 mt-1">Enter the actual value of the won project</p>
                  </div>
                )}
                {updateData.status === 'closed_lost' && (
                  <div><label className="block text-sm mb-1">Lost Reason</label>
                    <textarea value={updateData.lost_reason} onChange={(e) => setUpdateData({...updateData, lost_reason: e.target.value})} className="w-full border rounded px-3 py-2" rows="2" />
                  </div>
                )}
                <div><label className="block text-sm mb-1">Update Notes *</label>
                  <textarea required value={updateData.update_note} onChange={(e) => setUpdateData({...updateData, update_note: e.target.value})} className="w-full border rounded px-3 py-2" rows="2" placeholder="What changed?" />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowUpdateModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">💾 Save Update</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {filteredLeads.length === 0 ? (
            <div className="p-8 text-center text-gray-500">{searchQuery ? 'No leads found' : 'No leads yet'}</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-700 to-green-700 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Lead Title</th>
                  <th className="px-4 py-3 text-left">Sales Rep</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Quote Ref</th>
                  <th className="px-4 py-3 text-left">Quote Value</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} onClick={() => openDetailModal(lead)} className="border-b hover:bg-blue-50 cursor-pointer">
                    <td className="px-4 py-3 font-medium">{customers.find(c => c.id === lead.customer_id)?.name || 'Unknown'}</td>
                    <td className="px-4 py-3">{lead.lead_title}</td>
                    <td className="px-4 py-3 text-blue-600 font-medium">👤 {getUserName(lead.created_by)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(lead.status)}`}>
                        {lead.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{lead.quote_ref || '-'}</td>
                    <td className="px-4 py-3">{lead.quote_value ? formatAmount(lead.quote_value) : '-'}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {lead.status === 'closed_won' ? (
                        <span className="text-gray-400 text-sm font-medium cursor-not-allowed">🔒 Locked</span>
                      ) : (user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'sales' || user?.role === 'data_entry') ? (
                        <button onClick={() => openUpdateModal(lead)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          ✏️ Update
                        </button>
                      ) : (
                        <span className="text-gray-500 text-sm">View Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
