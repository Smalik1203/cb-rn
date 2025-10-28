import { supabase } from '../lib/supabase';
import { mapError, formatErrorForLog } from './errorMapper';
import { DB } from '../types/db.constants';
import type {
  Student,
  StudentInsert,
  Admin,
  ClassInstance,
  Attendance,
  AttendanceInsert,
  FeeStudentPlan,
  FeePayment,
  FeePaymentInsert,
  FeeComponentType,
  LearningResource,
  Test,
  TestQuestion,
  TimetableSlot,
  TimetableSlotInsert,
  CalendarEvent,
  CalendarEventInsert,
  Task,
  User,
  AcademicYear,
  Subject,
} from '../types/database.types';

export interface QueryResult<T> {
  data: T | null;
  error: ReturnType<typeof mapError> | null;
}

type StudentLite = Pick<Student,
  'id' | 'student_code' | 'full_name' | 'email' | 'phone' | 'class_instance_id' | 'school_code' | 'created_at'
>;

// ==================== AUTH & CONTEXT ====================

export async function getCurrentUserContext(options?: { signal?: AbortSignal }): Promise<QueryResult<{
  auth_id: string;
  role: string;
  school_code: string | null;
  class_instance_id: string | null;
}>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        data: null,
        error: mapError(authError || new Error('No user found'), { queryName: 'getCurrentUserContext' }),
      };
    }
    
    // Query the custom users table to get profile data
    const { data, error } = await supabase
      .from(DB.tables.users)
      .select('id, role, school_code, class_instance_id')
      .eq('id', user.id)
      .abortSignal(options?.signal as any)
      .maybeSingle();
    
    if (error && (error as any).code !== 'PGRST116') {
      return {
        data: null,
        error: mapError(error, { queryName: 'getCurrentUserContext', table: 'users' }),
      };
    }
    
    // If no data found, this is an error - user should exist
    if (!data) {
      return {
        data: null,
        error: mapError(new Error('User profile not found'), { queryName: 'getCurrentUserContext', table: 'users' }),
      };
    }
    
    return {
      data: {
        auth_id: user.id,
        role: data.role,
        school_code: data.school_code,
        class_instance_id: data.class_instance_id,
      },
      error: null,
    };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'getCurrentUserContext' });
    return { data: null, error: mappedError };
  }
}

export async function getUserProfile(userId: string, options?: { signal?: AbortSignal }): Promise<QueryResult<User>> {
  try {
    const { data, error } = await supabase
      .from(DB.tables.users)
      .select('*')
      .eq('id', userId)
      .abortSignal(options?.signal as any)
      .maybeSingle();
    
    if (error && (error as any).code !== 'PGRST116') {
      return {
        data: null,
        error: mapError(error, { queryName: 'getUserProfile', table: 'users' }),
      };
    }
    
    return { data, error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'getUserProfile' });
    return { data: null, error: mappedError };
  }
}

// ==================== ACADEMIC YEARS ====================

export async function getActiveAcademicYear(schoolCode: string, options?: { signal?: AbortSignal }): Promise<QueryResult<AcademicYear>> {
  try {
    const { data, error } = await supabase
      .from(DB.tables.academicYears)
      .select('*')
      .eq(DB.columns.schoolCode, schoolCode)
      .eq('is_active', true)
      .abortSignal(options?.signal as any)
      .maybeSingle();
    
    if (error && (error as any).code !== 'PGRST116') {
      return {
        data: null,
        error: mapError(error, { queryName: 'getActiveAcademicYear', table: 'academic_years' }),
      };
    }
    
    return { data, error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'getActiveAcademicYear' });
    return { data: null, error: mappedError };
  }
}

export async function listAcademicYears(schoolCode: string, options?: { signal?: AbortSignal; from?: number; to?: number }): Promise<QueryResult<AcademicYear[]>> {
  try {
    const { data, error } = await supabase
      .from(DB.tables.academicYears)
      .select('*')
      .eq(DB.columns.schoolCode, schoolCode)
      .order('year_start', { ascending: false })
      .range(options?.from ?? 0, options?.to ?? 99)
      .abortSignal(options?.signal as any);
    
    if (error) {
      return {
        data: null,
        error: mapError(error, { queryName: 'listAcademicYears', table: 'academic_years' }),
      };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'listAcademicYears' });
    return { data: null, error: mappedError };
  }
}

