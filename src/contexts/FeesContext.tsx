import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from './AuthContext';
import { FeeComponentType, FeeStudentPlan, FeePayment } from '@/src/types/database.types';

// Action types
const FEES_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_FEE_COMPONENTS: 'SET_FEE_COMPONENTS',
  SET_STUDENTS: 'SET_STUDENTS',
  SET_STUDENT_PLANS: 'SET_STUDENT_PLANS',
  SET_PAYMENTS: 'SET_PAYMENTS',
  SET_CLASSES: 'SET_CLASSES',
  SET_ACADEMIC_YEAR: 'SET_ACADEMIC_YEAR',
  REFRESH_DATA: 'REFRESH_DATA',
  UPDATE_PAYMENT: 'UPDATE_PAYMENT',
  UPDATE_PLAN: 'UPDATE_PLAN',
  UPDATE_COMPONENT: 'UPDATE_COMPONENT'
} as const;

// Types
interface StudentWithFees {
  id: string;
  full_name: string;
  student_code: string;
  class_instance_id: string;
  feeDetails: {
    plan: FeeStudentPlan | null;
    payments: FeePayment[];
    totalDue: number;
    totalPaid: number;
    balance: number;
  };
}

interface ClassFeesSummary {
  totalStudents: number;
  totalDue: number;
  totalPaid: number;
  totalBalance: number;
}

// Initial state
interface FeesState {
  loading: boolean;
  error: string | null;
  feeComponents: FeeComponentType[];
  students: StudentWithFees[];
  studentPlans: Map<string, FeeStudentPlan>;
  payments: Map<string, FeePayment[]>;
  classes: any[];
  academicYear: any;
  lastUpdated: string | null;
}

const initialState: FeesState = {
  loading: false,
  error: null,
  feeComponents: [],
  students: [],
  studentPlans: new Map(),
  payments: new Map(),
  classes: [],
  academicYear: null,
  lastUpdated: null
};

// Reducer
type FeesAction = 
  | { type: typeof FEES_ACTIONS.SET_LOADING; payload: boolean }
  | { type: typeof FEES_ACTIONS.SET_ERROR; payload: string | null }
  | { type: typeof FEES_ACTIONS.SET_FEE_COMPONENTS; payload: FeeComponentType[] }
  | { type: typeof FEES_ACTIONS.SET_STUDENTS; payload: StudentWithFees[] }
  | { type: typeof FEES_ACTIONS.SET_STUDENT_PLANS; payload: [string, FeeStudentPlan][] }
  | { type: typeof FEES_ACTIONS.SET_PAYMENTS; payload: [string, FeePayment[]][] }
  | { type: typeof FEES_ACTIONS.SET_CLASSES; payload: any[] }
  | { type: typeof FEES_ACTIONS.SET_ACADEMIC_YEAR; payload: any }
  | { type: typeof FEES_ACTIONS.REFRESH_DATA }
  | { type: typeof FEES_ACTIONS.UPDATE_PAYMENT; payload: { studentId: string; payment: FeePayment } }
  | { type: typeof FEES_ACTIONS.UPDATE_PLAN; payload: { studentId: string; plan: FeeStudentPlan } }
  | { type: typeof FEES_ACTIONS.UPDATE_COMPONENT; payload: FeeComponentType };

