import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Database } from '@/src/types/database.types';

// Get Supabase configuration from environment or app.json
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// Custom storage adapter for React Native
const AsyncStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage === 'undefined') {
          return null;
        }
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  },
};

// Create Supabase client with proper configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  // Realtime is disabled by default for better performance
  // Enable selectively where needed using .channel() method
  global: {
    headers: {
      'X-Client-Info': 'classbridge-mobile',
    },
  },
});

// Helper function to get current user with profile
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper function to get user profile from users table
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

// Helper function to get user's school and class context
export const getUserContext = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      school:schools(*),
      class_instance:class_instances(*)
    `)
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

// Helper function to check if user has permission for a resource
export const hasPermission = (userRole: string, resource: string, action: string): boolean => {
  const permissions = {
    admin: ['*'], // Admin can do everything
    teacher: ['attendance:read', 'attendance:write', 'tests:read', 'tests:write', 'timetable:read', 'timetable:write'],
    student: ['attendance:read', 'tests:read', 'timetable:read', 'fees:read'],
    parent: ['attendance:read', 'tests:read', 'fees:read'],
  };

  const userPermissions = permissions[userRole as keyof typeof permissions] || [];
  return userPermissions.includes('*') || userPermissions.includes(`${resource}:${action}`);
};

// Export types for convenience
export type { Database } from '@/src/types/database.types';
