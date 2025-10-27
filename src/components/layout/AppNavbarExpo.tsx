import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Menu, Plus, RefreshCw, User } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../../lib/design-system';

type AppNavbarProps = {
  title: string;
  showBackButton?: boolean;
  onAddPress?: () => void;
  onRefreshPress?: () => void;
  showProfileShortcut?: boolean;
};

export const AppNavbar: React.FC<AppNavbarProps> = ({
  title,
  showBackButton = false,
  onAddPress,
  onRefreshPress,
  showProfileShortcut = true,
}) => {
  const router = useRouter();
  const navigation = useNavigation();

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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
          {showProfileShortcut ? (
            <TouchableOpacity
              onPress={() => {
                // Open drawer instead of navigating to non-existent profile
                navigation.dispatch(DrawerActions.openDrawer());
              }}
              style={styles.iconBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <User size={20} color={colors.text.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
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
});

export default AppNavbar;
