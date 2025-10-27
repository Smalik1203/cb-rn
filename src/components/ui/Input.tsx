import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle, TextStyle, TextInput, TextInputProps } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, borderRadius, spacing, typography, shadows, animation } from '../../../lib/design-system';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export function Input({
  label,
  error,
  helperText,
  variant = 'default',
  size = 'md',
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: colors.neutral[50],
          borderColor: isFocused ? colors.primary[500] : colors.neutral[200],
          borderWidth: 0,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderColor: isFocused ? colors.primary[500] : colors.border.DEFAULT,
          borderWidth: 2,
        };
      default:
        return {
          backgroundColor: colors.surface.primary,
          borderColor: isFocused ? colors.primary[500] : colors.border.light,
          borderWidth: 1,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          fontSize: typography.fontSize.sm,
          borderRadius: borderRadius.md,
        };
      case 'md':
        return {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          fontSize: typography.fontSize.base,
          borderRadius: borderRadius.lg,
        };
      case 'lg':
        return {
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.xl,
          fontSize: typography.fontSize.lg,
          borderRadius: borderRadius.lg,
        };
      default:
        return {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          fontSize: typography.fontSize.base,
          borderRadius: borderRadius.lg,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const containerStyles = [
    styles.container,
    containerStyle,
  ];

  const inputContainerStyles = [
    styles.inputContainer,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderColor: error ? colors.error[500] : variantStyles.borderColor,
      borderWidth: variantStyles.borderWidth,
      paddingVertical: sizeStyles.paddingVertical,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      borderRadius: sizeStyles.borderRadius,
      ...(isFocused && !error ? shadows.sm : shadows.xs),
    },
  ];

  const inputStyles = [
    styles.input,
    {
      fontSize: sizeStyles.fontSize,
      color: colors.text.primary,
    },
    inputStyle,
  ];

  const labelStyles = [
    styles.label,
    {
      color: error ? colors.error[500] : colors.text.secondary,
    },
    labelStyle,
  ];

  const helperStyles = [
    styles.helper,
    {
      color: error ? colors.error[500] : colors.text.tertiary,
    },
  ];

  return (
    <View style={containerStyles}>
      {label && <Text style={labelStyles}>{label}</Text>}
      
      <View style={inputContainerStyles}>
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={inputStyles}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={colors.text.quaternary}
          {...props}
        />
        
        {rightIcon && (
          <View style={styles.rightIcon}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {(error || helperText) && (
        <Text style={helperStyles}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  helper: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
});
