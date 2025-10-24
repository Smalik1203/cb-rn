import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from './AuthContext';

// Action types
const ANALYTICS_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_DASHBOARD_STATS: 'SET_DASHBOARD_STATS',
  SET_ATTENDANCE_ANALYTICS: 'SET_ATTENDANCE_ANALYTICS',
  SET_FEE_ANALYTICS: 'SET_FEE_ANALYTICS',
  SET_STUDENT_PERFORMANCE: 'SET_STUDENT_PERFORMANCE',
  SET_CLASS_COMPARISON: 'SET_CLASS_COMPARISON',
  REFRESH_DATA: 'REFRESH_DATA',
} as const;

// Types
interface DashboardStats {
  totalStudents: number;
  totalClasses: number;
  totalTeachers: number;
  todayAttendance: number;
  attendanceRate: number;
  feeCollectionRate: number;
  pendingFees: number;
  overdueFees: number;
}

interface AttendanceAnalytics {
  overallRate: number;
  dailyTrends: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
  }>;
  classComparison: Array<{
    classId: string;
    className: string;
    attendanceRate: number;
    totalStudents: number;
  }>;
  studentPerformance: Array<{
    studentId: string;
    studentName: string;
    attendanceRate: number;
    totalDays: number;
    presentDays: number;
  }>;
}

interface FeeAnalytics {
  totalDue: number;
  totalCollected: number;
  collectionRate: number;
  pendingAmount: number;
  overdueAmount: number;
  monthlyTrends: Array<{
    month: string;
    due: number;
    collected: number;
    rate: number;
  }>;
  classComparison: Array<{
    classId: string;
    className: string;
    totalDue: number;
    totalCollected: number;
    collectionRate: number;
  }>;
}

interface StudentPerformance {
  studentId: string;
  studentName: string;
  className: string;
  attendanceRate: number;
  feeStatus: 'paid' | 'partial' | 'overdue';
  totalFees: number;
  paidFees: number;
  performanceScore: number;
}

interface ClassComparison {
  classId: string;
  className: string;
  totalStudents: number;
  attendanceRate: number;
  feeCollectionRate: number;
  performanceScore: number;
}

// Initial state
interface AnalyticsState {
  loading: boolean;
  error: string | null;
  dashboardStats: DashboardStats | null;
  attendanceAnalytics: AttendanceAnalytics | null;
  feeAnalytics: FeeAnalytics | null;
  studentPerformance: StudentPerformance[];
  classComparison: ClassComparison[];
  lastUpdated: string | null;
}

const initialState: AnalyticsState = {
  loading: false,
  error: null,
  dashboardStats: null,
  attendanceAnalytics: null,
  feeAnalytics: null,
  studentPerformance: [],
  classComparison: [],
  lastUpdated: null
};

// Reducer
type AnalyticsAction = 
  | { type: typeof ANALYTICS_ACTIONS.SET_LOADING; payload: boolean }
  | { type: typeof ANALYTICS_ACTIONS.SET_ERROR; payload: string | null }
  | { type: typeof ANALYTICS_ACTIONS.SET_DASHBOARD_STATS; payload: DashboardStats }
  | { type: typeof ANALYTICS_ACTIONS.SET_ATTENDANCE_ANALYTICS; payload: AttendanceAnalytics }
  | { type: typeof ANALYTICS_ACTIONS.SET_FEE_ANALYTICS; payload: FeeAnalytics }
  | { type: typeof ANALYTICS_ACTIONS.SET_STUDENT_PERFORMANCE; payload: StudentPerformance[] }
  | { type: typeof ANALYTICS_ACTIONS.SET_CLASS_COMPARISON; payload: ClassComparison[] }
  | { type: typeof ANALYTICS_ACTIONS.REFRESH_DATA };

