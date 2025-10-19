import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Text, Card, Avatar, Chip, ProgressBar } from 'react-native-paper';
import { Calendar, Clock, Users, BookOpen, TrendingUp, Bell, Award, DollarSign } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const MOCK_USER = {
  name: 'Priya Sharma',
  role: 'Teacher',
  class: 'Grade 10-A',
  avatar: 'PS',
};

const MOCK_STATS = {
  students: 35,
  attendance: 92,
  pendingFees: 3,
  upcomingTests: 2,
};

const MOCK_SCHEDULE = [
  { id: '1', subject: 'Mathematics', time: '9:00 AM', room: 'Room 201', status: 'ongoing' },
  { id: '2', subject: 'Physics', time: '10:30 AM', room: 'Lab 1', status: 'upcoming' },
  { id: '3', subject: 'English', time: '12:00 PM', room: 'Room 105', status: 'upcoming' },
];

const MOCK_ANNOUNCEMENTS = [
  { id: '1', title: 'Parent-Teacher Meeting', date: '25 Oct', type: 'event' },
  { id: '2', title: 'Half-Yearly Results', date: '28 Oct', type: 'result' },
  { id: '3', title: 'Sports Day Registration', date: '30 Oct', type: 'event' },
];

const MOCK_QUICK_ACTIONS = [
  { id: '1', title: 'Mark Attendance', icon: 'check-circle', color: '#10b981', route: '/attendance-demo' },
  { id: '2', title: 'View Timetable', icon: 'calendar', color: '#667eea', route: '/demo-timetable' },
  { id: '3', title: 'Fee Management', icon: 'dollar-sign', color: '#f59e0b', route: '/demo-fees' },
  { id: '4', title: 'Analytics', icon: 'trending-up', color: '#ec4899', route: '/demo-analytics' },
];

export default function DemoHomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Avatar.Text size={56} label={MOCK_USER.avatar} style={styles.avatar} />
          <View style={styles.headerText}>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Welcome back,
            </Text>
            <Text variant="titleLarge" style={styles.headerName}>
              {MOCK_USER.name}
            </Text>
            <Chip icon="school" mode="flat" style={styles.roleChip} textStyle={styles.roleChipText}>
              {MOCK_USER.class} • {MOCK_USER.role}
            </Chip>
          </View>
        </View>
        <TouchableOpacity style={styles.bellIcon}>
          <Bell size={24} color="#ffffff" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard} elevation={2}>
            <Card.Content style={styles.statContent}>
              <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                <Users size={24} color="#667eea" />
              </View>
              <Text style={styles.statValue}>{MOCK_STATS.students}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard} elevation={2}>
            <Card.Content style={styles.statContent}>
              <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
                <TrendingUp size={24} color="#10b981" />
              </View>
              <Text style={styles.statValue}>{MOCK_STATS.attendance}%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard} elevation={2}>
            <Card.Content style={styles.statContent}>
              <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                <DollarSign size={24} color="#f59e0b" />
              </View>
              <Text style={styles.statValue}>{MOCK_STATS.pendingFees}</Text>
              <Text style={styles.statLabel}>Pending Fees</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard} elevation={2}>
            <Card.Content style={styles.statContent}>
              <View style={[styles.statIcon, { backgroundColor: '#fce7f3' }]}>
                <Award size={24} color="#ec4899" />
              </View>
              <Text style={styles.statValue}>{MOCK_STATS.upcomingTests}</Text>
              <Text style={styles.statLabel}>Tests Due</Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Today's Schedule
            </Text>
            <Text style={styles.sectionLink}>View All →</Text>
          </View>

          {MOCK_SCHEDULE.map((item) => (
            <Card key={item.id} style={styles.scheduleCard} elevation={1}>
              <Card.Content style={styles.scheduleContent}>
                <View style={styles.scheduleLeft}>
                  <View style={[
                    styles.scheduleIndicator,
                    { backgroundColor: item.status === 'ongoing' ? '#10b981' : '#667eea' }
                  ]} />
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleSubject}>{item.subject}</Text>
                    <View style={styles.scheduleDetails}>
                      <Clock size={14} color="#6b7280" />
                      <Text style={styles.scheduleTime}>{item.time}</Text>
                      <Text style={styles.scheduleRoom}>• {item.room}</Text>
                    </View>
                  </View>
                </View>
                {item.status === 'ongoing' && (
                  <Chip mode="flat" style={styles.ongoingChip} textStyle={styles.ongoingText}>
                    Live
                  </Chip>
                )}
              </Card.Content>
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Quick Actions
            </Text>
          </View>

          <View style={styles.actionsGrid}>
            {MOCK_QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                  {action.icon === 'check-circle' && <Users size={24} color={action.color} />}
                  {action.icon === 'calendar' && <Calendar size={24} color={action.color} />}
                  {action.icon === 'dollar-sign' && <DollarSign size={24} color={action.color} />}
                  {action.icon === 'trending-up' && <TrendingUp size={24} color={action.color} />}
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Announcements
            </Text>
          </View>

          {MOCK_ANNOUNCEMENTS.map((announcement) => (
            <Card key={announcement.id} style={styles.announcementCard} elevation={1}>
              <Card.Content style={styles.announcementContent}>
                <View style={[
                  styles.announcementIcon,
                  { backgroundColor: announcement.type === 'event' ? '#dbeafe' : '#fce7f3' }
                ]}>
                  {announcement.type === 'event' ? (
                    <Calendar size={20} color="#667eea" />
                  ) : (
                    <Award size={20} color="#ec4899" />
                  )}
                </View>
                <View style={styles.announcementInfo}>
                  <Text style={styles.announcementTitle}>{announcement.title}</Text>
                  <Text style={styles.announcementDate}>{announcement.date}</Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <Card style={styles.performanceCard} elevation={2}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.performanceTitle}>
                Class Performance
              </Text>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceLabel}>Average Score</Text>
                <View style={styles.performanceBar}>
                  <ProgressBar progress={0.85} color="#10b981" style={styles.progressBar} />
                  <Text style={styles.performanceValue}>85%</Text>
                </View>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceLabel}>Assignment Completion</Text>
                <View style={styles.performanceBar}>
                  <ProgressBar progress={0.78} color="#667eea" style={styles.progressBar} />
                  <Text style={styles.performanceValue}>78%</Text>
                </View>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceLabel}>Participation Rate</Text>
                <View style={styles.performanceBar}>
                  <ProgressBar progress={0.92} color="#f59e0b" style={styles.progressBar} />
                  <Text style={styles.performanceValue}>92%</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  avatar: {
    backgroundColor: '#ffffff',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: '#e0e7ff',
    fontSize: 16,
  },
  headerName: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  roleChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
  },
  roleChipText: {
    color: '#ffffff',
    fontSize: 12,
  },
  bellIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  sectionLink: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
  },
  scheduleCard: {
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  scheduleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  scheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  scheduleIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  scheduleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleTime: {
    fontSize: 13,
    color: '#6b7280',
  },
  scheduleRoom: {
    fontSize: 13,
    color: '#6b7280',
  },
  ongoingChip: {
    backgroundColor: '#d1fae5',
  },
  ongoingText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
  announcementCard: {
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  announcementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  announcementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementInfo: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  announcementDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  performanceCard: {
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  performanceTitle: {
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  performanceItem: {
    marginBottom: 16,
  },
  performanceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  performanceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    minWidth: 40,
    textAlign: 'right',
  },
});
