// Typed hook for Fees analytics using direct table queries

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type {
  AnalyticsQueryFilters,
  FeeRow,
  RankedRow,
  FeeAggregation,
  AgingBucket,
  FeeStatus,
} from '../../lib/analytics-table-types';
import { analyticsUtils } from '../../lib/analytics-utils';

// ==============================================================================
// FEES ANALYTICS HOOK
// ==============================================================================

interface UseFeesAnalyticsOptions extends AnalyticsQueryFilters {
  limit?: number; // For dashboard preview (top-N)
  classInstanceId?: string; // Optional: filter by specific class
}

export function useFeesAnalytics(options: UseFeesAnalyticsOptions) {
  const { school_code, academic_year_id, start_date, end_date, limit, classInstanceId } = options;

  return useQuery({
    queryKey: ['analytics', 'fees', school_code, academic_year_id, start_date, end_date, classInstanceId, limit],
    queryFn: async () => {
      // TODO: Update to use actual fee_student_plans schema once plan amounts are stored
      // Currently using simplified query with fee_payments only
      //
      // NOTE: The fee_student_plans table in database doesn't have amount/due_date fields.
      // Fee amounts are stored in separate tables or calculated via RPC.
      // For now, we'll use student_fee_summary view via RPC or simplify the query.

      // 1. Fetch students in scope
      let studentsQuery = supabase
        .from('student')
        .select(`
          id,
          full_name,
          class_instance_id,
          school_code,
          class_instances!inner(
            id,
            grade,
            section,
            academic_year_id
          )
        `)
        .eq('school_code', school_code)
        .eq('class_instances.academic_year_id', academic_year_id);

      if (classInstanceId) {
        studentsQuery = studentsQuery.eq('class_instance_id', classInstanceId);
      }

      const { data: studentsData, error: studentsError } = await studentsQuery;

      if (studentsError) throw studentsError;
      if (!studentsData || studentsData.length === 0) {
        return {
          aggregation: {
            totalBilled: 0,
            totalCollected: 0,
            totalOutstanding: 0,
            realizationRate: 0,
            agingBreakdown: { current: 0, '30-60': 0, '60-90': 0, '90+': 0 },
            studentSummaries: [],
          },
          rankedRows: [],
        };
      }

      // 2. Fetch payments
      const studentIds = studentsData.map((s: any) => s.id);

      const { data: paymentsData } = await supabase
        .from('fee_payments')
        .select('student_id, amount, created_at')
        .in('student_id', studentIds)
        .gte('created_at', start_date)
        .lte('created_at', end_date);

      // 3. Build payment map
      const paymentMap = new Map<string, { total: number; lastDate: string | null }>();

      paymentsData?.forEach((payment: any) => {
        const studentId = payment.student_id;

        if (!paymentMap.has(studentId)) {
          paymentMap.set(studentId, { total: 0, lastDate: null });
        }

        const record = paymentMap.get(studentId)!;
        record.total += payment.amount;

        if (!record.lastDate || payment.created_at > record.lastDate) {
          record.lastDate = payment.created_at;
        }
      });

      // 4. Helper function to calculate aging bucket
      const calculateAgingBucket = (dueDate: string | null): AgingBucket => {
        if (!dueDate) return 'current';

        const due = new Date(dueDate);
        const now = new Date();
        const daysOverdue = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

        if (daysOverdue < 0) return 'current';
        if (daysOverdue <= 30) return 'current';
        if (daysOverdue <= 60) return '30-60';
        if (daysOverdue <= 90) return '60-90';
        return '90+';
      };

      // Helper function to determine fee status
      const calculateFeeStatus = (totalBilled: number, totalPaid: number, dueDate: string | null): FeeStatus => {
        if (totalBilled === 0) return 'no_billing';
        if (totalPaid >= totalBilled) return 'paid';

        if (!dueDate) return 'current';

        const due = new Date(dueDate);
        const now = new Date();

        return now > due ? 'overdue' : 'current';
      };

      // 5. Aggregate by student
      const studentMap = new Map<string, FeeRow>();

      studentsData.forEach((student: any) => {
        const studentId = student.id;
        const studentName = student.full_name;
        const className = `${student.class_instances.grade}${student.class_instances.section || ''}`;
        // TODO: Get actual billing amount from fee plans
        // For now, use payment amount as a proxy
        const paymentInfo = paymentMap.get(studentId) || { total: 0, lastDate: null };
        const totalPaid = paymentInfo.total;
        // TODO: Calculate total billed from fee plans
        const totalBilled = totalPaid * 1.2; // Temporary: assume 20% outstanding
        const totalDue = totalBilled - totalPaid;
        const dueDate = null; // TODO: Get from fee plans

        if (!studentMap.has(studentId)) {
          const agingBucket = calculateAgingBucket(dueDate);
          const agingDays = dueDate
            ? Math.max(0, Math.floor((new Date().getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24)))
            : 0;

          const status = calculateFeeStatus(totalBilled, totalPaid, dueDate);

          studentMap.set(studentId, {
            studentId,
            studentName,
            className,
            totalBilled,
            totalPaid,
            totalDue,
            status,
            agingDays,
            agingBucket,
            lastPaymentDate: paymentInfo.lastDate,
          });
        } else {
          // Accumulate if student has multiple plans
          const existing = studentMap.get(studentId)!;
          existing.totalBilled += totalBilled;
          existing.totalPaid += totalPaid;
          existing.totalDue += totalDue;
          existing.status = calculateFeeStatus(existing.totalBilled, existing.totalPaid, dueDate);
        }
      });

      // 6. Fetch previous period data (for trend)
      const { startDate: prevStartDate, endDate: prevEndDate } = analyticsUtils.calculatePreviousPeriod(
        start_date,
        end_date
      );

      const { data: prevPaymentsData } = await supabase
        .from('fee_payments')
        .select('student_id, amount')
        .in('student_id', studentIds)
        .gte('created_at', prevStartDate)
        .lte('created_at', prevEndDate);

      const prevPaymentMap = new Map<string, number>();
      prevPaymentsData?.forEach((payment: any) => {
        const studentId = payment.student_id;
        prevPaymentMap.set(studentId, (prevPaymentMap.get(studentId) || 0) + payment.amount);
      });

      // 7. Rank rows with trends (by total due, descending)
      const currentRows = Array.from(studentMap.values());
      const previousRows = Array.from(prevPaymentMap.entries()).map(([studentId, totalPaid]): FeeRow => {
        // TODO: Get actual billing amount from fee plans
        const totalBilled = totalPaid * 1.2; // Temporary: assume 20% outstanding
        const student = studentsData.find((s: any) => s.id === studentId);
        return {
          studentId,
          studentName: student?.full_name || '',
          className: student ? `${student.class_instances.grade}${student.class_instances.section || ''}` : '',
          totalBilled,
          totalPaid,
          totalDue: totalBilled - totalPaid,
          status: 'current',
          agingDays: 0,
          agingBucket: 'current',
          lastPaymentDate: null,
        };
      });

      const rankedRows = analyticsUtils.rankRowsWithTrend(
        currentRows,
        previousRows,
        (row) => row.studentId,
        (row) => row.totalDue,
        'desc'
      );

      // 8. Apply limit if specified
      const limitedRows = limit ? rankedRows.slice(0, limit) : rankedRows;

      // 9. Calculate aggregation metrics
      const totalBilled = analyticsUtils.calculateSum(currentRows.map((r) => r.totalBilled));
      const totalCollected = analyticsUtils.calculateSum(currentRows.map((r) => r.totalPaid));
      const totalOutstanding = totalBilled - totalCollected;
      const realizationRate = analyticsUtils.calculatePercentage(totalCollected, totalBilled);

      const agingBreakdown = {
        current: currentRows.filter((r) => r.agingBucket === 'current').length,
        '30-60': currentRows.filter((r) => r.agingBucket === '30-60').length,
        '60-90': currentRows.filter((r) => r.agingBucket === '60-90').length,
        '90+': currentRows.filter((r) => r.agingBucket === '90+').length,
      };

      const aggregation: FeeAggregation = {
        totalBilled,
        totalCollected,
        totalOutstanding,
        realizationRate,
        agingBreakdown,
        studentSummaries: currentRows,
      };

      return {
        aggregation,
        rankedRows: limitedRows,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!school_code && !!academic_year_id && !!start_date && !!end_date,
  });
}
