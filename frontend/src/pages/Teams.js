import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import api from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const Teams = () => {
  const { user: currentUser } = useAuth();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teamsRes, usersRes] = await Promise.all([
        api.get('/teams'),
        api.get('/users')
      ]);
      setTeams(teamsRes.data);
      setUsers(usersRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teams', newTeam);
      alert('Team created successfully!');
      setNewTeam({ name: '', description: '' });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      alert('Error creating team: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleAddMember = async (teamId, userId) => {
    try {
      await api.post(`/teams/${teamId}/members/${userId}`);
      alert('Member added successfully!');
      fetchData();
    } catch (error) {
      alert('Error adding member: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleRemoveMember = async (teamId, userId) => {
    try {
      await api.delete(`/teams/${teamId}/members/${userId}`);
      alert('Member removed successfully!');
      fetchData();
    } catch (error) {
      alert('Error removing member: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    
    try {
      await api.delete(`/teams/${teamId}`);
      alert('Team deleted successfully!');
      fetchData();
    } catch (error) {
      alert('Error deleting team: ' + (error.response?.data?.detail || error.message));
    }
  };

  const getTeamMembers = (team) => {
    return users.filter(user => team.member_ids?.includes(user.id));
  };

  const getAvailableUsers = (team) => {
    return users.filter(user => !team.member_ids?.includes(user.id));
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-50">
      <PageHeader title="Teams Management">
        <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
          Back to Dashboard
        </Button>
      </PageHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">All Teams ({teams.length})</h2>
          {isAdmin && (
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-blue-500 to-green-500"
            >
              + Create Team
            </Button>
          )}
        </div>

        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Team</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTeam} className="space-y-4">
                <div>
                  <Label>Team Name</Label>
                  <Input
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <textarea
                    className="w-full border rounded-md p-2"
                    rows="3"
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" className="bg-gradient-to-r from-blue-500 to-green-500">
                    Create Team
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{team.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                    </div>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteTeam(team.id)}
                      >
                        Delete Team
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Team Members ({getTeamMembers(team).length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {getTeamMembers(team).map(member => (
                        <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 rounded-full ${
                              member.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                              member.role === 'agent' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                            } flex items-center justify-center text-sm font-bold`}>
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.role}</p>
                            </div>
                          </div>
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveMember(team.id, member.id)}
                            >
                              ✕
                            </Button>
                          )}
                        </div>
                      ))}
                      {getTeamMembers(team).length === 0 && (
                        <p className="text-sm text-gray-500">No members yet</p>
                      )}
                    </div>
                  </div>

                  {getAvailableUsers(team).length > 0 && isAdmin && (
                    <div>
                      <h4 className="font-semibold mb-2">Add Members</h4>
                      <div className="flex flex-wrap gap-2">
                        {getAvailableUsers(team).map(user => (
                          <Button
                            key={user.id}
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddMember(team.id, user.id)}
                          >
                            + {user.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && teams.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No teams found. Create your first team!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Teams;
