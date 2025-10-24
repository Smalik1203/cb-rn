import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppScope } from '@/src/contexts/AppScopeContext';
import { supabase } from '@/src/data/supabaseClient';
import { listClasses, listStudents } from '@/src/data/queries';

export interface ClassListItem {
  id: string;
  grade: number;
  section: string;
  school_code: string;
  academic_year_id: string | null;
  class_teacher_name?: string;
  student_count: number;
  created_at: string;
}

export interface ClassStats {
  total: number;
  active: number;
  students: number;
  teachers: number;
}

export function useClassesList(page: number = 0, limit: number = 50) {
  const { profile, user } = useAuth();
  const { scope } = useAppScope();
  const schoolCode = scope.school_code || profile?.school_code;
  const academicYearId = scope.academic_year_id;

  return useQuery({
    queryKey: ['classes-list', schoolCode, academicYearId, page, limit],
    queryFn: async (): Promise<ClassListItem[]> => {
      
      if (!user || !schoolCode) {
        throw new Error('Missing authentication');
      }

      // Use data layer to get classes
      const classesResult = await listClasses(schoolCode, academicYearId || undefined);
      
      if (classesResult.error) {
        throw new Error(classesResult.error.userMessage);
      }

      if (!classesResult.data || classesResult.data.length === 0) return [];

      // Get student counts for each class using data layer
      const classesWithCounts: ClassListItem[] = [];
      
      for (const classInstance of classesResult.data) {
        const studentsResult = await listStudents(classInstance.id, schoolCode);
        const studentCount = studentsResult.data?.length || 0;
        
        classesWithCounts.push({
          id: classInstance.id,
          grade: classInstance.grade || 0,
          section: classInstance.section || '',
          school_code: classInstance.school_code,
          academic_year_id: classInstance.academic_year_id,
          class_teacher_name: classInstance.class_teacher_id ? 'Teacher' : 'No Teacher',
          student_count: studentCount,
          created_at: classInstance.created_at,
        });
      }

      // Apply pagination
      return classesWithCounts
        .sort((a, b) => a.grade - b.grade || a.section.localeCompare(b.section))
        .slice(page * limit, (page + 1) * limit);
    },
    enabled: !!user && !!schoolCode,
    staleTime: 1000 * 60 * 10,
  });
}

export function useClassStats() {
  const { profile, user } = useAuth();
  const schoolCode = profile?.school_code;

  return useQuery({
    queryKey: ['class-stats', schoolCode],
    queryFn: async (): Promise<ClassStats> => {
      if (!user || !schoolCode) {
        throw new Error('Missing authentication');
      }

      // Count classes - class instances already have academic_year_id
      const { count: classCount, error: classError } = await supabase
        .from('class_instances')
        .select('id', { count: 'exact', head: true })
        .eq('school_code', schoolCode);

      if (classError) throw new Error(`Failed to count classes: ${classError.message}`);

      // Count students
      const { count: studentCount, error: studentError } = await supabase
        .from('student')
        .select('id', { count: 'exact', head: true })
        .eq('school_code', schoolCode);

      if (studentError) throw new Error(`Failed to count students: ${studentError.message}`);

      // Count teachers (admins with role 'teacher' or 'admin')
      const { count: teacherCount, error: teacherError } = await supabase
        .from('admin')
        .select('id', { count: 'exact', head: true })
        .eq('school_code', schoolCode);

      if (teacherError) throw new Error(`Failed to count teachers: ${teacherError.message}`);

      return {
        total: classCount || 0,
        active: classCount || 0,
        students: studentCount || 0,
        teachers: teacherCount || 0,
      };
    },
    enabled: !!user && !!schoolCode,
    staleTime: 1000 * 60 * 10,
  });
}

export function useClassDetails(classId: string) {
  const { profile, user } = useAuth();
  const schoolCode = profile?.school_code;

  return useQuery({
    queryKey: ['class-details', classId, schoolCode],
    queryFn: async () => {
      if (!user || !schoolCode || !classId) {
        throw new Error('Missing required parameters');
      }

      const { data: classData, error } = await supabase
        .from('class_instances')
        .select(`
          id,
          grade,
          section,
          school_code,
          academic_year_id,
          class_id,
          class_teacher_id,
          created_by,
          created_at,
          class_teacher:admin(id, full_name, email),
          academic_year:academic_years(year_start, year_end)
        `)
        .eq('id', classId)
        .eq('school_code', schoolCode)
        .single();

      if (error) throw new Error(`Failed to load class details: ${error.message}`);
      if (!classData) throw new Error('Class not found');

      // Get student count and subjects
      const { count: studentCount } = await supabase
        .from('student')
        .select('id', { count: 'exact', head: true })
        .eq('class_instance_id', classId)
        .eq('school_code', schoolCode);

      const { count: subjectCount } = await supabase
        .from('timetable_slots')
        .select('subject_id', { count: 'exact', head: true })
        .eq('class_instance_id', classId)
        .eq('school_code', schoolCode)
        .not('subject_id', 'is', null);

      return {
        ...(classData as any),
        student_count: studentCount || 0,
        subject_count: subjectCount || 0,
      };
    },
    enabled: !!user && !!schoolCode && !!classId,
    staleTime: 1000 * 60 * 5,
  });
}

