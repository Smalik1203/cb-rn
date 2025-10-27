import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { colors } from '../lib/design-system';

export default function IndexScreen() {
  const { user, loading } = useAuth();

  // Show loading indicator while checking auth status
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  // Redirect to tabs if logged in, otherwise to login
  return <Redirect href={user ? "/(tabs)" : "/login"} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
});
