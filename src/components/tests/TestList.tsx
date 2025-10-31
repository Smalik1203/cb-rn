import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Search, Filter, X } from 'lucide-react-native';
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
}: TestListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'online' | 'offline'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'completed'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and search tests
  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.subject_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.class_name?.toLowerCase().includes(searchQuery.toLowerCase());

      // Mode filter
      const matchesMode = filterMode === 'all' || test.test_mode === filterMode;

      // Status filter
      const matchesStatus = filterStatus === 'all' || test.status === filterStatus;

      return matchesSearch && matchesMode && matchesStatus;
    });
  }, [tests, searchQuery, filterMode, filterStatus]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Tests Found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery || filterMode !== 'all' || filterStatus !== 'all'
          ? 'Try adjusting your filters'
          : 'Create your first test to get started'}
      </Text>
    </View>
  );

  const renderFilterChip = (
    label: string,
    active: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

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
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Mode:</Text>
            <View style={styles.filterChips}>
              {renderFilterChip('All', filterMode === 'all', () => setFilterMode('all'))}
              {renderFilterChip('Online', filterMode === 'online', () => setFilterMode('online'))}
              {renderFilterChip('Offline', filterMode === 'offline', () => setFilterMode('offline'))}
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Status:</Text>
            <View style={styles.filterChips}>
              {renderFilterChip('All', filterStatus === 'all', () => setFilterStatus('all'))}
              {renderFilterChip('Active', filterStatus === 'active', () => setFilterStatus('active'))}
              {renderFilterChip('Completed', filterStatus === 'completed', () => setFilterStatus('completed'))}
            </View>
          </View>

          {(filterMode !== 'all' || filterStatus !== 'all') && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setFilterMode('all');
                setFilterStatus('all');
              }}
            >
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredTests.length} {filteredTests.length === 1 ? 'test' : 'tests'}
        </Text>
      </View>

      {/* Test List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading tests...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if (isStudentView) {
              // Find the student's attempt for this test
              const attempt = studentAttempts.find((a) => a.test_id === item.id);
              return <StudentTestCard test={item} attempt={attempt} />;
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
          }}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  filterButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  filtersContainer: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  filterRow: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface.secondary,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  filterChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.text.inverse,
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
  },
  clearFiltersText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[600],
  },
  resultsHeader: {
    marginBottom: spacing.md,
  },
  resultsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
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
});
