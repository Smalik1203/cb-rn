import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type Tables = Database['public']['Tables'];

export interface UserProfile {
  id: string;
  role: string;
  school_code: string | null;
  class_instance_id: string | null;
  full_name: string;
  email: string;
  phone?: string;
  student?: Tables['student']['Row'];
  admin?: Tables['admin']['Row'];
  class_instance?: ClassInstance;
}

export interface ClassInstance {
  id: string;
  grade: number;
  section: string;
  school_code: string;
  academic_year_id: string;
  class_teacher_id?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_instance_id: string;
  date: string;
  status: 'present' | 'absent';
  marked_by: string;
  marked_by_role_code: string;
  school_code: string;
  created_at: string;
  updated_at?: string;
}

export interface AttendanceInput {
  student_id: string;
  class_instance_id: string;
  date: string;
  status: 'present' | 'absent';
  marked_by: string;
  marked_by_role_code: string;
  school_code: string;
}

export interface FeePayment {
  id: string;
  student_id: string;
  amount_paise: number;
  payment_date: string;
  payment_method: string | null;
  component_type_id: string;
  plan_id: string | null;
  receipt_number: string | null;
  remarks: string | null;
  school_code: string;
  transaction_id: string | null;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface TimetableSlot {
  id: string;
  school_code: string;
  class_instance_id: string;
  class_date: string; // YYYY-MM-DD
  period_number: number;
  slot_type: 'period' | 'break' | string;
  name: string | null;
  start_time: string; // HH:MM:SS
  end_time: string;   // HH:MM:SS
  subject_id: string | null;
  teacher_id: string | null;
  syllabus_item_id?: string | null;
  plan_text?: string | null;
  status: 'planned' | 'done' | 'cancelled' | string;
  created_by: string;
  created_at: string;
  updated_at: string;
  syllabus_chapter_id?: string | null;
  syllabus_topic_id?: string | null;
  // Enriched properties added by useUnifiedTimetable hook
  subject_name?: string | null;
  teacher_name?: string | null;
  chapter_name?: string | null;
  topic_name?: string | null;
  // Legacy nested objects (for backward compatibility)
  subject?: {
    id: string;
    subject_name: string;
  };
  teacher?: {
    id: string;
    full_name: string;
  };
  // Legacy properties for backward compatibility
  day_of_week?: number;
}

export interface LearningResource {
  id: string;
  title: string;
  description: string | null;
  resource_type: string;
  content_url: string | null;
  file_size: number | null;
  school_code: string;
  class_instance_id: string | null;
  subject_id: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean | null;
  is_recurring: boolean | null;
  recurrence_pattern: string | null;
  recurrence_interval: number | null;
  recurrence_end_date: string | null;
  color: string | null;
  is_active: boolean | null;
  school_code: string;
  class_instance_id: string | null;
  academic_year_id: string | null;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  assigned_date: string;
  due_date: string;
  priority: string | null;
  max_marks: number | null;
  attachments: any | null;
  is_active: boolean | null;
  academic_year_id: string | null;
  class_instance_id: string | null;
  subject_id: string | null;
  school_code: string;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
}

export const api = {
  users: {
    async getCurrentProfile(): Promise<UserProfile | null> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role, school_code, class_instance_id')
        .eq('id', user.id)
        .maybeSingle();

      if (userError || !userData) return null;

      let profile: UserProfile = {
        id: userData.id,
        role: userData.role,
        school_code: userData.school_code,
        class_instance_id: userData.class_instance_id,
        full_name: user.email?.split('@')[0] || 'User',
        email: user.email || '',
      };

      if (userData.role === 'student') {
        const { data: studentData } = await supabase
          .from('student')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (studentData) {
          profile.student = studentData;
          profile.full_name = studentData.full_name;
          profile.class_instance_id = studentData.class_instance_id;
        }
      } else if (userData.role === 'admin' || userData.role === 'superadmin') {
        const { data: adminData } = await supabase
          .from('admin')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (adminData) {
          profile.admin = adminData;
          profile.full_name = adminData.full_name;
          profile.email = adminData.email;
          profile.phone = adminData.phone?.toString();
        }
      }

      if (userData.class_instance_id) {
        const { data: classData } = await supabase
          .from('class_instances')
          .select('id, grade, section, school_code, academic_year_id, class_teacher_id')
          .eq('id', userData.class_instance_id)
          .maybeSingle();

        if (classData) {
          profile.class_instance = classData;
        }
      }

      return profile;
    },
  },

