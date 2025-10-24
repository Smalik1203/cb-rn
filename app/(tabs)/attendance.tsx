import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, SegmentedButtons, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckSquare, Users, TrendingUp, Clock } from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useClassSelection } from '@/src/contexts/ClassSelectionContext';
import { ClassSelector } from '@/src/components/ClassSelector';
import { UnifiedAttendance } from '@/src/components/attendance/UnifiedAttendance';
import { AttendanceAnalytics } from '@/src/components/attendance/AttendanceAnalytics';

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
      {/* Modern Header */}
      <LinearGradient
        colors={['#F59E0B', '#D97706']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <CheckSquare size={28} color="white" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Attendance</Text>
              <Text style={styles.headerSubtitle}>
                {canMark ? 'Mark and track attendance' : 'View your attendance'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Class Selector */}
        <View style={styles.selectorContainer}>
          <ClassSelector />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <Surface style={styles.tabSurface} elevation={2}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'mark' && styles.activeTab]}
              onPress={() => setActiveTab('mark')}
            >
              <CheckSquare size={20} color={activeTab === 'mark' ? '#F59E0B' : '#6B7280'} />
              <Text style={[styles.tabText, activeTab === 'mark' && styles.activeTabText]}>
                Mark Attendance
              </Text>
            </TouchableOpacity>
            {isSuperAdmin && (
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'analytics' && styles.activeTab]}
                onPress={() => setActiveTab('analytics')}
              >
                <TrendingUp size={20} color={activeTab === 'analytics' ? '#F59E0B' : '#6B7280'} />
                <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
                  Analytics
                </Text>
              </TouchableOpacity>
            )}
          </Surface>
        </View>

        {/* Content */}
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
  tabContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tabSurface: {
    backgroundColor: 'white',
    borderRadius: 16,
    flexDirection: 'row',
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#FEF3C7',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#F59E0B',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
});