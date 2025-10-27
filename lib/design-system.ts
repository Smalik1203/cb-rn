import { ViewStyle, TextStyle } from 'react-native';

// Modern Educational SaaS Color Palette
export const colors = {
  // Primary Brand Colors - Deep Blue with Purple Accent
  primary: {
    50: '#f0f4ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
    main: '#6366f1', // Main primary color
  },

  // Secondary - Modern Teal
  secondary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e',
    main: '#14b8a6', // Main secondary color
  },

  // Success - Vibrant Green
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
    main: '#22c55e', // Main success color
  },

  // Warning - Modern Amber
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
    main: '#f59e0b', // Main warning color
  },

  // Error - Modern Red
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
    main: '#ef4444', // Main error color
  },

  // Info - Modern Blue
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Neutral - Modern Grays
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },

  // Background System
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    quaternary: '#e2e8f0',
    dark: '#0f172a',
    app: '#f8fafc',
    elevated: '#ffffff',
    glass: 'rgba(255, 255, 255, 0.8)',
    default: '#f8fafc', // Default background
    light: '#f1f5f9', // Light background
    paper: '#ffffff', // Paper background
  },

  // Surface System
  surface: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    elevated: '#ffffff',
    overlay: 'rgba(15, 23, 42, 0.6)',
    glass: 'rgba(255, 255, 255, 0.9)',
    dark: '#1e293b',
    light: '#f1f5f9', // Light surface
    paper: '#ffffff', // Paper surface
  },

  // Border System
  border: {
    light: '#e2e8f0',
    DEFAULT: '#cbd5e1',
    dark: '#94a3b8',
    accent: '#6366f1',
  },

  // Text System - Senior-level accessibility standards
  text: {
    primary: '#000000',        // Pure black for maximum readability
    secondary: '#374151',      // Dark gray for secondary text
    tertiary: '#6b7280',       // Medium gray for tertiary text
    quaternary: '#9ca3af',     // Light gray for disabled text
    inverse: '#ffffff',        // White for dark backgrounds
    disabled: '#d1d5db',       // Light gray for disabled states
    accent: '#6366f1',         // Brand color for links/accents
  },

  // Modern Gradients
  gradient: {
    primary: ['#6366f1', '#8b5cf6', '#a855f7'],
    secondary: ['#14b8a6', '#06b6d4', '#0ea5e9'],
    success: ['#22c55e', '#16a34a', '#15803d'],
    warning: ['#f59e0b', '#f97316', '#ef4444'],
    sunset: ['#f59e0b', '#ef4444', '#ec4899'],
    ocean: ['#0ea5e9', '#3b82f6', '#6366f1'],
    forest: ['#22c55e', '#16a34a', '#15803d'],
    cosmic: ['#8b5cf6', '#a855f7', '#c084fc'],
  },

  // Special Educational Colors
  education: {
    math: '#3b82f6',
    science: '#10b981',
    english: '#f59e0b',
    history: '#ef4444',
    art: '#8b5cf6',
    music: '#ec4899',
    sports: '#06b6d4',
    library: '#84cc16',
  },
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  xxl: 80, // Extra extra large spacing
};

export const borderRadius = {
  none: 0,
  sm: 4,
  DEFAULT: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  DEFAULT: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  xl: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 8,
  },
  '2xl': {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 36,
    elevation: 10,
  },
  inner: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 0,
  },
  glow: {
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 0,
  },
};

export const typography = {
  fontFamily: {
    // Modern font stack for educational apps
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
    display: 'Inter-Bold', // For large headings
    mono: 'SFMono-Regular', // For code/numbers
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
    '7xl': 72,
  },
  fontWeight: {
    light: '300' as TextStyle['fontWeight'],
    normal: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    extrabold: '800' as TextStyle['fontWeight'],
    black: '900' as TextStyle['fontWeight'],
  },
  lineHeight: {
    tight: 1.1,
    snug: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
    widest: 1,
  },
  // Typography variants for easy use
  h1: {
    fontSize: 48,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 1.1,
  },
  h2: {
    fontSize: 36,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 1.2,
  },
  h3: {
    fontSize: 30,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 1.2,
  },
  h4: {
    fontSize: 24,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 1.3,
  },
  h5: {
    fontSize: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 1.4,
  },
  h6: {
    fontSize: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 1.4,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 1.5,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 1.5,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 1.4,
  },
  button: {
    fontSize: 14,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 1.4,
  },
};

export const animation = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 700,
    slowest: 1000,
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    // Custom easing curves for modern feel
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    snappy: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  spring: {
    gentle: {
      tension: 120,
      friction: 14,
    },
    wobbly: {
      tension: 180,
      friction: 12,
    },
    stiff: {
      tension: 210,
      friction: 20,
    },
  },
};

export const layout = {
  maxWidth: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  container: {
    padding: spacing.md,
  },
};

// Modern Component Design Tokens
export const componentStyles = {
  card: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  } as ViewStyle,

  cardElevated: {
    backgroundColor: colors.surface.elevated,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  } as ViewStyle,

  cardGlass: {
    backgroundColor: colors.surface.glass,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  } as ViewStyle,

  button: {
    primary: {
      backgroundColor: colors.primary[600],
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.lg,
      ...shadows.sm,
      borderWidth: 0,
    } as ViewStyle,

    secondary: {
      backgroundColor: colors.secondary[600],
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.lg,
      ...shadows.sm,
      borderWidth: 0,
    } as ViewStyle,

    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.primary[600],
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.lg,
    } as ViewStyle,

    ghost: {
      backgroundColor: 'transparent',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.lg,
      borderWidth: 0,
    } as ViewStyle,

    floating: {
      backgroundColor: colors.primary[600],
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.full,
      ...shadows.lg,
      borderWidth: 0,
    } as ViewStyle,
  },

  input: {
    backgroundColor: colors.surface.primary,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.base,
    color: '#000000', // Pure black for maximum readability
    ...shadows.xs,
  } as ViewStyle,

  inputFocused: {
    backgroundColor: colors.surface.primary,
    borderWidth: 2,
    borderColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.base,
    color: '#000000', // Pure black for maximum readability
    ...shadows.sm,
  } as ViewStyle,

  badge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    ...shadows.xs,
  } as ViewStyle,

  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.xs,
  } as ViewStyle,

  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  } as ViewStyle,

  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  } as ViewStyle,
};

// Modern Layout Tokens
export const layoutTokens = {
  container: {
    padding: spacing.lg,
    maxWidth: 1200,
  },
  section: {
    marginBottom: spacing.xl,
  },
  grid: {
    gap: spacing.md,
  },
  stack: {
    gap: spacing.sm,
  },
  stackLarge: {
    gap: spacing.lg,
  },
};

export const createGradient = (colors: string[]) => ({
  colors,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
});
