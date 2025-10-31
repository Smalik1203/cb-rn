import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { BookOpen, Calendar, Clock, Play, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react-native';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { TestWithDetails, TestAttempt } from '../../types/test.types';
import { colors, spacing, typography, borderRadius, shadows } from '../../../lib/design-system';

interface StudentTestCardProps {
  test: TestWithDetails;
  attempt?: TestAttempt;
}

export function StudentTestCard({ test, attempt }: StudentTestCardProps) {
  const router = useRouter();

  const getTestStatus = () => {
    if (!attempt) return 'not_started';
    if (attempt.status === 'completed') return 'completed';
    if (attempt.status === 'in_progress') return 'in_progress';
    return 'not_started';
  };

  const status = getTestStatus();

  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          color: colors.success[600],
          backgroundColor: colors.success[50],
          label: 'Completed',
          buttonText: 'View Results',
          buttonColor: colors.success[600],
        };
      case 'in_progress':
        return {
          icon: RotateCcw,
          color: colors.warning[600],
          backgroundColor: colors.warning[50],
          label: 'In Progress',
          buttonText: 'Continue Test',
          buttonColor: colors.warning[600],
        };
      default:
        return {
          icon: AlertCircle,
          color: colors.primary[600],
          backgroundColor: colors.primary[50],
          label: 'Not Started',
          buttonText: 'Start Test',
          buttonColor: colors.primary[600],
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const handleStartTest = () => {
    if (test.test_mode !== 'online') {
      // For offline tests, students can't take them in the app
      return;
    }

    // Navigate to test taking screen
    router.push({
      pathname: `/test/${test.id}/take` as any,
      params: {
        testTitle: test.title,
        timeLimit: test.time_limit_seconds || '',
      },
    });
  };

  const handleViewResults = () => {
    if (test.test_mode !== 'online') {
      return;
    }

    // Navigate to results view
    router.push({
      pathname: `/test/${test.id}/results` as any,
      params: {
        testTitle: test.title,
      },
    });
  };

  const isTestAvailable = () => {
    // Test must be active
    if (test.status !== 'active') return false;

    // Test must be online
    if (test.test_mode !== 'online') return false;

    // If test has a date, check if it's available
    if (test.test_date) {
      const testDate = new Date(test.test_date);
      const now = new Date();
      // Test should be available on or after the test date
      if (now < testDate) return false;
    }

    // If already completed and reattempts not allowed
    if (status === 'completed' && !test.allow_reattempts) {
      return true; // Can view results
    }

    return true;
  };

  const canTakeTest = isTestAvailable();

  const getScoreDisplay = () => {
    if (status === 'completed' && attempt) {
      const score = attempt.earned_points || 0;
      const total = attempt.total_points || 0;
      const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
      return {
        score,
        total,
        percentage,
      };
    }
    return null;
  };

  const scoreDisplay = getScoreDisplay();

  return (
    <Card style={styles.card}>
      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {test.title}
            </Text>
          </View>

          <View style={styles.badges}>
            {test.test_mode === 'online' ? (
              <View style={[styles.badge, styles.badgeOnline]}>
                <Text style={styles.badgeText}>ONLINE</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.badgeOffline]}>
                <Text style={styles.badgeText}>OFFLINE</Text>
              </View>
            )}

            <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
              <StatusIcon size={14} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Test Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <BookOpen size={16} color={colors.text.secondary} />
            <Text style={styles.infoText}>{test.subject_name}</Text>
          </View>

          {test.test_date && (
            <View style={styles.infoRow}>
              <Calendar size={16} color={colors.text.secondary} />
              <Text style={styles.infoText}>
                {format(new Date(test.test_date), 'MMM dd, yyyy')}
              </Text>
            </View>
          )}

          {test.time_limit_seconds && test.test_mode === 'online' && (
            <View style={styles.infoRow}>
              <Clock size={16} color={colors.text.secondary} />
              <Text style={styles.infoText}>
                {Math.floor(test.time_limit_seconds / 60)} minutes
              </Text>
            </View>
          )}
        </View>

        {/* Score Display (if completed) */}
        {scoreDisplay && (
          <View style={styles.scoreSection}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Your Score</Text>
              <View style={styles.scoreDisplay}>
                <Text style={styles.scoreValue}>
                  {scoreDisplay.score}/{scoreDisplay.total}
                </Text>
                <View style={styles.percentageBadge}>
                  <Text style={styles.percentageText}>{scoreDisplay.percentage}%</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Additional Info */}
        <View style={styles.additionalInfo}>
          {test.test_mode === 'online' && (
            <Text style={styles.additionalText}>
              {test.question_count || 0} Questions
            </Text>
          )}
          {test.test_mode === 'offline' && (
            <Text style={styles.additionalText}>
              Max Marks: {test.max_marks || 100}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        {test.test_mode === 'online' ? (
          canTakeTest ? (
            status === 'completed' && test.allow_reattempts ? (
              // Show both View Result and Retake for completed tests with reattempts allowed
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.secondaryButton]}
                  onPress={handleViewResults}
                >
                  <CheckCircle size={20} color={colors.success[600]} />
                  <Text style={styles.secondaryButtonText}>View Result</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary[600] }]}
                  onPress={handleStartTest}
                >
                  <RotateCcw size={20} color={colors.text.inverse} />
                  <Text style={styles.actionButtonText}>Retake Test</Text>
                </TouchableOpacity>
              </View>
            ) : status === 'completed' && !test.allow_reattempts ? (
              // Show only View Result for completed tests without reattempts
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.success[600] }]}
                onPress={handleViewResults}
              >
                <CheckCircle size={20} color={colors.text.inverse} />
                <Text style={styles.actionButtonText}>View Result</Text>
              </TouchableOpacity>
            ) : (
              // Show Start/Continue for not started or in progress tests
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: statusConfig.buttonColor },
                ]}
                onPress={handleStartTest}
              >
                <Play size={20} color={colors.text.inverse} />
                <Text style={styles.actionButtonText}>{statusConfig.buttonText}</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={styles.unavailableButton}>
              <Text style={styles.unavailableText}>
                {test.status !== 'active' ? 'Test not active' : 'Not available yet'}
              </Text>
            </View>
          )
        ) : (
          <View style={styles.offlineNotice}>
            <AlertCircle size={16} color={colors.text.secondary} />
            <Text style={styles.offlineText}>
              This is an offline test. Your teacher will upload marks after evaluation.
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  cardContent: {
    padding: spacing.sm,
  },
  header: {
    marginBottom: spacing.sm,
  },
  titleRow: {
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    lineHeight: typography.fontSize.lg * 1.3,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeOnline: {
    backgroundColor: colors.primary[600],
  },
  badgeOffline: {
    backgroundColor: colors.secondary[600],
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  infoSection: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  scoreSection: {
    marginBottom: spacing.sm,
  },
  scoreCard: {
    backgroundColor: colors.success[50],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  scoreLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.success[700],
    marginBottom: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.success[700],
  },
  percentageBadge: {
    backgroundColor: colors.success[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  percentageText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  additionalInfo: {
    marginBottom: spacing.sm,
  },
  additionalText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  actionButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.success[50],
    borderWidth: 2,
    borderColor: colors.success[600],
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.success[600],
  },
  unavailableButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
  },
  unavailableText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.warning[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  offlineText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.warning[700],
    lineHeight: typography.fontSize.sm * 1.4,
  },
});
