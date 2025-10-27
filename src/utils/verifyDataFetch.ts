/**
 * Data Fetch Verification Script
 * Run this to verify all major tables return live data from Supabase
 */

import { supabase } from '../lib/supabase';
import { DB } from '../types/db.constants';

export function verifyTablesExist() {
  // Basic runtime guards for critical tables
  const required = [
    DB.tables.users,
    DB.tables.admin,
    DB.tables.student,
    DB.tables.classes,
    DB.tables.classInstances,
    DB.tables.attendance,
  ];
  if (required.some((t) => !t)) {
    throw new Error('One or more required tables missing from DB constants');
  }
}

export async function verifyDataFetch() {

  // 1. class_instances
  const { data: classInstances, error: classError } = await supabase
    .from(DB.tables.classInstances)
    .select('id, grade, section, school_code, academic_year_id')
    .limit(3);
  

  // 2. student
  const { data: students, error: studentError } = await supabase
    .from(DB.tables.student)
    .select('id, full_name, student_code, school_code, class_instance_id')
    .limit(3);
  

  // 3. attendance
  const { data: attendance, error: attendanceError } = await supabase
    .from(DB.tables.attendance)
    .select('id, date, status, student_id, school_code')
    .limit(3);
  

  // 4. fee_payments
  const { data: feePayments, error: feeError } = await supabase
    .from(DB.tables.feePayments)
    .select('id, amount_paise, payment_date, student_id, school_code')
    .limit(3);
  

  // 5. school_calendar_events
  const { data: calendarEvents, error: calendarError } = await supabase
    .from(DB.tables.schoolCalendarEvents)
    .select('id, title, start_date, event_type, school_code')
    .limit(3);
  

  // Summary
  const allSuccessful = !classError && !studentError && !attendanceError && !feeError && !calendarError;
  const totalRecords = (classInstances?.length || 0) + (students?.length || 0) + 
                       (attendance?.length || 0) + (feePayments?.length || 0) + 
                       (calendarEvents?.length || 0);

  
  return {
    success: allSuccessful,
    results: {
      classInstances: { count: classInstances?.length || 0, hasData: (classInstances?.length || 0) > 0 },
      students: { count: students?.length || 0, hasData: (students?.length || 0) > 0 },
      attendance: { count: attendance?.length || 0, hasData: (attendance?.length || 0) > 0 },
      feePayments: { count: feePayments?.length || 0, hasData: (feePayments?.length || 0) > 0 },
      calendarEvents: { count: calendarEvents?.length || 0, hasData: (calendarEvents?.length || 0) > 0 },
    },
  };
}

// Test with AbortSignal
export async function verifyWithAbortSignal() {
  
  const controller = new AbortController();
  
  try {
    const { data, error } = await supabase
      .from(DB.tables.attendance)
      .select('*')
      .limit(5)
      .abortSignal(controller.signal);
    
  } catch (err) {
  }
}

// Test pagination
export async function verifyPagination() {
  
  const { data: page1, error: error1 } = await supabase
    .from(DB.tables.student)
    .select('id, full_name')
    .range(0, 2)
    .order('full_name', { ascending: true });
  
  const { data: page2, error: error2 } = await supabase
    .from(DB.tables.student)
    .select('id, full_name')
    .range(3, 5)
    .order('full_name', { ascending: true });
  
  
  if (page1 && page2 && page1.length > 0 && page2.length > 0) {
  }
}

