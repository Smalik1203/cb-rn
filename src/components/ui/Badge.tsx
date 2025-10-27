import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, borderRadius, spacing, typography, shadows } from '../../../lib/design-system';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  style,
  textStyle,
}: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary[100],
          textColor: colors.primary[700],
          borderColor: colors.primary[200],
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary[100],
          textColor: colors.secondary[700],
          borderColor: colors.secondary[200],
        };
      case 'success':
        return {
          backgroundColor: colors.success[100],
          textColor: colors.success[700],
          borderColor: colors.success[200],
        };
      case 'warning':
        return {
          backgroundColor: colors.warning[100],
          textColor: colors.warning[700],
          borderColor: colors.warning[200],
        };
      case 'error':
        return {
          backgroundColor: colors.error[100],
          textColor: colors.error[700],
          borderColor: colors.error[200],
        };
      case 'info':
        return {
          backgroundColor: colors.info[100],
          textColor: colors.info[700],
          borderColor: colors.info[200],
        };
      default:
        return {
          backgroundColor: colors.neutral[100],
          textColor: colors.neutral[700],
          borderColor: colors.neutral[200],
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
          fontSize: typography.fontSize.xs,
          borderRadius: borderRadius.sm,
        };
      case 'md':
        return {
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.md,
          fontSize: typography.fontSize.sm,
          borderRadius: borderRadius.md,
        };
      case 'lg':
        return {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          fontSize: typography.fontSize.base,
          borderRadius: borderRadius.lg,
        };
      default:
        return {
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.md,
          fontSize: typography.fontSize.sm,
          borderRadius: borderRadius.md,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const badgeStyles = [
    styles.badge,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      paddingVertical: sizeStyles.paddingVertical,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      borderRadius: sizeStyles.borderRadius,
    },
    style,
  ];

  const textStyles = [
    styles.text,
    {
      color: variantStyles.textColor,
      fontSize: sizeStyles.fontSize,
      fontWeight: typography.fontWeight.semibold,
    },
    textStyle,
  ];

  return (
    <View style={badgeStyles}>
      <Text style={textStyles}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    ...shadows.xs,
  },
  text: {
    textAlign: 'center',
  },
});
