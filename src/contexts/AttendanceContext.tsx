import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from './AuthContext';
import { saveAttendance } from '@/src/data/queries';

// Action types
const ATTENDANCE_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_STUDENTS: 'SET_STUDENTS',
  SET_ATTENDANCE: 'SET_ATTENDANCE',
  SET_ANALYTICS: 'SET_ANALYTICS',
  SET_CLASSES: 'SET_CLASSES',
  UPDATE_ATTENDANCE: 'UPDATE_ATTENDANCE',
  REFRESH_DATA: 'REFRESH_DATA',
} as const;

// Types
interface StudentAttendance {
  id: string;
  full_name: string;
  student_code: string;
  class_instance_id: string;
  status: 'present' | 'absent' | 'late' | 'excused' | null;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_instance_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
  marked_by: string;
  marked_by_role_code: string;
  school_code: string;
  created_at: string;
}

interface AttendanceAnalytics {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
  dailyTrends: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
  }>;
  studentStats: Array<{
    student_id: string;
    student_name: string;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    excusedDays: number;
    attendanceRate: number;
  }>;
}

// Initial state
interface AttendanceState {
  loading: boolean;
  error: string | null;
  students: StudentAttendance[];
  attendance: Map<string, AttendanceRecord[]>;
  analytics: AttendanceAnalytics | null;
  classes: any[];
  lastUpdated: string | null;
}

const initialState: AttendanceState = {
  loading: false,
  error: null,
  students: [],
  attendance: new Map(),
  analytics: null,
  classes: [],
  lastUpdated: null
};

// Reducer
type AttendanceAction = 
  | { type: typeof ATTENDANCE_ACTIONS.SET_LOADING; payload: boolean }
  | { type: typeof ATTENDANCE_ACTIONS.SET_ERROR; payload: string | null }
  | { type: typeof ATTENDANCE_ACTIONS.SET_STUDENTS; payload: StudentAttendance[] }
  | { type: typeof ATTENDANCE_ACTIONS.SET_ATTENDANCE; payload: [string, AttendanceRecord[]][] }
  | { type: typeof ATTENDANCE_ACTIONS.SET_ANALYTICS; payload: AttendanceAnalytics }
  | { type: typeof ATTENDANCE_ACTIONS.SET_CLASSES; payload: any[] }
  | { type: typeof ATTENDANCE_ACTIONS.UPDATE_ATTENDANCE; payload: { studentId: string; date: string; status: string; remarks?: string } }
  | { type: typeof ATTENDANCE_ACTIONS.REFRESH_DATA };

