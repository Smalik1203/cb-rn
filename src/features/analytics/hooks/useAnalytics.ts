import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppScope } from '@/src/contexts/AppScopeContext';
import { supabase } from '@/src/data/supabaseClient';
import {
  listStudents,
  getAttendanceForDate
} from '@/src/data/queries';

export interface AttendanceAnalytics {
  overall: number;
  thisMonth: number;
  lastMonth: number;
  trend: 'up' | 'down' | 'stable';
  bySubject: Array<{
    subject: string;
    attendance: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  recentDays: Array<{
    date: string;
    present: number;
    absent: number;
    total: number;
  }>;
}

export interface PerformanceAnalytics {
  averageScore: number;
  totalTests: number;
  completedTests: number;
  pendingTests: number;
  bySubject: Array<{
    subject: string;
    score: number;
    tests: number;
  }>;
}

export function useAttendanceAnalytics() {
  const { profile, user } = useAuth();
  const { scope } = useAppScope();
  const schoolCode = scope.school_code || profile?.school_code;
  const classInstanceId = scope.class_instance_id || profile?.class_instance_id;
  const studentId = profile?.student?.id;
  const role = profile?.role;

  return useQuery({
    queryKey: ['attendance-analytics', studentId, classInstanceId, schoolCode],
    queryFn: async (): Promise<AttendanceAnalytics> => {
      if (!user || !schoolCode) {
        throw new Error('Missing authentication');
      }

      const today = new Date();
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
      
      // Get last 30 days for overall
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      let overallQuery;
      let thisMonthQuery;
      let lastMonthQuery;
      let recentDaysQuery;

      // For students: get their own attendance
      if (role === 'student' && studentId) {
        // Overall (last 30 days)
        overallQuery = supabase
          .from('attendance')
          .select('status')
          .eq('student_id', studentId)
          .eq('school_code', schoolCode)
          .gte('date', thirtyDaysAgoStr);

        // This month
        thisMonthQuery = supabase
          .from('attendance')
          .select('status')
          .eq('student_id', studentId)
          .eq('school_code', schoolCode)
          .gte('date', thisMonthStart);

        // Last month
        lastMonthQuery = supabase
          .from('attendance')
          .select('status')
          .eq('student_id', studentId)
          .eq('school_code', schoolCode)
          .gte('date', lastMonthStart)
          .lte('date', lastMonthEnd);

        // Recent days (last 5 days)
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        recentDaysQuery = supabase
          .from('attendance')
          .select('date, status')
          .eq('student_id', studentId)
          .eq('school_code', schoolCode)
          .gte('date', fiveDaysAgo.toISOString().split('T')[0])
          .order('date', { ascending: false });
      } else if (classInstanceId) {
        // For teachers/admins: get class attendance
        overallQuery = supabase
          .from('attendance')
          .select('status')
          .eq('class_instance_id', classInstanceId)
          .eq('school_code', schoolCode)
          .gte('date', thirtyDaysAgoStr);

        thisMonthQuery = supabase
          .from('attendance')
          .select('status')
          .eq('class_instance_id', classInstanceId)
          .eq('school_code', schoolCode)
          .gte('date', thisMonthStart);

        lastMonthQuery = supabase
          .from('attendance')
          .select('status')
          .eq('class_instance_id', classInstanceId)
          .eq('school_code', schoolCode)
          .gte('date', lastMonthStart)
          .lte('date', lastMonthEnd);

        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        recentDaysQuery = supabase
          .from('attendance')
          .select('date, status')
          .eq('class_instance_id', classInstanceId)
          .eq('school_code', schoolCode)
          .gte('date', fiveDaysAgo.toISOString().split('T')[0])
          .order('date', { ascending: false });
      } else {
        throw new Error('Missing class context');
      }

      const [overallData, thisMonthData, lastMonthData, recentDaysData] = await Promise.all([
        overallQuery,
        thisMonthQuery,
        lastMonthQuery,
        recentDaysQuery,
      ]);

      // Calculate overall percentage
      const overall = overallData.data && overallData.data.length > 0
        ? Math.round((overallData.data.filter(a => a.status === 'present').length / overallData.data.length) * 100)
        : 0;

      const thisMonth = thisMonthData.data && thisMonthData.data.length > 0
        ? Math.round((thisMonthData.data.filter(a => a.status === 'present').length / thisMonthData.data.length) * 100)
        : 0;

      const lastMonth = lastMonthData.data && lastMonthData.data.length > 0
        ? Math.round((lastMonthData.data.filter(a => a.status === 'present').length / lastMonthData.data.length) * 100)
        : 0;

      const trend = thisMonth > lastMonth ? 'up' : thisMonth < lastMonth ? 'down' : 'stable';

      // Process recent days
      const recentDaysMap = new Map<string, { present: number; absent: number; total: number }>();
      if (recentDaysData.data) {
        recentDaysData.data.forEach((record) => {
          if (!recentDaysMap.has(record.date)) {
            recentDaysMap.set(record.date, { present: 0, absent: 0, total: 0 });
          }
          const dayData = recentDaysMap.get(record.date)!;
          dayData.total++;
          if (record.status === 'present') {
            dayData.present++;
          } else if (record.status === 'absent') {
            dayData.absent++;
          }
        });
      }

      const recentDays = Array.from(recentDaysMap.entries())
        .map(([date, data]) => ({
          date,
          ...data,
        }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5);

      return {
        overall,
        thisMonth,
        lastMonth,
        trend,
        bySubject: [], // This would require more complex queries with timetable joins
        recentDays,
      };
    },
    enabled: !!user && !!schoolCode && (!!studentId || !!classInstanceId),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePerformanceAnalytics() {
  const { profile, user } = useAuth();
  const schoolCode = profile?.school_code;
  const classInstanceId = profile?.class_instance_id;
  const studentId = profile?.student?.id;
  const role = profile?.role;

  return useQuery({
    queryKey: ['performance-analytics', studentId, classInstanceId, schoolCode],
    queryFn: async (): Promise<PerformanceAnalytics> => {
      if (!user || !schoolCode) {
        throw new Error('Missing authentication');
      }

      if (role === 'student' && studentId) {
        // Get student's test attempts
        const { data: attempts, error } = await supabase
          .from('test_attempts')
          .select(`
            *,
            test:tests(
              *,
              subject:subjects(subject_name)
            )
          `)
          .eq('student_id', studentId)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(`Failed to load performance data: ${error.message}`);
        }

        const completedAttempts = (attempts as any[])?.filter((a: any) => a.status === 'completed') || [];
        const totalAttempts = (attempts as any[])?.length || 0;

        // Calculate average score
        let averageScore = 0;
        if (completedAttempts.length > 0) {
          const totalScore = completedAttempts.reduce((sum, attempt: any) => {
            if (attempt.total_points && attempt.total_points > 0) {
              return sum + ((attempt.earned_points || 0) / attempt.total_points) * 100;
            }
            return sum;
          }, 0);
          averageScore = Math.round(totalScore / completedAttempts.length);
        }

        // Group by subject
        const subjectMap = new Map<string, { total: number; count: number; tests: number }>();
        completedAttempts.forEach((attempt: any) => {
          const subjectName = attempt.test?.subject?.subject_name || 'Unknown';
          if (!subjectMap.has(subjectName)) {
            subjectMap.set(subjectName, { total: 0, count: 0, tests: 0 });
          }
          const subjectData = subjectMap.get(subjectName)!;
          if (attempt.total_points && attempt.total_points > 0) {
            subjectData.total += ((attempt.earned_points || 0) / attempt.total_points) * 100;
            subjectData.count++;
          }
          subjectData.tests++;
        });

        const bySubject = Array.from(subjectMap.entries()).map(([subject, data]) => ({
          subject,
          score: data.count > 0 ? Math.round(data.total / data.count) : 0,
          tests: data.tests,
        }));

        return {
          averageScore,
          totalTests: totalAttempts,
          completedTests: completedAttempts.length,
          pendingTests: totalAttempts - completedAttempts.length,
          bySubject,
        };
      } else if (classInstanceId) {
        // For teachers/admins: aggregate class performance
        const { data: students } = await supabase
          .from('student')
          .select('id')
          .eq('class_instance_id', classInstanceId)
          .eq('school_code', schoolCode);

        if (!students || students.length === 0) {
          return {
            averageScore: 0,
            totalTests: 0,
            completedTests: 0,
            pendingTests: 0,
            bySubject: [],
          };
        }

        const studentIds = (students as any[]).map((s: any) => s.id);

        const { data: attempts } = await supabase
          .from('test_attempts')
          .select(`
            *,
            test:tests(
              *,
              subject:subjects(subject_name)
            )
          `)
          .in('student_id', studentIds);

        const completedAttempts = (attempts as any[])?.filter((a: any) => a.status === 'completed') || [];
        
        let averageScore = 0;
        if (completedAttempts.length > 0) {
          const totalScore = completedAttempts.reduce((sum, attempt: any) => {
            if (attempt.total_points && attempt.total_points > 0) {
              return sum + ((attempt.earned_points || 0) / attempt.total_points) * 100;
            }
            return sum;
          }, 0);
          averageScore = Math.round(totalScore / completedAttempts.length);
        }

        return {
          averageScore,
          totalTests: attempts?.length || 0,
          completedTests: completedAttempts.length,
          pendingTests: (attempts?.length || 0) - completedAttempts.length,
          bySubject: [],
        };
      }

      throw new Error('Missing student or class context');
    },
    enabled: !!user && !!schoolCode && (!!studentId || !!classInstanceId),
    staleTime: 1000 * 60 * 5,
  });
}

