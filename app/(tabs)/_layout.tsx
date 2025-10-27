import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Calendar, CheckSquare, DollarSign, BarChart3, Users, CalendarDays, BookOpen } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/design-system';
import { AppNavbar } from '../../src/components/layout/AppNavbarExpo';

export default function TabLayout() {
  const { profile } = useAuth();
  const role = profile?.role || 'student';

  const showAdminTabs = role === 'admin' || role === 'superadmin' || role === 'cb_admin';
  const showSuperAdminTabs = role === 'superadmin' || role === 'cb_admin';

  return (
    <Tabs
      screenOptions={{
        header: ({ options }) => (
          <AppNavbar 
            title={options.title || 'ClassBridge'} 
            showBackButton={false}
          />
        ),
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: {
          backgroundColor: colors.surface.primary,
          borderTopWidth: 1,
          borderTopColor: colors.border.light,
          borderTopLeftRadius: borderRadius.md,
          borderTopRightRadius: borderRadius.md,
          paddingTop: spacing.xs,
          paddingBottom: spacing.sm,
          height: 60,
          ...shadows.sm,
          elevation: 2,
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSize.xs - 1,
          fontWeight: typography.fontWeight.medium,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="timetable"
        options={{
          title: 'Timetable',
          tabBarIcon: ({ size, color }) => <Calendar size={size} color={color} />,
          tabBarStyle: { display: 'none' }, // Hide tab bar for timetable screen
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ size, color }) => <CalendarDays size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="resources"
        options={{
          title: 'Resources',
          tabBarIcon: ({ size, color }) => <BookOpen size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ size, color }) => <CheckSquare size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="fees"
        options={{
          title: 'Fees',
          tabBarIcon: ({ size, color }) => <DollarSign size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ size, color }) => <BarChart3 size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="manage"
        options={{
          title: 'Management',
          tabBarIcon: ({ size, color }) => <Users size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
