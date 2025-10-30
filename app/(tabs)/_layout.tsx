import React, { useEffect } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Home, Calendar, CheckSquare, DollarSign, BarChart3, Users, CalendarDays, BookOpen } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/design-system';
import { AppNavbar } from '../../src/components/layout/AppNavbarExpo';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const { profile, status, loading, bootstrapping } = useAuth();
  const role = profile?.role;
  const router = useRouter();

  // Protect routes: redirect to login if no profile or not signed in
  useEffect(() => {
    // Don't redirect while checking/auth is loading
    if (loading || bootstrapping) {
      return;
    }
    
    if (status === 'signedOut' || status === 'accessDenied' || (status === 'signedIn' && !profile)) {
      // Only redirect if we're not already on login page
      router.replace('/login');
    }
  }, [status, profile, loading, bootstrapping, router]);

  // Don't render tabs if user doesn't have a profile or auth is still loading
  if (loading || bootstrapping || status !== 'signedIn' || !profile) {
    return null; // Will redirect via useEffect or show loading
  }

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
        tabBarStyle: { display: 'none' }, // Hide tab bar globally
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
        name="syllabus"
        options={{
          title: 'Syllabus',
          tabBarIcon: ({ size, color }) => <BookOpen size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="syllabus-student"
        options={{
          title: 'Syllabus (Student)',
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
