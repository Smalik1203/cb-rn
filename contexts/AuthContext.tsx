import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserMetadata {
  id: string;
  email: string;
  role: string;
  schoolCode: string;
  studentId?: string;
  adminId?: string;
}

interface AuthContextType {
  user: User | null;
  userMetadata: UserMetadata | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userMetadata: null,
  session: null,
  loading: true,
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
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeMetadata = (user: User): UserMetadata => {
    const rawMetadata = user.user_metadata || {};
    const role = rawMetadata.role || 'student';

    return {
      id: user.id,
      email: user.email || '',
      role,
      schoolCode: rawMetadata.school_code || rawMetadata.schoolCode || '',
      studentId: rawMetadata.student_id || rawMetadata.studentId,
      adminId: rawMetadata.admin_id || rawMetadata.adminId,
    };
  };

  const fetchUserProfile = async (currentUser: User) => {
    try {
      const metadata = normalizeMetadata(currentUser);
      setUserMetadata(metadata);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        setSession(currentSession);
        if (currentSession?.user) {
          setUser(currentSession.user);
          await fetchUserProfile(currentSession.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user);
        } else {
          setUserMetadata(null);
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUserMetadata(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userMetadata, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
