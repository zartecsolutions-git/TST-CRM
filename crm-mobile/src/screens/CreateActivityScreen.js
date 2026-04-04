import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { activitiesAPI, usersAPI, customersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../utils/colors';
import { Picker } from '@react-native-picker/picker';

export default function CreateActivityScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    customer_id: '',
    status: 'pending',
    priority: 'medium',
    activity_type: 'others',
  });

  useEffect(() => {
    fetchUsers();
    fetchCustomers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
      
      // Auto-assign to current user if support role
      if (user?.role === 'support' && user?.id) {
        setFormData(prev => ({ ...prev, assigned_to: user.id }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customersAPI.getAll();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Required', 'Please enter activity title');
      return;
    }

    if (!formData.assigned_to) {
      Alert.alert('Required', 'Please assign the activity to a user');
      return;
    }

    setLoading(true);
    try {
      // Clean up empty fields
      const payload = {
        title: formData.title,
        description: formData.description || null,
        assigned_to: formData.assigned_to,
        customer_id: formData.customer_id || null,
        status: formData.status,
        priority: formData.priority,
        activity_type: formData.activity_type,
      };

      await activitiesAPI.create(payload);
      Alert.alert('Success', 'Activity created successfully', [
        { 
          text: 'OK', 
          onPress: () => {
            navigation.goBack();
            // Optionally navigate to Activities screen
            navigation.navigate('Activities');
          }
        },
      ]);
    } catch (error) {
      console.error('Create activity error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create activity';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Activity</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter activity title"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter activity description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Activity Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.activity_type}
                onValueChange={(value) => setFormData({ ...formData, activity_type: value })}
                style={styles.picker}
              >
                <Picker.Item label="Demo/POC" value="demo_poc" />
                <Picker.Item label="Warranty" value="warranty" />
                <Picker.Item label="Service Call" value="service_call" />
                <Picker.Item label="Maintenance" value="maintenance" />
                <Picker.Item label="Installation" value="installation" />
                <Picker.Item label="Training" value="training" />
                <Picker.Item label="Others" value="others" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assign To *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                style={styles.picker}
                enabled={user?.role !== 'support'}
              >
                <Picker.Item label="Select User" value="" />
                {users.map((u) => (
                  <Picker.Item
                    key={u.id}
                    label={`${u.name} (${u.role})`}
                    value={u.id}
                  />
                ))}
              </Picker>
            </View>
            {user?.role === 'support' && (
              <Text style={styles.helpText}>Auto-assigned to you</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.customer_id}
                onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                style={styles.picker}
              >
                <Picker.Item label="Select Customer (Optional)" value="" />
                {customers.map((customer) => (
                  <Picker.Item
                    key={customer.id}
                    label={customer.name}
                    value={customer.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
                style={styles.picker}
              >
                <Picker.Item label="Low" value="low" />
                <Picker.Item label="Medium" value="medium" />
                <Picker.Item label="High" value="high" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Initial Status</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                style={styles.picker}
              >
                <Picker.Item label="Pending" value="pending" />
                <Picker.Item label="In Progress" value="in_progress" />
                <Picker.Item label="Completed" value="completed" />
              </Picker>
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCreate}
            disabled={loading}
          >
            <LinearGradient
              colors={colors.gradient}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Create Activity</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
