import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { CheckSquare, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useClassSelection } from '@/src/contexts/ClassSelectionContext';
import { ClassSelector } from '@/src/components/ClassSelector';
import { UnifiedAttendance } from '@/src/components/attendance/UnifiedAttendance';
import { AttendanceAnalytics } from '@/src/components/attendance/AttendanceAnalytics';
import { colors, typography, spacing, borderRadius } from '@/lib/design-system';

export default function AttendanceScreen() {
  const { profile } = useAuth();
  const { isSuperAdmin } = useClassSelection();
  const [activeTab, setActiveTab] = useState<'mark' | 'analytics'>('mark');

  const role = profile?.role || 'student';
  const canMark = role === 'admin' || role === 'superadmin' || role === 'cb_admin';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'mark':
        return <UnifiedAttendance />;
      case 'analytics':
        return <AttendanceAnalytics />;
      default:
        return <UnifiedAttendance />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <CheckSquare size={24} color={colors.success[600]} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Attendance</Text>
            <Text style={styles.headerSubtitle}>
              {canMark ? 'Mark and track attendance' : 'View your attendance'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.selectorContainer}>
          <ClassSelector />
        </View>

        <View style={styles.tabContainer}>
          <Surface style={styles.tabSurface} elevation={1}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'mark' && styles.activeTab]}
              onPress={() => setActiveTab('mark')}
            >
              <CheckSquare size={20} color={activeTab === 'mark' ? colors.success[600] : colors.neutral[500]} />
              <Text style={[styles.tabText, activeTab === 'mark' && styles.activeTabText]}>
                Mark Attendance
              </Text>
            </TouchableOpacity>
            {isSuperAdmin && (
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'analytics' && styles.activeTab]}
                onPress={() => setActiveTab('analytics')}
              >
                <TrendingUp size={20} color={activeTab === 'analytics' ? colors.success[600] : colors.neutral[500]} />
                <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
                  Analytics
                </Text>
              </TouchableOpacity>
            )}
          </Surface>
        </View>

        <View style={styles.contentContainer}>
          {renderTabContent()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.app,
  },
  header: {
    backgroundColor: colors.surface.primary,
    paddingTop: spacing.xl + 20,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.success[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  scrollView: {
    flex: 1,
  },
  selectorContainer: {
    padding: spacing.md,
  },
  tabContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  tabSurface: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface.primary,
    flexDirection: 'row',
    padding: spacing.xs,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  activeTab: {
    backgroundColor: colors.success[50],
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.success[700],
    fontWeight: typography.fontWeight.semibold,
  },
  contentContainer: {
    padding: spacing.md,
  },
});
