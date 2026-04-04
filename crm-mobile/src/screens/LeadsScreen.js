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
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { leadsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../utils/colors';

export default function LeadsScreen({ navigation }) {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    status: 'new',
    source: '',
    notes: '',
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await leadsAPI.getAll();
      setLeads(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch leads');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeads();
  };

  const handleCreate = () => {
    setEditingLead(null);
    setFormData({
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      status: 'new',
      source: '',
      notes: '',
    });
    setShowModal(true);
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setFormData({
      company_name: lead.company_name,
      contact_person: lead.contact_person || '',
      email: lead.email || '',
      phone: lead.phone || '',
      status: lead.status,
      source: lead.source || '',
      notes: lead.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.company_name.trim()) {
      Alert.alert('Required', 'Company name is required');
      return;
    }

    try {
      if (editingLead) {
        await leadsAPI.update(editingLead.id, formData);
        Alert.alert('Success', 'Lead updated');
      } else {
        await leadsAPI.create(formData);
        Alert.alert('Success', 'Lead created');
      }
      setShowModal(false);
      fetchLeads();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save lead');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return '#3B82F6';
      case 'contacted': return '#8B5CF6';
      case 'qualified': return '#10B981';
      case 'proposal': return '#F59E0B';
      case 'negotiation': return '#EF4444';
      case 'closed_won': return '#059669';
      case 'closed_lost': return '#6B7280';
      default: return colors.textSecondary;
    }
  };

  const getStatusText = (status) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const renderLead = ({ item }) => (
    <TouchableOpacity
      style={styles.leadCard}
      onPress={() => handleEdit(item)}
    >
      <View style={styles.leadHeader}>
        <Text style={styles.leadCompany}>{item.company_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      {item.contact_person && (
        <Text style={styles.leadContact}>👤 {item.contact_person}</Text>
      )}
      {item.email && (
        <Text style={styles.leadDetail}>📧 {item.email}</Text>
      )}
      {item.phone && (
        <Text style={styles.leadDetail}>📞 {item.phone}</Text>
      )}
      {item.source && (
        <Text style={styles.leadSource}>Source: {item.source}</Text>
      )}
      {item.project_value && (
        <Text style={styles.projectValue}>💰 ${item.project_value.toLocaleString()}</Text>
      )}
    </TouchableOpacity>
  );

  const leadStatuses = [
    { label: 'New', value: 'new' },
    { label: 'Contacted', value: 'contacted' },
    { label: 'Qualified', value: 'qualified' },
    { label: 'Proposal Sent', value: 'proposal' },
    { label: 'Negotiation', value: 'negotiation' },
    { label: 'Closed Won', value: 'closed_won' },
    { label: 'Closed Lost', value: 'closed_lost' },
  ];

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
        <Text style={styles.headerTitle}>Leads</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
        >
          <Text style={styles.createButtonText}>+ Add</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Leads List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={leads}
          renderItem={renderLead}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No leads found</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleCreate}>
                <Text style={styles.emptyButtonText}>Add First Lead</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Create/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingLead ? 'Edit Lead' : 'New Lead'}
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="Company Name *"
                value={formData.company_name}
                onChangeText={(text) => setFormData({ ...formData, company_name: text })}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Contact Person"
                value={formData.contact_person}
                onChangeText={(text) => setFormData({ ...formData, contact_person: text })}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
              
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Status</Text>
                <Picker
                  selectedValue={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  style={styles.picker}
                >
                  {leadStatuses.map((status) => (
                    <Picker.Item key={status.value} label={status.label} value={status.value} />
                  ))}
                </Picker>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Source (e.g., Website, Referral)"
                value={formData.source}
                onChangeText={(text) => setFormData({ ...formData, source: text })}
              />
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes"
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={3}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={handleSave}
                >
                  <Text style={[styles.modalButtonText, { color: 'white' }]}>
                    {editingLead ? 'Update' : 'Create'}
                  </Text>
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
  backButton: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  leadCard: {
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
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leadCompany: {
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
  leadContact: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 6,
    fontWeight: '600',
  },
  leadDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  leadSource: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  projectValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  picker: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
