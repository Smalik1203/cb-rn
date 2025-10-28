import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { supabase, testSupabaseConnection } from '../lib/supabase';
import { log } from '../lib/logger';

/** Auth state machine */
type AuthStatus = 'checking' | 'signedIn' | 'signedOut' | 'accessDenied';

type Profile = {
  auth_id: string;
  role: string;
  school_code: string | null;
  school_name: string | null;
  class_instance_id: string | null;
  full_name: string | null;
  email: string | null;
} | null;

type AuthState = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: Profile;
  /** true while fetching user profile / app context after auth */
  bootstrapping: boolean;
  /** changes on each sign-in / token change to invalidate stale async work */
  sessionVersion: string;
  accessDeniedReason?: string;
  accessDeniedEmail?: string;
};

type AuthContextValue = AuthState & {
  /** Force-refresh the session + bootstrap (keeps signed-in state on errors) */
  refresh: () => Promise<void>;
  /** Sign out the user */
  signOut: () => Promise<void>;
  /** UI helper: true if we should show a blocking loader */
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  status: 'checking',
  session: null,
  user: null,
  profile: null,
  bootstrapping: false,
  sessionVersion: 'init',
  refresh: async () => {},
  signOut: async () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: 'checking',
    session: null,
    user: null,
    profile: null,
    bootstrapping: false,
    sessionVersion: 'init',
  });

  // Prevent duplicate bootstrap for same session version
  const lastBootstrappedVersion = React.useRef<string>('');

  /** Guard against duplicate bootstrap for same session version */
  const maybeBootstrap = (session: Session, version: string) => {
    if (lastBootstrappedVersion.current === version) {
      log.warn('Bootstrap skipped – already bootstrapped this version');
      return;
    }
    lastBootstrappedVersion.current = version;
    setState((prev) => ({ ...prev, bootstrapping: true }));
    bootstrapUser(session, version);
  };

  /** Debug — safe, concise */
  useEffect(() => {
    log.auth('Auth state changed:', {
      status: state.status,
      bootstrapping: state.bootstrapping,
      hasProfile: !!state.profile,
      platform: Platform.OS,
      sessionId: state.session?.user?.id?.slice(0, 8),
      sessionVersion: state.sessionVersion,
    });
  }, [state.status, state.bootstrapping, !!state.profile, state.session?.user?.id, state.sessionVersion]);

  /** Bootstrap user profile; never flips auth to signedOut on errors. */
  const bootstrapUser = async (session: Session, version: string) => {
    // mark bootstrapping true immediately
    setState((prev) => ({ ...prev, bootstrapping: true }));

    const user = session.user;

    // Timeout/abort protection
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      log.warn('DB bootstrap timeout (15s) – aborting');
      controller.abort();
    }, 15_000);

    try {
      const sessionStringLen = JSON.stringify(session).length;
      const accessLen = session.access_token?.length ?? 0;
      const refreshLen = session.refresh_token?.length ?? 0;

      log.auth('Starting user bootstrap', {
        authId: user.id,
        email: user.email,
        platform: Platform.OS,
        sessionSize: sessionStringLen,
        accessTokenLength: accessLen,
        refreshTokenLength: refreshLen,
        expiresAt: session.expires_at,
        sessionVersion: version,
      });

      // Fetch profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id, role, school_code, class_instance_id, full_name, email')
        .eq('id', user.id)
        .abortSignal(controller.signal)
        .maybeSingle();

      // Fetch school name if school_code exists
      let schoolName = null;
      if (userProfile?.school_code && !profileError) {
        const { data: schoolData } = await supabase
          .from('schools')
          .select('school_name')
          .eq('school_code', userProfile.school_code)
          .abortSignal(controller.signal)
          .maybeSingle();
        
        schoolName = schoolData?.school_name || null;
      }

      clearTimeout(timeout);

      // Discard stale results from a previous session
      const stillCurrent = (() => {
        let current = true;
        setState((prev) => {
          current = prev.sessionVersion === version;
          return prev;
        });
        return current;
      })();
      if (!stillCurrent) {
        log.warn('Bootstrap result ignored – sessionVersion changed');
        return;
      }

      if (profileError) {
        log.error('Profile fetch error during bootstrap', {
          error: profileError,
          authId: user.id,
          email: user.email,
        });
        // Stay signedIn; let UI continue with minimal context.
        setState((prev) => ({ ...prev, bootstrapping: false, profile: null }));
        return;
      }

      if (!userProfile) {
        log.error('User profile not found – access denied', { authId: user.id, email: user.email });
        setState((prev) => ({
          ...prev,
          status: 'accessDenied',
          accessDeniedReason: 'No profile found in system. Please contact administrator.',
          accessDeniedEmail: user.email ?? undefined,
          bootstrapping: false,
          profile: null,
        }));
        return;
      }

      if (userProfile.role === 'unknown') {
        log.error('User has unknown role – access denied', { authId: user.id, email: user.email });
        setState((prev) => ({
          ...prev,
          status: 'accessDenied',
          accessDeniedReason: 'Account not properly configured. Please contact administrator.',
          accessDeniedEmail: user.email ?? undefined,
          bootstrapping: false,
          profile: null,
        }));
        return;
      }

      // Success
      const profile: Profile = {
        auth_id: user.id,
        role: userProfile.role,
        school_code: userProfile.school_code,
        school_name: schoolName,
        class_instance_id: userProfile.class_instance_id,
        full_name: userProfile.full_name,
        email: userProfile.email,
      };

      setState((prev) => ({
        ...prev,
        status: 'signedIn',
        session,
        user,
        profile,
        bootstrapping: false,
      }));

      // Verify persistence once (non-blocking)
      setTimeout(async () => {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            log.auth('Session persistence verified', {
              size: JSON.stringify(data.session).length,
              hasAccess: !!data.session.access_token,
              hasRefresh: !!data.session.refresh_token,
              expiresAt: data.session.expires_at,
            });
          } else {
            log.warn('Session persistence check failed – no session present');
          }
        } catch (e) {
          log.warn('Session persistence check failed', e);
        }
      }, 1000);
    } catch (e: any) {
      clearTimeout(timeout);
      if (e?.name === 'AbortError') {
        log.warn('Bootstrap aborted due to timeout');
      } else {
        log.error('Unexpected error during bootstrap', {
          name: e?.name,
          message: e?.message,
        });
      }
      // Stay signed-in, just mark bootstrap done so UI can show retry affordances.
      setState((prev) => ({ ...prev, bootstrapping: false }));
    }
  };

  /** Initial session + subscription */
  useEffect(() => {
    let alive = true;

    const prime = async () => {
      try {
        // Test Supabase connection first
        const connectionOk = await testSupabaseConnection();
        if (!connectionOk) {
          log.error('Supabase connection failed - check your configuration');
          if (alive) setState((prev) => ({ ...prev, status: 'signedOut' }));
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!alive) return;

        const version = session ? `${session.user.id}:${session.expires_at || Date.now()}` : 'none';

        setState((prev) => ({
          ...prev,
          status: session ? 'signedIn' : 'signedOut',
          session,
          user: session?.user ?? null,
          sessionVersion: version,
          // do not set bootstrapping here; set it only when starting bootstrap
        }));

         if (session) {
           maybeBootstrap(session, version);
         }
      } catch (e) {
        log.error('Initial session check failed', e);
        if (alive) setState((prev) => ({ ...prev, status: 'signedOut' }));
      }
    };

    prime();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;

      const version = session ? `${session.user.id}:${session.expires_at || Date.now()}` : 'none';
      log.auth('Auth state change event:', {
        event,
        hasSession: !!session,
        platform: Platform.OS,
        prevStatus: state.status,
      });

       if (event === 'SIGNED_OUT' || !session) {
         setState((prev) => ({
           ...prev,
           status: 'signedOut',
           session: null,
           user: null,
           profile: null,
           bootstrapping: false,
           sessionVersion: `${Date.now()}:${Math.random().toString(36).slice(2)}`,
         }));
         return;
       }

       if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
         setState((prev) => ({
           ...prev,
           status: 'signedIn',
           session,
           user: session.user,
           sessionVersion: version,
           // bootstrapping true gets set inside maybeBootstrap
         }));
         maybeBootstrap(session, version);
         return;
       }

      if (event === 'TOKEN_REFRESHED' && session) {
        // only update tokens & sessionVersion; don't restart bootstrap
        setState((prev) => ({
          ...prev,
          session,
          user: session.user,
          sessionVersion: version,
        }));
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // subscribe once

  const api = useMemo<AuthContextValue>(() => {
    const loading = state.status === 'checking' || state.bootstrapping;

    async function refresh() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const version = `${data.session.user.id}:${data.session.expires_at || Date.now()}`;
          setState((prev) => ({
            ...prev,
            status: 'signedIn',
            session: data.session,
            user: data.session.user,
            sessionVersion: version,
            bootstrapping: true,
          }));
          await bootstrapUser(data.session, version);
        } else {
          setState((prev) => ({ ...prev, status: 'signedOut', profile: null }));
        }
      } catch (e) {
        log.error('Auth refresh error', e);
        setState((prev) => ({ ...prev, status: 'signedOut', profile: null }));
      }
    }

    async function signOut() {
      try {
        await supabase.auth.signOut();
      } finally {
         setState((prev) => ({
           ...prev,
           status: 'signedOut',
           session: null,
           user: null,
           profile: null,
           bootstrapping: false,
           sessionVersion: `${Date.now()}:${Math.random().toString(36).slice(2)}`,
         }));
      }
    }

    return { ...state, refresh, signOut, loading };
  }, [state]);

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Optional: screens can call this to assert auth */
export function useRequireAuth() {
  const auth = useAuth();
  // If needed, screens can redirect when auth.status === 'signedOut'
  return auth;
}
