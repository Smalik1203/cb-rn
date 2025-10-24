import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/src/lib/queryClient';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { AppScopeProvider } from '@/src/contexts/AppScopeContext';
import { ClassSelectionProvider } from '@/src/contexts/ClassSelectionContext';
import { FeesProvider } from '@/src/contexts/FeesContext';
import { AttendanceProvider } from '@/src/contexts/AttendanceContext';
import { AnalyticsProvider } from '@/src/contexts/AnalyticsContext';
import { CalendarProvider } from '@/src/contexts/CalendarContext';
import { LearningResourcesProvider } from '@/src/contexts/LearningResourcesContext';
import { TaskManagementProvider } from '@/src/contexts/TaskManagementContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import ErrorBoundary from '@/src/components/ErrorBoundary';


function RootLayoutContent() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (!user && inAuthGroup) {
      router.replace('/login');
    } else if (user && !inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <PaperProvider>
                 <AuthProvider>
                   <AppScopeProvider>
                     <ClassSelectionProvider>
                     <FeesProvider>
                       <AttendanceProvider>
                         <AnalyticsProvider>
                           <CalendarProvider>
                             <LearningResourcesProvider>
                               <TaskManagementProvider>
                                 <RootLayoutContent />
                               </TaskManagementProvider>
                             </LearningResourcesProvider>
                           </CalendarProvider>
                         </AnalyticsProvider>
                       </AttendanceProvider>
                     </FeesProvider>
                     </ClassSelectionProvider>
                   </AppScopeProvider>
                 </AuthProvider>
        </PaperProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
