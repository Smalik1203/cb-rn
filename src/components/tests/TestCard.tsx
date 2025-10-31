import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card } from 'react-native-paper';
import { BookOpen, Calendar, Clock, Users, Edit, Trash2, Eye, FileText } from 'lucide-react-native';
import { format } from 'date-fns';
import { TestWithDetails } from '../../types/test.types';
import { colors, spacing, typography, borderRadius, shadows } from '../../../lib/design-system';

interface TestCardProps {
  test: TestWithDetails;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onManageQuestions?: () => void;
  onUploadMarks?: () => void;
  showActions?: boolean;
}

export function TestCard({
  test,
  onPress,
  onEdit,
  onDelete,
  onManageQuestions,
  onUploadMarks,
  showActions = true,
}: TestCardProps) {
  const getStatusColor = (status: string) => {
    const statusColors = {
      active: colors.success[600],
      inactive: colors.neutral[400],
      completed: colors.primary[600],
      draft: colors.warning[600],
    };
    return statusColors[status as keyof typeof statusColors] || colors.neutral[400];
  };

  const getModeColor = (mode: string) => {
    return mode === 'online' ? colors.primary[600] : colors.secondary[600];
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Test',
      `Are you sure you want to delete "${test.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {test.title}
            </Text>
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: getModeColor(test.test_mode) }]}>
                <Text style={styles.badgeText}>{test.test_mode.toUpperCase()}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: getStatusColor(test.status) }]}>
                <Text style={styles.badgeText}>{test.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <BookOpen size={16} color={colors.text.secondary} />
            <Text style={styles.infoText}>{test.subject_name}</Text>
          </View>

          <View style={styles.infoItem}>
            <Users size={16} color={colors.text.secondary} />
            <Text style={styles.infoText}>{test.class_name}</Text>
          </View>

          {test.test_date && (
            <View style={styles.infoItem}>
              <Calendar size={16} color={colors.text.secondary} />
              <Text style={styles.infoText}>
                {format(new Date(test.test_date), 'MMM dd, yyyy')}
              </Text>
            </View>
          )}

          {test.time_limit_seconds && (
            <View style={styles.infoItem}>
              <Clock size={16} color={colors.text.secondary} />
              <Text style={styles.infoText}>
                {Math.floor(test.time_limit_seconds / 60)} min
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          {test.test_mode === 'online' ? (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{test.question_count || 0}</Text>
                <Text style={styles.statLabel}>Q&apos;s</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{test.attempts_count || 0}</Text>
                <Text style={styles.statLabel}>Attempts</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{test.max_marks || 100}</Text>
                <Text style={styles.statLabel}>Max</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{(test.marks_uploaded || 0)}/{test.total_students || 0}</Text>
                <Text style={styles.statLabel}>Graded</Text>
              </View>
            </>
          )}
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{test.total_students || 0}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
        </View>

        {/* Actions */}
        {showActions && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionIconButton} onPress={onPress}>
              <Eye size={18} color={colors.primary[600]} />
            </TouchableOpacity>

            {test.test_mode === 'online' && onManageQuestions && (
              <TouchableOpacity style={styles.actionIconButton} onPress={onManageQuestions}>
                <FileText size={18} color={colors.secondary[600]} />
              </TouchableOpacity>
            )}

            {test.test_mode === 'offline' && onUploadMarks && (
              <TouchableOpacity style={styles.actionIconButton} onPress={onUploadMarks}>
                <FileText size={18} color={colors.secondary[600]} />
              </TouchableOpacity>
            )}

            {onEdit && (
              <TouchableOpacity style={styles.actionIconButton} onPress={onEdit}>
                <Edit size={18} color={colors.warning[600]} />
              </TouchableOpacity>
            )}

            {onDelete && (
              <TouchableOpacity style={styles.actionIconButton} onPress={handleDelete}>
                <Trash2 size={18} color={colors.error[600]} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surface.primary,
    ...shadows.xs,
  },
  cardContent: {
    padding: spacing.sm,
  },
  header: {
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface.secondary,
  },
  actionIconButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface.secondary,
  },
  actionButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[600],
  },
});
