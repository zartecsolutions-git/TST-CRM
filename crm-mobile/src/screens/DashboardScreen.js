import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../utils/colors';
import {
  requestLocationPermissions,
  startLocationTracking,
  stopLocationTracking,
  isLocationTrackingActive,
} from '../services/locationService';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [tracking, setTracking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkTracking();
  }, []);

  const checkTracking = async () => {
    const isActive = await isLocationTrackingActive();
    setTracking(isActive);
  };

  const handleLocationTracking = async () => {
    if (tracking) {
      const result = await stopLocationTracking();
      if (result.success) {
        setTracking(false);
        Alert.alert('Success', 'Location tracking stopped');
      }
    } else {
      const permission = await requestLocationPermissions();
      if (!permission.success) {
        Alert.alert('Permission Required', permission.message);
        return;
      }

      const result = await startLocationTracking();
      if (result.success) {
        setTracking(true);
        Alert.alert('Success', 'Location tracking started');
      } else {
        Alert.alert('Error', result.error);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkTracking();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
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
        <Text style={styles.headerTitle}>CRM Dashboard</Text>
        <Text style={styles.headerSubtitle}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{user?.role?.toUpperCase()}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Location Tracking Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📍 Location Tracking</Text>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: tracking ? colors.success : colors.textSecondary },
              ]}
            />
          </View>
          <Text style={styles.cardDescription}>
            {tracking
              ? 'Your location is being tracked in the background'
              : 'Start tracking to share your location'}
          </Text>
          <TouchableOpacity
            style={[
              styles.trackingButton,
              { backgroundColor: tracking ? colors.error : colors.primary },
            ]}
            onPress={handleLocationTracking}
          >
            <Text style={styles.trackingButtonText}>
              {tracking ? 'Stop Tracking' : 'Start Tracking'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Activities')}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>My Activities</Text>
            <Text style={styles.actionDescription}>
              View and manage your assigned activities
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('CreateActivity')}
        >
          <LinearGradient
            colors={[colors.secondary, colors.secondaryDark]}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionTitle}>Create Activity</Text>
            <Text style={styles.actionDescription}>
              Add a new activity or task
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Customers')}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.actionIcon}>\ud83d\udcc1</Text>
            <Text style={styles.actionTitle}>Customers</Text>
            <Text style={styles.actionDescription}>
              View and manage customer database
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Products')}
        >
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.actionIcon}>\ud83d\udce6</Text>
            <Text style={styles.actionTitle}>Products</Text>
            <Text style={styles.actionDescription}>
              Browse and manage product catalog
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Leads')}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.actionIcon}>\ud83c\udfaf</Text>
            <Text style={styles.actionTitle}>Leads</Text>
            <Text style={styles.actionDescription}>
              Track sales pipeline and opportunities
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  roleBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  trackingButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  trackingButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  actionCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  logoutButton: {
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
