import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { RefreshCw, AlertCircle, Inbox } from 'lucide-react-native';
import { colors, spacing, typography } from '../../../lib/design-system';

export interface ThreeStateViewProps {
  state: 'loading' | 'error' | 'empty' | 'success';
  loadingMessage?: string;
  errorMessage?: string;
  errorDetails?: string;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onPress: () => void;
  };
  onRetry?: () => void;
  children?: React.ReactNode;
  timeout?: number; // in seconds
}

export const ThreeStateView: React.FC<ThreeStateViewProps> = ({
  state,
  loadingMessage = 'Loading...',
  errorMessage = 'Something went wrong',
  errorDetails,
  emptyMessage = 'No data available',
  emptyAction,
  onRetry,
  children,
  timeout = 6,
}) => {
  if (state === 'success' && children) {
    return <>{children}</>;
  }

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
            {timeout > 0 && (
              <Text style={styles.timeoutText}>
                Taking longer than expected? Check your connection.
              </Text>
            )}
          </View>
        );

      case 'error':
        return (
          <View style={styles.centerContent}>
            <AlertCircle size={48} color={colors.error[500]} />
            <Text style={styles.errorTitle}>{errorMessage}</Text>
            {errorDetails && (
              <Text style={styles.errorDetails}>{errorDetails}</Text>
            )}
            {onRetry && (
              <Button
                mode="contained"
                onPress={onRetry}
                style={styles.retryButton}
                icon={() => <RefreshCw size={16} color="white" />}
              >
                Retry
              </Button>
            )}
          </View>
        );

      case 'empty':
        return (
          <View style={styles.centerContent}>
            <Inbox size={48} color={colors.text.secondary} />
            <Text style={styles.emptyTitle}>{emptyMessage}</Text>
            {emptyAction && (
              <Button
                mode="outlined"
                onPress={emptyAction.onPress}
                style={styles.emptyButton}
              >
                {emptyAction.label}
              </Button>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  centerContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  timeoutText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error[500],
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  retryButton: {
    marginTop: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: spacing.lg,
  },
});
