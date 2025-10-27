import React from 'react';
import { View, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing, typography } from '../../../lib/design-system';

interface LoadingViewProps {
  message?: string;
  size?: 'small' | 'large';
  showMessage?: boolean;
}

export function LoadingView({ 
  message = 'Loading...', 
  size = 'large',
  showMessage = true 
}: LoadingViewProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ActivityIndicator 
        size={size} 
        color={colors.primary[500]} 
        accessibilityLabel="Loading content"
      />
      {showMessage && (
        <Text 
          style={styles.message}
          accessibilityLabel={`Loading: ${message}`}
        >
          {message}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  message: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
    marginTop: spacing.md,
  },
});
