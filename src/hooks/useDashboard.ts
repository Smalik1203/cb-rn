import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { DB } from '../types/db.constants';

export interface DashboardStats {
  todaysClasses: number;
  attendancePercentage: number;
  pendingAssignments: number;
  achievements: number;
}

export interface RecentActivity {
  id: string;
  type: 'attendance' | 'assignment' | 'achievement';
  title: string;
  subtitle: string;
  timestamp: string;
  icon: string;
}

export function useDashboardStats(userId: string, classInstanceId?: string) {
  return useQuery({
    queryKey: ['dashboard-stats', userId, classInstanceId],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date().toISOString().split('T')[0];
      
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

      // Get pending assignments (placeholder - would need assignments table)
      const pendingAssignments = 0; // TODO: Implement when assignments table exists

      // Get achievements (placeholder - would need achievements table)
      const achievements = 0; // TODO: Implement when achievements table exists

      return {
        todaysClasses: todaysClasses?.length || 0,
        attendancePercentage,
        pendingAssignments,
        achievements,
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
      const activities: RecentActivity[] = [];
      
      // Get recent attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from(DB.tables.attendance)
        .select('id, status, date, created_at')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (!attendanceError && attendanceData) {
        attendanceData.forEach(record => {
          activities.push({
            id: record.id,
            type: 'attendance',
            title: `Attendance ${record.status}`,
            subtitle: `${record.date} - ${record.status === 'present' ? 'Present' : 'Absent'}`,
            timestamp: record.created_at,
            icon: 'CheckSquare',
          });
        });
      }

      // TODO: Add assignments and achievements when tables exist
      
      return activities.slice(0, 3); // Limit to 3 most recent
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

