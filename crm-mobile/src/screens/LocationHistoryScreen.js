import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { locationAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { startLocationTracking, stopLocationTracking, isLocationTrackingActive, requestLocationPermissions } from '../services/locationService';

export default function LocationHistoryScreen({ navigation }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    fetchLocationHistory();
    checkTrackingStatus();
  }, []);

  const checkTrackingStatus = async () => {
    const tracking = await isLocationTrackingActive();
    setIsTracking(tracking);
  };

  const fetchLocationHistory = async () => {
    try {
      const data = await locationAPI.getMyLocationHistory();
      setLocations(data);
    } catch (error) {
      console.error('Failed to fetch location history:', error);
      Alert.alert('Error', 'Failed to load location history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleTracking = async () => {
    if (isTracking) {
      // Stop tracking
      const result = await stopLocationTracking();
      if (result.success) {
        setIsTracking(false);
        Alert.alert('Success', 'Location tracking stopped');
      } else {
        Alert.alert('Error', 'Failed to stop location tracking');
      }
    } else {
      // Start tracking
      const permissionResult = await requestLocationPermissions();
      if (!permissionResult.success) {
        Alert.alert('Permission Denied', permissionResult.message);
        return;
      }

      const result = await startLocationTracking();
      if (result.success) {
        setIsTracking(true);
        Alert.alert('Success', 'Location tracking started');
      } else {
        Alert.alert('Error', `Failed to start location tracking: ${result.error}`);
      }
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLocationHistory();
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const renderLocationItem = ({ item, index }) => (
    <View style={styles.locationCard}>
      <View style={styles.locationHeader}>
        <Ionicons name="location" size={24} color="#2563eb" />
        <View style={styles.locationInfo}>
          <Text style={styles.locationTime}>{formatDate(item.timestamp)}</Text>
          <Text style={styles.locationCoords}>
            {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
          </Text>
        </View>
      </View>
      {index < locations.length - 1 && <View style={styles.locationLine} />}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading location history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with tracking toggle */}
      <View style={styles.header}>
        <Text style={styles.title}>Location History</Text>
        <TouchableOpacity
          style={[styles.trackingButton, isTracking && styles.trackingButtonActive]}
          onPress={handleToggleTracking}
        >
          <Ionicons
            name={isTracking ? 'stop-circle' : 'play-circle'}
            size={20}
            color="white"
          />
          <Text style={styles.trackingButtonText}>
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tracking Status Banner */}
      {isTracking && (
        <View style={styles.statusBanner}>
          <View style={styles.pulseIndicator} />
          <Text style={styles.statusText}>Live location tracking active</Text>
        </View>
      )}

      {/* Location List */}
      {locations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Location History</Text>
          <Text style={styles.emptyText}>
            {isTracking
              ? 'Location tracking is active. Your location will be recorded.'
              : 'Enable location tracking to start recording your location history.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={locations}
          renderItem={renderLocationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  trackingButtonActive: {
    backgroundColor: '#dc2626',
  },
  trackingButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  pulseIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563eb',
  },
  statusText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  locationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  locationLine: {
    position: 'absolute',
    left: 28,
    top: 48,
    width: 2,
    height: 30,
    backgroundColor: '#e5e7eb',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
