import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ActivityStatusModal = ({
  selectedActivity,
  statusUpdateNote,
  setStatusUpdateNote,
  completionData,
  setCompletionData,
  companySettings,
  onConfirm,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Update Activity Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You are updating the status to: <strong className="capitalize">{selectedActivity?.newStatus?.replace('_', ' ')}</strong>
            </p>
            <div>
              <Label>Enter details about this status update *</Label>
              <textarea
                className="w-full border rounded-md p-2 mt-1"
                rows="4"
                placeholder="What work was done? Any blockers? Next steps?"
                value={statusUpdateNote}
                onChange={(e) => setStatusUpdateNote(e.target.value)}
                required
              />
            </div>
            
            {/* Show invoice and amount fields when completing */}
            {selectedActivity?.newStatus === 'completed' && (
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-semibold text-green-700">💰 Completion Details</h4>
                <div>
                  <Label>Work Order No.</Label>
                  <Input
                    placeholder="WO-2024-001"
                    value={completionData.work_order_no}
                    onChange={(e) => setCompletionData({...completionData, work_order_no: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Invoice Number</Label>
                  <Input
                    placeholder="INV-2024-001"
                    value={completionData.invoice_number}
                    onChange={(e) => setCompletionData({...completionData, invoice_number: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Next Maintenance Date</Label>
                  <Input
                    type="date"
                    value={completionData.next_maintenance_date}
                    onChange={(e) => setCompletionData({...completionData, next_maintenance_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Total Amount ({companySettings?.currency || 'USD'})</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={completionData.total_amount}
                    onChange={(e) => setCompletionData({...completionData, total_amount: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button 
                onClick={onConfirm}
                className="bg-gradient-to-r from-blue-700 to-green-700"
              >
                Confirm Update
              </Button>
              <Button 
                variant="outline" 
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityStatusModal;