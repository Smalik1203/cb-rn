import React, { useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { 
  LayoutDashboard,
  CalendarDays, 
  CalendarRange, 
  NotebookText, 
  UserCheck, 
  UsersRound, 
  Wrench, 
  LineChart, 
  CreditCard, 
  LogOut, 
  Bell, 
  Settings2, 
  User, 
  ChevronRight,
  Star,
  Activity,
  CheckCircle2,
  UserPlus,
  List,
  Layers,
  ReceiptText,
  FolderOpen,
  Zap,
  FileText
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../../../lib/design-system';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

type MenuItem = {
  key: string;
  label: string;
  icon: any;
  route: string;
  roles?: Array<'superadmin' | 'cb_admin' | 'admin' | 'teacher' | 'student'>;
  section: 'Main' | 'Academic' | 'Learning' | 'Admin' | 'Settings' | 'CB Admin';
  badge?: number;
  isNew?: boolean;
  description?: string;
  hasSubMenu?: boolean;
  parent?: string;
};

const MENU: MenuItem[] = [
  { 
    key: 'home', 
    label: 'Dashboard', 
    icon: LayoutDashboard, 
    route: '/(tabs)', 
    section: 'Main',
    description: 'Overview and quick stats'
  },
  { 
    key: 'calendar', 
    label: 'Calendar', 
    icon: CalendarDays, 
    route: '/(tabs)/calendar', 
    section: 'Main',
    description: 'Events and schedules'
  },
  { 
    key: 'timetable', 
    label: 'Timetable', 
    icon: CalendarRange, 
    route: '/(tabs)/timetable', 
    section: 'Main',
    description: 'Class schedules',
    badge: 2
  },
  { 
    key: 'resources', 
    label: 'Resources', 
    icon: FolderOpen, 
    route: '/(tabs)/resources', 
    section: 'Learning',
    description: 'Study materials'
  },
  { 
    key: 'syllabus_staff', 
    label: 'Syllabus', 
    icon: NotebookText, 
    route: '/(tabs)/syllabus', 
    roles: ['admin', 'superadmin', 'cb_admin', 'teacher'],
    section: 'Learning',
    description: 'Chapters and topics'
  },
  { 
    key: 'syllabus_student', 
    label: 'Syllabus', 
    icon: NotebookText, 
    route: '/(tabs)/syllabus-student', 
    roles: ['student'],
    section: 'Learning',
    description: 'Your syllabus'
  },
  { 
    key: 'attendance', 
    label: 'Attendance', 
    icon: UserCheck, 
    route: '/(tabs)/attendance', 
    roles: ['admin', 'superadmin', 'cb_admin'], 
    section: 'Academic',
    description: 'Track student attendance',
    badge: 5
  },
  {
    key: 'assessments',
    label: 'Assessments',
    icon: FileText,
    route: '/(tabs)/assessments',
    section: 'Academic',
    description: 'Tests and exams',
    isNew: true
  },
  { 
    key: 'fees', 
    label: 'Fees', 
    icon: CreditCard, 
    route: '/(tabs)/fees', 
    roles: ['admin', 'superadmin', 'cb_admin'], 
    section: 'Academic',
    description: 'Fee management',
    hasSubMenu: true
  },
  { 
    key: 'fees_payments', 
    label: 'Payments', 
    icon: ReceiptText, 
    route: '/(tabs)/payments', 
    roles: ['admin', 'superadmin', 'cb_admin'], 
    section: 'Academic',
    description: 'Payment history',
    parent: 'fees'
  },
  { 
    key: 'fees_components', 
    label: 'Components', 
    icon: Settings2, 
    route: '/(tabs)/fees?tab=components', 
    roles: ['admin', 'superadmin', 'cb_admin'], 
    section: 'Academic',
    description: 'Manage fee components',
    parent: 'fees'
  },
  { 
    key: 'fees_manage', 
    label: 'Manage Fee', 
    icon: Wrench, 
    route: '/(tabs)/fees?tab=plans', 
    roles: ['admin', 'superadmin', 'cb_admin'], 
    section: 'Academic',
    description: 'Assign plans and record payments',
    parent: 'fees'
  },
  { 
    key: 'analytics', 
    label: 'Analytics', 
    icon: LineChart, 
    route: '/(tabs)/analytics', 
    roles: ['admin', 'superadmin', 'cb_admin'], 
    section: 'Academic',
    description: 'Performance insights'
  },
  { 
    key: 'tasks', 
    label: 'Tasks', 
    icon: CheckCircle2, 
    route: '/(tabs)/tasks', 
    roles: ['admin', 'superadmin', 'cb_admin', 'student'], 
    section: 'Academic',
    description: 'Homework and assignments',
    isNew: true
  },
  { 
    key: 'class_mgmt', 
    label: 'Management', 
    icon: Settings2, 
    route: '/(tabs)/manage', 
    roles: ['admin', 'superadmin', 'cb_admin'], 
    section: 'Academic',
    description: 'Class administration'
  },
  {
    key: 'setup',
    label: 'Setup School',
    icon: Zap,
    route: '/(tabs)/setup',
    roles: ['superadmin'],
    section: 'Admin',
    description: 'Quick school setup wizard',
    isNew: true
  },
  {
    key: 'add_admin',
    label: 'Add Admins',
    icon: UserPlus,
    route: '/(tabs)/add-admin',
    roles: ['superadmin'],
    section: 'Admin',
    description: 'Create and manage administrators'
  },
  {
    key: 'add_classes',
    label: 'Add Classes',
    icon: List,
    route: '/(tabs)/add-classes',
    roles: ['superadmin'],
    section: 'Admin',
    description: 'Manage academic years and classes'
  },
  {
    key: 'add_subjects',
    label: 'Add Subjects',
    icon: Layers,
    route: '/(tabs)/add-subjects',
    roles: ['superadmin'],
    section: 'Admin',
    description: 'Manage school subjects'
  },
  {
    key: 'add_student',
    label: 'Add Students',
    icon: UsersRound,
    route: '/(tabs)/add-student',
    roles: ['admin', 'superadmin'],
    section: 'Admin',
    description: 'Create and manage students'
  },
];

export function DrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const role = profile?.role as MenuItem['roles'][number];
  const [activeItem, setActiveItem] = React.useState<string>('home');
  const [expandedMenus, setExpandedMenus] = React.useState<Set<string>>(new Set(['fees']));
  const insets = useSafeAreaInsets();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const grouped = useMemo(() => {
    const allowed = MENU.filter(item => !item.roles || item.roles.includes(role));
    const sections: Record<string, MenuItem[]> = {};
    for (const item of allowed) {
      sections[item.section] = sections[item.section] || [];
      sections[item.section].push(item);
    }
    return sections;
  }, [role]);

  // Animation effects
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogout = async () => {
    try {
      props.navigation.closeDrawer();
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleSubMenu = (key: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleItemPress = (item: MenuItem) => {
    try {
      if (item.hasSubMenu) {
        toggleSubMenu(item.key);
        return;
      }
      
      setActiveItem(item.key);
      props.navigation.closeDrawer();
      
      // Handle sub-menu items by setting parent as active too
      if (item.parent) {
        setActiveItem(item.parent);
      }
      
      router.push(item.route as any);
    } catch (_error) {
      try {
        router.replace(item.route as any);
      } catch (fallbackError) {
        console.error('Navigation error:', fallbackError);
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return colors.error[500];
      case 'cb_admin': return colors.primary[600];
      case 'admin': return colors.secondary[600];
      case 'teacher': return colors.success[600];
      case 'student': return colors.info[600];
      default: return colors.neutral[500];
    }
  };

  return (
    <View style={styles.container}>
      {/* Clean Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.md,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.userSection}>
          <View style={[styles.avatar, { backgroundColor: getRoleColor(role || '') }]}>
            <User size={20} color={colors.surface.primary} />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName} numberOfLines={1}>
              {profile?.full_name || 'User'}
            </Text>
            <Text style={[styles.userRole, { color: getRoleColor(role || '') }]}>
              {(profile?.role || 'UNKNOWN').toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity style={styles.headerLogoutButton} onPress={handleLogout}>
            <LogOut size={16} color={colors.error[600]} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View 
        style={[
          styles.scrollView,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <DrawerContentScrollView {...props} style={styles.scrollView} showsVerticalScrollIndicator={false}>

          {/* Menu Sections */}
          <View style={styles.menu}>
            {Object.entries(grouped).map(([section, items]) => (
              <View key={section} style={styles.section}>
                <Text style={styles.sectionLabel}>{section}</Text>
                {items.filter(item => !item.parent).map((item) => {
                  const isExpanded = expandedMenus.has(item.key);
                  const subItems = items.filter(i => i.parent === item.key);
                  
                  return (
                    <View key={item.key}>
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      activeItem === item.key && styles.menuItemActive
                    ]}
                    onPress={() => handleItemPress(item)}
                  >
                    <item.icon 
                      size={20} 
                      color={activeItem === item.key ? colors.primary[600] : colors.text.secondary} 
                    />
                    <Text style={[
                      styles.menuItemLabel,
                      activeItem === item.key && styles.menuItemLabelActive
                    ]}>
                      {item.label}
                    </Text>
                        {item.hasSubMenu && (
                          <ChevronRight 
                            size={16} 
                            color={colors.text.secondary}
                            style={[
                              styles.chevron,
                              isExpanded && styles.chevronExpanded
                            ]}
                          />
                        )}
                    {item.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                      
                      {/* Sub-items */}
                      {item.hasSubMenu && isExpanded && subItems.map((subItem) => {
                        const isSubItemActive = activeItem === subItem.key || activeItem === subItem.parent;
                        return (
                          <TouchableOpacity
                            key={subItem.key}
                            style={[
                              styles.menuItem,
                              styles.subMenuItem,
                              isSubItemActive && styles.menuItemActive
                            ]}
                            onPress={() => handleItemPress(subItem)}
                          >
                            <subItem.icon 
                              size={18} 
                              color={isSubItemActive ? colors.primary[600] : colors.text.secondary} 
                            />
                            <Text style={[
                              styles.menuItemLabel,
                              styles.subMenuItemLabel,
                              isSubItemActive && styles.menuItemLabelActive
                            ]}>
                              {subItem.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </DrawerContentScrollView>
      </Animated.View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.schoolNameSection}>
          <Text style={styles.schoolNameText} numberOfLines={1}>
            {profile?.school_name || profile?.school_code || 'School Portal'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.primary,
    ...shadows.lg,
    elevation: 8,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.surface.primary,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: 2,
  },
  userRole: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
  },
  headerLogoutButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error[50],
  },
  scrollView: {
    flex: 1,
  },
  menu: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold as any,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginVertical: 2,
  },
  menuItemActive: {
    backgroundColor: colors.primary[50],
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[600],
  },
  menuItemLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
    marginLeft: spacing.md,
    flex: 1,
  },
  menuItemLabelActive: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold as any,
  },
  subMenuItem: {
    marginLeft: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.sm,
    marginVertical: 1,
  },
  subMenuItemLabel: {
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.sm,
    color: colors.text.secondary,
  },
  chevron: {
    marginLeft: 'auto',
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  badge: {
    backgroundColor: colors.error[500],
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: spacing.sm,
  },
  badgeText: {
    color: colors.surface.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold as any,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.surface.primary,
  },
  schoolNameSection: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  schoolNameText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    textAlign: 'center',
  },
});

export default DrawerContent;