// ==================== CLASSES ====================

export async function listClasses(
  schoolCode: string,
  academicYearId?: string,
  options?: { signal?: AbortSignal; from?: number; to?: number }
): Promise<QueryResult<ClassInstance[]>> {
  try {
    let query = supabase
      .from(DB.tables.classInstances)
      .select('*')
      .eq(DB.columns.schoolCode, schoolCode)
      .order('grade', { ascending: true })
      .order('section', { ascending: true });
    
    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId);
    }
    
    const { data, error } = await query
      .range(options?.from ?? 0, options?.to ?? 199)
      .abortSignal(options?.signal as any);
    
    if (error) {
      return {
        data: null,
        error: mapError(error, { queryName: 'listClasses', table: 'class_instances' }),
      };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'listClasses' });
    return { data: null, error: mappedError };
  }
}

export async function getClassDetails(classInstanceId: string, options?: { signal?: AbortSignal }): Promise<QueryResult<ClassInstance>> {
  try {
    const { data, error } = await supabase
      .from(DB.tables.classInstances)
      .select('*')
      .eq('id', classInstanceId)
      .abortSignal(options?.signal as any)
      .maybeSingle();
    
    if (error && (error as any).code !== 'PGRST116') {
      return {
        data: null,
        error: mapError(error, { queryName: 'getClassDetails', table: 'class_instances' }),
      };
    }
    
    return { data, error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'getClassDetails' });
    return { data: null, error: mappedError };
  }
}

// ==================== STUDENTS ====================

export async function listAdmins(
  schoolCode: string
): Promise<QueryResult<Admin[]>> {
  try {
    const { data, error } = await supabase
      .from(DB.tables.admin)
      .select('*')
      .eq(DB.columns.schoolCode, schoolCode)
      .order('full_name');

    if (error) {
      return { data: null, error: mapError(error, { queryName: 'listAdmins', table: 'admin' }) };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { data: null, error: mapError(error, { queryName: 'listAdmins', table: 'admin' }) };
  }
}

export async function listStudents(
  classInstanceId: string,
  schoolCode: string,
  options?: { signal?: AbortSignal; from?: number; to?: number }
): Promise<QueryResult<StudentLite[]>> {
  try {
    const { data, error } = await supabase
      .from(DB.tables.student)
      .select('id, student_code, full_name, email, phone, class_instance_id, school_code, created_at')
      .eq(DB.columns.classInstanceId, classInstanceId)
      .eq(DB.columns.schoolCode, schoolCode)
      .order('full_name', { ascending: true })
      .range(options?.from ?? 0, options?.to ?? 499)
      .abortSignal(options?.signal as any);
    
    if (error) {
      return {
        data: null,
        error: mapError(error, { queryName: 'listStudents', table: 'student' }),
      };
    }
    
    return { data: (data as unknown as StudentLite[]) || [], error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'listStudents' });
    return { data: null, error: mappedError };
  }
}

export async function getStudentDetails(studentId: string, options?: { signal?: AbortSignal }): Promise<QueryResult<Student>> {
  try {
    const { data, error } = await supabase
      .from(DB.tables.student)
      .select('*')
      .eq('id', studentId)
      .abortSignal(options?.signal as any)
      .maybeSingle();
    
    if (error && (error as any).code !== 'PGRST116') {
      return {
        data: null,
        error: mapError(error, { queryName: 'getStudentDetails', table: 'student' }),
      };
    }
    
    return { data, error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'getStudentDetails' });
    return { data: null, error: mappedError };
  }
}

// ==================== ATTENDANCE ====================

export async function getAttendanceForDate(
  classInstanceId: string,
  date: string,
  schoolCode: string,
  options?: { signal?: AbortSignal; from?: number; to?: number }
): Promise<QueryResult<Attendance[]>> {
  try {
    const { data, error } = await supabase
      .from(DB.tables.attendance)
      .select('*')
      .eq(DB.columns.classInstanceId, classInstanceId)
      .eq('date', date)
      .eq(DB.columns.schoolCode, schoolCode)
      .range(options?.from ?? 0, options?.to ?? 499)
      .abortSignal(options?.signal as any);
    
    if (error) {
      return {
        data: null,
        error: mapError(error, { queryName: 'getAttendanceForDate', table: 'attendance' }),
      };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'getAttendanceForDate' });
    return { data: null, error: mappedError };
  }
}

