import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { DB } from '../types/db.constants';

export interface DashboardStats {
  todaysClasses: number;
  attendancePercentage: number;
  pendingAssignments: number;
  achievements: number;
  totalStudents?: number;
  upcomingTests: number;
  weekAttendance: number;
}

export interface RecentActivity {
  id: string;
  type: 'attendance' | 'assignment' | 'achievement' | 'test' | 'event';
  title: string;
  subtitle: string;
  timestamp: string;
  icon: string;
  color?: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  description?: string;
  color: string;
}

export interface FeeOverview {
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  nextDueDate?: string;
}

export interface TaskOverview {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  dueThisWeek: number;
}

export interface SyllabusProgressOverview {
  overallProgress: number;
  totalSubjects: number;
  subjectBreakdown: {
    subjectId: string;
    subjectName: string;
    progress: number;
    totalTopics: number;
    completedTopics: number;
  }[];
}

export function useDashboardStats(userId: string, classInstanceId?: string, role?: string) {
  return useQuery({
    queryKey: ['dashboard-stats', userId, classInstanceId, role],
    queryFn: async (): Promise<DashboardStats> => {
      // Guard against invalid UUID values
      if (!userId || !classInstanceId) {
        return {
          todaysClasses: 0,
          attendancePercentage: 0,
          weekAttendance: 0,
          pendingAssignments: 0,
          upcomingTests: 0,
          achievements: 0,
          totalStudents: 0,
        };
      }

      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekStartStr = weekStart.toISOString().split('T')[0];
      
      // Get today's classes
      const { data: todaysClasses, error: classesError } = await supabase
        .from(DB.tables.timetableSlots)
        .select('id')
        .eq('class_instance_id', classInstanceId)
        .eq('class_date', today);
      
      if (classesError) throw classesError;

      // Get attendance percentage for current month
      const currentMonth = new Date().toISOString().substring(0, 7);
      const { data: attendanceData, error: attendanceError } = await supabase
        .from(DB.tables.attendance)
        .select('status')
        .eq('student_id', userId)
        .gte('date', `${currentMonth}-01`)
        .lt('date', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0]);
      
      if (attendanceError) throw attendanceError;
      
      const totalAttendance = attendanceData.length;
      const presentCount = attendanceData.filter(a => a.status === 'present').length;
      const attendancePercentage = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

      // Get week attendance
      const { data: weekAttendanceData } = await supabase
        .from(DB.tables.attendance)
        .select('status')
        .eq('student_id', userId)
        .gte('date', weekStartStr)
        .lte('date', today);

      const weekTotal = weekAttendanceData?.length || 0;
      const weekPresent = weekAttendanceData?.filter(a => a.status === 'present').length || 0;
      const weekAttendance = weekTotal > 0 ? Math.round((weekPresent / weekTotal) * 100) : 0;

      // Get pending assignments from tasks table
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id')
        .eq('class_instance_id', classInstanceId)
        .gte('due_date', today)
        .eq('is_active', true);

      const pendingAssignments = tasksData?.length || 0;

      // Get upcoming tests (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      const { data: upcomingTestsData } = await supabase
        .from('tests')
        .select('id')
        .eq('class_instance_id', classInstanceId)
        .gte('test_date', today)
        .lte('test_date', nextWeekStr)
        .eq('status', 'active');

      const upcomingTests = upcomingTestsData?.length || 0;

      // Get total students if admin
      let totalStudents = 0;
      if (role === 'admin' || role === 'superadmin') {
        const { data: studentsData } = await supabase
          .from('student')
          .select('id')
          .eq('class_instance_id', classInstanceId);
        totalStudents = studentsData?.length || 0;
      }

      // Get achievements (test scores, perfect attendance, etc.)
      const achievements = 0; // TODO: Implement achievements system

      return {
        todaysClasses: todaysClasses?.length || 0,
        attendancePercentage,
        weekAttendance,
        pendingAssignments,
        upcomingTests,
        achievements,
        totalStudents,
      };
    },
    enabled: !!userId && !!classInstanceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRecentActivity(userId: string, classInstanceId?: string) {
  return useQuery({
    queryKey: ['recent-activity', userId, classInstanceId],
    queryFn: async (): Promise<RecentActivity[]> => {
      // Guard against invalid UUID values
      if (!userId) {
        return [];
      }

      const activities: RecentActivity[] = [];
      
      // Get recent attendance records
      try {
        const { data: attendanceData, error: attendanceError } = await supabase
          .from(DB.tables.attendance)
          .select('id, status, date, created_at')
          .eq('student_id', userId)
          .order('created_at', { ascending: false })
          .limit(2);
        
        if (!attendanceError && attendanceData) {
          attendanceData.forEach(record => {
            activities.push({
              id: record.id,
              type: 'attendance',
              title: `Attendance marked`,
              subtitle: `${new Date(record.date).toLocaleDateString()} - ${record.status === 'present' ? 'Present' : record.status === 'absent' ? 'Absent' : 'Late'}`,
              timestamp: record.created_at,
              icon: 'CheckSquare',
              color: record.status === 'present' ? 'success' : 'error',
            });
          });
        }
      } catch (error) {
        console.warn('Error fetching recent attendance:', error);
      }

      // Get recent tasks (only if classInstanceId is provided)
      if (classInstanceId) {
        try {
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('id, title, due_date, created_at, subjects(subject_name)')
            .eq('class_instance_id', classInstanceId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(2);

          if (!tasksError && tasksData) {
            tasksData.forEach((task: any) => {
              activities.push({
                id: task.id,
                type: 'assignment',
                title: task.title,
                subtitle: `${task.subjects?.subject_name || 'General'} - Due ${new Date(task.due_date).toLocaleDateString()}`,
                timestamp: task.created_at,
                icon: 'BookOpen',
                color: 'info',
              });
            });
          }
        } catch (error) {
          console.warn('Error fetching recent tasks:', error);
        }
      }

      // Get recent test scores
      try {
        const { data: testScoresData, error: testScoresError } = await supabase
          .from('test_marks')
          .select('id, marks_obtained, max_marks, created_at, tests(title)')
          .eq('student_id', userId)
          .order('created_at', { ascending: false })
          .limit(2);

        if (!testScoresError && testScoresData) {
          testScoresData.forEach((score: any) => {
            activities.push({
              id: score.id,
              type: 'test',
              title: `Test graded: ${score.tests?.title}`,
              subtitle: `Score: ${score.marks_obtained}/${score.max_marks}`,
              timestamp: score.created_at,
              icon: 'Award',
              color: 'secondary',
            });
          });
        }
      } catch (error) {
        console.warn('Error fetching recent test scores:', error);
      }
      
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5); // Limit to 5 most recent
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useUpcomingEvents(schoolCode: string, classInstanceId?: string) {
  return useQuery({
    queryKey: ['upcoming-events', schoolCode, classInstanceId],
    queryFn: async (): Promise<UpcomingEvent[]> => {
      // Guard against invalid school code
      if (!schoolCode) {
        return [];
      }

      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      const nextMonthStr = nextMonth.toISOString().split('T')[0];

      let query = supabase
        .from('school_calendar_events')
        .select('id, title, start_date, event_type, description, color')
        .eq('school_code', schoolCode)
        .eq('is_active', true)
        .gte('start_date', today)
        .lte('start_date', nextMonthStr)
        .order('start_date', { ascending: true });

      if (classInstanceId) {
        query = query.or(`class_instance_id.is.null,class_instance_id.eq.${classInstanceId}`);
      }

      const { data, error } = await query.limit(5);
      
      if (error) throw error;
      
      return (data || []).map(event => ({
        id: event.id,
        title: event.title,
        date: event.start_date,
        type: event.event_type,
        description: event.description,
        color: event.color || '#6366f1',
      }));
    },
    enabled: !!schoolCode,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useFeeOverview(studentId: string) {
  return useQuery({
    queryKey: ['fee-overview', studentId],
    queryFn: async (): Promise<FeeOverview> => {
      // Guard against invalid student ID
      if (!studentId) {
        return { totalFee: 0, paidAmount: 0, pendingAmount: 0 };
      }

      // Get active fee plan for student
      const { data: feePlan } = await supabase
        .from('fee_student_plans')
        .select(`
          id,
          fee_student_plan_items(amount_inr, quantity)
        `)
        .eq('student_id', studentId)
        .eq('status', 'active')
        .single();

      if (!feePlan) {
        return { totalFee: 0, paidAmount: 0, pendingAmount: 0 };
      }

      // Calculate total fee
      const totalFee = (feePlan.fee_student_plan_items || []).reduce(
        (sum: number, item: any) => sum + (item.amount_inr * (item.quantity || 1)),
        0
      );

      // Get total paid amount
      const { data: payments } = await supabase
        .from('fee_payments')
        .select('amount_inr')
        .eq('student_id', studentId)
        .eq('plan_id', feePlan.id);

      const paidAmount = (payments || []).reduce(
        (sum, payment) => sum + payment.amount_inr,
        0
      );

      const pendingAmount = totalFee - paidAmount;

      return {
        totalFee,
        paidAmount,
        pendingAmount,
      };
    },
    enabled: !!studentId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useTaskOverview(studentId: string, classInstanceId?: string) {
  return useQuery({
    queryKey: ['task-overview', studentId, classInstanceId],
    queryFn: async (): Promise<TaskOverview> => {
      // Guard against invalid ID values
      if (!studentId || !classInstanceId) {
        return {
          total: 0,
          completed: 0,
          pending: 0,
          overdue: 0,
          dueThisWeek: 0,
        };
      }

      const today = new Date().toISOString().split('T')[0];
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      // Get all tasks for student's class
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, due_date')
        .eq('class_instance_id', classInstanceId)
        .eq('is_active', true);

      // Get student submissions
      const { data: submissions } = await supabase
        .from('task_submissions')
        .select('task_id')
        .eq('student_id', studentId);

      const submittedTaskIds = new Set(submissions?.map(s => s.task_id) || []);
      
      const overview: TaskOverview = {
        total: tasks?.length || 0,
        completed: submittedTaskIds.size,
        pending: 0,
        overdue: 0,
        dueThisWeek: 0,
      };

      tasks?.forEach(task => {
        if (!submittedTaskIds.has(task.id)) {
          overview.pending++;
          if (task.due_date < today) {
            overview.overdue++;
          } else if (task.due_date <= weekEndStr) {
            overview.dueThisWeek++;
          }
        }
      });

      return overview;
    },
    enabled: !!studentId && !!classInstanceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSyllabusOverview(classInstanceId: string) {
  return useQuery({
    queryKey: ['syllabus-overview', classInstanceId],
    queryFn: async (): Promise<SyllabusProgressOverview> => {
      if (!classInstanceId) {
        return {
          overallProgress: 0,
          totalSubjects: 0,
          subjectBreakdown: [],
        };
      }

      // Fetch all subjects for this class from timetable
      const { data: timetableData } = await supabase
        .from(DB.tables.timetableSlots)
        .select('subject_id, subjects!inner(subject_name, id)')
        .eq('class_instance_id', classInstanceId);

      if (!timetableData || timetableData.length === 0) {
        return {
          overallProgress: 0,
          totalSubjects: 0,
          subjectBreakdown: [],
        };
      }

      // Get unique subjects
      const uniqueSubjects = new Map<string, any>();
      timetableData.forEach((item: any) => {
        if (item.subjects) {
          uniqueSubjects.set(item.subjects.id, item.subjects);
        }
      });

      const subjects = Array.from(uniqueSubjects.values());

      // Fetch progress for each subject
      const subjectProgress = await Promise.all(
        subjects.map(async (subject: any) => {
          // Fetch syllabus tree
          const { data: syllabiData } = await supabase
            .from('syllabi')
            .select('id')
            .eq('class_instance_id', classInstanceId)
            .eq('subject_id', subject.id)
            .maybeSingle();

          if (!syllabiData?.id) {
            return {
              subjectId: subject.id,
              subjectName: subject.subject_name,
              progress: 0,
              totalTopics: 0,
              completedTopics: 0,
            };
          }

          // Get topics for this syllabus
          const { data: chapters } = await supabase
            .from('syllabus_chapters')
            .select('id')
            .eq('syllabus_id', syllabiData.id);

          const chapterIds = chapters?.map(c => c.id) || [];
          
          const { data: topics } = await supabase
            .from('syllabus_topics')
            .select('id')
            .in('chapter_id', chapterIds);

          const totalTopics = topics?.length || 0;

          // Get completed topics from syllabus_progress
          const { data: progressData } = await supabase
            .from('syllabus_progress')
            .select('syllabus_topic_id')
            .eq('class_instance_id', classInstanceId)
            .eq('subject_id', subject.id)
            .not('syllabus_topic_id', 'is', null);

          const completedTopics = new Set(
            progressData?.map(p => p.syllabus_topic_id).filter(Boolean) || []
          ).size;

          const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

          return {
            subjectId: subject.id,
            subjectName: subject.subject_name,
            progress,
            totalTopics,
            completedTopics,
          };
        })
      );

      // Calculate overall progress
      const totalTopics = subjectProgress.reduce((sum, s) => sum + s.totalTopics, 0);
      const completedTopics = subjectProgress.reduce((sum, s) => sum + s.completedTopics, 0);
      const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      return {
        overallProgress,
        totalSubjects: subjects.length,
        subjectBreakdown: subjectProgress,
      };
    },
    enabled: !!classInstanceId,
    staleTime: 5 * 60 * 1000,
  });
}

