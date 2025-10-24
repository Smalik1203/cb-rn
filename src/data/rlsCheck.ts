import { supabase } from './supabaseClient';
import { mapError } from './errorMapper';

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
      table: 'users',
      query: () => supabase.from('users').select('id', { count: 'exact', head: true }).eq('school_code', schoolCode),
      queryName: 'checkUsersAccess'
    },
    {
      table: 'student',
      query: () => supabase.from('student').select('id', { count: 'exact', head: true }).eq('school_code', schoolCode),
      queryName: 'checkStudentsAccess'
    },
    {
      table: 'class_instances',
      query: () => supabase.from('class_instances').select('id', { count: 'exact', head: true }).eq('school_code', schoolCode),
      queryName: 'checkClassesAccess'
    },
    {
      table: 'attendance',
      query: () => supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('school_code', schoolCode),
      queryName: 'checkAttendanceAccess'
    },
    {
      table: 'fee_student_plans',
      query: () => supabase.from('fee_student_plans').select('id', { count: 'exact', head: true }).eq('school_code', schoolCode),
      queryName: 'checkFeePlansAccess'
    },
    {
      table: 'fee_payments',
      query: () => supabase.from('fee_payments').select('id', { count: 'exact', head: true }).eq('school_code', schoolCode),
      queryName: 'checkFeePaymentsAccess'
    },
    {
      table: 'timetable_slots',
      query: () => supabase.from('timetable_slots').select('id', { count: 'exact', head: true }).eq('school_code', schoolCode),
      queryName: 'checkTimetableAccess'
    },
    {
      table: 'school_calendar_events',
      query: () => supabase.from('school_calendar_events').select('id', { count: 'exact', head: true }).eq('school_code', schoolCode),
      queryName: 'checkCalendarAccess'
    },
    {
      table: 'learning_resources',
      query: () => supabase.from('learning_resources').select('id', { count: 'exact', head: true }).eq('school_code', schoolCode),
      queryName: 'checkResourcesAccess'
    },
    {
      table: 'tests',
      query: () => supabase.from('tests').select('id', { count: 'exact', head: true }).eq('school_code', schoolCode),
      queryName: 'checkTestsAccess'
    },
    {
      table: 'tasks',
      query: () => supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('school_code', schoolCode),
      queryName: 'checkTasksAccess'
    },
    {
      table: 'academic_years',
      query: () => supabase.from('academic_years').select('id', { count: 'exact', head: true }).eq('school_code', schoolCode),
      queryName: 'checkAcademicYearsAccess'
    },
    {
      table: 'subjects',
      query: () => supabase.from('subjects').select('id', { count: 'exact', head: true }).eq('school_code', schoolCode),
      queryName: 'checkSubjectsAccess'
    },
    {
      table: 'fee_component_types',
      query: () => supabase.from('fee_component_types').select('id', { count: 'exact', head: true }).eq('school_code', schoolCode),
      queryName: 'checkFeeComponentsAccess'
    }
  ];

  // Add class-specific checks if classInstanceId provided
  if (classInstanceId) {
    checks.push(
      {
        table: 'student (class-filtered)',
        query: () => supabase.from('student').select('id', { count: 'exact', head: true }).eq('class_instance_id', classInstanceId).eq('school_code', schoolCode),
        queryName: 'checkClassStudentsAccess'
      },
      {
        table: 'attendance (class-filtered)',
        query: () => supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('class_instance_id', classInstanceId).eq('school_code', schoolCode),
        queryName: 'checkClassAttendanceAccess'
      }
    );
  }

  // Add academic year specific checks if academicYearId provided
  if (academicYearId) {
    checks.push(
      {
        table: 'fee_student_plans (year-filtered)',
        query: () => supabase.from('fee_student_plans').select('id', { count: 'exact', head: true }).eq('academic_year_id', academicYearId).eq('school_code', schoolCode),
        queryName: 'checkYearFeePlansAccess'
      },
      {
        table: 'tasks (year-filtered)',
        query: () => supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('academic_year_id', academicYearId).eq('school_code', schoolCode),
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
  table: string,
  schoolCode: string,
  additionalFilters?: Record<string, any>
): Promise<RLSCheckResult> {
  try {
    let query = supabase.from(table).select('id', { count: 'exact', head: true });
    
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
      .single();

    if (userError) {
      result.errors.push(`User lookup failed: ${userError.message}`);
      return result;
    }

    result.userRole = (user as any)?.role || 'student';
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
        .single();

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