export async function getAttendanceOverview(
  classInstanceId: string,
  dateRange: [string, string],
  schoolCode: string,
  options?: { signal?: AbortSignal; from?: number; to?: number }
): Promise<QueryResult<Attendance[]>> {
  try {
    const [startDate, endDate] = dateRange;
    const { data, error } = await supabase
      .from(DB.tables.attendance)
      .select('*')
      .eq(DB.columns.classInstanceId, classInstanceId)
      .eq(DB.columns.schoolCode, schoolCode)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
      .range(options?.from ?? 0, options?.to ?? 999)
      .abortSignal(options?.signal as any);
    
    if (error) {
      return {
        data: null,
        error: mapError(error, { queryName: 'getAttendanceOverview', table: 'attendance' }),
      };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'getAttendanceOverview' });
    return { data: null, error: mappedError };
  }
}

export async function saveAttendance(
  records: AttendanceInsert[]
): Promise<QueryResult<Attendance[]>> {
  try {
    if (records.length === 0) {
      return { data: [], error: null };
    }
    
    // Delete existing attendance for this class and date
    const { class_instance_id, date, school_code } = records[0];
    await supabase
      .from(DB.tables.attendance)
      .delete()
      .eq(DB.columns.classInstanceId, class_instance_id!)
      .eq('date', date)
      .eq(DB.columns.schoolCode, school_code!);
    
    // Insert new records
    const { data, error } = await supabase
      .from(DB.tables.attendance)
      .insert(records as any)
      .select();
    
    if (error) {
      return {
        data: null,
        error: mapError(error, { queryName: 'saveAttendance', table: 'attendance', operation: 'insert' }),
      };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'saveAttendance' });
    return { data: null, error: mappedError };
  }
}

export async function checkHoliday(
  schoolCode: string,
  date: string,
  classInstanceId?: string,
  options?: { signal?: AbortSignal }
): Promise<QueryResult<CalendarEvent | null>> {
  try {
    let query = supabase
      .from(DB.tables.schoolCalendarEvents)
      .select('*')
      .eq(DB.columns.schoolCode, schoolCode)
      .eq('start_date', date)
      .eq('is_active', true);
    
    if (classInstanceId) {
      query = query.or(`class_instance_id.is.null,class_instance_id.eq.${classInstanceId}`);
    } else {
      query = query.is('class_instance_id', null);
    }
    
    const { data, error } = await query.abortSignal(options?.signal as any).maybeSingle();
    
    if (error && (error as any).code !== 'PGRST116') {
      return {
        data: null,
        error: mapError(error, { queryName: 'checkHoliday', table: 'school_calendar_events' }),
      };
    }
    
    return { data, error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'checkHoliday' });
    return { data: null, error: mappedError };
  }
}

// ==================== FEES ====================

