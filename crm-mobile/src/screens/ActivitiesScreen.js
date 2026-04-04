import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { activitiesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../utils/colors';

export default function ActivitiesScreen({ navigation }) {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  
  // Modals
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [statusNotes, setStatusNotes] = useState('');
  const [progressUpdate, setProgressUpdate] = useState({ update: '', percentage: 0 });

  useEffect(() => {
    fetchActivities();
  }, [filter]);

  const fetchActivities = async () => {
    try {
      const response = await activitiesAPI.getAll(filter !== 'all' ? filter : null);
      setActivities(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch activities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const handleUpdateStatus = (activity) => {
    const newStatus = activity.status === 'pending' ? 'in_progress' : 'completed';
    setSelectedActivity({ ...activity, newStatus });
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (!statusNotes.trim()) {
      Alert.alert('Required', 'Please enter status update notes');
      return;
    }

    try {
      await activitiesAPI.update(selectedActivity.id, {
        status: selectedActivity.newStatus,
        notes: statusNotes,
      });
      
      setShowStatusModal(false);
      setStatusNotes('');
      setSelectedActivity(null);
      fetchActivities();
      Alert.alert('Success', 'Activity status updated');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleAddProgress = (activity) => {
    setSelectedActivity(activity);
    setShowProgressModal(true);
  };

  const confirmProgressUpdate = async () => {
    if (!progressUpdate.update.trim()) {
      Alert.alert('Required', 'Please enter progress details');
      return;
    }

    try {
      await activitiesAPI.addProgress(selectedActivity.id, progressUpdate);
      
      setShowProgressModal(false);
      setProgressUpdate({ update: '', percentage: 0 });
      setSelectedActivity(null);
      fetchActivities();
      Alert.alert('Success', 'Progress update added');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add progress');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return colors.statusPending;
      case 'in_progress': return colors.statusInProgress;
      case 'completed': return colors.statusCompleted;
      default: return colors.textSecondary;
    }
  };

  const getStatusText = (status) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const renderActivity = ({ item }) => {
    const handleCardPress = () => {
      navigation.navigate('ActivityDetails', { activityId: item.id });
    };

    const handleProgressPress = () => {
      handleAddProgress(item);
    };

    const handleStatusPress = () => {
      handleUpdateStatus(item);
    };

    return (
      <View style={styles.activityCard}>
        <TouchableOpacity 
          onPress={handleCardPress}
          activeOpacity={0.7}
        >
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          </View>
          
          {item.description && (
            <Text style={styles.activityDescription}>{item.description}</Text>
          )}

          <Text style={styles.tapHint}>👆 Tap to view full details</Text>

          {/* Progress Updates */}
          {item.status === 'in_progress' && item.progress_updates && item.progress_updates.length > 0 && (
            <View style={styles.progressSection}>
              <Text style={styles.progressTitle}>Progress Updates:</Text>
              {item.progress_updates.slice().reverse().slice(0, 2).map((update, idx) => (
                <View key={idx} style={styles.progressUpdate}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressPercentage}>{update.percentage}% Complete</Text>
                    <Text style={styles.progressTime}>
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                  <Text style={styles.progressText}>{update.update}</Text>
                </View>
              ))}
              {item.progress_updates.length > 2 && (
                <Text style={styles.moreUpdates}>+ {item.progress_updates.length - 2} more updates</Text>
              )}
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.activityActions}>
          {item.status === 'in_progress' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.progressButton]}
              onPress={handleProgressPress}
            >
              <Text style={styles.progressButtonText}>+ Add Progress</Text>
            </TouchableOpacity>
          )}
          
          {item.status !== 'completed' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.statusButton]}
              onPress={handleStatusPress}
            >
              <Text style={styles.statusButtonText}>
                {item.status === 'pending' ? 'Start' : 'Complete'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={colors.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>Activities</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateActivity')}
        >
          <Text style={styles.createButtonText}>+ Create</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'pending', 'in_progress', 'completed'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : getStatusText(f)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Activities List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activities}
          renderItem={renderActivity}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No activities found</Text>
            </View>
          }
        />
      )}

      {/* Status Update Modal */}
      <Modal visible={showStatusModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Status</Text>
            <Text style={styles.modalSubtitle}>
              Status: <Text style={styles.modalStatus}>{selectedActivity?.newStatus?.replace('_', ' ')}</Text>
            </Text>
            
            <TextInput
              style={styles.modalTextArea}
              placeholder="Enter details about this status update..."
              value={statusNotes}
              onChangeText={setStatusNotes}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowStatusModal(false);
                  setStatusNotes('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmStatusUpdate}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Progress Update Modal */}
      <Modal visible={showProgressModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Progress Update</Text>
              
              <TextInput
                style={styles.modalTextArea}
                placeholder="What have you completed? What's next?"
                value={progressUpdate.update}
                onChangeText={(text) => setProgressUpdate({ ...progressUpdate, update: text })}
                multiline
                numberOfLines={4}
              />
              
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Completion Percentage</Text>
                <View style={styles.sliderRow}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={100}
                    step={5}
                    value={progressUpdate.percentage}
                    onValueChange={(value) => setProgressUpdate({ ...progressUpdate, percentage: value })}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={colors.border}
                  />
                  <Text style={styles.sliderValue}>{progressUpdate.percentage}%</Text>
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowProgressModal(false);
                    setProgressUpdate({ update: '', percentage: 0 });
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={confirmProgressUpdate}
                >
                  <Text style={[styles.modalButtonText, { color: 'white' }]}>Add Progress</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  createButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  activityTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  activityDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  tapHint: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  progressSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  progressUpdate: {
    backgroundColor: '#EBF5FF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  progressTime: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  progressText: {
    fontSize: 12,
    color: colors.text,
  },
  moreUpdates: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: 'italic',
  },
  activityActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  progressButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  progressButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  statusButton: {
    backgroundColor: colors.primary,
  },
  statusButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  modalStatus: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  modalTextArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    marginRight: 12,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    width: 50,
    textAlign: 'right',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