function attendanceReducer(state: AttendanceState, action: AttendanceAction): AttendanceState {
  switch (action.type) {
    case ATTENDANCE_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ATTENDANCE_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case ATTENDANCE_ACTIONS.SET_STUDENTS:
      return { 
        ...state, 
        students: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case ATTENDANCE_ACTIONS.SET_ATTENDANCE:
      return { 
        ...state, 
        attendance: new Map(action.payload),
        lastUpdated: new Date().toISOString()
      };
    
    case ATTENDANCE_ACTIONS.SET_ANALYTICS:
      return { 
        ...state, 
        analytics: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case ATTENDANCE_ACTIONS.SET_CLASSES:
      return { ...state, classes: action.payload };
    
    case ATTENDANCE_ACTIONS.UPDATE_ATTENDANCE:
      const newAttendance = new Map(state.attendance);
      const key = `${action.payload.studentId}_${action.payload.date}`;
      const existingRecords = newAttendance.get(key) || [];
      
      // Update or add attendance record
      const updatedRecords = existingRecords.map(record => 
        record.student_id === action.payload.studentId && 
        record.date === action.payload.date
          ? { ...record, status: action.payload.status as any, remarks: action.payload.remarks }
          : record
      );
      
      if (updatedRecords.length === 0) {
        updatedRecords.push({
          id: `temp_${Date.now()}`,
          student_id: action.payload.studentId,
          class_instance_id: '',
          date: action.payload.date,
          status: action.payload.status as any,
          remarks: action.payload.remarks,
          marked_by: 'current_user',
          marked_by_role_code: 'teacher',
          school_code: '',
          created_at: new Date().toISOString()
        });
      }
      
      newAttendance.set(key, updatedRecords);
      return { ...state, attendance: newAttendance };
    
    case ATTENDANCE_ACTIONS.REFRESH_DATA:
      return { ...state, lastUpdated: new Date().toISOString() };
    
    default:
      return state;
  }
}

// Context
interface AttendanceContextType {
  state: AttendanceState;
  actions: {
    loadStudentsForClass: (classId: string) => Promise<void>;
    loadAttendanceForDate: (classId: string, date: string) => Promise<void>;
    loadAttendanceAnalytics: (classId: string, startDate?: string, endDate?: string) => Promise<void>;
    loadClasses: () => Promise<void>;
    markAttendance: (studentId: string, date: string, status: string, remarks?: string) => Promise<void>;
    saveAttendance: (classId: string, date: string, attendanceData: any[]) => Promise<void>;
    refreshData: () => void;
    clearError: () => void;
  };
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

// Provider
export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(attendanceReducer, initialState);
  const { profile, user } = useAuth();
  const schoolCode = profile?.school_code;

  // Load students for a class
  const loadStudentsForClass = useCallback(async (classId: string) => {
    if (!user || !schoolCode) return;
    
    dispatch({ type: ATTENDANCE_ACTIONS.SET_LOADING, payload: true });
    try {
      const { data, error } = await supabase
        .from('student')
        .select(`
          id,
          full_name,
          student_code,
          class_instance_id
        `)
        .eq('class_instance_id', classId)
        .eq('school_code', schoolCode)
        .order('full_name', { ascending: true });

      if (error) throw error;
      
      dispatch({ 
        type: ATTENDANCE_ACTIONS.SET_STUDENTS, 
        payload: (data as unknown as StudentAttendance[]) || [] 
      });
    } catch (error) {
      dispatch({ 
        type: ATTENDANCE_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load students' 
      });
    }
  }, [user, schoolCode]);

  // Load attendance for a specific date
  const loadAttendanceForDate = useCallback(async (classId: string, date: string) => {
    if (!user || !schoolCode) return;
    
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_instance_id', classId)
        .eq('date', date)
        .eq('school_code', schoolCode);

      if (error) throw error;
      
      const attendanceMap = new Map<string, AttendanceRecord[]>();
      (data as AttendanceRecord[])?.forEach((record) => {
        const key = `${record.student_id}_${record.date}`;
        const existing = attendanceMap.get(key) || [];
        attendanceMap.set(key, [...existing, record]);
      });
      
      dispatch({ 
        type: ATTENDANCE_ACTIONS.SET_ATTENDANCE, 
        payload: Array.from(attendanceMap.entries()) 
      });
    } catch (error) {
      dispatch({ 
        type: ATTENDANCE_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load attendance' 
      });
    }
  }, [user, schoolCode]);

  // Load attendance analytics
  const loadAttendanceAnalytics = useCallback(async (classId: string, startDate?: string, endDate?: string) => {
    if (!user || !schoolCode) return;
    
    try {
      // Get date range
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get all attendance records for the class in date range
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_instance_id', classId)
        .eq('school_code', schoolCode)
        .gte('attendance_date', start)
        .lte('attendance_date', end)
        .order('attendance_date', { ascending: true });

      if (attendanceError) throw attendanceError;

      // Get students for the class
      const { data: studentsData, error: studentsError } = await supabase
        .from('student')
        .select('id, full_name')
        .eq('class_instance_id', classId)
        .eq('school_code', schoolCode);

      if (studentsError) throw studentsError;

      // Calculate analytics
      const totalStudents = studentsData?.length || 0;
      const attendanceRecords = attendanceData as AttendanceRecord[] || [];
      
      // Daily trends
      const dailyTrends = new Map<string, { present: number; absent: number; late: number; excused: number; rate: number }>();
      
      attendanceRecords.forEach(record => {
        const date = record.date;
        const existing = dailyTrends.get(date) || { present: 0, absent: 0, late: 0, excused: 0, rate: 0 };
        
        switch (record.status) {
          case 'present':
            existing.present++;
            break;
          case 'absent':
            existing.absent++;
            break;
          case 'late':
            existing.late++;
            break;
          case 'excused':
            existing.excused++;
            break;
        }
        
        const total = existing.present + existing.absent + existing.late + existing.excused;
        existing.rate = total > 0 ? (existing.present / total) * 100 : 0;
        
        dailyTrends.set(date, existing);
      });

      // Student statistics
      const studentStats = (studentsData as any[])?.map((student: any) => {
        const studentRecords = attendanceRecords.filter(r => r.student_id === student.id);
        const totalDays = studentRecords.length;
        const presentDays = studentRecords.filter(r => r.status === 'present').length;
        const absentDays = studentRecords.filter(r => r.status === 'absent').length;
        const lateDays = studentRecords.filter(r => r.status === 'late').length;
        const excusedDays = studentRecords.filter(r => r.status === 'excused').length;
        const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        return {
          student_id: student.id,
          student_name: student.full_name,
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          excusedDays,
          attendanceRate
        };
      }) || [];

      // Overall statistics
      const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
      const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
      const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
      const excusedCount = attendanceRecords.filter(r => r.status === 'excused').length;
      const totalRecords = attendanceRecords.length;
      const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

      const analytics: AttendanceAnalytics = {
        totalStudents,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendanceRate,
        dailyTrends: Array.from(dailyTrends.entries()).map(([date, stats]) => ({
          date,
          ...stats
        })),
        studentStats
      };

      dispatch({ type: ATTENDANCE_ACTIONS.SET_ANALYTICS, payload: analytics });
    } catch (error) {
      dispatch({ 
        type: ATTENDANCE_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load analytics' 
      });
    }
  }, [user, schoolCode]);

  // Load classes
  const loadClasses = useCallback(async () => {
    if (!user || !schoolCode) return;
    
    try {
      const { data, error } = await supabase
        .from('class_instances')
        .select(`
          id,
          grade,
          section,
          class_teacher_id,
          class_teacher:admin!class_teacher_id(full_name)
        `)
        .eq('school_code', schoolCode)
        .order('grade', { ascending: true })
        .order('section', { ascending: true });

      if (error) throw error;
      
      dispatch({ type: ATTENDANCE_ACTIONS.SET_CLASSES, payload: (data as any[]) || [] });
    } catch (error) {
      dispatch({ 
        type: ATTENDANCE_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load classes' 
      });
    }
  }, [user, schoolCode]);

  // Mark attendance (local update)
  const markAttendance = useCallback(async (studentId: string, date: string, status: string, remarks?: string) => {
    dispatch({ 
      type: ATTENDANCE_ACTIONS.UPDATE_ATTENDANCE, 
      payload: { studentId, date, status, remarks } 
    });
  }, []);

  // Save attendance to database
  const saveAttendance = useCallback(async (classId: string, date: string, attendanceData: any[]) => {
    if (!user || !schoolCode) return;
    
    try {
      // Prepare attendance records
      const records = attendanceData.map(item => ({
        student_id: item.studentId,
        class_instance_id: classId,
        date: date,
        status: item.status,
        remarks: item.remarks || null,
        school_code: schoolCode,
        marked_by: user.id,
        marked_by_role_code: profile?.role || 'teacher',
      }));

      // Insert attendance records using direct Supabase
      const { error } = await supabase
        .from('attendance')
        .upsert(records as any);
      
      if (error) {
        throw new Error(`Failed to save attendance: ${error.message}`);
      }
      
      // Refresh data
      dispatch({ type: ATTENDANCE_ACTIONS.REFRESH_DATA });
    } catch (error) {
      dispatch({ 
        type: ATTENDANCE_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to save attendance' 
      });
    }
  }, [user, schoolCode]);

  // Refresh data
  const refreshData = useCallback(() => {
    dispatch({ type: ATTENDANCE_ACTIONS.REFRESH_DATA });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: ATTENDANCE_ACTIONS.SET_ERROR, payload: null });
  }, []);

  // Auto-load classes when context mounts
  useEffect(() => {
    if (user && schoolCode) {
      loadClasses();
    }
  }, [user, schoolCode, loadClasses]);

  const contextValue: AttendanceContextType = {
    state,
    actions: {
      loadStudentsForClass,
      loadAttendanceForDate,
      loadAttendanceAnalytics,
      loadClasses,
      markAttendance,
      saveAttendance,
      refreshData,
      clearError,
    },
  };

  return (
    <AttendanceContext.Provider value={contextValue}>
      {children}
    </AttendanceContext.Provider>
  );
};

// Hook
export const useAttendance = (): AttendanceContextType => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
