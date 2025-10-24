import { supabase } from '@/src/lib/supabase';
import { Database } from '@/src/types/database.types';

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
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_by: string;
  created_at: string;
}

export interface FeePayment {
  id: string;
  student_id: string;
  amount_paise: number;
  payment_date: string;
  payment_method: string;
  status: string;
  created_at: string;
}

export interface TimetableSlot {
  id: string;
  class_instance_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject_id: string;
  teacher_id?: string;
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
          profile.phone = adminData.phone;
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
      return data || [];
    },

    async getByStudent(studentId: string): Promise<AttendanceRecord[]> {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data || [];
    },

    async markAttendance(records: Omit<AttendanceRecord, 'id' | 'created_at'>[]): Promise<void> {
      const { error } = await supabase
        .from('attendance')
        .insert(records);

      if (error) throw error;
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
  },
};
