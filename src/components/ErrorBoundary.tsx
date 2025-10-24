import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { AlertCircle } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/design-system';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console (in production, send to error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send error to monitoring service (e.g., Sentry, Bugsnag)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <AlertCircle size={80} color={colors.error[500]} />
            </View>
            
            <Text variant="headlineMedium" style={styles.title}>
              Oops! Something went wrong
            </Text>
            
            <Text variant="bodyLarge" style={styles.message}>
              The app encountered an unexpected error. Don't worry, your data is safe.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text variant="titleSmall" style={styles.errorDetailsTitle}>
                  Error Details (Dev Only):
                </Text>
                <Text style={styles.errorDetailsText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorStack}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.button}
                onPress={this.handleReset}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['8'],
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: spacing['8'],
  },
  title: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing['4'],
  },
  message: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing['8'],
    lineHeight: 24,
  },
  errorDetails: {
    width: '100%',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    padding: spacing['4'],
    marginBottom: spacing['8'],
    maxHeight: 200,
  },
  errorDetailsTitle: {
    color: colors.error[500],
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing['2'],
  },
  errorDetailsText: {
    color: colors.error[500],
    fontSize: typography.fontSize.xs,
    fontFamily: 'monospace',
    marginBottom: spacing['2'],
  },
  errorStack: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.xs,
    fontFamily: 'monospace',
  },
  actions: {
    width: '100%',
  },
  button: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing['4'],
    paddingHorizontal: spacing['8'],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default ErrorBoundary;

