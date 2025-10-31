import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  UserPlus, 
  BookOpen, 
  List, 
  Users, 
  Calendar, 
  FileText, 
  DollarSign, 
  Clock 
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/design-system';
import { Card } from '../../src/components/ui';

const { width } = Dimensions.get('window');

type SetupTask = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: any;
  route: string;
  color: string;
  bgColor: string;
  iconBg: string;
  priority: number;
};

const SETUP_TASKS: SetupTask[] = [
  {
    id: 'admins',
    title: 'Administrator Setup',
    tagline: 'Create accounts',
    description: 'Create and manage administrator accounts for your school',
    icon: UserPlus,
    route: '/(tabs)/add-admin',
    color: colors.success[600],
    bgColor: colors.success[50],
    iconBg: colors.success[100],
    priority: 1,
  },
  {
    id: 'classes',
    title: 'Class Structure',
    tagline: 'Organize grades',
    description: 'Define academic years, grades, and class organization',
    icon: List,
    route: '/(tabs)/add-classes',
    color: colors.warning[600],
    bgColor: colors.warning[50],
    iconBg: colors.warning[100],
    priority: 2,
  },
  {
    id: 'subjects',
    title: 'Subject Management',
    tagline: 'Set curriculum',
    description: 'Set up curriculum subjects and course offerings',
    icon: BookOpen,
    route: '/(tabs)/add-subjects',
    color: colors.info[600],
    bgColor: colors.info[50],
    iconBg: colors.info[100],
    priority: 3,
  },
  {
    id: 'students',
    title: 'Student Enrollment',
    tagline: 'Enroll students',
    description: 'Enroll students and assign them to classes',
    icon: Users,
    route: '/(tabs)/manage',
    color: colors.primary[600],
    bgColor: colors.primary[50],
    iconBg: colors.primary[100],
    priority: 4,
  },
  {
    id: 'timetable',
    title: 'Timetable Management',
    tagline: 'Create schedules',
    description: 'Create and manage class schedules and timetables',
    icon: Calendar,
    route: '/(tabs)/timetable',
    color: colors.info[600],
    bgColor: colors.info[50],
    iconBg: colors.info[100],
    priority: 5,
  },
  {
    id: 'syllabus',
    title: 'Syllabus & Learning',
    tagline: 'Manage resources',
    description: 'Manage curriculum and learning resources',
    icon: FileText,
    route: '/(tabs)/syllabus',
    color: colors.success[500],
    bgColor: colors.success[50],
    iconBg: colors.success[100],
    priority: 6,
  },
  {
    id: 'fees',
    title: 'Fee Management',
    tagline: 'Handle billing',
    description: 'Handle payments, billing, and fee collection',
    icon: DollarSign,
    route: '/(tabs)/fees',
    color: colors.warning[600],
    bgColor: colors.warning[50],
    iconBg: colors.warning[100],
    priority: 7,
  },
  {
    id: 'attendance',
    title: 'Attendance Tracking',
    tagline: 'Monitor attendance',
    description: 'Monitor and track student attendance',
    icon: Clock,
    route: '/(tabs)/attendance',
    color: colors.error[500],
    bgColor: colors.error[50],
    iconBg: colors.error[100],
    priority: 8,
  },
];

export default function SetupSchoolScreen() {
  const router = useRouter();

  const handleTaskPress = (route: string) => {
    try {
      router.push(route as any);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary[50], colors.surface.primary]}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Quick Setup</Text>
            <Text style={styles.subtitle}>
              Get your school up and running in minutes
            </Text>
          </View>

          {/* Setup Tasks Grid */}
          <View style={styles.grid}>
            {SETUP_TASKS.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={styles.cardWrapper}
                onPress={() => handleTaskPress(task.route)}
                activeOpacity={0.7}
              >
                <Card style={[styles.card, { backgroundColor: task.bgColor }]}>
                  {/* Icon */}
                  <View style={[styles.iconContainer, { backgroundColor: task.iconBg }]}>
                    <task.icon size={32} color={task.color} />
                  </View>

                  {/* Content */}
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{task.title}</Text>
                    <Text style={[styles.cardTagline, { color: task.color }]}>
                      {task.tagline}
                    </Text>
                  </View>

                  {/* Priority Badge */}
                  <View style={[styles.priorityBadge, { backgroundColor: task.color }]}>
                    <Text style={styles.priorityText}>{task.priority}</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.primary,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
    marginBottom: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    minHeight: 180,
    ...shadows.md,
    position: 'relative',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardTagline: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
  },
  priorityBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  priorityText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.surface.primary,
  },
});

