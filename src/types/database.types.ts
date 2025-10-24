export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          role: string
          school_code: string | null
          class_instance_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: string
          school_code?: string | null
          class_instance_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: string
          school_code?: string | null
          class_instance_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      student: {
        Row: {
          id: string
          full_name: string
          student_code: string
          class_instance_id: string
          school_code: string
          auth_user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          student_code: string
          class_instance_id: string
          school_code: string
          auth_user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          student_code?: string
          class_instance_id?: string
          school_code?: string
          auth_user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      admin: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string
          role: string
          school_code: string
          school_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email?: string
          phone?: string
          role?: string
          school_code: string
          school_name?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string
          role?: string
          school_code?: string
          school_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      class_instances: {
        Row: {
          id: string
          grade: number
          section: string
          school_code: string
          academic_year_id: string
          class_teacher_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          grade: number
          section: string
          school_code: string
          academic_year_id: string
          class_teacher_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          grade?: number
          section?: string
          school_code?: string
          academic_year_id?: string
          class_teacher_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          student_id: string
          class_instance_id: string
          date: string
          status: 'present' | 'absent'
          marked_by: string
          marked_by_role_code: string
          school_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          class_instance_id: string
          date: string
          status: 'present' | 'absent'
          marked_by: string
          marked_by_role_code: string
          school_code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          class_instance_id?: string
          date?: string
          status?: 'present' | 'absent'
          marked_by?: string
          marked_by_role_code?: string
          school_code?: string
          created_at?: string
          updated_at?: string
        }
      }
      fee_component_types: {
        Row: {
          id: string
          name: string
          description: string | null
          amount_paise: number
          default_amount_paise: number
          code: string
          period: string
          is_active: boolean
          is_recurring: boolean
          is_optional: boolean
          school_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          amount_paise: number
          default_amount_paise?: number
          code?: string
          period?: string
          is_active?: boolean
          is_recurring?: boolean
          is_optional?: boolean
          school_code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          amount_paise?: number
          default_amount_paise?: number
          code?: string
          period?: string
          is_active?: boolean
          is_recurring?: boolean
          is_optional?: boolean
          school_code?: string
          created_at?: string
          updated_at?: string
        }
      }
      fee_student_plans: {
        Row: {
          id: string
          student_id: string
          academic_year_id: string
          school_code: string
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          academic_year_id: string
          school_code: string
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          academic_year_id?: string
          school_code?: string
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      fee_student_plan_items: {
        Row: {
          id: string
          plan_id: string
          component_id: string
          amount_paise: number
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          component_id: string
          amount_paise: number
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          component_id?: string
          amount_paise?: number
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      fee_payments: {
        Row: {
          id: string
          student_id: string
          component_type_id: string
          amount_paise: number
          payment_date: string
          payment_method: string | null
          transaction_id: string | null
          receipt_number: string | null
          remarks: string | null
          school_code: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          component_type_id: string
          amount_paise: number
          payment_date: string
          payment_method?: string | null
          transaction_id?: string | null
          receipt_number?: string | null
          remarks?: string | null
          school_code: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          component_type_id?: string
          amount_paise?: number
          payment_date?: string
          payment_method?: string | null
          transaction_id?: string | null
          receipt_number?: string | null
          remarks?: string | null
          school_code?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      learning_resources: {
        Row: {
          id: string
          title: string
          description: string | null
          resource_type: 'link' | 'video' | 'image' | 'document' | 'pdf'
          file_url: string
          file_size: number
          subject_id: string
          class_instance_id: string
          is_public: boolean
          tags: string[]
          school_code: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          resource_type: 'link' | 'video' | 'image' | 'document' | 'pdf'
          file_url: string
          file_size: number
          subject_id: string
          class_instance_id: string
          is_public?: boolean
          tags?: string[]
          school_code: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          resource_type?: 'link' | 'video' | 'image' | 'document' | 'pdf'
          file_url?: string
          file_size?: number
          subject_id?: string
          class_instance_id?: string
          is_public?: boolean
          tags?: string[]
          school_code?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      tests: {
        Row: {
          id: string
          title: string
          description: string | null
          subject_id: string
          class_instance_id: string
          total_marks: number
          duration_minutes: number
          is_published: boolean
          school_code: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          subject_id: string
          class_instance_id: string
          total_marks: number
          duration_minutes: number
          is_published?: boolean
          school_code: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          subject_id?: string
          class_instance_id?: string
          total_marks?: number
          duration_minutes?: number
          is_published?: boolean
          school_code?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      test_questions: {
        Row: {
          id: string
          test_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
          options: string[] | null
          correct_answer: string
          marks: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          test_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
          options?: string[] | null
          correct_answer: string
          marks: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          question_text?: string
          question_type?: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
          options?: string[] | null
          correct_answer?: string
          marks?: number
          created_at?: string
          updated_at?: string
        }
      }
      timetable_slots: {
        Row: {
          id: string
          class_instance_id: string
          subject_id: string
          day_of_week: number
          start_time: string
          end_time: string
          slot_type: string
          school_code: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_instance_id: string
          subject_id: string
          day_of_week: number
          start_time: string
          end_time: string
          slot_type?: string
          school_code: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_instance_id?: string
          subject_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          slot_type?: string
          school_code?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      school_calendar_events: {
        Row: {
          id: string
          title: string
          description: string | null
          start_date: string
          end_date: string
          start_time: string | null
          end_time: string | null
          event_type: 'academic' | 'holiday' | 'exam' | 'meeting' | 'other'
          is_all_day: boolean
          school_code: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_date: string
          end_date: string
          start_time?: string | null
          end_time?: string | null
          event_type: 'academic' | 'holiday' | 'exam' | 'meeting' | 'other'
          is_all_day?: boolean
          school_code: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string
          start_time?: string | null
          end_time?: string | null
          event_type?: 'academic' | 'holiday' | 'exam' | 'meeting' | 'other'
          is_all_day?: boolean
          school_code?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          task_type: 'assignment' | 'homework' | 'project' | 'exam' | 'other'
          subject_id: string
          class_instance_id: string
          assigned_to: string
          due_date: string
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'pending' | 'in_progress' | 'completed' | 'overdue'
          total_marks: number
          is_published: boolean
          is_active: boolean
          school_code: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          task_type: 'assignment' | 'homework' | 'project' | 'exam' | 'other'
          subject_id: string
          class_instance_id: string
          assigned_to: string
          due_date: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'in_progress' | 'completed' | 'overdue'
          total_marks: number
          is_published?: boolean
          is_active?: boolean
          school_code: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          task_type?: 'assignment' | 'homework' | 'project' | 'exam' | 'other'
          subject_id?: string
          class_instance_id?: string
          assigned_to?: string
          due_date?: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'in_progress' | 'completed' | 'overdue'
          total_marks?: number
          is_published?: boolean
          is_active?: boolean
          school_code?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      academic_years: {
        Row: {
          id: string
          year: number
          start_date: string
          end_date: string
          is_active: boolean
          school_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          year: number
          start_date: string
          end_date: string
          is_active?: boolean
          school_code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          year?: number
          start_date?: string
          end_date?: string
          is_active?: boolean
          school_code?: string
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          subject_name: string
          subject_code: string
          school_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subject_name: string
          subject_code: string
          school_code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subject_name?: string
          subject_code?: string
          school_code?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type aliases for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific type aliases
export type User = Tables<'users'>
export type Student = Tables<'student'>
export type StudentInsert = TablesInsert<'student'>
export type Admin = Tables<'admin'>
export type ClassInstance = Tables<'class_instances'>
export type Attendance = Tables<'attendance'>
export type AttendanceInsert = TablesInsert<'attendance'>
export type FeeComponentType = Tables<'fee_component_types'>
export type FeeStudentPlan = Tables<'fee_student_plans'>
export type FeeStudentPlanItem = Tables<'fee_student_plan_items'>
export type FeePayment = Tables<'fee_payments'>
export type FeePaymentInsert = TablesInsert<'fee_payments'>
export type LearningResource = Tables<'learning_resources'>
export type Test = Tables<'tests'>
export type TestQuestion = Tables<'test_questions'>
export type TimetableSlot = Tables<'timetable_slots'>
export type TimetableSlotInsert = TablesInsert<'timetable_slots'>
export type CalendarEvent = Tables<'school_calendar_events'>
export type CalendarEventInsert = TablesInsert<'school_calendar_events'>
export type Task = Tables<'tasks'>
export type AcademicYear = Tables<'academic_years'>
export type Subject = Tables<'subjects'>
