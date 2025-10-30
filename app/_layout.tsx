import 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/lib/queryClient';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ClassSelectionProvider } from '../src/contexts/ClassSelectionContext';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import ErrorBoundary from '../src/components/ErrorBoundary';
import { NetworkStatus } from '../src/components/ui/NetworkStatus';
import { DrawerContent } from '../src/components/layout/DrawerContent';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <PaperProvider>
            <AuthProvider>
              <ClassSelectionProvider>
                <Drawer
                    drawerContent={(props) => <DrawerContent {...props} />}
                    screenOptions={{
                      headerShown: false,
                      drawerStyle: {
                        backgroundColor: '#ffffff',
                        width: 280,
                      },
                      overlayColor: 'rgba(0, 0, 0, 0.5)',
                      drawerType: 'front',
                      swipeEnabled: true,
                    }}
                  >
                    <Drawer.Screen
                      name="(tabs)"
                      options={{
                        drawerLabel: () => null, // Hide from drawer since we have custom navigation
                        title: 'ClassBridge',
                      }}
                    />
                    <Drawer.Screen
                      name="login"
                      options={{
                        drawerLabel: () => null, // Hide from drawer
                        title: 'Login',
                      }}
                    />
                  </Drawer>
                  <StatusBar style="dark" translucent={false} />
                  <NetworkStatus />
              </ClassSelectionProvider>
            </AuthProvider>
            </PaperProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
