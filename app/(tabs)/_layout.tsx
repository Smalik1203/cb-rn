import { Tabs } from 'expo-router';
import { Home, Calendar, CheckSquare, DollarSign, BarChart3, Users, Settings, CalendarDays, BookOpen } from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { colors, typography, spacing } from '@/lib/design-system';

export default function TabLayout() {
  const { profile } = useAuth();
  const role = profile?.role || 'student';

  const showAdminTabs = role === 'admin' || role === 'superadmin' || role === 'cb_admin';
  const showSuperAdminTabs = role === 'superadmin' || role === 'cb_admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.neutral[500],
        tabBarStyle: {
          backgroundColor: colors.surface.primary,
          borderTopWidth: 1,
          borderTopColor: colors.border.light,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.semibold,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="timetable"
        options={{
          title: 'Timetable',
          tabBarIcon: ({ size, color }) => <Calendar size={size} color={color} />,
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

      {showAdminTabs && (
        <>
          <Tabs.Screen
            name="analytics"
            options={{
              title: 'Analytics',
              tabBarIcon: ({ size, color }) => <BarChart3 size={size} color={color} />,
            }}
          />

          {showSuperAdminTabs && (
            <Tabs.Screen
              name="manage"
              options={{
                title: 'Manage',
                tabBarIcon: ({ size, color }) => <Users size={size} color={color} />,
              }}
            />
          )}
        </>
      )}

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
