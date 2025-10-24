import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useClassSelection } from '@/src/contexts/ClassSelectionContext';
import { ClassSelector } from '@/src/components/ClassSelector';
import { EnhancedTimetable } from '@/src/components/timetable/EnhancedTimetable';

export default function TimetableScreen() {
  const { profile } = useAuth();
  const { isSuperAdmin } = useClassSelection();

  const role = profile?.role || 'student';
  const canManageTimetable = role === 'admin' || role === 'superadmin' || role === 'cb_admin';

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Calendar size={28} color="white" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Timetable</Text>
              <Text style={styles.headerSubtitle}>
                {canManageTimetable ? 'Manage class schedules' : 'View your schedule'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Class Selector */}
        <View style={styles.selectorContainer}>
          <ClassSelector />
        </View>

        {/* Timetable Content */}
        <View style={styles.contentContainer}>
          <EnhancedTimetable />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  selectorContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
});