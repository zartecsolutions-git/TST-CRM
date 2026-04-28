import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock, Edit2, CheckCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DailyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    task_date: new Date().toISOString().split('T')[0],
    task_description: '',
    hours_spent: '',
    status: 'logged'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/daily-tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const url = editingTask 
        ? `${API_URL}/api/daily-tasks/${editingTask.id}`
        : `${API_URL}/api/daily-tasks`;
      
      const method = editingTask ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          hours_spent: parseFloat(formData.hours_spent)
        })
      });

      if (response.ok) {
        setSuccess(editingTask ? 'Task updated successfully!' : 'Task logged successfully!');
        setShowForm(false);
        setEditingTask(null);
        setFormData({
          task_date: new Date().toISOString().split('T')[0],
          task_description: '',
          hours_spent: '',
          status: 'logged'
        });
        fetchTasks();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to save task');
      }
    } catch (error) {
      setError('Error saving task');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      task_date: task.task_date,
      task_description: task.task_description,
      hours_spent: task.hours_spent.toString(),
      status: task.status
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingTask(null);
    setFormData({
      task_date: new Date().toISOString().split('T')[0],
      task_description: '',
      hours_spent: '',
      status: 'logged'
    });
    setError('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-green-700 bg-clip-text text-transparent">
            Daily Tasks
          </h1>
          <p className="text-gray-600 mt-1">Log your daily work and hours</p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-700 to-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log New Task
          </Button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Task Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingTask ? 'Edit Task' : 'Log New Task'}</CardTitle>
            <CardDescription>Enter your daily task details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.task_date}
                    onChange={(e) => setFormData({...formData, task_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Hours Spent</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={formData.hours_spent}
                    onChange={(e) => setFormData({...formData, hours_spent: e.target.value})}
                    placeholder="e.g., 8"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Task Description</label>
                <textarea
                  value={formData.task_description}
                  onChange={(e) => setFormData({...formData, task_description: e.target.value})}
                  placeholder="Describe what you worked on today..."
                  rows="4"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <input
                  type="text"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  placeholder="e.g., In Progress, Completed, etc."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-700 to-green-700"
                >
                  {loading ? 'Saving...' : editingTask ? 'Update Task' : 'Log Task'}
                </Button>
                <Button
                  type="button"
                  onClick={cancelForm}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No tasks logged yet</p>
              <p className="text-sm mt-2">Start logging your daily tasks to track your work</p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(task.task_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        {task.hours_spent} hours
                      </div>
                      {task.status && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {task.status}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{task.task_description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Logged by: {task.user_name}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleEdit(task)}
                    variant="ghost"
                    size="sm"
                    className="ml-4"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DailyTasks;
