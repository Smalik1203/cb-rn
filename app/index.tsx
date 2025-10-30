import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { colors } from '../lib/design-system';

export default function IndexScreen() {
  const auth = useAuth();

  useEffect(() => {
    // Handle auth state changes
  }, [auth.status, auth.bootstrapping, auth.loading, auth.profile]);

  // 1) While checking session or bootstrapping profile, show splash (no redirects).
  if (auth.status === 'checking' || auth.loading || auth.bootstrapping) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </SafeAreaView>
    );
  }

  // 2) Signed in but no profile -> sign out and redirect to login
  // This handles edge cases where user might have session but no profile
  if (auth.status === 'signedIn' && !auth.profile) {
    // Auth context should handle this, but as fallback redirect to login
    return <Redirect href="/login" />;
  }

  // 3) Fully signed in with a resolved profile -> go to app
  if (auth.status === 'signedIn' && auth.profile) {
    return <Redirect href="/(tabs)" />;
  }

  // 4) Access denied routes to login (LoginScreen will show the reason via context)
  if (auth.status === 'accessDenied') {
    return <Redirect href="/login" />;
  }

  // 5) Default: signedOut or fallback -> login
  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
});
