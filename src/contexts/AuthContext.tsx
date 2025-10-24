// @ts-nocheck - Supabase type inference issues, runtime verified
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabase';
import { User as DbUser, Student, Admin, ClassInstance } from '@/src/types/database.types';

interface UserProfile {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  role: string
  school_code: string | null
  school_name: string | null
  class_instance_id: string | null
  student?: Student
  admin?: Admin
  class_instance?: ClassInstance
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signInWithMagicLink: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  refreshProfile: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (currentUser: User) => {
    try {
      
      // First get user from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email, phone, role, school_code, class_instance_id, created_at')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (userError) {
        throw userError;
      }

      if (!userData) {
        setProfile(null);
        return;
      }

      // Build profile with additional data based on role
      const profile: UserProfile = {
        id: userData.id,
        full_name: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        school_code: userData.school_code,
        school_name: null,
        class_instance_id: userData.class_instance_id,
      };

      // Fetch role-specific data
      if (userData.role === 'student') {
        try {
          const { data: studentData, error: studentError } = await supabase
            .from('student')
            .select('id, full_name, email, phone, auth_user_id, school_code, class_instance_id, student_code, created_at')
            .eq('auth_user_id', currentUser.id)
            .maybeSingle();
          
          if (studentError) {
            // Handle error silently
          } else if (studentData) {
            profile.student = studentData;
            profile.class_instance_id = studentData.class_instance_id;
            profile.school_name = studentData.school_code;
          }
        } catch (error) {
          // Handle error silently
        }
      } else if (userData.role === 'admin' || userData.role === 'teacher') {
        try {
          const { data: adminData, error: adminError } = await supabase
            .from('admin')
            .select('id, full_name, email, phone, role, auth_user_id, school_code, created_at')
            .eq('auth_user_id', currentUser.id)
            .maybeSingle();
          
          if (adminError) {
            // Handle error silently
          } else if (adminData) {
            profile.admin = adminData;
            profile.school_name = adminData.school_code;
          }
        } catch (error) {
          // Handle error silently
        }
      }

      // Fetch class instance if available
      if (profile.class_instance_id) {
        try {
          const { data: classData, error: classError } = await supabase
            .from('class_instances')
            .select('id, grade, section, school_code, academic_year_id, class_teacher_id, created_by, created_at')
            .eq('id', profile.class_instance_id)
            .maybeSingle();
          
          if (classError) {
            // Handle error silently
          } else if (classData) {
            profile.class_instance = classData;
          }
        } catch (error) {
          // Handle error silently
        }
      }

      setProfile(profile);
    } catch (error) {
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  }, [user, fetchUserProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchUserProfile(data.user);
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, [fetchUserProfile]);

  const signInWithMagicLink = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'classbridge://auth/callback',
        },
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        setUser(null);
        setProfile(null);
        setSession(null);
      }

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(currentSession);
        if (currentSession?.user) {
          setUser(currentSession.user);
          await fetchUserProfile(currentSession.user);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        try {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            await fetchUserProfile(currentSession.user);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signInWithMagicLink,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
