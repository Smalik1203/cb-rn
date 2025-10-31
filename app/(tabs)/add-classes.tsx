import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Portal, Modal } from 'react-native-paper';
import { Calendar, BookOpen, Edit, Trash2, X, Plus } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/design-system';
import { Card, Button, Input, EmptyState, Badge } from '../../src/components/ui';
import { useAuth } from '../../src/contexts/AuthContext';
import { useAcademicYears, useCreateAcademicYear, useUpdateAcademicYear, useDeleteAcademicYear } from '../../src/hooks/useAcademicYears';
import { useClassInstances, useCreateClassInstance, useUpdateClassInstance, useDeleteClassInstance } from '../../src/hooks/useClassInstances';
import { useAdmins } from '../../src/hooks/useAdmins';
import { ThreeStateView } from '../../src/components/common/ThreeStateView';
import { Picker } from '@react-native-picker/picker';

export default function AddClassesScreen() {
  const { profile } = useAuth();
  const schoolCode = profile?.school_code;
  const schoolName = profile?.school_name;

  // Queries
  const { data: academicYears = [] } = useAcademicYears(schoolCode);
  const { data: classInstances = [], isLoading: classesLoading, error: classesError, refetch: refetchClasses } = useClassInstances(schoolCode);
  const { data: admins = [] } = useAdmins(schoolCode);
  const [mode, setMode] = useState<'create' | 'list'>('create');

  // Mutations
  const createYearMutation = useCreateAcademicYear(schoolCode);
  const updateYearMutation = useUpdateAcademicYear(schoolCode);
  const deleteYearMutation = useDeleteAcademicYear(schoolCode);
  const createClassMutation = useCreateClassInstance(schoolCode);
  const updateClassMutation = useUpdateClassInstance(schoolCode);
  const deleteClassMutation = useDeleteClassInstance(schoolCode);

  // Academic Year Form
  const [yearStart, setYearStart] = useState('');
  const [yearEnd, setYearEnd] = useState('');

  // Class Form
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');

  // Edit Modals
  const [editYearModalVisible, setEditYearModalVisible] = useState(false);
  const [editingYear, setEditingYear] = useState<any>(null);
  const [editYearStart, setEditYearStart] = useState('');
  const [editYearEnd, setEditYearEnd] = useState('');
  const [editYearActive, setEditYearActive] = useState(true);

  const [editClassModalVisible, setEditClassModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [editGrade, setEditGrade] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editTeacher, setEditTeacher] = useState('');

  // Role check
  const isSuperAdmin = profile?.role === 'superadmin';

  if (!isSuperAdmin) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Access Denied"
          message="Only Super Admins can manage classes"
        />
      </View>
    );
  }

  const handleCreateYear = async () => {
    if (!yearStart || !yearEnd) {
      Alert.alert('Validation Error', 'Please enter both start and end years');
      return;
    }

    const start = parseInt(yearStart);
    const end = parseInt(yearEnd);

    if (isNaN(start) || isNaN(end)) {
      Alert.alert('Validation Error', 'Years must be valid numbers');
      return;
    }

    if (end !== start + 1) {
      Alert.alert('Validation Error', 'End year should be exactly one year after start year');
      return;
    }

    try {
      await createYearMutation.mutateAsync({
        year_start: start,
        year_end: end,
        school_code: schoolCode!,
        school_name: schoolName || schoolCode!,
      });

      Alert.alert('Success', 'Academic year created successfully!');
      setYearStart('');
      setYearEnd('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create academic year');
    }
  };

  const handleCreateClass = async () => {
    if (!grade || !section || !selectedAcademicYear || !selectedTeacher) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return;
    }

    if (academicYears.length === 0) {
      Alert.alert('Error', 'Please create an academic year first');
      return;
    }

    try {
      await createClassMutation.mutateAsync({
        grade,
        section: section.toUpperCase(),
        academic_year_id: selectedAcademicYear,
        class_teacher_id: selectedTeacher,
        school_code: schoolCode!,
        school_name: schoolName || schoolCode!,
        created_by: profile?.auth_id || '',
      });

      Alert.alert('Success', 'Class created successfully!');
      setGrade('');
      setSection('');
      setSelectedAcademicYear('');
      setSelectedTeacher('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create class');
    }
  };

  const handleEditYear = (year: any) => {
    setEditingYear(year);
    setEditYearStart(year.year_start.toString());
    setEditYearEnd(year.year_end.toString());
    setEditYearActive(year.is_active);
    setEditYearModalVisible(true);
  };

  const handleUpdateYear = async () => {
    if (!editingYear) return;

    try {
      await updateYearMutation.mutateAsync({
        id: editingYear.id,
        year_start: parseInt(editYearStart),
        year_end: parseInt(editYearEnd),
        is_active: editYearActive,
      });

      Alert.alert('Success', 'Academic year updated successfully');
      setEditYearModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update academic year');
    }
  };

  const handleDeleteYear = (yearId: string) => {
    Alert.alert(
      'Delete Academic Year',
      'Are you sure? This will fail if any classes are using this year.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteYearMutation.mutateAsync(yearId);
              Alert.alert('Success', 'Academic year deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete academic year');
            }
          },
        },
      ]
    );
  };

  const handleEditClass = (classInstance: any) => {
    setEditingClass(classInstance);
    setEditGrade(classInstance.grade);
    setEditSection(classInstance.section);
    setEditTeacher(classInstance.class_teacher_id || '');
    setEditClassModalVisible(true);
  };

  const handleUpdateClass = async () => {
    if (!editingClass) return;

    try {
      await updateClassMutation.mutateAsync({
        id: editingClass.id,
        grade: editGrade,
        section: editSection.toUpperCase(),
        class_teacher_id: editTeacher,
      });

      Alert.alert('Success', 'Class updated successfully');
      setEditClassModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update class');
    }
  };

  const handleDeleteClass = (classId: string) => {
    Alert.alert(
      'Delete Class',
      'Are you sure you want to delete this class?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClassMutation.mutateAsync(classId);
              Alert.alert('Success', 'Class deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete class');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Segment */}
        <View style={styles.segment}>
          <TouchableOpacity style={[styles.segmentItem, mode === 'create' && styles.segmentItemActive]} onPress={() => setMode('create')}>
            <Text style={styles.segmentText}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segmentItem, mode === 'list' && styles.segmentItemActive]} onPress={() => setMode('list')}>
            <Text style={styles.segmentText}>Existing</Text>
          </TouchableOpacity>
        </View>
        {/* Academic Year Section */}
        {mode === 'create' && (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Calendar size={20} color={colors.success[600]} />
            <Text style={styles.cardTitle}>Academic Year</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Input
                  label="Start Year"
                  value={yearStart}
                  onChangeText={setYearStart}
                  placeholder="e.g., 2025"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
              <View style={styles.formCol}>
                <Input
                  label="End Year"
                  value={yearEnd}
                  onChangeText={setYearEnd}
                  placeholder="e.g., 2026"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>

            <Button
              title={createYearMutation.isPending ? 'Creating...' : 'Create Academic Year'}
              onPress={handleCreateYear}
              loading={createYearMutation.isPending}
              disabled={createYearMutation.isPending}
              icon={<Plus size={20} color={colors.surface.primary} />}
            />
          </View>
        </Card>
        )}

        {/* Academic Years List */}
        {academicYears.length > 0 && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Academic Years</Text>
              <Badge variant="success">{academicYears.length}</Badge>
            </View>

            <View style={styles.list}>
              {academicYears.map((year) => (
                <View key={year.id} style={styles.listItem}>
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemTitle}>
                      {year.year_start} - {year.year_end}
                    </Text>
                    <Badge variant={year.is_active ? 'success' : 'default'}>
                      {year.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </View>

                  <View style={styles.listItemActions}>
                    <TouchableOpacity onPress={() => handleEditYear(year)} style={styles.actionButton}>
                      <Edit size={18} color={colors.info[600]} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteYear(year.id)} style={styles.actionButton}>
                      <Trash2 size={18} color={colors.error[600]} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Tip Card */}
        {academicYears.length === 0 && (
          <Card style={[styles.card, styles.tipCard]}>
            <Text style={styles.tipText}>
              💡 <Text style={styles.tipBold}>Tip:</Text> Create an academic year first before adding classes
            </Text>
          </Card>
        )}

        {/* Add Class Section */}
        {mode === 'create' && (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <BookOpen size={20} color={colors.primary[600]} />
            <Text style={styles.cardTitle}>Class</Text>
          </View>

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>Academic Year</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedAcademicYear}
                  onValueChange={setSelectedAcademicYear}
                  enabled={academicYears.length > 0}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Academic Year" value="" />
                  {academicYears.map((year) => (
                    <Picker.Item
                      key={year.id}
                      label={`${year.year_start} - ${year.year_end}`}
                      value={year.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Input
                  label="Grade"
                  value={grade}
                  onChangeText={setGrade}
                  placeholder="e.g., 10"
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.formCol}>
                <Input
                  label="Section"
                  value={section}
                  onChangeText={setSection}
                  placeholder="e.g., A"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View>
              <Text style={styles.label}>Class Admin</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedTeacher}
                  onValueChange={setSelectedTeacher}
                  enabled={admins.length > 0}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Class Admin" value="" />
                  {admins.map((admin) => (
                    <Picker.Item key={admin.id} label={admin.full_name} value={admin.id} />
                  ))}
                </Picker>
              </View>
            </View>

            <Button
              title={createClassMutation.isPending ? 'Creating...' : 'Create Class'}
              onPress={handleCreateClass}
              loading={createClassMutation.isPending}
              disabled={createClassMutation.isPending || academicYears.length === 0}
              icon={<Plus size={20} color={colors.surface.primary} />}
            />
          </View>
        </Card>
        )}

        {/* Classes List */}
        {mode === 'list' && (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Existing Classes</Text>
            <Badge variant="info">{classInstances.length}</Badge>
          </View>

          <ThreeStateView
            state={classesLoading ? 'loading' : classesError ? 'error' : classInstances.length === 0 ? 'empty' : 'success'}
            loadingMessage="Loading classes..."
            errorMessage="Failed to load classes"
            errorDetails={classesError?.message}
            emptyMessage="No classes have been created yet"
            onRetry={refetchClasses}
          >
            <View style={styles.list}>
              {classInstances.map((classInstance) => (
                <View key={classInstance.id} style={styles.listItem}>
                  <View style={styles.classInfo}>
                    <Text style={styles.listItemTitle}>
                      Grade {classInstance.grade} - Section {classInstance.section}
                    </Text>
                    <Text style={styles.listItemSubtitle}>
                      {classInstance.year?.year_start} - {classInstance.year?.year_end}
                    </Text>
                    <Text style={styles.listItemSubtitle}>
                      Teacher: {classInstance.teacher?.full_name || 'Not assigned'}
                    </Text>
                  </View>

                  <View style={styles.listItemActions}>
                    <TouchableOpacity onPress={() => handleEditClass(classInstance)} style={styles.actionButton}>
                      <Edit size={18} color={colors.info[600]} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteClass(classInstance.id)} style={styles.actionButton}>
                      <Trash2 size={18} color={colors.error[600]} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ThreeStateView>
        </Card>
        )}
      </ScrollView>

      {/* Edit Year Modal */}
      <Portal>
        <Modal
          visible={editYearModalVisible}
          onDismiss={() => setEditYearModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Academic Year</Text>
            <TouchableOpacity onPress={() => setEditYearModalVisible(false)}>
              <X size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Input
              label="Start Year"
              value={editYearStart}
              onChangeText={setEditYearStart}
              keyboardType="number-pad"
              maxLength={4}
            />

            <Input
              label="End Year"
              value={editYearEnd}
              onChangeText={setEditYearEnd}
              keyboardType="number-pad"
              maxLength={4}
            />

            <TouchableOpacity
              onPress={() => setEditYearActive(!editYearActive)}
              style={styles.switchRow}
            >
              <Text style={styles.switchLabel}>Active</Text>
              <View style={[styles.switch, editYearActive && styles.switchActive]}>
                <View style={[styles.switchThumb, editYearActive && styles.switchThumbActive]} />
              </View>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setEditYearModalVisible(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Update"
                onPress={handleUpdateYear}
                loading={updateYearMutation.isPending}
                style={styles.modalButton}
              />
            </View>
          </View>
        </Modal>
      </Portal>

      {/* Edit Class Modal */}
      <Portal>
        <Modal
          visible={editClassModalVisible}
          onDismiss={() => setEditClassModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Class</Text>
            <TouchableOpacity onPress={() => setEditClassModalVisible(false)}>
              <X size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Input
              label="Grade"
              value={editGrade}
              onChangeText={setEditGrade}
              keyboardType="number-pad"
            />

            <Input
              label="Section"
              value={editSection}
              onChangeText={setEditSection}
              autoCapitalize="characters"
            />

            <View>
              <Text style={styles.label}>Class Admin</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={editTeacher}
                  onValueChange={setEditTeacher}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Class Admin" value="" />
                  {admins.map((admin) => (
                    <Picker.Item key={admin.id} label={admin.full_name} value={admin.id} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setEditClassModalVisible(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Update"
                onPress={handleUpdateClass}
                loading={updateClassMutation.isPending}
                style={styles.modalButton}
              />
            </View>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface.secondary,
    padding: 4,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  segmentItemActive: {
    backgroundColor: colors.surface.primary,
    ...shadows.sm,
  },
  segmentText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  tipCard: {
    backgroundColor: colors.info[50],
    borderColor: colors.info[200],
  },
  tipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  tipBold: {
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  form: {
    gap: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.primary,
  },
  picker: {
    height: 44,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formCol: {
    flex: 1,
  },
  list: {
    gap: spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  listItemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  classInfo: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  listItemSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
  },
  listItemActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.primary,
    ...shadows.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  switchLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[300],
    padding: spacing.xs / 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: colors.success[500],
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface.primary,
    ...shadows.sm,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  modal: {
    backgroundColor: colors.surface.primary,
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  modalContent: {
    gap: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});

