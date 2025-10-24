import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { getActiveAcademicYear } from '@/src/data/queries';

const SCOPE_STORAGE_KEY = '@classbridge_app_scope';

export interface AppScope {
  school_code: string | null;
  academic_year_id: string | null;
  class_instance_id: string | null;
}

interface AppScopeContextType {
  scope: AppScope;
  setScope: (scope: Partial<AppScope>) => Promise<void>;
  resetScope: () => Promise<void>;
  loading: boolean;
}

const AppScopeContext = createContext<AppScopeContextType>({
  scope: {
    school_code: null,
    academic_year_id: null,
    class_instance_id: null,
  },
  setScope: async () => {},
  resetScope: async () => {},
  loading: true,
});

export const useAppScope = () => {
  const context = useContext(AppScopeContext);
  if (!context) {
    throw new Error('useAppScope must be used within AppScopeProvider');
  }
  return context;
};

export const AppScopeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, user } = useAuth();
  const [scope, setScopeState] = useState<AppScope>({
    school_code: null,
    academic_year_id: null,
    class_instance_id: null,
  });
  const [loading, setLoading] = useState(true);

  // Load scope from AsyncStorage on mount
  useEffect(() => {
    const loadScope = async () => {
      try {
        const stored = await AsyncStorage.getItem(SCOPE_STORAGE_KEY);
        if (stored) {
          const parsedScope = JSON.parse(stored);
          setScopeState(parsedScope);
        }
      } catch (error) {
        console.error('Failed to load app scope from storage:', error);
      }
    };
    
    loadScope();
  }, []);

  // Initialize scope from user profile when auth is ready
  useEffect(() => {
    const initializeScope = async () => {
      if (!user || !profile) {
        setLoading(false);
        return;
      }

      try {
        // Check if we already have a valid scope
        const hasValidScope = scope.school_code && scope.academic_year_id;
        if (hasValidScope) {
          setLoading(false);
          return;
        }

        // Initialize from profile
        const newScope: AppScope = {
          school_code: profile.school_code,
          class_instance_id: profile.class_instance_id,
          academic_year_id: null,
        };

        // Fetch active academic year if we have school_code
        if (profile.school_code) {
          const { data: academicYear } = await getActiveAcademicYear(profile.school_code);
          if (academicYear) {
            newScope.academic_year_id = academicYear.id;
          }
        }

        setScopeState(newScope);
        await AsyncStorage.setItem(SCOPE_STORAGE_KEY, JSON.stringify(newScope));
      } catch (error) {
        console.error('Failed to initialize app scope:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeScope();
  }, [user, profile]);

  const setScope = useCallback(async (updates: Partial<AppScope>) => {
    try {
      const newScope = { ...scope, ...updates };
      setScopeState(newScope);
      await AsyncStorage.setItem(SCOPE_STORAGE_KEY, JSON.stringify(newScope));
    } catch (error) {
      console.error('Failed to update app scope:', error);
    }
  }, [scope]);

  const resetScope = useCallback(async () => {
    try {
      const emptyScope: AppScope = {
        school_code: null,
        academic_year_id: null,
        class_instance_id: null,
      };
      setScopeState(emptyScope);
      await AsyncStorage.removeItem(SCOPE_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset app scope:', error);
    }
  }, []);

  const value: AppScopeContextType = {
    scope,
    setScope,
    resetScope,
    loading,
  };

  return (
    <AppScopeContext.Provider value={value}>
      {children}
    </AppScopeContext.Provider>
  );
};

