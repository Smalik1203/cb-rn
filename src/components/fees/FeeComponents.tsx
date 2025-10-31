import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Platform, ToastAndroid } from 'react-native';
import { Text, Button, ActivityIndicator, Portal, Modal as PaperModal, IconButton } from 'react-native-paper';
import { Plus, Edit, Trash2, X, DollarSign } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius, shadows, typography } from '../../../lib/design-system';

interface FeeComponent {
  id: string;
  name: string;
  default_amount_paise: number | null;
  created_at: string;
  code: string;
}

interface FeeComponentsProps {
  schoolCode: string;
}

const toast = (msg: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert('Notice', msg);
  }
};

const formatAmount = (paise: number | null) => {
  if (!paise) return '₹---';
  const amount = paise / 100;
  if (amount === 0) return '₹0';
  
  const absAmount = Math.abs(amount);
  
  // Format large numbers more cleanly
  if (absAmount >= 10000000) {
    const crores = absAmount / 10000000;
    return `₹${crores.toFixed(1)}Cr`;
  }
  
  if (absAmount >= 100000) {
    const lakhs = absAmount / 100000;
    return `₹${lakhs.toFixed(1)}L`;
  }
  
  if (absAmount >= 1000) {
    const thousands = absAmount / 1000;
    return `₹${thousands.toFixed(1)}K`;
  }
  
  // For smaller amounts, show with proper formatting
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
};

export function FeeComponents({ schoolCode }: FeeComponentsProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingComponent, setEditingComponent] = useState<FeeComponent | null>(null);
  const [componentName, setComponentName] = useState('');
  const [componentAmount, setComponentAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();
  const { profile } = useAuth();

  // Fetch components
  const { data: components = [], isLoading } = useQuery({
    queryKey: ['feeComponents', schoolCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_component_types')
        .select('*')
        .eq('school_code', schoolCode)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as FeeComponent[];
    },
    enabled: !!schoolCode,
  });

  // Open add modal
  const openAddModal = () => {
    setEditingComponent(null);
    setComponentName('');
    setComponentAmount('');
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (component: FeeComponent) => {
    setEditingComponent(component);
    setComponentName(component.name);
    setComponentAmount(component.default_amount_paise ? (component.default_amount_paise / 100).toString() : '');
    setShowModal(true);
  };

  // Save component
  const handleSave = async () => {
    if (!componentName.trim()) {
      Alert.alert('Error', 'Enter component name');
      return;
    }
    
    // Amount is optional - if provided, validate it
    let amountPaise = null;
    if (componentAmount.trim()) {
      if (isNaN(parseFloat(componentAmount))) {
        Alert.alert('Error', 'Enter valid amount');
      return;
      }
      amountPaise = Math.round(parseFloat(componentAmount) * 100);
    }

    setLoading(true);
    try {
    if (editingComponent) {
        // Update
        const { error } = await supabase
          .from('fee_component_types')
          .update({
        name: componentName.trim(),
            default_amount_paise: amountPaise,
          })
          .eq('id', editingComponent.id);

        if (error) throw error;
        toast('Component updated');
    } else {
        // Create
        const { error } = await supabase
          .from('fee_component_types')
          .insert({
        name: componentName.trim(),
            default_amount_paise: amountPaise,
            school_code: schoolCode,
            code: componentName.toLowerCase().replace(/\s+/g, '_'),
            created_by: profile?.auth_id || '',
          });

        if (error) throw error;
        toast('Component added');
      }

      await queryClient.invalidateQueries({ queryKey: ['feeComponents', schoolCode] });
      setShowModal(false);
      setEditingComponent(null);
      setComponentName('');
      setComponentAmount('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  // Delete component
  const handleDelete = async (component: FeeComponent) => {
    Alert.alert(
      'Delete Component',
      `Delete "${component.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('fee_component_types')
                .delete()
                .eq('id', component.id);

              if (error) throw error;
              await queryClient.invalidateQueries({ queryKey: ['feeComponents', schoolCode] });
              toast('Component deleted');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Delete failed');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
          </View>
        ) : components.length === 0 ? (
          <View style={styles.emptyContainer}>
              <DollarSign size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No Components</Text>
            <Text style={styles.emptyText}>Tap + to add a fee component</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {components.map((component) => (
              <View key={component.id} style={styles.componentCard}>
                <View style={styles.componentContent}>
                  <View style={styles.componentInfo}>
                    <View style={styles.componentIconContainer}>
                      <DollarSign size={20} color={colors.primary[600]} />
                    </View>
                    <View style={styles.componentText}>
                      <Text style={styles.componentName}>{component.name}</Text>
                      <Text style={styles.componentCode}>Code: {component.code}</Text>
                    </View>
                  </View>
                  <View style={styles.componentRight}>
                    <Text style={styles.componentAmount}>
                      {formatAmount(component.default_amount_paise)}
                    </Text>
                    <View style={styles.componentActions}>
                      <IconButton
                        icon={() => <Edit size={18} color={colors.text.secondary} />}
                        size={18}
                        onPress={() => openEditModal(component)}
                        style={styles.actionIconButton}
                      />
                      <IconButton
                        icon={() => <Trash2 size={18} color={colors.error[600]} />}
                        size={18}
                        onPress={() => handleDelete(component)}
                        style={styles.actionIconButton}
                        iconColor={colors.error[600]}
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={openAddModal}
        >
          <Plus size={24} color={colors.text.inverse} />
        </TouchableOpacity>
      </View>

      {/* Modal */}
      {showModal && (
      <Portal>
          <PaperModal
          visible={showModal}
          onDismiss={() => {
            setShowModal(false);
              setEditingComponent(null);
              setComponentName('');
              setComponentAmount('');
          }}
          >
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                  {editingComponent ? 'Edit Component' : 'Add Component'}
              </Text>
              <IconButton
                icon={() => <X size={24} color={colors.text.primary} />}
                onPress={() => {
                  setShowModal(false);
                    setEditingComponent(null);
                    setComponentName('');
                    setComponentAmount('');
                }}
                size={24}
              />
            </View>

              <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Component Name</Text>
                  <TextInput
                  style={styles.input}
                    placeholder="e.g. Tuition, Transport"
                  value={componentName}
                  onChangeText={setComponentName}
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount (₹) - Optional</Text>
                  <TextInput
                  style={styles.input}
                    placeholder="Leave empty for no amount"
                  value={componentAmount}
                  onChangeText={setComponentAmount}
                  keyboardType="decimal-pad"
                />
              </View>

                <View style={styles.modalActions}>
                  <Button
                    onPress={() => {
                      setShowModal(false);
                      setEditingComponent(null);
                      setComponentName('');
                      setComponentAmount('');
                    }}
                  >
                    Cancel
                  </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                    loading={loading}
                    disabled={!componentName.trim() || loading}
              >
                    {editingComponent ? 'Update' : 'Add'}
              </Button>
                </View>
              </View>
            </View>
          </PaperModal>
      </Portal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 24,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  componentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  componentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  componentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  componentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  componentText: {
    flex: 1,
  },
  componentName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  componentCode: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  componentRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  componentAmount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.primary[600],
  },
  componentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconButton: {
    margin: 0,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 1000,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  modalContent: {
    backgroundColor: colors.surface.primary,
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    maxHeight: '80%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  modalBody: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
