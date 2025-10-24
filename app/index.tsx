import { Redirect } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';

export default function IndexScreen() {
  const { user, loading } = useAuth();

  // Show nothing while checking auth status
  if (loading) {
    return null;
  }

  // Redirect to tabs if logged in, otherwise to login
  return <Redirect href={user ? "/(tabs)" : "/login"} />;
}
