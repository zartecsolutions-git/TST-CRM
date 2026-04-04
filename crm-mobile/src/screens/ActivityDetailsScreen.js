import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { activitiesAPI } from '../services/api';
import { colors } from '../utils/colors';

export default function ActivityDetailsScreen({ route, navigation }) {
  const { activityId } = route.params;
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Add Progress Modal State
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressUpdate, setProgressUpdate] = useState({ update: '', percentage: 0 });
  const [savingProgress, setSavingProgress] = useState(false);

  useEffect(() => {
    fetchActivityDetails();
  }, []);

  const fetchActivityDetails = async () => {
    try {
      console.log('Fetching activity details for ID:', activityId);
      const response = await activitiesAPI.getAll();
      console.log('Total activities fetched:', response.data.length);
      
      const activityData = response.data.find(a => a.id === activityId);
      
      if (activityData) {
        console.log('Activity found:', activityData.title);
        setActivity(activityData);
      } else {
        console.error('Activity not found with ID:', activityId);
        Alert.alert('Error', 'Activity not found', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error fetching activity details:', error);
      Alert.alert('Error', 'Failed to fetch activity details: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivityDetails();
  };

  const handleAddProgress = () => {
    setProgressUpdate({ update: '', percentage: 0 });
    setShowProgressModal(true);
  };

  const handleSaveProgress = async () => {
    if (!progressUpdate.update.trim()) {
      Alert.alert('Required', 'Please enter progress details');
      return;
    }

    setSavingProgress(true);
    try {
      await activitiesAPI.addProgress(activityId, progressUpdate);
      Alert.alert('Success', 'Progress update added');
      setShowProgressModal(false);
      setProgressUpdate({ update: '', percentage: 0 });
      fetchActivityDetails(); // Refresh to show new progress
    } catch (error) {
      console.error('Error adding progress:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add progress');
    } finally {
      setSavingProgress(false);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Activity not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={colors.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Details</Text>
        
        {/* Add Progress Button in Header */}
        {activity.status === 'in_progress' && (
          <TouchableOpacity 
            style={styles.headerAddButton}
            onPress={handleAddProgress}
          >
            <Text style={styles.headerAddButtonText}>+ Progress</Text>
          </TouchableOpacity>
        )}
        {activity.status !== 'in_progress' && <View style={{ width: 80 }} />}
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Title & Status */}
        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activity.status) }]}>
              <Text style={styles.statusText}>{getStatusText(activity.status)}</Text>
            </View>
          </View>
          {activity.description && (
            <Text style={styles.description}>{activity.description}</Text>
          )}
        </View>

        {/* Activity Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Information</Text>
          
          {activity.activity_type && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoValue}>{activity.activity_type}</Text>
            </View>
          )}
          
          {activity.priority && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Priority:</Text>
              <Text style={[styles.infoValue, styles.priorityBadge]}>
                {activity.priority.toUpperCase()}
              </Text>
            </View>
          )}
          
          {activity.assigned_to && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assigned To:</Text>
              <Text style={styles.infoValue}>{activity.assigned_to}</Text>
            </View>
          )}
          
          {activity.support_staff && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Support Staff:</Text>
              <Text style={styles.infoValue}>{activity.support_staff}</Text>
            </View>
          )}
          
          {activity.customer_id && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Customer:</Text>
              <Text style={styles.infoValue}>{activity.customer_id}</Text>
            </View>
          )}
          
          {activity.due_date && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Due Date:</Text>
              <Text style={styles.infoValue}>{formatDate(activity.due_date)}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>{formatDate(activity.created_at)}</Text>
          </View>
          
          {activity.completion_date && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Completed:</Text>
              <Text style={styles.infoValue}>{formatDate(activity.completion_date)}</Text>
            </View>
          )}
        </View>

        {/* Invoice & Financial Details (if completed) */}
        {activity.status === 'completed' && (activity.invoice_number || activity.work_order_no || activity.total_amount) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Financial Details</Text>
            
            {activity.invoice_number && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Invoice #:</Text>
                <Text style={styles.infoValue}>{activity.invoice_number}</Text>
              </View>
            )}
            
            {activity.work_order_no && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Work Order #:</Text>
                <Text style={styles.infoValue}>{activity.work_order_no}</Text>
              </View>
            )}
            
            {activity.total_amount && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Amount:</Text>
                <Text style={[styles.infoValue, styles.amountText]}>
                  ${activity.total_amount.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Progress Updates - Full History */}
        {activity.progress_updates && activity.progress_updates.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                📊 Progress History ({activity.progress_updates.length} updates)
              </Text>
              {activity.status === 'in_progress' && (
                <TouchableOpacity 
                  style={styles.addProgressSmallButton}
                  onPress={handleAddProgress}
                >
                  <Text style={styles.addProgressSmallButtonText}>+ Add</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {activity.progress_updates.slice().reverse().map((update, index) => (
              <View key={index} style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <View style={styles.progressPercentageContainer}>
                    <Text style={styles.progressPercentage}>
                      {update.percentage}%
                    </Text>
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { width: `${update.percentage}%` }
                        ]} 
                      />
                    </View>
                  </View>
                  <Text style={styles.progressDate}>
                    {formatDate(update.timestamp)}
                  </Text>
                </View>
                <Text style={styles.progressText}>{update.update}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Show "No Progress Yet" for in_progress activities without updates */}
        {activity.status === 'in_progress' && (!activity.progress_updates || activity.progress_updates.length === 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📊 Progress History</Text>
              <TouchableOpacity 
                style={styles.addProgressSmallButton}
                onPress={handleAddProgress}
              >
                <Text style={styles.addProgressSmallButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.emptyProgressContainer}>
              <Text style={styles.emptyProgressText}>No progress updates yet</Text>
              <TouchableOpacity 
                style={styles.emptyProgressButton}
                onPress={handleAddProgress}
              >
                <Text style={styles.emptyProgressButtonText}>Add First Progress Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Status History */}
        {activity.status_history && activity.status_history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🔄 Status History ({activity.status_history.length} changes)
            </Text>
            
            {activity.status_history.slice().reverse().map((history, index) => (
              <View key={index} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <View style={[
                    styles.historyStatusBadge, 
                    { backgroundColor: getStatusColor(history.status) }
                  ]}>
                    <Text style={styles.historyStatusText}>
                      {getStatusText(history.status)}
                    </Text>
                  </View>
                  <Text style={styles.historyDate}>
                    {formatDate(history.timestamp)}
                  </Text>
                </View>
                {history.notes && (
                  <Text style={styles.historyNotes}>{history.notes}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Location (if available) */}
        {(activity.location_lat && activity.location_lng) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Location</Text>
            <Text style={styles.infoValue}>
              Lat: {activity.location_lat}, Lng: {activity.location_lng}
            </Text>
          </View>
        )}

        {/* Maintenance Report (if available) */}
        {activity.maintenance_report && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Maintenance Report</Text>
            <Text style={styles.reportText}>{activity.maintenance_report}</Text>
          </View>
        )}

      </ScrollView>

      {/* Add Progress Modal */}
      <Modal visible={showProgressModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
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
                disabled={savingProgress}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleSaveProgress}
                disabled={savingProgress}
              >
                {savingProgress ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: 'white' }]}>Save Progress</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  backButton: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerAddButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerAddButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginTop: 40,
  },
  section: {
    backgroundColor: colors.surface,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  addProgressSmallButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addProgressSmallButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    width: 120,
    fontWeight: '600',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  priorityBadge: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  progressCard: {
    backgroundColor: '#EBF5FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  progressHeader: {
    marginBottom: 12,
  },
  progressPercentageContainer: {
    marginBottom: 8,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#D1E7F8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  emptyProgressContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyProgressText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  emptyProgressButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyProgressButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  historyStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  historyDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  historyNotes: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  reportText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
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
    marginBottom: 20,
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
