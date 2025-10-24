import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppScope } from '@/src/contexts/AppScopeContext';
import { supabase } from '@/src/data/supabaseClient';
import { listStudents, listAdmins } from '@/src/data/queries';
import type { Student, Admin } from '@/src/types/database.types';

export interface UserListItem {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | number | null;
  role: string;
  school_code: string;
  school_name: string;
  class_info?: string;
  created_at: string;
}

export interface UserStats {
  total: number;
  students: number;
  teachers: number;
  admins: number;
}

export function useUsersList(role?: string, page: number = 0, limit: number = 50) {
  const { profile, user } = useAuth();
  const { scope } = useAppScope();
  const schoolCode = scope.school_code || profile?.school_code;
  const userRole = profile?.role;

  return useQuery({
    queryKey: ['users-list', schoolCode, role, page, limit],
    queryFn: async (): Promise<UserListItem[]> => {
      if (!user || !schoolCode) {
        throw new Error('Missing authentication');
      }

      // Only admins and superadmins can view user lists
      if (userRole !== 'admin' && userRole !== 'superadmin') {
        throw new Error('Insufficient permissions');
      }

      const users: UserListItem[] = [];

      // Fetch students if no role filter or role is 'student'
      if (!role || role === 'student') {
        // Note: listStudents requires classInstanceId, so we'll need to get all classes first
        // For now, return empty array - this would need a different data layer function
        // that gets all students for a school regardless of class
      }

      // Fetch admins/teachers if no role filter or role matches
      if (!role || role === 'admin' || role === 'teacher') {
        const adminsResult = await listAdmins(schoolCode);
        if (adminsResult.data) {
          users.push(...adminsResult.data.map((a: Admin) => ({
            id: a.id,
            full_name: a.full_name,
            email: a.email,
            phone: a.phone?.toString() || null,
            role: a.role || 'admin',
            school_code: a.school_code,
            school_name: a.school_name,
            created_at: a.created_at,
          })));
        }
      }

      // Sort by created_at desc and apply pagination
      return users
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(page * limit, (page + 1) * limit);
    },
    enabled: !!user && !!schoolCode && (userRole === 'admin' || userRole === 'superadmin'),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUserStats() {
  const { profile, user } = useAuth();
  const schoolCode = profile?.school_code;

  return useQuery({
    queryKey: ['user-stats', schoolCode],
    queryFn: async (): Promise<UserStats> => {
      if (!user || !schoolCode) {
        throw new Error('Missing authentication');
      }

      // Get student count
      const { count: studentCount, error: studentError } = await supabase
        .from('student')
        .select('id', { count: 'exact', head: true })
        .eq('school_code', schoolCode);

      if (studentError) throw new Error(`Failed to count students: ${studentError.message}`);

      // Get admin/teacher count from users table
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('school_code', schoolCode)
        .in('role', ['admin', 'teacher', 'superadmin']);

      if (userError) throw new Error(`Failed to count users: ${userError.message}`);

      const teacherCount = users?.filter((u: any) => u.role === 'teacher' || u.role === 'admin').length || 0;
      const adminCount = users?.filter((u: any) => u.role === 'admin' || u.role === 'superadmin').length || 0;

      return {
        total: (studentCount || 0) + (users?.length || 0),
        students: studentCount || 0,
        teachers: teacherCount,
        admins: adminCount,
      };
    },
    enabled: !!user && !!schoolCode,
    staleTime: 1000 * 60 * 10,
  });
}

export function useRecentUsers(limit: number = 4) {
  const { profile, user } = useAuth();
  const schoolCode = profile?.school_code;

  return useQuery({
    queryKey: ['recent-users', schoolCode, limit],
    queryFn: async (): Promise<UserListItem[]> => {
      if (!user || !schoolCode) {
        throw new Error('Missing authentication');
      }

      const users: UserListItem[] = [];

      // Get recent students
      const { data: students, error: studentsError } = await supabase
        .from('student')
        .select(`
          id,
          full_name,
          email,
          phone,
          school_code,
          school_name,
          created_at,
          class_instance:class_instances(grade, section)
        `)
        .eq('school_code', schoolCode)
        .order('created_at', { ascending: false })
        .limit(Math.floor(limit / 2));

      if (!studentsError && students) {
        users.push(...students.map((s: any) => ({
          id: s.id,
          full_name: s.full_name,
          email: s.email,
          phone: s.phone,
          role: 'student',
          school_code: s.school_code,
          school_name: s.school_name,
          class_info: s.class_instance ? `Grade ${s.class_instance.grade}-${s.class_instance.section}` : undefined,
          created_at: s.created_at,
        })));
      }

      // Get recent admins
      const { data: admins, error: adminsError } = await supabase
        .from('admin')
        .select('*')
        .eq('school_code', schoolCode)
        .order('created_at', { ascending: false })
        .limit(Math.ceil(limit / 2));

      if (!adminsError && admins) {
        users.push(...admins.map((a: any) => ({
          id: a.id,
          full_name: a.full_name,
          email: a.email,
          phone: a.phone?.toString() || null,
          role: a.role || 'admin',
          school_code: a.school_code,
          school_name: a.school_name,
          created_at: a.created_at,
        })));
      }

      return users
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    },
    enabled: !!user && !!schoolCode,
    staleTime: 1000 * 60 * 5,
  });
}

