import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
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
    status: '', quote_ref: '', quote_value: '', quote_date: '', notes: '', update_note: '', lost_reason: '', update_date: ''
  });

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => { 
    fetchLeads();
    fetchCustomers();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Clean up form data - remove empty datetime fields
      const submitData = { ...formData };
      if (!submitData.expected_close_date) delete submitData.expected_close_date;
      if (!submitData.quote_date) delete submitData.quote_date;
      if (!submitData.estimated_value) delete submitData.estimated_value;
      if (!submitData.quote_value) delete submitData.quote_value;
      
      await axios.post(`${API_URL}/api/leads`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Lead created successfully!');
      fetchLeads();
      setShowForm(false);
      setFormData({ customer_id: '', lead_title: '', description: '', lead_source: 'Website',
        status: 'new', priority: 'medium', estimated_value: '', 
        quote_ref: '', quote_value: '', quote_date: '', expected_close_date: '', notes: '' });
    } catch (error) {
      console.error('Error creating lead:', error);
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
      
      await axios.put(`${API_URL}/api/leads/${selectedLead.id}`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Lead updated successfully!');
      fetchLeads();
      setShowUpdateModal(false);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error updating lead:', error);
      alert(error.response?.data?.detail || 'Error updating lead');
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
      update_date: new Date().toISOString().split('T')[0]
    });
    setShowUpdateModal(true);
  };

  const openDetailModal = (lead) => {
    setSelectedLead(lead);
    setShowDetailModal(true);
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const customerName = customers.find(c => c.id === lead.customer_id)?.name?.toLowerCase() || '';
    return (
      customerName.includes(query) ||
      lead.lead_title?.toLowerCase().includes(query) ||
      lead.status?.toLowerCase().includes(query) ||
      lead.quote_ref?.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status) => {
    const colors = {
      'new': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-purple-100 text-purple-800',
      'qualified': 'bg-cyan-100 text-cyan-800',
      'proposal': 'bg-yellow-100 text-yellow-800',
      'negotiation': 'bg-orange-100 text-orange-800',
      'closed_won': 'bg-green-100 text-green-800',
      'closed_lost': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🎯 Leads Management</h1>
          <div className="flex gap-2">
            <button onClick={() => window.location.href = '/dashboard'} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Back to Dashboard
            </button>
            <button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-2 rounded-lg">+ Add Lead</button>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Search leads by customer, title, status, or quote ref..."
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
                  <div><label className="block text-sm mb-1">Estimated Value ($)</label>
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
                  <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded">Create Lead</button>
                </div>
              </form>
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
                      <option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option>
                      <option value="proposal">Proposal</option><option value="negotiation">Negotiation</option>
                      <option value="closed_won">Closed Won</option><option value="closed_lost">Closed Lost</option>
                    </select>
                  </div>
                  <div><label className="block text-sm mb-1">Quote Reference</label>
                    <input type="text" value={updateData.quote_ref} onChange={(e) => setUpdateData({...updateData, quote_ref: e.target.value})} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div><label className="block text-sm mb-1">Quote Value ($)</label>
                    <input type="number" value={updateData.quote_value} onChange={(e) => setUpdateData({...updateData, quote_value: e.target.value})} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div><label className="block text-sm mb-1">Quote Date</label>
                    <input type="date" value={updateData.quote_date} onChange={(e) => setUpdateData({...updateData, quote_date: e.target.value})} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div><label className="block text-sm mb-1">Update Date *</label>
                    <input type="date" required value={updateData.update_date} onChange={(e) => setUpdateData({...updateData, update_date: e.target.value})} className="w-full border rounded px-3 py-2" />
                  </div>
                </div>
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
              <thead className="bg-gradient-to-r from-blue-500 to-green-500 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Lead Title</th>
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
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(lead.status)}`}>
                        {lead.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{lead.quote_ref || '-'}</td>
                    <td className="px-4 py-3">{lead.quote_value ? `$${lead.quote_value.toLocaleString()}` : '-'}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openUpdateModal(lead)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        ✏️ Update
                      </button>
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
