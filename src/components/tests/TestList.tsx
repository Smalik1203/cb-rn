import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { TestCard } from './TestCard';
import { StudentTestCard } from './StudentTestCard';
import { TestWithDetails, TestAttempt } from '../../types/test.types';
import { colors, spacing, typography, borderRadius } from '../../../lib/design-system';

interface TestListProps {
  tests: TestWithDetails[];
  loading?: boolean;
  onTestPress?: (test: TestWithDetails) => void;
  onTestEdit?: (test: TestWithDetails) => void;
  onTestDelete?: (test: TestWithDetails) => void;
  onManageQuestions?: (test: TestWithDetails) => void;
  onUploadMarks?: (test: TestWithDetails) => void;
  showActions?: boolean;
  isStudentView?: boolean;
  studentAttempts?: TestAttempt[];
  studentMarks?: Record<string, { marks_obtained: number; max_marks: number; remarks?: string | null; test_mode?: string }>;
}

export function TestList({
  tests,
  loading = false,
  onTestPress,
  onTestEdit,
  onTestDelete,
  onManageQuestions,
  onUploadMarks,
  showActions = true,
  isStudentView = false,
  studentAttempts = [],
  studentMarks = {},
}: TestListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and search tests
  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      // Search filter only
      const matchesSearch =
        searchQuery === '' ||
        test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.subject_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.class_name?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [tests, searchQuery]);

  // Separate tests by mode
  const onlineTests = useMemo(() => 
    filteredTests.filter(test => test.test_mode === 'online'),
    [filteredTests]
  );
  const offlineTests = useMemo(() => 
    filteredTests.filter(test => test.test_mode === 'offline'),
    [filteredTests]
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Tests Found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery
          ? 'Try adjusting your search'
          : 'Create your first test to get started'}
      </Text>
    </View>
  );

  const renderTestCard = (item: any) => {
    if (isStudentView) {
      const attempt = studentAttempts.find((a) => a.test_id === item.id);
      const mark = studentMarks[item.id];
      return <StudentTestCard test={item} attempt={attempt} mark={mark} />;
    }

    return (
      <TestCard
        test={item}
        onPress={() => onTestPress?.(item)}
        onEdit={() => onTestEdit?.(item)}
        onDelete={() => onTestDelete?.(item)}
        onManageQuestions={() => onManageQuestions?.(item)}
        onUploadMarks={() => onUploadMarks?.(item)}
        showActions={showActions}
      />
    );
  };

  const renderSection = (title: string, tests: any[], mode: 'online' | 'offline') => {
    if (tests.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionHeaderDot, { backgroundColor: mode === 'online' ? colors.primary[600] : colors.secondary[600] }]} />
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionCount}>({tests.length})</Text>
        </View>
        {tests.map((item) => (
          <View key={item.id}>
            {renderTestCard(item)}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.text.secondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tests..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.text.secondary}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Test List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading tests...</Text>
        </View>
      ) : (
        <>
          {onlineTests.length === 0 && offlineTests.length === 0 ? (
            renderEmptyState()
          ) : (
            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            >
              {renderSection('Online Tests', onlineTests, 'online')}
              {renderSection('Offline Tests', offlineTests, 'offline')}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    padding: 0,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  emptyState: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  sectionHeaderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sectionCount: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
});
