import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, SegmentedButtons } from 'react-native-paper';
import { BarChart3 } from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useClassSelection } from '@/src/contexts/ClassSelectionContext';
import { ClassSelector } from '@/src/components/ClassSelector';
import { AnalyticsDashboard } from '@/src/components/analytics/AnalyticsDashboard';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/design-system';

export default function AnalyticsScreen() {
  const { profile } = useAuth();
  const { isSuperAdmin } = useClassSelection();
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed'>('overview');

  const role = profile?.role || 'student';
  const canViewAnalytics = role === 'admin' || role === 'superadmin' || role === 'cb_admin';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AnalyticsDashboard />;
      case 'detailed':
        return <AnalyticsDashboard />; // For now, same component
      default:
        return <AnalyticsDashboard />;
    }
  };

  if (!canViewAnalytics) {
    return (
      <View style={styles.container}>
        <View
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <BarChart3 size={32} color={colors.text.inverse} />
              </View>
              <View>
                <Text variant="headlineSmall" style={styles.headerTitle}>
                  Analytics
                </Text>
                <Text variant="bodyLarge" style={styles.headerSubtitle}>
                  Access restricted to administrators
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.restrictedContainer}>
          <Text variant="bodyLarge" style={styles.restrictedText}>
            You don't have permission to view analytics.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <BarChart3 size={32} color={colors.text.inverse} />
            </View>
            <View>
              <Text variant="headlineSmall" style={styles.headerTitle}>
                Analytics
              </Text>
              <Text variant="bodyLarge" style={styles.headerSubtitle}>
                Comprehensive insights and performance metrics
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ClassSelector />

      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'overview' | 'detailed')}
          buttons={[
            { value: 'overview', label: 'Overview', icon: 'chart-pie' },
            { value: 'detailed', label: 'Detailed', icon: 'chart-bar' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {renderTabContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    paddingTop: spacing['12'],
    paddingBottom: spacing['8'],
    paddingHorizontal: spacing['6'],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['4'],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    marginBottom: spacing['1'],
  },
  headerSubtitle: {
    color: colors.text.inverse,
    opacity: 0.9,
  },
  tabContainer: {
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
  },
  segmentedButtons: {
    borderRadius: borderRadius.lg,
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['6'],
  },
  restrictedText: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
});