export async function getStudentFees(
  studentId: string,
  academicYearId: string,
  schoolCode: string
): Promise<QueryResult<{
  plan: FeeStudentPlan | null;
  payments: FeePayment[];
  totalDue: number;
  totalPaid: number;
  balance: number;
}>> {
  try {
    // Get student's fee plan with items
    const { data: planData, error: planError } = await supabase
      .from(DB.tables.feeStudentPlans)
      .select(`
        *,
        items:${DB.tables.feeStudentPlanItems}(
          *,
          component:${DB.tables.feeComponentTypes}(*)
        )
      `)
      .eq('student_id', studentId)
      .eq(DB.columns.academicYearId, academicYearId)
      .eq(DB.columns.schoolCode, schoolCode)
      .eq('status', 'active')
      .maybeSingle();
    
    // Get all payments for this student
    const { data: paymentsData, error: paymentsError } = await supabase
      .from(DB.tables.feePayments)
      .select(`
        *,
        component_type:${DB.tables.feeComponentTypes}(*)
      `)
      .eq('student_id', studentId)
      .eq(DB.columns.schoolCode, schoolCode)
      .order('payment_date', { ascending: false });
    
    if (paymentsError) {
      return {
        data: null,
        error: mapError(paymentsError, { queryName: 'getStudentFees', table: 'fee_payments' }),
      };
    }
    
    // Calculate totals
    let totalDue = 0;
    if (planData && !planError && (planData as any)?.items) {
      totalDue = (planData as any).items.reduce((sum: number, item: any) => {
        return sum + (item.amount_paise * item.quantity);
      }, 0);
    }
    
    const totalPaid = (paymentsData || []).reduce((sum: number, payment: any) => {
      return sum + payment.amount_paise;
    }, 0);
    
    const balance = totalDue - totalPaid;
    
    return {
      data: {
        plan: planData as any,
        payments: paymentsData as any[] || [],
        totalDue,
        totalPaid,
        balance,
      },
      error: null,
    };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'getStudentFees' });
    return { data: null, error: mappedError };
  }
}

export async function getClassStudentsFees(
  classInstanceId: string,
  academicYearId: string,
  schoolCode: string
): Promise<QueryResult<any[]>> {
  try {
    // Get all students in this class
    const { data: students, error: studentsError } = await supabase
      .from(DB.tables.student)
      .select('id, student_code, full_name, class_instance_id')
      .eq(DB.columns.classInstanceId, classInstanceId)
      .eq(DB.columns.schoolCode, schoolCode)
      .order('full_name', { ascending: true });
    
    if (studentsError) {
      return {
        data: null,
        error: mapError(studentsError, { queryName: 'getClassStudentsFees', table: 'student' }),
      };
    }
    
    if (!students || students.length === 0) {
      return { data: [], error: null };
    }
    
    const studentIds = students.map((s: any) => s.id);
    
    // Get all fee plans for these students
    const { data: plans } = await supabase
      .from(DB.tables.feeStudentPlans)
      .select(`
        *,
        items:${DB.tables.feeStudentPlanItems}(*)
      `)
      .in('student_id', studentIds)
      .eq(DB.columns.academicYearId, academicYearId)
      .eq(DB.columns.schoolCode, schoolCode)
      .eq('status', 'active');
    
    // Get all payments for these students
    const { data: payments } = await supabase
      .from(DB.tables.feePayments)
      .select('*')
      .in('student_id', studentIds)
      .eq(DB.columns.schoolCode, schoolCode);
    
    // Combine student data with fee information
    const studentsWithFees = (students as any[]).map((student: any) => {
      const studentPlan = plans?.find((p: any) => p.student_id === student.id);
      const studentPayments = payments?.filter((p: any) => p.student_id === student.id) || [];
      
      let totalDue = 0;
      if (studentPlan && (studentPlan as any)?.items) {
        totalDue = (studentPlan as any).items.reduce((sum: number, item: any) => {
          return sum + (item.amount_paise * item.quantity);
        }, 0);
      }
      
      const totalPaid = studentPayments.reduce((sum: number, payment: any) => {
        return sum + payment.amount_paise;
      }, 0);
      
      const balance = totalDue - totalPaid;
      
      return {
        ...student,
        feeDetails: {
          plan: studentPlan || null,
          payments: studentPayments,
          totalDue,
          totalPaid,
          balance,
        }
      };
    });
    
    return { data: studentsWithFees, error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'getClassStudentsFees' });
    return { data: null, error: mappedError };
  }
}

export async function getFeeComponentTypes(schoolCode: string, options?: { signal?: AbortSignal; from?: number; to?: number }): Promise<QueryResult<FeeComponentType[]>> {
  try {
    const { data, error } = await supabase
      .from(DB.tables.feeComponentTypes)
      .select('*')
      .eq(DB.columns.schoolCode, schoolCode)
      .order('name', { ascending: true })
      .range(options?.from ?? 0, options?.to ?? 99)
      .abortSignal(options?.signal as any);
    
    if (error) {
      return {
        data: null,
        error: mapError(error, { queryName: 'getFeeComponentTypes', table: 'fee_component_types' }),
      };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'getFeeComponentTypes' });
    return { data: null, error: mappedError };
  }
}

