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

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh data if needed
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
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        {/* Activities - Available to ALL users */}
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

        {/* Create Activity - Available to ALL users */}
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

        {/* Customers - Available to ALL users */}
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
            <Text style={styles.actionIcon}>📁</Text>
            <Text style={styles.actionTitle}>Customers</Text>
            <Text style={styles.actionDescription}>
              View and manage customer database
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Products - Only for ADMIN and SALES users */}
        {(user?.role === 'admin' || user?.role === 'sales') && (
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
              <Text style={styles.actionIcon}>📦</Text>
              <Text style={styles.actionTitle}>Products</Text>
              <Text style={styles.actionDescription}>
                Browse and manage product catalog
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Leads - Only for ADMIN and SALES users */}
        {(user?.role === 'admin' || user?.role === 'sales') && (
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
              <Text style={styles.actionIcon}>🎯</Text>
              <Text style={styles.actionTitle}>Leads</Text>
              <Text style={styles.actionDescription}>
                Track sales pipeline and opportunities
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Logout Button - Available to ALL users */}
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
