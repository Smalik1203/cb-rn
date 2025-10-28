import { supabase } from '../lib/supabase';
import { mapError } from './errorMapper';
import { DB } from '../types/db.constants';

export interface RLSCheckResult {
  table: string;
  accessible: boolean;
  error?: string;
  count?: number;
  queryName: string;
}

/**
 * RLS Diagnostics - Test access to each table with minimal queries
 * Used for debugging RLS policies and access issues
 */

export async function checkRLSAccess(
  schoolCode: string,
  classInstanceId?: string,
  academicYearId?: string
): Promise<RLSCheckResult[]> {
  const results: RLSCheckResult[] = [];
  
  // Test each table with a minimal count query
  const checks = [
    {
      table: DB.tables.users,
      query: () => supabase.from(DB.tables.users).select('id', { count: 'exact', head: true }).eq(DB.columns.schoolCode, schoolCode),
      queryName: 'checkUsersAccess'
    },
    {
      table: DB.tables.student,
      query: () => supabase.from(DB.tables.student).select('id', { count: 'exact', head: true }).eq(DB.columns.schoolCode, schoolCode),
      queryName: 'checkStudentsAccess'
    },
    {
      table: DB.tables.classInstances,
      query: () => supabase.from(DB.tables.classInstances).select('id', { count: 'exact', head: true }).eq(DB.columns.schoolCode, schoolCode),
      queryName: 'checkClassesAccess'
    },
    {
      table: DB.tables.attendance,
      query: () => supabase.from(DB.tables.attendance).select('id', { count: 'exact', head: true }).eq(DB.columns.schoolCode, schoolCode),
      queryName: 'checkAttendanceAccess'
    },
    {
      table: DB.tables.feeStudentPlans,
      query: () => supabase.from(DB.tables.feeStudentPlans).select('id', { count: 'exact', head: true }).eq(DB.columns.schoolCode, schoolCode),
      queryName: 'checkFeePlansAccess'
    },
    {
      table: DB.tables.feePayments,
      query: () => supabase.from(DB.tables.feePayments).select('id', { count: 'exact', head: true }).eq(DB.columns.schoolCode, schoolCode),
      queryName: 'checkFeePaymentsAccess'
    },
    {
      table: DB.tables.timetableSlots,
      query: () => supabase.from(DB.tables.timetableSlots).select('id', { count: 'exact', head: true }).eq(DB.columns.schoolCode, schoolCode),
      queryName: 'checkTimetableAccess'
    },
    {
      table: DB.tables.schoolCalendarEvents,
      query: () => supabase.from(DB.tables.schoolCalendarEvents).select('id', { count: 'exact', head: true }).eq(DB.columns.schoolCode, schoolCode),
      queryName: 'checkCalendarAccess'
    },
    {
      table: DB.tables.learningResources,
      query: () => supabase.from(DB.tables.learningResources).select('id', { count: 'exact', head: true }).eq(DB.columns.schoolCode, schoolCode),
      queryName: 'checkResourcesAccess'
    },
    {
      table: DB.tables.tests,
      query: () => supabase.from(DB.tables.tests).select('id', { count: 'exact', head: true }).eq(DB.columns.schoolCode, schoolCode),
      queryName: 'checkTestsAccess'
    },
    {
      table: DB.tables.tasks,
      query: () => supabase.from(DB.tables.tasks).select('id', { count: 'exact', head: true }).eq(DB.columns.schoolCode, schoolCode),
      queryName: 'checkTasksAccess'
    },
    {
      table: DB.tables.academicYears,
      query: () => supabase.from(DB.tables.academicYears).select('id', { count: 'exact', head: true }).eq(DB.columns.schoolCode, schoolCode),
      queryName: 'checkAcademicYearsAccess'
    },
    {
      table: DB.tables.subjects,
      query: () => supabase.from(DB.tables.subjects).select('id', { count: 'exact', head: true }).eq(DB.columns.schoolCode, schoolCode),
      queryName: 'checkSubjectsAccess'
    },
    {
      table: DB.tables.feeComponentTypes,
      query: () => supabase.from(DB.tables.feeComponentTypes).select('id', { count: 'exact', head: true }).eq(DB.columns.schoolCode, schoolCode),
      queryName: 'checkFeeComponentsAccess'
    }
  ];

  // Add class-specific checks if classInstanceId provided
  if (classInstanceId) {
    checks.push(
    {
      table: DB.tables.student,
        query: () => supabase.from(DB.tables.student).select('id', { count: 'exact', head: true }).eq(DB.columns.classInstanceId, classInstanceId).eq(DB.columns.schoolCode, schoolCode),
        queryName: 'checkClassStudentsAccess'
      },
      {
      table: DB.tables.attendance,
        query: () => supabase.from(DB.tables.attendance).select('id', { count: 'exact', head: true }).eq(DB.columns.classInstanceId, classInstanceId).eq(DB.columns.schoolCode, schoolCode),
        queryName: 'checkClassAttendanceAccess'
      }
    );
  }

  // Add academic year specific checks if academicYearId provided
  if (academicYearId) {
    checks.push(
      {
        table: DB.tables.feeStudentPlans,
        query: () => supabase.from(DB.tables.feeStudentPlans).select('id', { count: 'exact', head: true }).eq(DB.columns.academicYearId, academicYearId).eq(DB.columns.schoolCode, schoolCode),
        queryName: 'checkYearFeePlansAccess'
      },
      {
        table: DB.tables.tasks,
        query: () => supabase.from(DB.tables.tasks).select('id', { count: 'exact', head: true }).eq(DB.columns.academicYearId, academicYearId).eq(DB.columns.schoolCode, schoolCode),
        queryName: 'checkYearTasksAccess'
      }
    );
  }

  // Run all checks
  for (const check of checks) {
    try {
      const { count, error } = await check.query();
      
      if (error) {
        const mappedError = mapError(error, { 
          queryName: check.queryName, 
          table: check.table 
        });
        
        results.push({
          table: check.table,
          accessible: false,
          error: mappedError.userMessage,
          queryName: check.queryName
        });
      } else {
        results.push({
          table: check.table,
          accessible: true,
          count: count || 0,
          queryName: check.queryName
        });
      }
    } catch (err) {
      const mappedError = mapError(err, { 
        queryName: check.queryName, 
        table: check.table 
      });
      
      results.push({
        table: check.table,
        accessible: false,
        error: mappedError.userMessage,
        queryName: check.queryName
      });
    }
  }

  return results;
}

/**
 * Check specific table access with detailed error info
 */
export async function checkTableAccess(
  table: keyof typeof DB.tables | keyof typeof DB.columns | string,
  schoolCode: string,
  additionalFilters?: Record<string, any>
): Promise<RLSCheckResult> {
  try {
    const tableName = (DB.tables as any)[table as any] || table;
    let query = (supabase as any).from(tableName).select('id', { count: 'exact', head: true });
    
    // Apply school filter
    query = query.eq('school_code', schoolCode);
    
    // Apply additional filters
    if (additionalFilters) {
      Object.entries(additionalFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }
    
    const { count, error } = await query;
    
    if (error) {
      const mappedError = mapError(error, { 
        queryName: `checkTableAccess_${table}`, 
        table 
      });
      
      return {
        table,
        accessible: false,
        error: mappedError.userMessage,
        queryName: `checkTableAccess_${table}`
      };
    }
    
    return {
      table,
      accessible: true,
      count: count || 0,
      queryName: `checkTableAccess_${table}`
    };
  } catch (err) {
    const mappedError = mapError(err, { 
      queryName: `checkTableAccess_${table}`, 
      table 
    });
    
    return {
      table,
      accessible: false,
      error: mappedError.userMessage,
      queryName: `checkTableAccess_${table}`
    };
  }
}

/**
 * Test user permissions for specific operations
 */
export async function checkUserPermissions(
  userId: string,
  schoolCode: string
): Promise<{
  userRole: string | null;
  schoolAccess: boolean;
  classAccess: string[];
  errors: string[];
}> {
  const result = {
    userRole: null as string | null,
    schoolAccess: false,
    classAccess: [] as string[],
    errors: [] as string[]
  };

  try {
    // Check user role and school access
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, school_code')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      result.errors.push(`User lookup failed: ${userError.message}`);
      return result;
    }

    if (!user) {
      result.errors.push('User profile not found');
      return result;
    }

    result.userRole = (user as any)?.role;
    result.schoolAccess = (user as any)?.school_code === schoolCode;

    // Check class access for teachers/admins
    if ((user as any)?.role === 'admin' || (user as any)?.role === 'teacher') {
      const { data: classes, error: classesError } = await supabase
        .from('class_instances')
        .select('id, grade, section')
        .eq('school_code', schoolCode)
        .eq('class_teacher_id', userId);

      if (classesError) {
        result.errors.push(`Class access check failed: ${classesError.message}`);
      } else {
        result.classAccess = (classes || []).map((c: any) => `${c.grade || 0}${c.section || ''}`);
      }
    }

    // Check student access
    if ((user as any)?.role === 'student') {
      const { data: student, error: studentError } = await supabase
        .from('student')
        .select('class_instance_id')
        .eq('auth_user_id', userId)
        .eq('school_code', schoolCode)
        .maybeSingle();

      if (studentError) {
        result.errors.push(`Student access check failed: ${studentError.message}`);
      } else if (student) {
        result.classAccess = [(student as any)?.class_instance_id || ''];
      }
    }

  } catch (err) {
    result.errors.push(`Permission check failed: ${err}`);
  }

  return result;
}

/**
 * Format RLS check results for display
 */
export function formatRLSResults(results: RLSCheckResult[]): string {
  const accessible = results.filter(r => r.accessible);
  const blocked = results.filter(r => !r.accessible);
  
  let output = `RLS Access Summary:\n`;
  output += `✅ Accessible: ${accessible.length}/${results.length} tables\n\n`;
  
  if (accessible.length > 0) {
    output += `✅ Accessible Tables:\n`;
    accessible.forEach(r => {
      output += `  • ${r.table}: ${r.count} records\n`;
    });
    output += `\n`;
  }
  
  if (blocked.length > 0) {
    output += `❌ Blocked Tables:\n`;
    blocked.forEach(r => {
      output += `  • ${r.table}: ${r.error}\n`;
    });
  }
  
  return output;
}

/**
 * Quick RLS health check for development
 */
export async function quickRLSCheck(schoolCode: string): Promise<boolean> {
  try {
    const results = await checkRLSAccess(schoolCode);
    const accessibleCount = results.filter(r => r.accessible).length;
    const totalCount = results.length;
    
    // Consider healthy if >80% of tables are accessible
    return (accessibleCount / totalCount) > 0.8;
  } catch {
    return false;
  }
}
