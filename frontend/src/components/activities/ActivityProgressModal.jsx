import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const ActivityProgressModal = ({
  progressUpdate,
  setProgressUpdate,
  onConfirm,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Add Progress Update</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Track your progress on this activity
            </p>
            <div>
              <Label>Progress Details *</Label>
              <textarea
                className="w-full border rounded-md p-2 mt-1"
                rows="4"
                placeholder="What have you completed? What's next?"
                value={progressUpdate.update}
                onChange={(e) => setProgressUpdate({...progressUpdate, update: e.target.value})}
                required
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={onConfirm} className="bg-gradient-to-r from-blue-700 to-green-700">
                Save Progress
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityProgressModal;