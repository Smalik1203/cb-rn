import { supabase } from '@/src/lib/supabase';

export interface Student {
  id: string;
  full_name: string;
  class_instance_id: string;
}

export interface ClassInstance {
  id: string;
  grade: number;
  section: string;
}

export interface AttendanceRecord {
  student_id: string;
  status: 'present' | 'absent';
}

export interface AttendanceHistoryRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent';
  student_name: string;
}

export const AttendanceService = {
  async getClassesForAdmin(adminId: string) {
    const { data, error } = await supabase
      .from('class_instances')
      .select('id, grade, section')
      .eq('class_teacher_id', adminId)
      .order('grade', { ascending: true })
      .order('section', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getClassesForSchool(schoolCode: string) {
    const { data, error } = await supabase
      .from('class_instances')
      .select('id, grade, section')
      .eq('school_code', schoolCode)
      .order('grade', { ascending: true })
      .order('section', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getStudentsByClass(classId: string): Promise<Student[]> {
    const { data, error } = await supabase
      .from('student')
      .select('id, full_name, class_instance_id')
      .eq('class_instance_id', classId)
      .order('full_name', { ascending: true });

    if (error) throw error;
    return (data as unknown as Student[]) || [];
  },

  async getStudentProfile(studentCode: string, schoolCode: string) {
    let query = supabase
      .from('student')
      .select('id, full_name, class_instance_id, school_code, email');

    query = query.eq('school_code', schoolCode);
    if (studentCode) {
      query = query.eq('student_code', studentCode);
    }

    const { data, error } = await query.single();
    if (error) throw error;
    return data;
  },

  async getExistingAttendance(classId: string, date: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('class_instance_id', classId)
      .eq('date', date);

    if (error) throw error;
    return data || [];
  },

  async saveAttendance(
    records: Array<{
      student_id: string;
      class_instance_id: string;
      date: string;
      status: 'present' | 'absent';
      marked_by: string;
      marked_by_role_code: string;
      school_code: string;
    }>
  ) {
    const { error } = await supabase.from('attendance').upsert(records as any);

    if (error) throw error;
  },

  async getAttendanceHistory(classId: string, date: string): Promise<AttendanceHistoryRecord[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        student_id,
        date,
        status,
        student!inner(
          full_name
        )
      `)
      .eq('class_instance_id', classId)
      .eq('date', date)
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map((record: any) => ({
      id: record.id,
      student_id: record.student_id,
      date: record.date,
      status: record.status,
      student_name: record.student?.full_name || 'Unknown',
    }));
  },

  async checkHoliday(schoolCode: string, date: string, classId?: string) {
    let query = supabase
      .from('school_calendar_events')
      .select('id, title, description, start_date, end_date')
      .eq('school_code', schoolCode)
      .lte('start_date', date)
      .gte('end_date', date);

    if (classId) {
      query = query.or(`class_instance_id.eq.${classId},class_instance_id.is.null`);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  },
};
