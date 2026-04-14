import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ActivityForm = ({
  newActivity,
  setNewActivity,
  users,
  customers,
  products,
  companySettings,
  onSubmit,
  onCancel
}) => {
  const supportUsers = users.filter(u => u.role === 'support');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-3xl my-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-white z-10 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Create New Activity</CardTitle>
            <Button
              variant="ghost"
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
              type="button"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <Label>Title</Label>
                <Input
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                  required
                />
              </div>

              {/* Assign To */}
              <div>
                <Label>Assign To</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={newActivity.assigned_to}
                  onChange={(e) => setNewActivity({...newActivity, assigned_to: e.target.value})}
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                  ))}
                </select>
              </div>

              {/* Support Staff */}
              <div>
                <Label>Support Staff</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={newActivity.support_staff}
                  onChange={(e) => setNewActivity({...newActivity, support_staff: e.target.value})}
                >
                  <option value="">Select Support Staff</option>
                  {supportUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              {/* Customer */}
              <div>
                <Label>Customer</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={newActivity.customer_id}
                  onChange={(e) => {
                    setNewActivity({...newActivity, customer_id: e.target.value, product_id: '', serial_number: ''});
                  }}
                >
                  <option value="">Select Customer (Optional)</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.business_vertical || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Product Selection */}
              <div>
                <Label>Product</Label>
                {newActivity.customer_id ? (
                  <select
                    className="w-full border rounded-md p-2"
                    value={newActivity.product_id}
                    onChange={(e) => {
                      setNewActivity({...newActivity, product_id: e.target.value, serial_number: ''});
                    }}
                  >
                    <option value="">Select Product</option>
                    {products
                      .filter(p => p.serial_numbers?.some(s => s.customer_id === newActivity.customer_id && s.status === 'sold'))
                      .map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.model || product.category}
                        </option>
                      ))}
                  </select>
                ) : (
                  <div className="w-full border rounded-md p-2 bg-gray-50 flex items-center justify-center text-gray-500">
                    Please select a customer first
                  </div>
                )}
              </div>
              
              {/* Serial Number Selection */}
              <div>
                <Label>Product Serial Number</Label>
                {newActivity.product_id && newActivity.customer_id ? (
                  <select
                    className="w-full border rounded-md p-2"
                    value={newActivity.serial_number}
                    onChange={(e) => setNewActivity({...newActivity, serial_number: e.target.value})}
                  >
                    <option value="">Select Serial Number</option>
                    {(() => {
                      const product = products.find(p => p.id === newActivity.product_id);
                      return product?.serial_numbers
                        ?.filter(s => s.customer_id === newActivity.customer_id && s.status === 'sold')
                        .map((serial, index) => (
                          <option key={index} value={serial.serial_number}>
                            {serial.serial_number} (Sold: {serial.sale_date ? new Date(serial.sale_date).toLocaleDateString() : 'N/A'})
                          </option>
                        )) || [];
                    })()}
                  </select>
                ) : (
                  <div className="w-full border rounded-md p-2 bg-gray-50 flex items-center justify-center text-gray-500 text-sm">
                    {!newActivity.customer_id ? 'Select customer and product first' : 'Select a product first'}
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Only serial numbers assigned to the selected customer are shown
                </p>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <Label>Description</Label>
                <textarea
                  className="w-full border rounded-md p-2"
                  rows="3"
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                />
              </div>

              {/* Status */}
              <div>
                <Label>Status</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={newActivity.status}
                  onChange={(e) => setNewActivity({...newActivity, status: e.target.value})}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Activity Type */}
              <div>
                <Label>Activity Type</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={newActivity.activity_type}
                  onChange={(e) => setNewActivity({...newActivity, activity_type: e.target.value})}
                >
                  <option value="demo_poc">Demo/POC</option>
                  <option value="warranty">Warranty</option>
                  <option value="service_call">Service Call</option>
                  <option value="periodic_visit">Periodic Visit</option>
                  <option value="new_installation">New Installation</option>
                  <option value="others">Others</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <Label>Due Date (Optional)</Label>
                <Input
                  type="date"
                  value={newActivity.due_date}
                  onChange={(e) => setNewActivity({...newActivity, due_date: e.target.value})}
                />
              </div>
              
              {/* Completion Fields - Show only when status is completed */}
              {newActivity.status === 'completed' && (
                <>
                  <div>
                    <Label>Invoice Number</Label>
                    <Input
                      value={newActivity.invoice_number}
                      onChange={(e) => setNewActivity({...newActivity, invoice_number: e.target.value})}
                      placeholder="INV-2024-001"
                    />
                  </div>
                  <div>
                    <Label>Work Order Number</Label>
                    <Input
                      value={newActivity.work_order_no}
                      onChange={(e) => setNewActivity({...newActivity, work_order_no: e.target.value})}
                      placeholder="WO-2024-001"
                    />
                  </div>
                  <div>
                    <Label>Total Amount ({companySettings?.currency || 'USD'})</Label>
                    <Input
                      type="number"
                      value={newActivity.total_amount}
                      onChange={(e) => setNewActivity({...newActivity, total_amount: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Next Maintenance Due Date</Label>
                    <Input
                      type="date"
                      value={newActivity.next_maintenance_date}
                      onChange={(e) => setNewActivity({...newActivity, next_maintenance_date: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will be synced to the product's serial number record
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-700 to-green-700">
                Create Activity
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityForm;
