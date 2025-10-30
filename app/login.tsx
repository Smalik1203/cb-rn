import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';
import { GraduationCap, Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../lib/design-system';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already signed in
  React.useEffect(() => {
    if (auth.status === 'signedIn') {
      router.replace('/(tabs)');
    }
  }, [auth.status]);

  // Handle access denied - sign out user and show message
  React.useEffect(() => {
    if (auth.status === 'accessDenied') {
      // Sign out the user automatically
      auth.signOut().catch((err) => {
        console.error('Failed to sign out after access denied:', err);
      });
      
      Alert.alert(
        'Access Denied',
        auth.accessDeniedReason || 'No profile found in system. Please contact administrator.',
        [{ 
          text: 'OK', 
          onPress: () => {
            // Clear the form after showing the error
            setEmail('');
            setPassword('');
          }
        }],
        { cancelable: false }
      );
    }
  }, [auth.status, auth.accessDeniedReason, auth.signOut]);

  // Reset loading state when auth state changes
  React.useEffect(() => {
    if (auth.status === 'signedIn' || auth.status === 'accessDenied' || auth.status === 'signedOut') {
      setLoading(false);
    }
  }, [auth.status]);

  // Show loading screen while auth is loading
  if (auth.loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        Alert.alert('Login Failed', error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Don't set loading to false here - let the auth context handle the flow
        // The auth context will either redirect to main app or show access denied
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset functionality will be implemented soon.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <GraduationCap size={80} color={colors.primary[600]} />
              </View>

              <Text variant="displayMedium" style={styles.title}>
                ClassBridge
              </Text>
              <Text variant="titleLarge" style={styles.subtitle}>
                School Management System
              </Text>
              <Text style={styles.description}>
                Connect, Learn, and Excel Together
              </Text>
            </View>

            <View style={styles.formSection}>
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Mail size={20} color={colors.neutral[400]} />
                  </View>
                  <TextInput
                    label="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    disabled={loading}
                    style={styles.input}
                    theme={{
                      colors: {
                        primary: colors.primary[500],
                        background: colors.surface.primary,
                        surface: colors.surface.primary,
                        outline: colors.neutral[300],
                      },
                    }}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Lock size={20} color={colors.neutral[400]} />
                  </View>
                  <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    disabled={loading}
                    style={styles.input}
                    onSubmitEditing={handleLogin}
                    theme={{
                      colors: {
                        primary: colors.primary[500],
                        background: colors.surface.primary,
                        surface: colors.surface.primary,
                        outline: colors.neutral[300],
                      },
                    }}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={colors.neutral[400]} />
                    ) : (
                      <Eye size={20} color={colors.neutral[400]} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={colors.text.inverse} size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing['10'],
    minHeight: height,
  },
  formContainer: {
    padding: spacing['6'],
    alignItems: 'center',
    width: '100%',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing['12'],
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['6'],
    ...shadows.md,
  },
  title: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing['2'],
    textAlign: 'center',
  },
  subtitle: {
    color: colors.text.secondary,
    marginBottom: spacing['2'],
    textAlign: 'center',
  },
  description: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
  },
  formSection: {
    width: '100%',
    maxWidth: 400,
  },
  inputContainer: {
    marginBottom: spacing['8'],
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: spacing['5'],
  },
  inputIcon: {
    position: 'absolute',
    left: spacing['4'],
    top: spacing['4'],
    zIndex: 1,
  },
  input: {
    paddingLeft: spacing['12'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  passwordToggle: {
    position: 'absolute',
    right: spacing['4'],
    top: spacing['4'],
    zIndex: 1,
    padding: spacing['1'],
  },
  loginButton: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[500],
    paddingVertical: spacing['4'],
    paddingHorizontal: spacing['6'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['6'],
    ...shadows.md,
  },
  loginButtonDisabled: {
    opacity: 0.6,
    backgroundColor: colors.neutral[400],
  },
  loginButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  forgotPassword: {
    alignItems: 'center',
    paddingVertical: spacing['2'],
  },
  forgotPasswordText: {
    color: colors.primary[600],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing['4'],
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
  },
});
