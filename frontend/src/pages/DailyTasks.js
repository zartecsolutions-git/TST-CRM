import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock, Edit2, CheckCircle, MessageSquarePlus, Lock, User } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const initialFormData = () => ({
  task_date: new Date().toISOString().split('T')[0],
  task_description: '',
  hours_spent: '',
  status: 'logged',
  customer_id: '',
});

const DailyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState(initialFormData());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [progressDraft, setProgressDraft] = useState({}); // { [taskId]: 'note text' }
  const [busyTaskId, setBusyTaskId] = useState(null);

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  });

  useEffect(() => {
    fetchTasks();
    fetchCustomers();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/daily-tasks`, { headers: authHeaders() });
      if (response.ok) setTasks(await response.json());
    } catch (e) {
      console.error('Error fetching tasks:', e);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/daily-tasks/customers`, { headers: authHeaders() });
      if (response.ok) setCustomers(await response.json());
    } catch (e) {
      console.error('Error fetching customers:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = editingTask
        ? `${API_URL}/api/daily-tasks/${editingTask.id}`
        : `${API_URL}/api/daily-tasks`;
      const method = editingTask ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        hours_spent: parseFloat(formData.hours_spent),
        customer_id: formData.customer_id || null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccess(editingTask ? 'Task updated successfully!' : 'Task logged successfully!');
        setShowForm(false);
        setEditingTask(null);
        setFormData(initialFormData());
        fetchTasks();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to save task');
      }
    } catch (err) {
      setError('Error saving task');
      console.error('Error:', err);
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
      status: task.status,
      customer_id: task.customer_id || '',
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingTask(null);
    setFormData(initialFormData());
    setError('');
  };

  const submitProgress = async (taskId) => {
    const note = (progressDraft[taskId] || '').trim();
    if (!note) return;
    setBusyTaskId(taskId);
    try {
      const response = await fetch(`${API_URL}/api/daily-tasks/${taskId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ note }),
      });
      if (response.ok) {
        setProgressDraft((prev) => ({ ...prev, [taskId]: '' }));
        await fetchTasks();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to add progress');
      }
    } finally {
      setBusyTaskId(null);
    }
  };

  const closeTask = async (taskId) => {
    if (!window.confirm('Mark this task as completed? Once closed, the task cannot be edited.')) return;
    setBusyTaskId(taskId);
    try {
      const response = await fetch(`${API_URL}/api/daily-tasks/${taskId}/close`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (response.ok) {
        setSuccess('Task marked as completed');
        await fetchTasks();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to close task');
      }
    } finally {
      setBusyTaskId(null);
    }
  };

  const statusBadge = (status) => {
    const map = {
      logged: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-amber-100 text-amber-700',
      completed: 'bg-green-100 text-green-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
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
            data-testid="log-new-task-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log New Task
          </Button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded" data-testid="success-banner">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" data-testid="error-banner">
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
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="daily-task-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.task_date}
                    onChange={(e) => setFormData({ ...formData, task_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    data-testid="task-date-input"
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
                    onChange={(e) => setFormData({ ...formData, hours_spent: e.target.value })}
                    placeholder="e.g., 8"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    data-testid="task-hours-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Customer</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  data-testid="task-customer-select"
                >
                  <option value="">— No customer —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Task Description</label>
                <textarea
                  value={formData.task_description}
                  onChange={(e) => setFormData({ ...formData, task_description: e.target.value })}
                  placeholder="Describe what you worked on today..."
                  rows="4"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  data-testid="task-description-input"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-700 to-green-700"
                  data-testid="task-save-btn"
                >
                  {loading ? 'Saving...' : editingTask ? 'Update Task' : 'Log Task'}
                </Button>
                <Button type="button" onClick={cancelForm} variant="outline" data-testid="task-cancel-btn">
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
          tasks.map((task) => {
            const isClosed = task.status === 'completed';
            return (
              <Card key={task.id} className="hover:shadow-md transition-shadow" data-testid={`task-card-${task.id}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(task.task_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-1" />
                          {task.hours_spent} hours
                        </div>
                        {task.customer_name && (
                          <div className="flex items-center text-sm text-gray-700" data-testid={`task-customer-${task.id}`}>
                            <User className="w-4 h-4 mr-1" />
                            {task.customer_name}
                          </div>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${statusBadge(task.status)}`} data-testid={`task-status-${task.id}`}>
                          {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-800 whitespace-pre-wrap">{task.task_description}</p>
                      <p className="text-xs text-gray-500 mt-2">Logged by: {task.user_name}</p>

                      {/* Progress Notes */}
                      {task.progress_notes && task.progress_notes.length > 0 && (
                        <div className="mt-3 border-l-2 border-blue-200 pl-3 space-y-2" data-testid={`task-progress-list-${task.id}`}>
                          <p className="text-xs font-semibold text-gray-700">Progress</p>
                          {task.progress_notes.map((p, i) => (
                            <div key={`${task.id}-pn-${i}`} className="text-sm">
                              <span className="text-xs text-gray-500 mr-2">
                                {new Date(p.timestamp).toLocaleString()}
                              </span>
                              <span className="text-gray-800">{p.note}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add progress + Close (only when not completed) */}
                      {!isClosed ? (
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">Add progress note</label>
                            <textarea
                              rows="2"
                              value={progressDraft[task.id] || ''}
                              onChange={(e) => setProgressDraft({ ...progressDraft, [task.id]: e.target.value })}
                              placeholder="Update on what you did since last entry..."
                              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              data-testid={`task-progress-input-${task.id}`}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={() => submitProgress(task.id)}
                              disabled={busyTaskId === task.id || !(progressDraft[task.id] || '').trim()}
                              className="bg-amber-600 hover:bg-amber-700 text-white"
                              data-testid={`task-add-progress-btn-${task.id}`}
                            >
                              <MessageSquarePlus className="w-4 h-4 mr-1" />
                              Add Progress
                            </Button>
                            <Button
                              type="button"
                              onClick={() => closeTask(task.id)}
                              disabled={busyTaskId === task.id}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              data-testid={`task-close-btn-${task.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Complete
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center text-sm text-gray-500" data-testid={`task-closed-indicator-${task.id}`}>
                          <Lock className="w-4 h-4 mr-1" />
                          Task is closed and locked from edits
                        </div>
                      )}
                    </div>

                    {!isClosed && (
                      <Button
                        onClick={() => handleEdit(task)}
                        variant="ghost"
                        size="sm"
                        className="ml-2 shrink-0"
                        data-testid={`task-edit-btn-${task.id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DailyTasks;
