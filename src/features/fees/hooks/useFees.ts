import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppScope } from '@/src/contexts/AppScopeContext';
import { supabase } from '@/src/data/supabaseClient';
import {
  getStudentFees,
  getClassStudentsFees,
  getFeeComponentTypes,
  recordPayment
} from '@/src/data/queries';
import type { 
  FeeComponentType, 
  FeeStudentPlan, 
  FeeStudentPlanItem, 
  FeePayment, 
  FeePaymentInsert,
  Student 
} from '@/src/types/database.types';

export interface StudentFeeDetails {
  plan: FeeStudentPlan | null;
  payments: FeePayment[];
  totalDue: number;
  totalPaid: number;
  balance: number;
}

export function useStudentFees(studentId?: string) {
  const { profile, user } = useAuth();
  const { scope } = useAppScope();
  const schoolCode = scope.school_code || profile?.school_code;
  const academicYearId = scope.academic_year_id;
  const effectiveStudentId = studentId || profile?.student?.id;

  return useQuery({
    queryKey: ['student-fees', effectiveStudentId, schoolCode, academicYearId],
    queryFn: async (): Promise<StudentFeeDetails> => {
      if (!user || !schoolCode || !effectiveStudentId || !academicYearId) {
        throw new Error('Missing authentication or context');
      }

      // Use data layer to get student fees
      const result = await getStudentFees(effectiveStudentId, academicYearId, schoolCode);
      
      if (result.error) {
        throw new Error(result.error.userMessage);
      }

      return result.data!;
    },
    enabled: !!user && !!schoolCode && !!effectiveStudentId && !!academicYearId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useFeeComponentTypes() {
  const { profile, user } = useAuth();
  const { scope } = useAppScope();
  const schoolCode = scope.school_code || profile?.school_code;

  return useQuery({
    queryKey: ['fee-component-types', schoolCode],
    queryFn: async (): Promise<FeeComponentType[]> => {
      if (!user || !schoolCode) {
        throw new Error('Missing authentication or school context');
      }

      // Use data layer to get fee component types
      const result = await getFeeComponentTypes(schoolCode);
      
      if (result.error) {
        throw new Error(result.error.userMessage);
      }

      return result.data || [];
    },
    enabled: !!user && !!schoolCode,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useClassStudentsFees(classInstanceId?: string) {
  const { profile, user } = useAuth();
  const { scope } = useAppScope();
  const schoolCode = scope.school_code || profile?.school_code;
  const academicYearId = scope.academic_year_id;
  const effectiveClassId = classInstanceId || profile?.class_instance_id;

  return useQuery({
    queryKey: ['class-students-fees', effectiveClassId, schoolCode, academicYearId],
    queryFn: async () => {
      if (!user || !schoolCode || !effectiveClassId || !academicYearId) {
        throw new Error('Missing authentication or context');
      }

      // Use data layer to get class students fees
      const result = await getClassStudentsFees(effectiveClassId, academicYearId, schoolCode);
      
      if (result.error) {
        throw new Error(result.error.userMessage);
      }

      return result.data || [];
    },
    enabled: !!user && !!schoolCode && !!effectiveClassId && !!academicYearId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useClassFeesSummary(classInstanceId?: string) {
  const { profile, user } = useAuth();
  const schoolCode = profile?.school_code;
  const effectiveClassId = classInstanceId || profile?.class_instance_id;

  return useQuery({
    queryKey: ['class-fees-summary', effectiveClassId, schoolCode],
    queryFn: async () => {
      if (!user || !schoolCode || !effectiveClassId) {
        throw new Error('Missing authentication or class context');
      }

      // Get current academic year
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('school_code', schoolCode)
        .eq('is_active', true)
        .single();

      if (!academicYear) {
        throw new Error('No active academic year found');
      }
      
      // Type assertion after null check
      const academicYearId = (academicYear as any)?.id || '';

      // Get all students in this class
      const { data: students } = await supabase
        .from('student')
        .select('id')
        .eq('class_instance_id', effectiveClassId)
        .eq('school_code', schoolCode);

      if (!students || students.length === 0) {
        return {
          totalStudents: 0,
          totalDue: 0,
          totalPaid: 0,
          totalBalance: 0,
        };
      }

      const studentIds = students.map((s: any) => s.id);

      // Get all plans for these students
      const { data: plans } = await supabase
        .from('fee_student_plans')
        .select(`
          *,
          items:fee_student_plan_items(*)
        `)
        .in('student_id', studentIds)
        .eq('academic_year_id', academicYearId)
        .eq('school_code', schoolCode)
        .eq('status', 'active');

      // Get all payments for these students
      const { data: payments } = await supabase
        .from('fee_payments')
        .select('amount_paise')
        .in('student_id', studentIds)
        .eq('school_code', schoolCode);

      const totalDue = (plans || []).reduce((sum: number, plan: any) => {
        const planTotal = plan.items.reduce((itemSum: number, item: any) => {
          return itemSum + (item.amount_paise * item.quantity);
        }, 0);
        return sum + planTotal;
      }, 0);

      const totalPaid = (payments || []).reduce((sum: number, payment: any) => {
        return sum + payment.amount_paise;
      }, 0);

      return {
        totalStudents: students.length,
        totalDue,
        totalPaid,
        totalBalance: totalDue - totalPaid,
      };
    },
    enabled: !!user && !!schoolCode && !!effectiveClassId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payment: FeePaymentInsert) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Use data layer to record payment
      const result = await recordPayment(payment);
      
      if (result.error) {
        throw new Error(result.error.userMessage);
      }

      return result.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ['student-fees', variables.student_id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['class-students-fees'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['class-fees-summary'] 
      });
    },
  });
}

