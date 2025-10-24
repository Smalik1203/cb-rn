import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, SegmentedButtons } from 'react-native-paper';
import { CalendarDays } from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useClassSelection } from '@/src/contexts/ClassSelectionContext';
import { ClassSelector } from '@/src/components/ClassSelector';
import { Calendar } from '@/src/components/calendar/Calendar';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/design-system';

export default function CalendarScreen() {
  const { profile } = useAuth();
  const { isSuperAdmin } = useClassSelection();
  const [activeTab, setActiveTab] = useState<'calendar' | 'events'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const role = profile?.role || 'student';
  const canManageEvents = role === 'admin' || role === 'superadmin' || role === 'cb_admin';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'calendar':
        return (
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        );
      case 'events':
        return (
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        );
      default:
        return (
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <CalendarDays size={32} color={colors.text.inverse} />
            </View>
            <View>
              <Text variant="headlineSmall" style={styles.headerTitle}>
                Calendar
              </Text>
              <Text variant="bodyLarge" style={styles.headerSubtitle}>
                {canManageEvents ? 'Manage events and view calendar' : 'View school calendar and events'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ClassSelector />

      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'calendar' | 'events')}
          buttons={[
            { value: 'calendar', label: 'Calendar', icon: 'calendar' },
            { value: 'events', label: 'Events', icon: 'calendar-clock' },
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
});
