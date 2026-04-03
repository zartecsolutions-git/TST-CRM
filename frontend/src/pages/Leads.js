import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function MeetingPlans() {
  const [meetings, setMeetings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    customer_id: '', meeting_date: '', meeting_type: 'Initial Contact', 
    agenda: '', location: '', notes: ''
  });

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => { 
    fetchMeetings();
    fetchCustomers();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/meeting-plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeetings(response.data);
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
      await axios.post(`${API_URL}/api/meeting-plans`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Meeting plan created successfully!');
      fetchMeetings();
      setShowForm(false);
      setFormData({ customer_id: '', meeting_date: '', meeting_type: 'Initial Contact', 
        agenda: '', location: '', notes: '' });
    } catch (error) {
      alert(error.response?.data?.detail || 'Error saving meeting plan');
    }
  };

  const handleStatusUpdate = async (meetingId, newStatus, outcome = '', nextSteps = '') => {
    try {
      await axios.put(`${API_URL}/api/meeting-plans/${meetingId}`, 
        { status: newStatus, outcome, next_steps: nextSteps },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Meeting updated successfully!');
      fetchMeetings();
    } catch (error) {
      alert('Error updating meeting');
    }
  };

  const filteredMeetings = meetings.filter(meeting => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const customerName = customers.find(c => c.id === meeting.customer_id)?.name?.toLowerCase() || '';
    return (
      customerName.includes(query) ||
      meeting.meeting_type?.toLowerCase().includes(query) ||
      meeting.location?.toLowerCase().includes(query)
    );
  });

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">📅 Meeting Plans</h1>
          <div className="flex gap-2">
            <button onClick={() => window.location.href = '/dashboard'} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Back to Dashboard
            </button>
            <button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-2 rounded-lg">+ Schedule Meeting</button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Search meetings by customer, type, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Create Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4">
              <h2 className="text-2xl font-bold mb-4">Schedule New Meeting</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Customer *</label>
                    <select required value={formData.customer_id} onChange={(e) => setFormData({...formData, customer_id: e.target.value})} className="w-full border rounded px-3 py-2">
                      <option value="">Select Customer</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Meeting Date & Time *</label>
                    <input type="datetime-local" required value={formData.meeting_date} onChange={(e) => setFormData({...formData, meeting_date: e.target.value})} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Meeting Type *</label>
                    <select value={formData.meeting_type} onChange={(e) => setFormData({...formData, meeting_type: e.target.value})} className="w-full border rounded px-3 py-2">
                      <option>Initial Contact</option>
                      <option>Follow-up</option>
                      <option>Product Demo</option>
                      <option>Negotiation</option>
                      <option>Closing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Location</label>
                    <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g., Office, Zoom, Customer Site" className="w-full border rounded px-3 py-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Agenda</label>
                  <textarea value={formData.agenda} onChange={(e) => setFormData({...formData, agenda: e.target.value})} className="w-full border rounded px-3 py-2" rows="2" placeholder="Meeting objectives and topics..." />
                </div>
                <div>
                  <label className="block text-sm mb-1">Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full border rounded px-3 py-2" rows="2" placeholder="Preparation notes, customer background..." />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded">Schedule</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Meetings Table */}
        <div className="bg-white rounded-lg shadow">
          {filteredMeetings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? 'No meetings found matching your search' : 'No meetings scheduled yet'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-green-500 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Date & Time</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeetings.map((m) => (
                  <tr key={m.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{customers.find(c => c.id === m.customer_id)?.name || 'Unknown'}</td>
                    <td className="px-4 py-3">{new Date(m.meeting_date).toLocaleString()}</td>
                    <td className="px-4 py-3">{m.meeting_type}</td>
                    <td className="px-4 py-3">{m.location || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        m.status === 'completed' ? 'bg-green-100 text-green-800' :
                        m.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.status === 'scheduled' && (
                        <button 
                          onClick={() => {
                            const outcome = prompt('Meeting outcome:');
                            const nextSteps = prompt('Next steps:');
                            if (outcome) handleStatusUpdate(m.id, 'completed', outcome, nextSteps);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          ✓ Mark Complete
                        </button>
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
