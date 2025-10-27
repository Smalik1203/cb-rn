import React, { useMemo } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Home, CalendarDays, Clock, BookOpen, CheckSquare, Users, Wrench, BarChart3, DollarSign, LogOut } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../../../lib/design-system';
import { useAuth } from '../../contexts/AuthContext';

type MenuItem = {
  key: string;
  label: string;
  icon: any;
  route: string;
  roles?: Array<'superadmin' | 'cb_admin' | 'admin' | 'teacher' | 'student'>;
  section: 'Main' | 'Academic' | 'Learning' | 'Settings' | 'CB Admin';
};

const MENU: MenuItem[] = [
  { key: 'home', label: 'Home', icon: Home, route: '/(tabs)', section: 'Main' },
  { key: 'calendar', label: 'Calendar', icon: CalendarDays, route: '/(tabs)/calendar', section: 'Main' },
  { key: 'timetable', label: 'Timetable', icon: Clock, route: '/(tabs)/timetable', section: 'Main' },
  { key: 'resources', label: 'Resources', icon: BookOpen, route: '/(tabs)/resources', section: 'Learning' },
  { key: 'attendance', label: 'Attendance', icon: CheckSquare, route: '/(tabs)/attendance', roles: ['admin', 'superadmin', 'cb_admin'], section: 'Academic' },
  { key: 'fees', label: 'Fees', icon: DollarSign, route: '/(tabs)/fees', roles: ['admin', 'superadmin', 'cb_admin'], section: 'Academic' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, route: '/(tabs)/analytics', roles: ['admin', 'superadmin', 'cb_admin'], section: 'Academic' },
  { key: 'class_mgmt', label: 'Management', icon: Wrench, route: '/(tabs)/manage', roles: ['admin', 'superadmin', 'cb_admin'], section: 'Academic' },
];

export function DrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const role = (profile?.role || 'student') as MenuItem['roles'][number];

  const grouped = useMemo(() => {
    const allowed = MENU.filter(item => !item.roles || item.roles.includes(role));
    const sections: Record<string, MenuItem[]> = {};
    for (const item of allowed) {
      sections[item.section] = sections[item.section] || [];
      sections[item.section].push(item);
    }
    return sections;
  }, [role]);

  const handleLogout = async () => {
    try {
      // Close drawer first
      props.navigation.closeDrawer();
      // Then logout
      await signOut();
      router.replace('/login');
    } catch (error) {
    }
  };

  return (
    <DrawerContentScrollView {...props} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image source={require('../../../assets/images/icon.png')} style={styles.logo} />
          <View>
            <Text style={styles.appName}>ClassBridge</Text>
            <Text style={styles.schoolName} numberOfLines={1}>
              {profile?.school_name || profile?.school_code || '—'}
            </Text>
          </View>
        </View>
        <View style={styles.userRow}>
          <Text style={styles.userName} numberOfLines={1}>{profile?.full_name || 'User'}</Text>
          <Text style={styles.userRole}>{(profile?.role || 'student').toUpperCase()}</Text>
        </View>
      </View>

      {/* Custom menu items */}
      <View style={styles.menu}>
        {Object.entries(grouped).map(([section, items]) => (
          <View key={section} style={styles.section}>
            <Text style={styles.sectionLabel}>{section}</Text>
            {items.map(item => (
              <DrawerItem
                key={item.key}
                label={item.label}
                icon={({ size, color }) => <item.icon size={size} color={color} />}
                onPress={() => {
                  try {
                    // Close drawer first
                    props.navigation.closeDrawer();
                    // Then navigate
                    router.push(item.route as any);
                  } catch (error) {
                    // Fallback navigation
                    try {
                      router.replace(item.route as any);
                    } catch (fallbackError) {
                    }
                  }
                }}
                style={styles.menuItem}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <DrawerItem
          label="Sign out"
          icon={({ size, color }) => <LogOut size={size} color={color} />}
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.secondary,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  appName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  schoolName: {
    color: colors.text.secondary,
    maxWidth: 200,
  },
  userRow: {
    marginTop: spacing.sm,
  },
  userName: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium as any,
  },
  userRole: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.sm,
  },
  menu: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  menuItem: {
    marginVertical: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  logoutBtn: {
    marginBottom: spacing.sm,
  },
  version: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
});

export default DrawerContent;
