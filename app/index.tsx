import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { colors } from '../lib/design-system';

export default function IndexScreen() {
  const auth = useAuth();

  useEffect(() => {
    console.log('🔎 Index auth:', {
      status: auth.status,
      bootstrapping: auth.bootstrapping,
      loading: auth.loading,
      hasProfile: !!auth.profile,
    });
  }, [auth.status, auth.bootstrapping, auth.loading, auth.profile]);

  // 1) While checking session or bootstrapping profile, show splash (no redirects).
  if (auth.status === 'checking' || auth.loading || auth.bootstrapping) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  // 2) Fully signed in with a resolved profile -> go to app
  if (auth.status === 'signedIn' && auth.profile) {
    return <Redirect href="/(tabs)" />;
  }

  // 3) Access denied routes to login (LoginScreen will show the reason via context)
  if (auth.status === 'accessDenied') {
    return <Redirect href="/login" />;
  }

  // 4) Default: signedOut or fallback -> login
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