  classes: {
    async getBySchool(schoolCode: string): Promise<ClassInstance[]> {
      const { data, error } = await supabase
        .from('class_instances')
        .select('id, grade, section, school_code, academic_year_id, class_teacher_id')
        .eq('school_code', schoolCode)
        .order('grade', { ascending: true })
        .order('section', { ascending: true });

      if (error) throw error;
      return data || [];
    },

    async getById(classId: string): Promise<ClassInstance | null> {
      const { data, error } = await supabase
        .from('class_instances')
        .select('id, grade, section, school_code, academic_year_id, class_teacher_id')
        .eq('id', classId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  },

  attendance: {
    async getByClass(classId: string, date?: string): Promise<AttendanceRecord[]> {
      let query = supabase
        .from('attendance')
        .select('*')
        .eq('class_instance_id', classId);

      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      return (data || []).map(record => ({
        ...record,
        status: record.status as 'present' | 'absent',
        updated_at: (record as any).updated_at || record.created_at
      }));
    },

    async getBySchool(schoolCode: string, date?: string): Promise<AttendanceRecord[]> {
      const { data: classes } = await supabase
        .from('class_instances')
        .select('id')
        .eq('school_code', schoolCode);

      if (!classes || classes.length === 0) return [];

      const classIds = classes.map(c => c.id);

      let query = supabase
        .from('attendance')
        .select('*')
        .in('class_instance_id', classIds);

      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      return (data || []).map(record => ({
        ...record,
        status: record.status as 'present' | 'absent',
        updated_at: (record as any).updated_at || record.created_at
      }));
    },

    async getByStudent(studentId: string): Promise<AttendanceRecord[]> {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;
      return (data || []).map(record => ({
        ...record,
        status: record.status as 'present' | 'absent',
        updated_at: (record as any).updated_at || record.created_at
      }));
    },

    async markAttendance(records: AttendanceInput[]): Promise<void> {
      // Batch process for better performance
      const existingRecords: { [key: string]: string } = {};
      
      // First, get all existing records in one query
      if (records.length > 0) {
        const studentIds = records.map(r => r.student_id);
        const classId = records[0].class_instance_id;
        const date = records[0].date;
        
        const { data: existing } = await supabase
          .from('attendance')
          .select('id, student_id')
          .eq('class_instance_id', classId)
          .eq('date', date)
          .in('student_id', studentIds);

        if (existing) {
          existing.forEach(record => {
            existingRecords[record.student_id] = record.id;
          });
        }
      }

      // Separate records into updates and inserts
      const updates: any[] = [];
      const inserts: AttendanceInput[] = [];

      records.forEach(record => {
        if (existingRecords[record.student_id]) {
          updates.push({
            id: existingRecords[record.student_id],
            status: record.status,
            marked_by: record.marked_by,
            marked_by_role_code: record.marked_by_role_code,
            updated_at: new Date().toISOString()
          });
        } else {
          inserts.push(record);
        }
      });

      // Batch update existing records
      if (updates.length > 0) {
        const { error: updateError } = await supabase
          .from('attendance')
          .upsert(updates);
        
        if (updateError) throw updateError;
      }

      // Batch insert new records
      if (inserts.length > 0) {
        const { error: insertError } = await supabase
          .from('attendance')
          .insert(inserts);
        
        if (insertError) throw insertError;
      }
    },

    async markBulkAttendance(
      classId: string, 
      date: string, 
      status: 'present' | 'absent',
      markedBy: string,
      markedByRoleCode: string,
      schoolCode: string
    ): Promise<void> {
      // Get all students in the class
      const { data: students, error: studentsError } = await supabase
        .from('student')
        .select('id')
        .eq('class_instance_id', classId);

      if (studentsError) throw studentsError;
      if (!students || students.length === 0) return;

      const records: AttendanceInput[] = students.map(student => ({
        student_id: student.id,
        class_instance_id: classId,
        date,
        status,
        marked_by: markedBy,
        marked_by_role_code: markedByRoleCode,
        school_code: schoolCode
      }));

      await this.markAttendance(records);
    },

    async getAttendanceStats(
      studentId: string, 
      startDate: string, 
      endDate: string
    ): Promise<{
      totalDays: number;
      presentDays: number;
      absentDays: number;
      percentage: number;
    }> {
      const { data, error } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', studentId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      const attendanceData = data || [];
      const totalDays = attendanceData.length;
      const presentDays = attendanceData.filter(a => a.status === 'present').length;
      const absentDays = attendanceData.filter(a => a.status === 'absent').length;
      const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      return {
        totalDays,
        presentDays,
        absentDays,
        percentage: Math.round(percentage * 100) / 100
      };
    },

    async getClassAttendanceSummary(
      classId: string,
      startDate: string,
      endDate: string
    ): Promise<{
      studentId: string;
      studentName: string;
      studentCode: string;
      totalDays: number;
      presentDays: number;
      absentDays: number;
      percentage: number;
    }[]> {
      // Get all students in the class
      const { data: students, error: studentsError } = await supabase
        .from('student')
        .select('id, full_name, student_code')
        .eq('class_instance_id', classId);

      if (studentsError) throw studentsError;
      if (!students || students.length === 0) return [];

      // Get attendance data for all students
      const studentIds = students.map(s => s.id);
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('student_id, status')
        .in('student_id', studentIds)
        .gte('date', startDate)
        .lte('date', endDate);

      if (attendanceError) throw attendanceError;

      // Calculate stats for each student
      return students.map(student => {
        const studentAttendance = attendanceData?.filter(a => a.student_id === student.id) || [];
        const totalDays = studentAttendance.length;
        const presentDays = studentAttendance.filter(a => a.status === 'present').length;
        const absentDays = studentAttendance.filter(a => a.status === 'absent').length;
        const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        return {
          studentId: student.id,
          studentName: student.full_name,
          studentCode: student.student_code,
          totalDays,
          presentDays,
          absentDays,
          percentage: Math.round(percentage * 100) / 100
        };
      });
    },
  },

  fees: {
    async getStudentPayments(studentId: string): Promise<FeePayment[]> {
      const { data, error } = await supabase
        .from('fee_payments')
        .select('*')
        .eq('student_id', studentId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async getClassPayments(classId: string): Promise<FeePayment[]> {
      const { data: students } = await supabase
        .from('student')
        .select('id')
        .eq('class_instance_id', classId);

      if (!students || students.length === 0) return [];

      const studentIds = students.map(s => s.id);

      const { data, error } = await supabase
        .from('fee_payments')
        .select('*')
        .in('student_id', studentIds)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async getSchoolPayments(schoolCode: string): Promise<FeePayment[]> {
      const { data: students } = await supabase
        .from('student')
        .select('id')
        .eq('school_code', schoolCode);

      if (!students || students.length === 0) return [];

      const studentIds = students.map(s => s.id);

      const { data, error } = await supabase
        .from('fee_payments')
        .select('*')
        .in('student_id', studentIds)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  },

  timetable: {
    async getByClass(classId: string): Promise<TimetableSlot[]> {
      const { data, error } = await supabase
        .from('timetable_slots')
        .select('*')
        .eq('class_instance_id', classId)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },

    async getBySchool(schoolCode: string): Promise<TimetableSlot[]> {
      const { data: classes } = await supabase
        .from('class_instances')
        .select('id')
        .eq('school_code', schoolCode);

      if (!classes || classes.length === 0) return [];

      const classIds = classes.map(c => c.id);

      const { data, error } = await supabase
        .from('timetable_slots')
        .select('*')
        .in('class_instance_id', classIds)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  },

  students: {
    async getByClass(classId: string) {
      const { data, error } = await supabase
        .from('student')
        .select('id, full_name, student_code, class_instance_id, school_code')
        .eq('class_instance_id', classId)
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },

    async getBySchool(schoolCode: string) {
      const { data, error } = await supabase
        .from('student')
        .select('id, full_name, student_code, class_instance_id, school_code')
        .eq('school_code', schoolCode)
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  },

  resources: {
    async getByClass(classId?: string, schoolCode?: string): Promise<LearningResource[]> {
      let query = supabase
        .from('learning_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (classId) {
        query = query.eq('class_instance_id', classId);
      } else if (schoolCode) {
        query = query.eq('school_code', schoolCode);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },

    async getAll(schoolCode: string): Promise<LearningResource[]> {
      const { data, error } = await supabase
        .from('learning_resources')
        .select('*')
        .eq('school_code', schoolCode)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async create(resourceData: Omit<LearningResource, 'id' | 'created_at' | 'updated_at'>): Promise<LearningResource> {
      const { data, error } = await supabase
        .from('learning_resources')
        .insert([resourceData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<LearningResource>): Promise<LearningResource> {
      const { data, error } = await supabase
        .from('learning_resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('learning_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
  },

  calendar: {
    async getByClass(classId: string): Promise<CalendarEvent[]> {
      const { data, error } = await supabase
        .from('school_calendar_events')
        .select('*')
        .eq('class_instance_id', classId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },

    async getBySchool(schoolCode: string): Promise<CalendarEvent[]> {
      const { data, error } = await supabase
        .from('school_calendar_events')
        .select('*')
        .eq('school_code', schoolCode)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  },

  tasks: {
    async getByUser(userId: string): Promise<Task[]> {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('created_by', userId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },

    async getBySchool(schoolCode: string): Promise<Task[]> {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('school_code', schoolCode)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  },

  subjects: {
    async getBySchool(schoolCode: string) {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, subject_name, school_code')
        .eq('school_code', schoolCode)
        .order('subject_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  },

  admin: {
    async getBySchool(schoolCode: string) {
      const { data, error } = await supabase
        .from('admin')
        .select('id, full_name, email, phone, role, school_code')
        .eq('school_code', schoolCode)
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  },
};