function analyticsReducer(state: AnalyticsState, action: AnalyticsAction): AnalyticsState {
  switch (action.type) {
    case ANALYTICS_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ANALYTICS_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case ANALYTICS_ACTIONS.SET_DASHBOARD_STATS:
      return { 
        ...state, 
        dashboardStats: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case ANALYTICS_ACTIONS.SET_ATTENDANCE_ANALYTICS:
      return { 
        ...state, 
        attendanceAnalytics: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case ANALYTICS_ACTIONS.SET_FEE_ANALYTICS:
      return { 
        ...state, 
        feeAnalytics: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case ANALYTICS_ACTIONS.SET_STUDENT_PERFORMANCE:
      return { 
        ...state, 
        studentPerformance: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case ANALYTICS_ACTIONS.SET_CLASS_COMPARISON:
      return { 
        ...state, 
        classComparison: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case ANALYTICS_ACTIONS.REFRESH_DATA:
      return { ...state, lastUpdated: new Date().toISOString() };
    
    default:
      return state;
  }
}

// Context
interface AnalyticsContextType {
  state: AnalyticsState;
  actions: {
    loadDashboardStats: () => Promise<void>;
    loadAttendanceAnalytics: (startDate?: string, endDate?: string) => Promise<void>;
    loadFeeAnalytics: (startDate?: string, endDate?: string) => Promise<void>;
    loadStudentPerformance: (classId?: string) => Promise<void>;
    loadClassComparison: () => Promise<void>;
    refreshData: () => void;
    clearError: () => void;
  };
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// Provider
export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(analyticsReducer, initialState);
  const { profile, user } = useAuth();
  const schoolCode = profile?.school_code;

  // Load dashboard statistics
  const loadDashboardStats = useCallback(async () => {
    if (!user || !schoolCode) return;
    
    dispatch({ type: ANALYTICS_ACTIONS.SET_LOADING, payload: true });
    try {
      // Get total students
      const { data: studentsData } = await supabase
        .from('student')
        .select('id')
        .eq('school_code', schoolCode);

      // Get total classes (class_instances already have academic_year_id)
      const { data: classesData } = await supabase
        .from('class_instances')
        .select('id')
        .eq('school_code', schoolCode);

      // Get total teachers
      const { data: teachersData } = await supabase
        .from('admin')
        .select('id')
        .eq('school_code', schoolCode)
        .eq('role', 'teacher');

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAttendanceData } = await supabase
        .from('attendance')
        .select('status')
        .eq('school_code', schoolCode)
        .eq('date', today) as { data: { status: string }[] | null };

      // Get overall attendance rate (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status')
        .eq('school_code', schoolCode)
        .gte('attendance_date', thirtyDaysAgo);

      // Get fee analytics
      const { data: feeData } = await supabase
        .from('fee_payments')
        .select('amount_paise')
        .eq('school_code', schoolCode);

      const { data: feePlansData } = await supabase
        .from('fee_student_plans')
        .select(`
          items:fee_student_plan_items(amount_paise, quantity)
        `)
        .eq('school_code', schoolCode);

      // Calculate statistics
      const totalStudents = studentsData?.length || 0;
      const totalClasses = classesData?.length || 0;
      const totalTeachers = teachersData?.length || 0;
      
      const todayPresent = todayAttendanceData?.filter((a: any) => a.status === 'present').length || 0;
      const todayTotal = todayAttendanceData?.length || 0;
      const todayAttendance = todayTotal > 0 ? (todayPresent / todayTotal) * 100 : 0;

      const totalPresent = attendanceData?.filter((a: any) => a.status === 'present').length || 0;
      const totalAttendance = attendanceData?.length || 0;
      const attendanceRate = totalAttendance > 0 ? (totalPresent / totalAttendance) * 100 : 0;

      const totalCollected = (feeData as any[])?.reduce((sum, fee) => sum + (fee.amount_paise || 0), 0) || 0;
      const totalDue = feePlansData?.reduce((sum, plan) => {
        const planTotal = (plan as any).items?.reduce((itemSum: number, item: any) => 
          itemSum + (item.amount_paise * item.quantity), 0) || 0;
        return sum + planTotal;
      }, 0) || 0;
      const feeCollectionRate = totalDue > 0 ? (totalCollected / totalDue) * 100 : 0;

      const pendingFees = totalDue - totalCollected;
      const overdueFees = Math.max(0, pendingFees); // Simplified calculation

      const dashboardStats: DashboardStats = {
        totalStudents,
        totalClasses,
        totalTeachers,
        todayAttendance,
        attendanceRate,
        feeCollectionRate,
        pendingFees,
        overdueFees,
      };

      dispatch({ type: ANALYTICS_ACTIONS.SET_DASHBOARD_STATS, payload: dashboardStats });
    } catch (error) {
      dispatch({ 
        type: ANALYTICS_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load dashboard stats' 
      });
    }
  }, [user, schoolCode]);

  // Load attendance analytics
  const loadAttendanceAnalytics = useCallback(async (startDate?: string, endDate?: string) => {
    if (!user || !schoolCode) return;
    
    try {
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get attendance data
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select(`
          attendance_date,
          status,
          student_id,
          class_instance_id,
          student:student(full_name, class_instance_id),
          class_instance:class_instances(grade, section)
        `)
        .eq('school_code', schoolCode)
        .gte('attendance_date', start)
        .lte('attendance_date', end)
        .order('attendance_date', { ascending: true });

      // Get classes data
      const { data: classesData } = await supabase
        .from('class_instances')
        .select(`
          id,
          grade,
          section,
          student:student(id)
        `)
        .eq('school_code', schoolCode);

      // Calculate analytics
      const attendanceRecords = attendanceData as any[] || [];
      const classes = classesData as any[] || [];

      // Daily trends
      const dailyTrends = new Map<string, { present: number; absent: number; late: number; excused: number; rate: number }>();
      
      attendanceRecords.forEach(record => {
        const date = record.attendance_date;
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

      // Class comparison
      const classComparison = classes.map(cls => {
        const classAttendance = attendanceRecords.filter(r => r.class_instance_id === cls.id);
        const present = classAttendance.filter(r => r.status === 'present').length;
        const total = classAttendance.length;
        const attendanceRate = total > 0 ? (present / total) * 100 : 0;
        const totalStudents = cls.student?.length || 0;

        return {
          classId: cls.id,
          className: `Grade ${cls.grade}-${cls.section}`,
          attendanceRate,
          totalStudents,
        };
      });

      // Student performance
      const studentPerformance = attendanceRecords.reduce((acc, record) => {
        const existing = acc.find(s => s.studentId === record.student_id);
        if (existing) {
          existing.totalDays++;
          if (record.status === 'present') existing.presentDays++;
        } else {
          acc.push({
            studentId: record.student_id,
            studentName: record.student?.full_name || 'Unknown',
            totalDays: 1,
            presentDays: record.status === 'present' ? 1 : 0,
          });
        }
        return acc;
      }, [] as any[]).map(student => ({
        ...student,
        attendanceRate: student.totalDays > 0 ? (student.presentDays / student.totalDays) * 100 : 0,
      }));

      // Overall rate
      const totalPresent = attendanceRecords.filter(r => r.status === 'present').length;
      const totalRecords = attendanceRecords.length;
      const overallRate = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;

      const analytics: AttendanceAnalytics = {
        overallRate,
        dailyTrends: Array.from(dailyTrends.entries()).map(([date, stats]) => ({
          date,
          ...stats
        })),
        classComparison,
        studentPerformance,
      };

      dispatch({ type: ANALYTICS_ACTIONS.SET_ATTENDANCE_ANALYTICS, payload: analytics });
    } catch (error) {
      dispatch({ 
        type: ANALYTICS_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load attendance analytics' 
      });
    }
  }, [user, schoolCode]);

  // Load fee analytics
  const loadFeeAnalytics = useCallback(async (startDate?: string, endDate?: string) => {
    if (!user || !schoolCode) return;
    
    try {
      // Get current academic year
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('school_code', schoolCode)
        .eq('is_active', true)
        .single();

      if (!academicYear) return;

      // Get fee payments
      const { data: paymentsData } = await supabase
        .from('fee_payments')
        .select(`
          amount_paise,
          payment_date,
          student_id,
          student:student(class_instance_id, class_instance:class_instances(grade, section))
        `)
        .eq('school_code', schoolCode);

      // Get fee plans
      const { data: plansData } = await supabase
        .from('fee_student_plans')
        .select(`
          student_id,
          items:fee_student_plan_items(amount_paise, quantity),
          student:student(class_instance_id, class_instance:class_instances(grade, section))
        `)
        .eq('school_code', schoolCode);

      const payments = paymentsData as any[] || [];
      const plans = plansData as any[] || [];

      // Calculate totals
      const totalCollected = payments.reduce((sum, payment) => sum + payment.amount_paise, 0);
      const totalDue = plans.reduce((sum, plan) => {
        const planTotal = (plan as any).items?.reduce((itemSum: number, item: any) => 
          itemSum + (item.amount_paise * item.quantity), 0) || 0;
        return sum + planTotal;
      }, 0);

      const collectionRate = totalDue > 0 ? (totalCollected / totalDue) * 100 : 0;
      const pendingAmount = totalDue - totalCollected;
      const overdueAmount = Math.max(0, pendingAmount);

      // Monthly trends (simplified)
      const monthlyTrends = [
        { month: 'Jan', due: totalDue / 12, collected: totalCollected / 12, rate: collectionRate },
        { month: 'Feb', due: totalDue / 12, collected: totalCollected / 12, rate: collectionRate },
        { month: 'Mar', due: totalDue / 12, collected: totalCollected / 12, rate: collectionRate },
        { month: 'Apr', due: totalDue / 12, collected: totalCollected / 12, rate: collectionRate },
        { month: 'May', due: totalDue / 12, collected: totalCollected / 12, rate: collectionRate },
        { month: 'Jun', due: totalDue / 12, collected: totalCollected / 12, rate: collectionRate },
      ];

      // Class comparison
      const classComparison = plans.reduce((acc, plan) => {
        const classId = plan.student?.class_instance_id;
        const className = plan.student?.class_instance ? 
          `Grade ${plan.student.class_instance.grade}-${plan.student.class_instance.section}` : 'Unknown';
        
        const existing = acc.find(c => c.classId === classId);
        if (existing) {
          const planTotal = (plan as any).items?.reduce((itemSum: number, item: any) => 
            itemSum + (item.amount_paise * item.quantity), 0) || 0;
          existing.totalDue += planTotal;
        } else {
          const planTotal = (plan as any).items?.reduce((itemSum: number, item: any) => 
            itemSum + (item.amount_paise * item.quantity), 0) || 0;
          acc.push({
            classId,
            className,
            totalDue: planTotal,
            totalCollected: 0,
            collectionRate: 0,
          });
        }
        return acc;
      }, [] as any[]);

      // Add collected amounts
      payments.forEach(payment => {
        const classId = payment.student?.class_instance_id;
        const existing = classComparison.find(c => c.classId === classId);
        if (existing) {
          existing.totalCollected += payment.amount_paise;
        }
      });

      // Calculate collection rates
      classComparison.forEach(cls => {
        cls.collectionRate = cls.totalDue > 0 ? (cls.totalCollected / cls.totalDue) * 100 : 0;
      });

      const analytics: FeeAnalytics = {
        totalDue,
        totalCollected,
        collectionRate,
        pendingAmount,
        overdueAmount,
        monthlyTrends,
        classComparison,
      };

      dispatch({ type: ANALYTICS_ACTIONS.SET_FEE_ANALYTICS, payload: analytics });
    } catch (error) {
      dispatch({ 
        type: ANALYTICS_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load fee analytics' 
      });
    }
  }, [user, schoolCode]);

  // Load student performance
  const loadStudentPerformance = useCallback(async (classId?: string) => {
    if (!user || !schoolCode) return;
    
    try {
      // This would combine attendance and fee data for comprehensive student performance
      // For now, return empty array
      dispatch({ type: ANALYTICS_ACTIONS.SET_STUDENT_PERFORMANCE, payload: [] });
    } catch (error) {
      dispatch({ 
        type: ANALYTICS_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load student performance' 
      });
    }
  }, [user, schoolCode]);

  // Load class comparison
  const loadClassComparison = useCallback(async () => {
    if (!user || !schoolCode) return;
    
    try {
      // This would combine all metrics for class comparison
      // For now, return empty array
      dispatch({ type: ANALYTICS_ACTIONS.SET_CLASS_COMPARISON, payload: [] });
    } catch (error) {
      dispatch({ 
        type: ANALYTICS_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load class comparison' 
      });
    }
  }, [user, schoolCode]);

  // Refresh data
  const refreshData = useCallback(() => {
    dispatch({ type: ANALYTICS_ACTIONS.REFRESH_DATA });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: ANALYTICS_ACTIONS.SET_ERROR, payload: null });
  }, []);

  // Auto-load dashboard stats when context mounts
  useEffect(() => {
    if (user && schoolCode) {
      loadDashboardStats();
    }
  }, [user, schoolCode, loadDashboardStats]);

  const contextValue: AnalyticsContextType = {
    state,
    actions: {
      loadDashboardStats,
      loadAttendanceAnalytics,
      loadFeeAnalytics,
      loadStudentPerformance,
      loadClassComparison,
      refreshData,
      clearError,
    },
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Hook
export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};
