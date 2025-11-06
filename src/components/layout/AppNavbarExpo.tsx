import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Modal, ScrollView, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { DrawerActions , useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Menu, Plus, RefreshCw, Bell, UserCheck, NotebookText, Target, CalendarDays, Activity, X } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../../lib/design-system';
import { useAuth } from '../../contexts/AuthContext';
import { useRecentActivity } from '../../hooks/useDashboard';

type AppNavbarProps = {
  title: string;
  showBackButton?: boolean;
  onAddPress?: () => void;
  onRefreshPress?: () => void;
};

export const AppNavbar: React.FC<AppNavbarProps> = ({
  title,
  showBackButton = false,
  onAddPress,
  onRefreshPress,
}) => {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [showActivityModal, setShowActivityModal] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;

  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(
    profile?.auth_id || '',
    profile?.class_instance_id || undefined
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  const handleMenuPress = () => {
    try {
      // Open the drawer using navigation dispatch
      navigation.dispatch(DrawerActions.openDrawer());
    } catch (error) {
      // Fallback navigation
      router.push('/(tabs)');
    }
  };

  const handleNotificationPress = () => {
    setShowActivityModal(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCloseModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowActivityModal(false);
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'attendance': return UserCheck;
      case 'assignment':
      case 'task': return NotebookText;
      case 'test': return Target;
      case 'event': return CalendarDays;
      default: return Activity;
    }
  };

  const getActivityColor = (color?: string) => {
    switch (color) {
      case 'success': return { bg: colors.success[50], icon: colors.success[600] };
      case 'error': return { bg: colors.error[50], icon: colors.error[600] };
      case 'warning': return { bg: colors.warning[50], icon: colors.warning[600] };
      case 'info': return { bg: colors.info[50], icon: colors.info[600] };
      case 'secondary': return { bg: colors.secondary[50], icon: colors.secondary[600] };
      default: return { bg: colors.primary[50], icon: colors.primary[600] };
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        <View style={styles.left}>
          {showBackButton ? (
            <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
              <ArrowLeft size={22} color={colors.text.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleMenuPress}
              style={styles.iconBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Menu size={22} color={colors.text.primary} />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.right}>
          {onRefreshPress ? (
            <TouchableOpacity onPress={onRefreshPress} style={styles.iconBtn}>
              <RefreshCw size={20} color={colors.text.primary} />
            </TouchableOpacity>
          ) : null}
          {onAddPress ? (
            <TouchableOpacity onPress={onAddPress} style={styles.iconBtn}>
              <Plus size={20} color={colors.text.primary} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={handleNotificationPress}
            style={styles.iconBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.notificationContainer}>
              <Bell size={20} color={colors.text.primary} />
              {recentActivity && recentActivity.length > 0 && (
                <View style={styles.notificationBadge} />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity Modal */}
      <Modal
        visible={showActivityModal}
        transparent
        animationType="none"
        onRequestClose={handleCloseModal}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: overlayOpacity }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleCloseModal}
          />
          <Animated.View
            style={[
              styles.bottomSheet,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [Dimensions.get('window').height, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={true}>
              {activityLoading ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Loading...</Text>
                </View>
              ) : recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  const activityColor = getActivityColor(activity.color);

                  return (
                    <View
                      key={activity.id}
                      style={[
                        styles.activityItem,
                        index < recentActivity.length - 1 && styles.activityItemBorder,
                      ]}
                    >
                      <View style={[styles.activityIcon, { backgroundColor: activityColor.bg }]}>
                        <ActivityIcon size={18} color={activityColor.icon} />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityTitle}>{activity.title}</Text>
                        <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                        <Text style={styles.activityTime}>{formatTimeAgo(activity.timestamp)}</Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Activity size={40} color={colors.text.secondary} />
                  <Text style={styles.emptyStateTitle}>No recent activity</Text>
                  <Text style={styles.emptyStateText}>
                    Your recent activity will appear here
                  </Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.surface.primary,
  },
  container: {
    height: 56,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: spacing.sm,
    fontWeight: typography.fontWeight.semibold as any,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 0,
    backgroundColor: 'transparent',
    // Ensure touch area is large enough
    minWidth: 44,
    minHeight: 44,
  },
  notificationContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error[500],
    borderWidth: 1.5,
    borderColor: colors.surface.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: '80%',
    minHeight: 300,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.neutral[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    flex: 1,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyStateText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default AppNavbar;
