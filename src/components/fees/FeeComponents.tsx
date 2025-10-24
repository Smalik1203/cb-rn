import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, Switch, Chip, FAB, Portal, Modal, List } from 'react-native-paper';
import { Plus, Edit, Trash2, DollarSign, Calendar, Settings } from 'lucide-react-native';
import { useFees } from '@/src/contexts/FeesContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/design-system';

interface FeeComponentFormData {
  code: string;
  name: string;
  description: string;
  is_recurring: boolean;
  period: string;
  default_amount_paise: number;
  is_optional: boolean;
  isActive: boolean;
}

const PERIOD_OPTIONS = [
  { label: 'One-time', value: 'one_time' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Yearly', value: 'yearly' },
];

export const FeeComponents: React.FC = () => {
  const { state, actions } = useFees();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingComponent, setEditingComponent] = useState<any>(null);
  const [formData, setFormData] = useState<FeeComponentFormData>({
    code: '',
    name: '',
    description: '',
    is_recurring: false,
    period: 'one_time',
    default_amount_paise: 0,
    is_optional: false,
    isActive: true,
  });

  const handleSave = async () => {
    try {
      const componentData = {
        name: formData.name,
        description: formData.description,
        is_active: formData.isActive,
        school_code: user?.user_metadata?.school_code || '',
      };

      if (editingComponent) {
        const { error } = await (supabase as any)
          .from('fee_component_types')
          .update(componentData)
          .eq('id', editingComponent.id);
        
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('fee_component_types')
          .insert([componentData]);
        
        if (error) throw error;
      }
      
      Alert.alert('Success', 'Fee component saved successfully');
      setShowForm(false);
      setEditingComponent(null);
      resetForm();
      actions.loadFeeComponents();
    } catch (error) {
      Alert.alert('Error', 'Failed to save fee component');
    }
  };

  const handleEdit = (component: any) => {
    setEditingComponent(component);
    setFormData({
      code: component.code,
      name: component.name,
      description: component.description || '',
      is_recurring: component.is_recurring,
      period: component.period,
      default_amount_paise: component.default_amount_paise,
      is_optional: component.is_optional,
      isActive: component.is_active !== false,
    });
    setShowForm(true);
  };

  const handleDelete = (component: any) => {
    Alert.alert(
      'Delete Fee Component',
      `Are you sure you want to delete "${component.name}"?`,
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
              
              Alert.alert('Success', 'Fee component deleted successfully');
              actions.loadFeeComponents();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete fee component');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      is_recurring: false,
      period: 'one_time',
      default_amount_paise: 0,
      is_optional: false,
      isActive: true,
    });
  };

  const formatAmount = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Settings size={24} color={colors.primary[600]} />
              <Text variant="titleLarge" style={styles.title}>
                Fee Components
              </Text>
            </View>
            <Button
              mode="contained"
              onPress={() => {
                resetForm();
                setEditingComponent(null);
                setShowForm(true);
              }}
              icon={() => <Plus size={16} color={colors.text.inverse} />}
              style={styles.addButton}
            >
              Add Component
            </Button>
          </View>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Manage fee component types and their default amounts
          </Text>
        </Card.Content>
      </Card>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {state.loading ? (
          <Card style={styles.loadingCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.loadingText}>
                Loading fee components...
              </Text>
            </Card.Content>
          </Card>
        ) : state.error ? (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.errorText}>
                Error: {state.error}
              </Text>
              <Button mode="outlined" onPress={actions.loadFeeComponents} style={styles.retryButton}>
                Retry
              </Button>
            </Card.Content>
          </Card>
        ) : state.feeComponents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.emptyText}>
                No fee components found. Add your first component to get started.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          state.feeComponents.map((component) => (
            <Card key={component.id} style={styles.componentCard}>
              <Card.Content>
                <View style={styles.componentHeader}>
                  <View style={styles.componentInfo}>
                    <Text variant="titleMedium" style={styles.componentName}>
                      {component.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.componentCode}>
                      Code: {component.code}
                    </Text>
                  </View>
                  <View style={styles.componentActions}>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => handleEdit(component)}
                      icon={() => <Edit size={14} color={colors.primary[600]} />}
                      style={styles.actionButton}
                    >
                      Edit
                    </Button>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => handleDelete(component)}
                      icon={() => <Trash2 size={14} color={colors.error[600]} />}
                      style={[styles.actionButton, styles.deleteButton]}
                    >
                      Delete
                    </Button>
                  </View>
                </View>

                <View style={styles.componentDetails}>
                  <View style={styles.detailRow}>
                    <DollarSign size={16} color={colors.text.secondary} />
                    <Text variant="bodyMedium" style={styles.detailText}>
                      Default Amount: {formatAmount(component.default_amount_paise)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Calendar size={16} color={colors.text.secondary} />
                    <Text variant="bodyMedium" style={styles.detailText}>
                      Period: {PERIOD_OPTIONS.find(p => p.value === component.period)?.label || component.period}
                    </Text>
                  </View>

                  <View style={styles.chipContainer}>
                    {component.is_recurring && (
                      <Chip mode="outlined" style={styles.chip}>
                        Recurring
                      </Chip>
                    )}
                    {component.is_optional && (
                      <Chip mode="outlined" style={styles.chip}>
                        Optional
                      </Chip>
                    )}
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={showForm}
          onDismiss={() => setShowForm(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {editingComponent ? 'Edit Fee Component' : 'Add Fee Component'}
            </Text>

            <TextInput
              label="Component Code"
              value={formData.code}
              onChangeText={(text) => setFormData({ ...formData, code: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Component Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Default Amount (₹)"
              value={formData.default_amount_paise.toString()}
              onChangeText={(text) => setFormData({ ...formData, default_amount_paise: parseInt(text) || 0 })}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <View style={styles.switchContainer}>
              <Text variant="bodyMedium">Recurring Fee</Text>
              <Switch
                value={formData.is_recurring}
                onValueChange={(value) => setFormData({ ...formData, is_recurring: value })}
              />
            </View>

            <View style={styles.switchContainer}>
              <Text variant="bodyMedium">Optional Fee</Text>
              <Switch
                value={formData.is_optional}
                onValueChange={(value) => setFormData({ ...formData, is_optional: value })}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => setShowForm(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                style={styles.saveButton}
              >
                {editingComponent ? 'Update' : 'Save'}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerCard: {
    margin: spacing['4'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['2'],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  title: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  addButton: {
    borderRadius: borderRadius.lg,
  },
  subtitle: {
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing['4'],
  },
  loadingCard: {
    marginBottom: spacing['4'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
  errorCard: {
    marginBottom: spacing['4'],
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.lg,
    borderColor: colors.error[200],
    borderWidth: 1,
  },
  errorText: {
    color: colors.error[600],
    marginBottom: spacing['2'],
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
  emptyCard: {
    marginBottom: spacing['4'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
  componentCard: {
    marginBottom: spacing['4'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  componentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing['3'],
  },
  componentInfo: {
    flex: 1,
  },
  componentName: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing['1'],
  },
  componentCode: {
    color: colors.text.secondary,
  },
  componentActions: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  actionButton: {
    borderRadius: borderRadius.md,
  },
  deleteButton: {
    borderColor: colors.error[300],
  },
  componentDetails: {
    gap: spacing['2'],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  detailText: {
    color: colors.text.secondary,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: spacing['2'],
    marginTop: spacing['2'],
  },
  chip: {
    borderRadius: borderRadius.md,
  },
  modal: {
    backgroundColor: colors.surface.primary,
    margin: spacing['4'],
    borderRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  modalTitle: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing['4'],
    textAlign: 'center',
  },
  input: {
    marginBottom: spacing['3'],
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['3'],
    paddingVertical: spacing['2'],
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing['3'],
    marginTop: spacing['4'],
  },
  cancelButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
  },
  saveButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
  },
});
