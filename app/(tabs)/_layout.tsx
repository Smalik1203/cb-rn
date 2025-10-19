import { Tabs } from 'expo-router';
import { Home, Calendar, CheckSquare, DollarSign, MessageSquare, BarChart3, Users, Settings } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { userMetadata } = useAuth();
  const role = userMetadata?.role || 'student';

  const showAdminTabs = role === 'admin' || role === 'superadmin' || role === 'cb_admin';
  const showSuperAdminTabs = role === 'superadmin' || role === 'cb_admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#999',
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
