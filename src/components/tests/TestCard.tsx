import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Card, Menu, IconButton, TouchableRipple } from 'react-native-paper';
import { BookOpen, Calendar, Clock, Users, Edit, Trash2, Eye, FileText, MoreVertical, BarChart3 } from 'lucide-react-native';
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
  const [menuVisible, setMenuVisible] = useState(false);

  const getStatusColor = (status: string) => {
    const statusColors = {
      active: colors.success[600],
      inactive: colors.neutral[400],
      completed: colors.primary[600],
      draft: colors.warning[600],
    };
    return statusColors[status as keyof typeof statusColors] || colors.neutral[400];
  };

  const handleDelete = () => {
    setMenuVisible(false);
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

  const toggleMenu = () => setMenuVisible(!menuVisible);
  const closeMenu = () => setMenuVisible(false);

  return (
    <Card style={styles.card}>
      <TouchableRipple 
        onPress={onPress}
        rippleColor="rgba(0, 0, 0, .05)"
        style={styles.cardPressable}
      >
        <View style={styles.cardInner}>
          <View style={styles.cardContent}>
            {/* 3-dot menu in top right corner */}
            {showActions && (
              <View style={styles.menuContainer}>
                <Menu
                  visible={menuVisible}
                  onDismiss={closeMenu}
                  anchor={
                    <IconButton
                      icon={() => <MoreVertical size={20} color={colors.text.tertiary} />}
                      size={20}
                      onPress={toggleMenu}
                      style={styles.menuButton}
                    />
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      closeMenu();
                      onPress?.();
                    }}
                    title="View"
                    leadingIcon={() => <Eye size={16} color={colors.primary[600]} />}
                  />
                  {test.test_mode === 'online' && onManageQuestions && (
                    <Menu.Item
                      onPress={() => {
                        closeMenu();
                        onManageQuestions();
                      }}
                      title="View Progress"
                      leadingIcon={() => <BarChart3 size={16} color={colors.primary[600]} />}
                    />
                  )}
                  {test.test_mode === 'offline' && onUploadMarks && (
                    <Menu.Item
                      onPress={() => {
                        closeMenu();
                        onUploadMarks();
                      }}
                      title="Upload Marks"
                      leadingIcon={() => <FileText size={16} color={colors.secondary[600]} />}
                    />
                  )}
                  {onEdit && (
                    <Menu.Item
                      onPress={() => {
                        closeMenu();
                        onEdit();
                      }}
                      title="Edit"
                      leadingIcon={() => <Edit size={16} color={colors.text.primary} />}
                    />
                  )}
                  {onDelete && (
                    <Menu.Item
                      onPress={handleDelete}
                      title="Delete"
                      leadingIcon={() => <Trash2 size={16} color={colors.error[600]} />}
                    />
                  )}
                </Menu>
              </View>
            )}

            {/* Title and status */}
            <View style={styles.titleRow}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(test.status) }]} />
              <Text style={styles.testTitle} numberOfLines={2}>
                {test.title}
              </Text>
            </View>

            {/* All metadata in single row */}
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{test.subject_name || 'Subject'}</Text>
              <Text style={styles.metaSeparator}> • </Text>
              <Text style={styles.metaText}>
                {test.class_name || 'Grade 1-A'}
              </Text>
              {test.test_mode === 'online' && test.time_limit_seconds && (
                <>
                  <Text style={styles.metaSeparator}> • </Text>
                  <Text style={styles.metaText}>
                    {Math.floor(test.time_limit_seconds / 60)} min
                  </Text>
                </>
              )}
              <View style={styles.spacer} />
              <View style={styles.dateContainer}>
                <Calendar size={14} color={colors.primary[600]} />
                <Text style={styles.highlightedDate}>
                  {test.test_date ? format(new Date(test.test_date), 'MMM dd') : 'No date'}
                </Text>
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              {test.test_mode === 'online' ? (
                <>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{test.question_count || 0}</Text>
                    <Text style={styles.statLabel}>Questions</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{test.attempts_count || 0}</Text>
                    <Text style={styles.statLabel}>Attempts</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{test.max_marks || 100}</Text>
                    <Text style={styles.statLabel}>Max Marks</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{(test.marks_uploaded || 0)}/{test.total_students || 0}</Text>
                    <Text style={styles.statLabel}>Graded</Text>
                  </View>
                </>
              )}
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{test.total_students || 0}</Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableRipple>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardPressable: {
    backgroundColor: colors.surface.primary,
  },
  cardInner: {
    flex: 1,
  },
  cardContent: {
    padding: spacing.md,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  menuContainer: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    zIndex: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  spacer: {
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  testTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  metaSeparator: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginHorizontal: 4,
  },
  highlightedDate: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
    fontWeight: typography.fontWeight.medium,
  },
  menuButton: {
    margin: -spacing.xs,
  },
});