function feesReducer(state: FeesState, action: FeesAction): FeesState {
  switch (action.type) {
    case FEES_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case FEES_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case FEES_ACTIONS.SET_FEE_COMPONENTS:
      return { 
        ...state, 
        feeComponents: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case FEES_ACTIONS.SET_STUDENTS:
      return { 
        ...state, 
        students: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case FEES_ACTIONS.SET_STUDENT_PLANS:
      return { 
        ...state, 
        studentPlans: new Map(action.payload),
        lastUpdated: new Date().toISOString()
      };
    
    case FEES_ACTIONS.SET_PAYMENTS:
      return { 
        ...state, 
        payments: new Map(action.payload),
        lastUpdated: new Date().toISOString()
      };
    
    case FEES_ACTIONS.SET_CLASSES:
      return { ...state, classes: action.payload };
    
    case FEES_ACTIONS.SET_ACADEMIC_YEAR:
      return { ...state, academicYear: action.payload };
    
    case FEES_ACTIONS.REFRESH_DATA:
      return { ...state, lastUpdated: new Date().toISOString() };
    
    case FEES_ACTIONS.UPDATE_PAYMENT:
      const newPayments = new Map(state.payments);
      const existingPayments = newPayments.get(action.payload.studentId) || [];
      newPayments.set(action.payload.studentId, [...existingPayments, action.payload.payment]);
      return { ...state, payments: newPayments };
    
    case FEES_ACTIONS.UPDATE_PLAN:
      const newPlans = new Map(state.studentPlans);
      newPlans.set(action.payload.studentId, action.payload.plan);
      return { ...state, studentPlans: newPlans };
    
    case FEES_ACTIONS.UPDATE_COMPONENT:
      return {
        ...state,
        feeComponents: state.feeComponents.map(comp => 
          comp.id === action.payload.id ? action.payload : comp
        )
      };
    
    default:
      return state;
  }
}

// Context
interface FeesContextType {
  state: FeesState;
  actions: {
    loadFeeComponents: () => Promise<void>;
    loadStudentsForClass: (classId: string) => Promise<void>;
    loadStudentPlans: (studentIds: string[]) => Promise<void>;
    loadPayments: (studentIds: string[]) => Promise<void>;
    loadClasses: () => Promise<void>;
    loadAcademicYear: () => Promise<void>;
    refreshData: () => void;
    addPayment: (studentId: string, payment: FeePayment) => void;
    updatePlan: (studentId: string, plan: FeeStudentPlan) => void;
    updateComponent: (component: FeeComponentType) => void;
    clearError: () => void;
  };
}

const FeesContext = createContext<FeesContextType | undefined>(undefined);

// Provider
export const FeesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(feesReducer, initialState);
  const { profile, user } = useAuth();
  const schoolCode = profile?.school_code;

  // Load fee components
  const loadFeeComponents = useCallback(async () => {
    if (!user || !schoolCode) return;
    
    dispatch({ type: FEES_ACTIONS.SET_LOADING, payload: true });
    try {
      const { data, error } = await supabase
        .from('fee_component_types')
        .select('*')
        .eq('school_code', schoolCode)
        .order('name', { ascending: true });

      if (error) throw error;
      
      dispatch({ 
        type: FEES_ACTIONS.SET_FEE_COMPONENTS, 
        payload: (data as unknown as FeeComponentType[]) || [] 
      });
    } catch (error) {
      dispatch({ 
        type: FEES_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load fee components' 
      });
    }
  }, [user, schoolCode]);

  // Load students for a class
  const loadStudentsForClass = useCallback(async (classId: string) => {
    if (!user || !schoolCode) return;
    
    dispatch({ type: FEES_ACTIONS.SET_LOADING, payload: true });
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
        .order('full_name', { ascending: true});

      if (error) throw error;
      
      const students = (data as any[]) || [];
      dispatch({ type: FEES_ACTIONS.SET_STUDENTS, payload: students });
    } catch (error) {
      dispatch({ 
        type: FEES_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load students' 
      });
    }
  }, [user, schoolCode]);

  // Load student plans
  const loadStudentPlans = useCallback(async (studentIds: string[]) => {
    if (!user || !schoolCode || studentIds.length === 0) return;
    
    try {
      // Get current academic year
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('school_code', schoolCode)
        .eq('is_active', true)
        .single();

      if (!academicYear) return;

      const { data, error } = await supabase
        .from('fee_student_plans')
        .select(`
          *,
          items:fee_student_plan_items(
            *,
            component:fee_component_types(*)
          )
        `)
        .in('student_id', studentIds)
        .eq('academic_year_id', (academicYear as any)?.id || '')
        .eq('school_code', schoolCode)
        .eq('status', 'active');

      if (error) throw error;
      
      const plansMap = new Map<string, FeeStudentPlan>();
      (data as any[])?.forEach((plan: any) => {
        plansMap.set(plan.student_id, plan as FeeStudentPlan);
      });
      
      dispatch({ 
        type: FEES_ACTIONS.SET_STUDENT_PLANS, 
        payload: Array.from(plansMap.entries()) 
      });
    } catch (error) {
      dispatch({ 
        type: FEES_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load student plans' 
      });
    }
  }, [user, schoolCode]);

  // Load payments
  const loadPayments = useCallback(async (studentIds: string[]) => {
    if (!user || !schoolCode || studentIds.length === 0) return;
    
    try {
      const { data, error } = await supabase
        .from('fee_payments')
        .select(`
          *,
          component_type:fee_component_types(*)
        `)
        .in('student_id', studentIds)
        .eq('school_code', schoolCode)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      
      const paymentsMap = new Map<string, FeePayment[]>();
      (data as any[])?.forEach((payment: any) => {
        const existing = paymentsMap.get(payment.student_id) || [];
        paymentsMap.set(payment.student_id, [...existing, payment as FeePayment]);
      });
      
      dispatch({ 
        type: FEES_ACTIONS.SET_PAYMENTS, 
        payload: Array.from(paymentsMap.entries()) 
      });
    } catch (error) {
      dispatch({ 
        type: FEES_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load payments' 
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
      
      dispatch({ type: FEES_ACTIONS.SET_CLASSES, payload: (data as any[]) || [] });
    } catch (error) {
      dispatch({ 
        type: FEES_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load classes' 
      });
    }
  }, [user, schoolCode]);

  // Load academic year
  const loadAcademicYear = useCallback(async () => {
    if (!user || !schoolCode) return;
    
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .eq('school_code', schoolCode)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      
      dispatch({ type: FEES_ACTIONS.SET_ACADEMIC_YEAR, payload: data });
    } catch (error) {
      dispatch({ 
        type: FEES_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load academic year' 
      });
    }
  }, [user, schoolCode]);

  // Refresh data
  const refreshData = useCallback(() => {
    dispatch({ type: FEES_ACTIONS.REFRESH_DATA });
  }, []);

  // Add payment
  const addPayment = useCallback((studentId: string, payment: FeePayment) => {
    dispatch({ type: FEES_ACTIONS.UPDATE_PAYMENT, payload: { studentId, payment } });
  }, []);

  // Update plan
  const updatePlan = useCallback((studentId: string, plan: FeeStudentPlan) => {
    dispatch({ type: FEES_ACTIONS.UPDATE_PLAN, payload: { studentId, plan } });
  }, []);

  // Update component
  const updateComponent = useCallback((component: FeeComponentType) => {
    dispatch({ type: FEES_ACTIONS.UPDATE_COMPONENT, payload: component });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: FEES_ACTIONS.SET_ERROR, payload: null });
  }, []);

  // Auto-load data when context mounts
  useEffect(() => {
    if (user && schoolCode) {
      loadFeeComponents();
      loadClasses();
      loadAcademicYear();
    }
  }, [user, schoolCode, loadFeeComponents, loadClasses, loadAcademicYear]);

  const contextValue: FeesContextType = {
    state,
    actions: {
      loadFeeComponents,
      loadStudentsForClass,
      loadStudentPlans,
      loadPayments,
      loadClasses,
      loadAcademicYear,
      refreshData,
      addPayment,
      updatePlan,
      updateComponent,
      clearError,
    },
  };

  return (
    <FeesContext.Provider value={contextValue}>
      {children}
    </FeesContext.Provider>
  );
};

// Hook
export const useFees = (): FeesContextType => {
  const context = useContext(FeesContext);
  if (context === undefined) {
    throw new Error('useFees must be used within a FeesProvider');
  }
  return context;
};
