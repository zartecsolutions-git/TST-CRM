import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Customers() {
  const { user } = useAuth(); // Use AuthContext instead of localStorage
  const [customers, setCustomers] = useState([]);
  const [divisions, setDivisions] = useState([]);  // NEW: For division dropdown
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', region: '', business_vertical: '', contact_person: '', 
    vat_reg_no: '', cr_no: '', division: ''  // NEW: Added new fields
  });
  const [editFormData, setEditFormData] = useState({
    name: '', email: '', phone: '', address: '', region: '', business_vertical: '', contact_person: '',
    vat_reg_no: '', cr_no: '', division: ''  // NEW: Added new fields
  });

  const token = localStorage.getItem('token');

  useEffect(() => { 
    fetchCustomers();
    fetchDivisions();  // NEW: Fetch divisions for dropdown
  }, [user]);

  const fetchDivisions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/master-data/divisions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDivisions(response.data || []);
    } catch (error) {
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/customers`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCustomers();
      setShowForm(false);
      setFormData({ name: '', email: '', phone: '', address: '', region: '', business_vertical: '', contact_person: '', vat_reg_no: '', cr_no: '', division: '' });
      alert('Customer created successfully!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Error saving customer');
    }
  };

  const handleEditClick = (customer) => {
    setSelectedCustomer(customer);
    setEditFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      region: customer.region || '',
      business_vertical: customer.business_vertical || '',
      contact_person: customer.contact_person || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/customers/${selectedCustomer.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Customer updated successfully!');
      fetchCustomers();
      setShowEditModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      alert(error.response?.data?.detail || 'Error updating customer');
    }
  };

  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query) ||
      customer.region?.toLowerCase().includes(query) ||
      customer.business_vertical?.toLowerCase().includes(query) ||
      customer.contact_person?.toLowerCase().includes(query)
    );
  });

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>;

  return (
    <div className="w-screen max-w-full overflow-x-hidden overflow-y-auto">
      {/* Customers page - No PageHeader on mobile */}
      <div className="w-full px-2 sm:px-4 lg:px-6 py-3 sm:py-6 overflow-x-hidden max-w-full">
        {/* Desktop only header */}
        <div className="hidden lg:block mb-4">
          <PageHeader title="👥 Customer Management">
            <div className="flex gap-2">
              <button onClick={() => window.location.href = '/dashboard'} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm" data-testid="back-to-dashboard-btn">
                Back to Dashboard
              </button>
              <button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-700 to-green-700 text-white px-4 py-2 rounded-lg text-sm" data-testid="add-customer-btn">+ Add Customer</button>
            </div>
          </PageHeader>
        </div>
        
        {/* Debug Info - Shows user role for troubleshooting */}
        {user && (
          <div className="mb-4 p-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg text-sm">
            <div className="font-bold mb-1">🔍 Debug: User Role Check</div>
            <div>Name: {user.name} | Email: {user.email}</div>
            <div>Role: <strong>{user.role}</strong> | Admin Check: 
              <strong className={user?.role?.toLowerCase() === 'admin' ? 'text-green-600' : 'text-red-600'}>
                {user?.role?.toLowerCase() === 'admin' ? ' ✅ YES' : ' ❌ NO'}
              </strong>
            </div>
          </div>
        )}
        
        {/* Mobile only: Add Customer button */}
        <div className="lg:hidden mb-3">
          <button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-700 to-green-700 text-white px-4 py-2 rounded-lg text-sm w-full">+ Add Customer</button>
        </div>

        {/* Search Bar */}
        <div className="mobile-section">
          <input
            type="text"
            placeholder="🔍 Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mobile-search"
          />
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {showForm && (
          <div className="mobile-modal" data-testid="create-customer-modal">
            <div className="mobile-modal-content">
              <div className="mobile-modal-header">
                <h2 className="text-xl sm:text-2xl font-bold">Add New Customer</h2>
              </div>
              <form onSubmit={handleSubmit} className="mobile-modal-body" data-testid="create-customer-form">
                <div className="mobile-form">
                  <div><label className="block text-sm mb-1 font-medium">Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mobile-input" data-testid="customer-name-input" /></div>
                  <div><label className="block text-sm mb-1 font-medium">Email *</label><input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="mobile-input" data-testid="customer-email-input" /></div>
                  <div><label className="block text-sm mb-1 font-medium">Phone</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="mobile-input" data-testid="customer-phone-input" /></div>
                  <div><label className="block text-sm mb-1 font-medium">Contact Person</label><input type="text" value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} className="mobile-input" data-testid="customer-contact-input" /></div>
                  <div><label className="block text-sm mb-1 font-medium">VAT REG NO.</label><input type="text" value={formData.vat_reg_no} onChange={(e) => setFormData({...formData, vat_reg_no: e.target.value})} className="mobile-input" data-testid="customer-vat-input" placeholder="e.g., BH123456789" /></div>
                  <div><label className="block text-sm mb-1 font-medium">CR NO.</label><input type="text" value={formData.cr_no} onChange={(e) => setFormData({...formData, cr_no: e.target.value})} className="mobile-input" data-testid="customer-cr-input" placeholder="e.g., CR-12345" /></div>
                  <div><label className="block text-sm mb-1 font-medium">Region</label><input type="text" value={formData.region} onChange={(e) => setFormData({...formData, region: e.target.value})} className="mobile-input" data-testid="customer-region-input" /></div>
                  <div><label className="block text-sm mb-1 font-medium">Business Vertical</label><input type="text" value={formData.business_vertical} onChange={(e) => setFormData({...formData, business_vertical: e.target.value})} className="mobile-input" data-testid="customer-business-input" /></div>
                  <div><label className="block text-sm mb-1 font-medium">Customer Division</label><select value={formData.division} onChange={(e) => setFormData({...formData, division: e.target.value})} className="mobile-input" data-testid="customer-division-select"><option value="">Select Division</option>{divisions.map(div => (<option key={div.name} value={div.name}>{div.name}</option>))}</select></div>
                </div>
                <div className="mt-4"><label className="block text-sm mb-1 font-medium">Address</label><textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="mobile-input" rows="2" data-testid="customer-address-input" /></div>
              </form>
              <div className="mobile-modal-footer">
                <button type="button" onClick={() => setShowForm(false)} className="mobile-btn border border-gray-300 w-full sm:w-auto" data-testid="cancel-create-btn">Cancel</button>
                <button type="submit" onClick={handleSubmit} className="mobile-btn bg-gradient-to-r from-blue-700 to-green-700 text-white w-full sm:w-auto" data-testid="submit-create-customer-btn">Create Customer</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {showEditModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="edit-customer-modal">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Edit Customer Details</h2>
              <form onSubmit={handleUpdateCustomer} className="space-y-4" data-testid="edit-customer-form">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm mb-1">Name *</label><input type="text" required value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Email *</label><input type="email" required value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Phone</label><input type="tel" value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Contact Person</label><input type="text" value={editFormData.contact_person} onChange={(e) => setEditFormData({...editFormData, contact_person: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">VAT REG NO.</label><input type="text" value={editFormData.vat_reg_no} onChange={(e) => setEditFormData({...editFormData, vat_reg_no: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="e.g., BH123456789" /></div>
                  <div><label className="block text-sm mb-1">CR NO.</label><input type="text" value={editFormData.cr_no} onChange={(e) => setEditFormData({...editFormData, cr_no: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="e.g., CR-12345" /></div>
                  <div><label className="block text-sm mb-1">Region</label><input type="text" value={editFormData.region} onChange={(e) => setEditFormData({...editFormData, region: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Business Vertical</label><input type="text" value={editFormData.business_vertical} onChange={(e) => setEditFormData({...editFormData, business_vertical: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Customer Division</label><select value={editFormData.division} onChange={(e) => setEditFormData({...editFormData, division: e.target.value})} className="w-full border rounded px-3 py-2"><option value="">Select Division</option>{divisions.map(div => (<option key={div.name} value={div.name}>{div.name}</option>))}</select></div>
                </div>
                <div><label className="block text-sm mb-1">Address</label><textarea value={editFormData.address} onChange={(e) => setEditFormData({...editFormData, address: e.target.value})} className="w-full border rounded px-3 py-2" rows="2" /></div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">💾 Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table with scroll indicator */}
        <div className="bg-white rounded-lg shadow">
          {/* Scroll hint */}
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-700 flex items-center gap-2">
            <span>👉</span>
            <span className="font-medium">Scroll right to see all columns including Actions</span>
          </div>
          
          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? 'No customers found matching your search' : 'No customers yet'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '900px' }} data-testid="customers-table">
                <thead className="bg-gradient-to-r from-blue-700 to-green-700 text-white">
                  <tr>
                    <th className="px-2 py-2 text-left text-sm whitespace-nowrap">Name</th>
                    <th className="px-2 py-2 text-left text-sm whitespace-nowrap">Email</th>
                    <th className="px-2 py-2 text-left text-sm whitespace-nowrap">Phone</th>
                    <th className="px-2 py-2 text-left text-sm whitespace-nowrap">Region</th>
                    <th className="px-2 py-2 text-left text-sm whitespace-nowrap">Business</th>
                    <th className="px-2 py-2 text-center bg-yellow-300 text-black text-sm font-bold whitespace-nowrap sticky right-0">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c, index) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50" data-testid={`customer-row-${index}`}>
                      <td className="px-2 py-2 font-medium text-sm whitespace-nowrap">{c.name}</td>
                      <td className="px-2 py-2 text-sm truncate" title={c.email} style={{ maxWidth: '200px' }}>{c.email}</td>
                      <td className="px-2 py-2 text-sm whitespace-nowrap">{c.phone || '-'}</td>
                      <td className="px-2 py-2 text-sm whitespace-nowrap">{c.region || '-'}</td>
                      <td className="px-2 py-2 text-sm whitespace-nowrap">{c.business_vertical || '-'}</td>
                      <td className="px-2 py-2 bg-yellow-100 text-center sticky right-0">
                        {user?.role === 'admin' ? (
                          <button 
                            onClick={() => handleEditClick(c)}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-sm whitespace-nowrap font-medium"
                            data-testid={`edit-customer-btn-${index}`}
                          >
                            ✏️ Edit
                          </button>
                        ) : (
                          <span className="text-gray-500 text-sm">View Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
