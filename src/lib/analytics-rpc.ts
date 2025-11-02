/**
 * @deprecated This file contains legacy RPC-based analytics functions.
 *
 * STATUS: DEPRECATED - To be removed after dashboard refactoring is complete
 *
 * These RPC functions (get_super_admin_analytics, get_admin_analytics, get_student_analytics)
 * do not exist in the current database and will cause runtime errors if called.
 *
 * REPLACEMENT: Use the new typed hooks from src/hooks/analytics/ instead:
 * - useAttendanceAnalytics
 * - useFeesAnalytics
 * - useAcademicsAnalytics
 * - useTasksAnalytics
 * - useSyllabusAnalytics
 * - useOperationsAnalytics
 *
 * See docs/ANALYTICS_REFACTORING_PLAN.md for migration details.
 */

// Type-safe wrapper for analytics RPC functions (DEPRECATED)
import { supabase } from './supabase';
import type {
  SuperAdminAnalytics,
  AdminAnalytics,
  StudentAnalytics,
} from '../components/analytics/types';

/**
 * Type-safe wrapper for get_super_admin_analytics RPC
 */
export async function getSuperAdminAnalytics(
  schoolCode: string,
  startDate: string,
  endDate: string
): Promise<SuperAdminAnalytics> {
  // @ts-expect-error - Deprecated RPC function, not in database types
  const { data, error } = await supabase.rpc('get_super_admin_analytics', {
    p_school_code: schoolCode,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) throw error;
  if (!data) throw new Error('No data returned from get_super_admin_analytics');

  return data as unknown as SuperAdminAnalytics;
}

/**
 * Type-safe wrapper for get_admin_analytics RPC
 */
export async function getAdminAnalytics(
  classInstanceId: string,
  startDate: string,
  endDate: string
): Promise<AdminAnalytics> {
  // @ts-expect-error - Deprecated RPC function, not in database types
  const { data, error } = await supabase.rpc('get_admin_analytics', {
    p_class_instance_id: classInstanceId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) throw error;
  if (!data) throw new Error('No data returned from get_admin_analytics');

  return data as unknown as AdminAnalytics;
}

/**
 * Type-safe wrapper for get_student_analytics RPC
 */
export async function getStudentAnalytics(
  studentId: string,
  startDate: string,
  endDate: string
): Promise<StudentAnalytics> {
  // @ts-expect-error - Deprecated RPC function, not in database types
  const { data, error } = await supabase.rpc('get_student_analytics', {
    p_student_id: studentId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) throw error;
  if (!data) throw new Error('No data returned from get_student_analytics');

  return data as unknown as StudentAnalytics;
}