export async function recordPayment(payment: FeePaymentInsert): Promise<QueryResult<FeePayment>> {
  try {
    const { data, error } = await supabase
      .from(DB.tables.feePayments)
      .insert(payment as any)
      .select()
      .maybeSingle();
    
    if (error) {
      return {
        data: null,
        error: mapError(error, { queryName: 'recordPayment', table: 'fee_payments', operation: 'insert' }),
      };
    }
    
    return { data, error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'recordPayment' });
    return { data: null, error: mappedError };
  }
}

// ==================== RESOURCES & LEARNING ====================

export async function listResources(
  classInstanceId: string,
  schoolCode: string,
  subjectId?: string,
  options?: { signal?: AbortSignal; from?: number; to?: number }
): Promise<QueryResult<LearningResource[]>> {
  try {
    let query = supabase
      .from(DB.tables.learningResources)
      .select('*')
      .eq(DB.columns.classInstanceId, classInstanceId)
      .eq(DB.columns.schoolCode, schoolCode)
      .order('created_at', { ascending: false })
      .range(options?.from ?? 0, options?.to ?? 99)
      .abortSignal(options?.signal as any);
    
    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return {
        data: null,
        error: mapError(error, { queryName: 'listResources', table: 'learning_resources' }),
      };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'listResources' });
    return { data: null, error: mappedError };
  }
}

export async function listQuizzes(
  classInstanceId: string,
  schoolCode: string,
  subjectId?: string,
  options?: { signal?: AbortSignal; from?: number; to?: number }
): Promise<QueryResult<Test[]>> {
  try {
    let query = supabase
      .from(DB.tables.tests)
      .select('*')
      .eq(DB.columns.classInstanceId, classInstanceId)
      .eq(DB.columns.schoolCode, schoolCode)
      .order('created_at', { ascending: false })
      .range(options?.from ?? 0, options?.to ?? 49)
      .abortSignal(options?.signal as any);
    
    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return {
        data: null,
        error: mapError(error, { queryName: 'listQuizzes', table: 'tests' }),
      };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'listQuizzes' });
    return { data: null, error: mappedError };
  }
}

export async function getQuizDetails(testId: string, options?: { signal?: AbortSignal }): Promise<QueryResult<{
  test: Test;
  questions: TestQuestion[];
}>> {
  try {
    const { data: test, error: testError } = await supabase
      .from(DB.tables.tests)
      .select('*')
      .eq('id', testId)
      .abortSignal(options?.signal as any)
      .maybeSingle();
    
    if (testError && (testError as any).code !== 'PGRST116') {
      return {
        data: null,
        error: mapError(testError, { queryName: 'getQuizDetails', table: 'tests' }),
      };
    }
    
    const { data: questions, error: questionsError } = await supabase
      .from(DB.tables.testQuestions)
      .select('*')
      .eq('test_id', testId)
      .order('order_index', { ascending: true });
    
    if (questionsError) {
      return {
        data: null,
        error: mapError(questionsError, { queryName: 'getQuizDetails', table: 'test_questions' }),
      };
    }
    
    return {
      data: {
        test,
        questions: questions || [],
      },
      error: null,
    };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'getQuizDetails' });
    return { data: null, error: mappedError };
  }
}

// ==================== TIMETABLE ====================

export async function getTimetable(
  classInstanceId: string,
  date: string,
  schoolCode: string,
  options?: { signal?: AbortSignal; from?: number; to?: number }
): Promise<QueryResult<TimetableSlot[]>> {
  try {
    const { data, error } = await supabase
      .from(DB.tables.timetableSlots)
      .select(`
        *,
        subject:${DB.tables.subjects}(id, subject_name),
        teacher:${DB.tables.admin}!teacher_id(id, full_name)
      `)
      .eq(DB.columns.classInstanceId, classInstanceId)
      .eq('class_date', date)
      .eq(DB.columns.schoolCode, schoolCode)
      .order('period_number', { ascending: true })
      .order('start_time', { ascending: true })
      .range(options?.from ?? 0, options?.to ?? 49)
      .abortSignal(options?.signal as any);
    
    if (error) {
      return {
        data: null,
        error: mapError(error, { queryName: 'getTimetable', table: 'timetable_slots' }),
      };
    }
    
    return { data: data as any[] || [], error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'getTimetable' });
    return { data: null, error: mappedError };
  }
}

