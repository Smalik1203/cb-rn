import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Portal, Modal } from 'react-native-paper';
import { Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { TestList } from '../../src/components/tests/TestList';
import { CreateTestForm } from '../../src/components/tests/CreateTestForm';
import { useTests, useCreateTest, useUpdateTest, useDeleteTest, useStudentAttempts } from '../../src/hooks/tests';
import { useAuth } from '../../src/contexts/AuthContext';
import { useClasses } from '../../src/hooks/useClasses';
import { useSubjects } from '../../src/hooks/useSubjects';
import { TestInput, TestWithDetails } from '../../src/types/test.types';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/design-system';

export default function AssessmentsScreen() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTest, setEditingTest] = useState<TestWithDetails | undefined>(undefined);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'completed'>('all');

  const isStudent = profile?.role === 'student';
  // TODO: Fetch student ID properly from student table using auth_user_id
  const studentId = isStudent ? user?.id : undefined;

  // Fetch data
  const { data: tests = [], isLoading: testsLoading } = useTests(
    profile?.school_code || '',
    selectedClassId || (isStudent ? profile?.class_instance_id || undefined : undefined)
  );
  const { data: classes = [] } = useClasses(profile?.school_code || '');
  const { data: subjects = [] } = useSubjects(profile?.school_code || '');

  // Fetch student attempts if user is a student
  const { data: studentAttempts = [] } = useStudentAttempts(studentId || '', undefined);

  // Mutations
  const createTest = useCreateTest();
  const updateTest = useUpdateTest();
  const deleteTest = useDeleteTest();

  // Calculate stats
  const stats = useMemo(() => {
    const total = tests.length;
    const active = tests.filter((t) => t.status === 'active').length;
    const completed = tests.filter((t) => t.status === 'completed').length;
    const online = tests.filter((t) => t.test_mode === 'online').length;

    return { total, active, completed, online };
  }, [tests]);

  const canCreateTest = profile?.role === 'admin' || profile?.role === 'superadmin';
  const canManageTests = canCreateTest;

  const handleCreateTest = async (testData: TestInput) => {
    try {
      await createTest.mutateAsync(testData);
      Alert.alert('Success', 'Test created successfully');
    } catch (error: any) {
      throw error;
    }
  };

  const handleUpdateTest = async (testData: TestInput) => {
    if (!editingTest) return;

    try {
      await updateTest.mutateAsync({ testId: editingTest.id, testData });
      Alert.alert('Success', 'Test updated successfully');
      setEditingTest(undefined);
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteTest = async (test: TestWithDetails) => {
    try {
      await deleteTest.mutateAsync(test.id);
      Alert.alert('Success', 'Test deleted successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete test');
    }
  };

  const handleTestPress = (test: TestWithDetails) => {
    // TODO: Navigate to test details screen
    Alert.alert('Test Details', `View details for: ${test.title}`);
  };

  const handleEditTest = (test: TestWithDetails) => {
    setEditingTest(test);
    setShowCreateModal(true);
  };

  const handleManageQuestions = (test: TestWithDetails) => {
    router.push(`/test/${test.id}/questions?testTitle=${encodeURIComponent(test.title)}`);
  };

  const handleUploadMarks = (test: TestWithDetails) => {
    router.push(
      `/test/${test.id}/marks?testTitle=${encodeURIComponent(test.title)}&maxMarks=${test.max_marks || 100}&classInstanceId=${test.class_instance_id}`
    );
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingTest(undefined);
  };

  const getSelectedClassName = () => {
    if (!selectedClassId) return 'All Classes';
    const selectedClass = classes.find((c) => c.id === selectedClassId);
    return selectedClass ? `Grade ${selectedClass.grade} - ${selectedClass.section}` : 'All Classes';
  };

  const filteredTestsByStatus = useMemo(() => {
    if (selectedStatus === 'all') return tests;
    return tests.filter((t) => t.status === selectedStatus);
  }, [tests, selectedStatus]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Quick Filters (Attendance-style) */}
      {(profile?.role === 'admin' || profile?.role === 'superadmin') && (
        <View style={styles.quickFilters}>
          <TouchableOpacity style={styles.filterBlock} onPress={() => setShowClassPicker(true)}>
            <Text style={styles.filterBlockLabel}>Class</Text>
            <Text style={styles.filterBlockValue} numberOfLines={1}>{getSelectedClassName()}</Text>
          </TouchableOpacity>
          <View style={styles.blockDivider} />
          <TouchableOpacity style={styles.filterBlock} onPress={() => setShowStatusPicker(true)}>
            <Text style={styles.filterBlockLabel}>Status</Text>
            <Text style={styles.filterBlockValue} numberOfLines={1}>
              {selectedStatus === 'all' ? 'All' : selectedStatus === 'active' ? 'Active' : 'Completed'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Compact Stats */}
      {!isStudent && (
        <View style={styles.compactStats}>
          <View style={styles.compactStatItem}>
            <Text style={styles.compactStatValue}>{stats.total}</Text>
            <Text style={styles.compactStatLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.compactStatItem}>
            <Text style={[styles.compactStatValue, { color: colors.success[600] }]}>
              {stats.active}
            </Text>
            <Text style={styles.compactStatLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.compactStatItem}>
            <Text style={[styles.compactStatValue, { color: colors.primary[600] }]}>
              {stats.online}
            </Text>
            <Text style={styles.compactStatLabel}>Online</Text>
          </View>
        </View>
      )}

      {/* Test List */}
      <View style={styles.listContainer}>
        <TestList
          tests={filteredTestsByStatus}
          loading={testsLoading}
          onTestPress={handleTestPress}
          onTestEdit={canManageTests ? handleEditTest : undefined}
          onTestDelete={canManageTests ? handleDeleteTest : undefined}
          onManageQuestions={canManageTests ? handleManageQuestions : undefined}
          onUploadMarks={canManageTests ? handleUploadMarks : undefined}
          showActions={canManageTests}
          isStudentView={isStudent}
          studentAttempts={studentAttempts as any}
        />
      </View>

      {/* Create/Edit Test Modal */}
      {showCreateModal && (
        <CreateTestForm
          visible={showCreateModal}
          onClose={handleCloseModal}
          onSubmit={editingTest ? handleUpdateTest : handleCreateTest}
          initialData={editingTest}
          classes={classes}
          subjects={subjects}
          schoolCode={profile?.school_code || ''}
          userId={user?.id || ''}
        />
      )}

      {/* Class Picker Modal */}
      <Portal>
        <Modal
          visible={showClassPicker}
          onDismiss={() => setShowClassPicker(false)}
          contentContainerStyle={styles.pickerModal}
        >
          <Text style={styles.pickerTitle}>Select Class</Text>
          <ScrollView style={styles.pickerScroll}>
            <TouchableOpacity
              style={[styles.pickerItem, !selectedClassId && styles.pickerItemSelected]}
              onPress={() => {
                setSelectedClassId(undefined);
                setShowClassPicker(false);
              }}
            >
              <Text style={[styles.pickerItemText, !selectedClassId && styles.pickerItemTextSelected]}>
                All Classes
              </Text>
            </TouchableOpacity>
            {classes.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                style={[styles.pickerItem, selectedClassId === cls.id && styles.pickerItemSelected]}
                onPress={() => {
                  setSelectedClassId(cls.id);
                  setShowClassPicker(false);
                }}
              >
                <Text style={[styles.pickerItemText, selectedClassId === cls.id && styles.pickerItemTextSelected]}>
                  Grade {cls.grade} - {cls.section}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Modal>
        <Modal
          visible={showStatusPicker}
          onDismiss={() => setShowStatusPicker(false)}
          contentContainerStyle={styles.pickerModal}
        >
          <Text style={styles.pickerTitle}>Select Status</Text>
          <ScrollView style={styles.pickerScroll}>
            {[
              { key: 'all', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'completed', label: 'Completed' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.pickerItem,
                  selectedStatus === (opt.key as any) && styles.pickerItemSelected,
                ]}
                onPress={() => {
                  setSelectedStatus(opt.key as any);
                  setShowStatusPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    selectedStatus === (opt.key as any) && styles.pickerItemTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Bottom Add Button */}
      {canCreateTest && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.addTestButton} onPress={() => setShowCreateModal(true)}>
            <Plus size={22} color={colors.surface.primary} />
            <Text style={styles.addTestText}>Add Test</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {},
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  headerContent: {
    flex: 1,
  },
  quickFilters: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  filterBlock: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  filterBlockLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: 1,
  },
  filterBlockValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  blockDivider: {
    width: 1,
    backgroundColor: colors.border.DEFAULT,
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  classFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  classFilterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[600],
  },
  clearFilterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  clearFilterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
  pickerModal: {
    backgroundColor: colors.surface.primary,
    margin: spacing.xl,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  pickerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  pickerScroll: {
    maxHeight: 400,
  },
  pickerItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  pickerItemSelected: {
    backgroundColor: colors.primary[100],
  },
  pickerItemText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  pickerItemTextSelected: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
  compactStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  compactStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  compactStatValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  compactStatLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.DEFAULT,
    marginHorizontal: spacing.sm,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: 0,
    paddingBottom: 80,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  addTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  addTestText: {
    color: colors.surface.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});
