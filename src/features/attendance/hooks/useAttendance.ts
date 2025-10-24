import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppScope } from '@/src/contexts/AppScopeContext';
import { 
  listClasses, 
  listStudents, 
  getAttendanceForDate, 
  checkHoliday, 
  saveAttendance 
} from '@/src/data/queries';
import type { Attendance, AttendanceInsert, Student } from '@/src/types/database.types';

export interface StudentAttendanceRecord {
  id: string;
  full_name: string;
  status: 'present' | 'absent' | 'late' | null;
}

export function useClassesForUser() {
  const { profile, user } = useAuth();
  const { scope } = useAppScope();
  const schoolCode = scope.school_code || profile?.school_code;
  const role = profile?.role;

  return useQuery({
    queryKey: ['user-classes', user?.id, schoolCode, role, scope.academic_year_id],
    queryFn: async () => {
      if (!user || !schoolCode) {
        throw new Error('Missing authentication');
      }

      // Use data layer to get classes
      const result = await listClasses(schoolCode, scope.academic_year_id || undefined);
      
      if (result.error) {
        throw new Error(result.error.userMessage);
      }

      // Filter based on user role
      if (role === 'admin' || role === 'teacher') {
        // For now, return all classes - in future, filter by class_teacher_id
        return result.data || [];
      } else if (role === 'superadmin') {
        return result.data || [];
      }

      return [];
    },
    enabled: !!user && !!schoolCode && role !== 'student',
    staleTime: 1000 * 60 * 10,
  });
}

export function useStudentsForClass(classInstanceId?: string) {
  const { scope } = useAppScope();
  const schoolCode = scope.school_code;

  return useQuery({
    queryKey: ['class-students', classInstanceId, schoolCode],
    queryFn: async (): Promise<StudentAttendanceRecord[]> => {
      if (!classInstanceId || !schoolCode) {
        throw new Error('Missing class or school context');
      }

      // Use data layer to get students
      const result = await listStudents(classInstanceId, schoolCode);
      
      if (result.error) {
        throw new Error(result.error.userMessage);
      }

      return (result.data || []).map((student: Student) => ({
        id: student.id,
        full_name: student.full_name,
        status: null,
      }));
    },
    enabled: !!classInstanceId && !!schoolCode,
    staleTime: 1000 * 60 * 5,
  });
}

export function useExistingAttendance(classInstanceId?: string, date?: string) {
  const { scope } = useAppScope();
  const schoolCode = scope.school_code;

  return useQuery({
    queryKey: ['existing-attendance', classInstanceId, date, schoolCode],
    queryFn: async (): Promise<Attendance[]> => {
      if (!classInstanceId || !date || !schoolCode) {
        return [];
      }

      // Use data layer to get attendance
      const result = await getAttendanceForDate(classInstanceId, date, schoolCode);
      
      if (result.error) {
        throw new Error(result.error.userMessage);
      }

      return result.data || [];
    },
    enabled: !!classInstanceId && !!date && !!schoolCode,
    staleTime: 1000 * 60 * 2, // 2 minutes since attendance can change
  });
}

export function useCheckHoliday(date?: string, classInstanceId?: string) {
  const { scope } = useAppScope();
  const schoolCode = scope.school_code;

  return useQuery({
    queryKey: ['holiday-check', date, classInstanceId, schoolCode],
    queryFn: async () => {
      if (!date || !schoolCode) {
        return null;
      }

      // Use data layer to check holiday
      const result = await checkHoliday(schoolCode, date, classInstanceId);
      
      if (result.error) {
        console.warn('Holiday check error:', result.error.userMessage);
        return null;
      }

      return result.data;
    },
    enabled: !!date && !!schoolCode,
    staleTime: 1000 * 60 * 30, // 30 minutes - holidays don't change often
  });
}

export function useSaveAttendance() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (records: AttendanceInsert[]) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Use data layer to save attendance
      const result = await saveAttendance(records);
      
      if (result.error) {
        throw new Error(result.error.userMessage);
      }

      return result.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      if (variables.length > 0) {
        const { class_instance_id, date } = variables[0];
        queryClient.invalidateQueries({ 
          queryKey: ['existing-attendance', class_instance_id, date] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['attendance-analytics'] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['dashboard-stats'] 
        });
      }
    },
  });
}