export async function getTimetableWeek(
  classInstanceId: string,
  startDate: string,
  schoolCode: string,
  options?: { signal?: AbortSignal; from?: number; to?: number }
): Promise<QueryResult<TimetableSlot[]>> {
  try {
    // Calculate end date (7 days from start)
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const endDate = end.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from(DB.tables.timetableSlots)
      .select(`
        *,
        subject:${DB.tables.subjects}(id, subject_name),
        teacher:${DB.tables.admin}!teacher_id(id, full_name)
      `)
      .eq(DB.columns.classInstanceId, classInstanceId)
      .eq(DB.columns.schoolCode, schoolCode)
      .gte('class_date', startDate)
      .lte('class_date', endDate)
      .order('class_date', { ascending: true })
      .order('period_number', { ascending: true })
      .range(options?.from ?? 0, options?.to ?? 299)
      .abortSignal(options?.signal as any);
    
    if (error) {
      return {
        data: null,
        error: mapError(error, { queryName: 'getTimetableWeek', table: 'timetable_slots' }),
      };
    }
    
    return { data: data as any[] || [], error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'getTimetableWeek' });
    return { data: null, error: mappedError };
  }
}

// ==================== CALENDAR ====================

export async function listCalendarEvents(
  schoolCode: string,
  month: string,
  classInstanceId?: string,
  options?: { signal?: AbortSignal; from?: number; to?: number }
): Promise<QueryResult<CalendarEvent[]>> {
  try {
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    const endDate = `${year}-${monthNum}-${lastDay.toString().padStart(2, '0')}`;
    
    let query = supabase
      .from(DB.tables.schoolCalendarEvents)
      .select('*')
      .eq(DB.columns.schoolCode, schoolCode)
      .eq('is_active', true)
      .gte('start_date', startDate)
      .lte('start_date', endDate)
      .range(options?.from ?? 0, options?.to ?? 199)
      .abortSignal(options?.signal as any);
    
    if (classInstanceId) {
      query = query.or(`class_instance_id.is.null,class_instance_id.eq.${classInstanceId}`);
    } else {
      query = query.is('class_instance_id', null);
    }
    
    const { data, error } = await query.order('start_date', { ascending: true });
    
    if (error) {
      return {
        data: null,
        error: mapError(error, { queryName: 'listCalendarEvents', table: 'school_calendar_events' }),
      };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'listCalendarEvents' });
    return { data: null, error: mappedError };
  }
}

// ==================== TASKS ====================

export async function listTasks(
  classInstanceId: string,
  academicYearId: string,
  schoolCode: string
): Promise<QueryResult<Task[]>> {
  try {
    const { data, error } = await supabase
      .from(DB.tables.tasks)
      .select('*')
      .eq(DB.columns.classInstanceId, classInstanceId)
      .eq(DB.columns.academicYearId, academicYearId)
      .eq(DB.columns.schoolCode, schoolCode)
      .eq('is_active', true)
      .order('due_date', { ascending: true })
      .range(0, 199);
    
    if (error) {
      return {
        data: null,
        error: mapError(error, { queryName: 'listTasks', table: 'tasks' }),
      };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'listTasks' });
    return { data: null, error: mappedError };
  }
}

// ==================== SUBJECTS ====================

export async function listSubjects(schoolCode: string, options?: { signal?: AbortSignal; from?: number; to?: number }): Promise<QueryResult<Subject[]>> {
  try {
    const { data, error } = await supabase
      .from(DB.tables.subjects)
      .select('*')
      .eq(DB.columns.schoolCode, schoolCode)
      .order('subject_name', { ascending: true })
      .range(options?.from ?? 0, options?.to ?? 199)
      .abortSignal(options?.signal as any);
    
    if (error) {
      return {
        data: null,
        error: mapError(error, { queryName: 'listSubjects', table: 'subjects' }),
      };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    const mappedError = mapError(err, { queryName: 'listSubjects' });
    return { data: null, error: mappedError };
  }
}

