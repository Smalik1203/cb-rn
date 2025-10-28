// src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import { log } from './logger';

// Get Supabase configuration from environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

log.info('Supabase configuration:', {
  hasUrl: !!SUPABASE_URL,
  hasKey: !!SUPABASE_ANON_KEY,
  urlLength: SUPABASE_URL?.length || 0,
  keyLength: SUPABASE_ANON_KEY?.length || 0
});

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  log.error('Missing Supabase configuration. Please check your .env file.');
  log.error('Required variables: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY');
  throw new Error('Supabase configuration is missing. Please check your .env file.');
}

// One-time migration to clear any existing SecureStore sessions
const migrateFromSecureStore = async () => {
  try {
    const { getItemAsync, deleteItemAsync } = await import('expo-secure-store');
    
    // Check for any existing session keys and clear them
    const possibleKeys = [
      'supabase.auth.token',
      'sb-mvvzqouqxrtyzuzqbeud-auth-token',
      'cb-session-v1',
      'supabase-session'
    ];
    
    for (const key of possibleKeys) {
      try {
        const existingValue = await getItemAsync(key);
        if (existingValue) {
          log.info(`Found existing SecureStore session for ${key}, clearing it`);
          await deleteItemAsync(key);
        }
      } catch (error) {
        // Ignore errors - key might not exist
      }
    }
    
    log.info('SecureStore migration completed');
  } catch (error) {
    log.warn('SecureStore migration failed (this is OK if SecureStore is not available):', error);
  }
};

// Run migration once at startup
migrateFromSecureStore();

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // RN has no URL callbacks
    storage: AsyncStorage,
    storageKey: 'cb-session-v1'
  },
});

log.info('Supabase client created successfully with AsyncStorage');

// Test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('schools')
      .select('count')
      .limit(1);
    
    if (error) {
      log.error('Supabase connection test failed:', error);
      return false;
    }
    
    log.info('Supabase connection test successful');
    return true;
  } catch (error) {
    log.error('Supabase connection test error:', error);
    return false;
  }
};
