export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string
          name: string
          code: string
          address: string | null
          phone: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          address?: string | null
          phone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      academic_years: {
        Row: {
          id: string
          school_id: string
          year: string
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          year: string
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          year?: string
          start_date?: string
          end_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey"
            columns: ["school_id"]
            referencedRelation: "schools"
            referencedColumns: ["id"]
          }
        ]
      }
      class_instances: {
        Row: {
          id: string
          school_id: string
          academic_year_id: string
          class_name: string
          section: string
          class_teacher_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          academic_year_id: string
          class_name: string
          section: string
          class_teacher_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          academic_year_id?: string
          class_name?: string
          section?: string
          class_teacher_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_instances_school_id_fkey"
            columns: ["school_id"]
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_instances_academic_year_id_fkey"
            columns: ["academic_year_id"]
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'teacher' | 'student' | 'parent'
          school_id: string
          student_id: string | null
          teacher_id: string | null
          parent_id: string | null
          class_instance_id: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role: 'admin' | 'teacher' | 'student' | 'parent'
          school_id: string
          student_id?: string | null
          teacher_id?: string | null
          parent_id?: string | null
          class_instance_id?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'teacher' | 'student' | 'parent'
          school_id?: string
          student_id?: string | null
          teacher_id?: string | null
          parent_id?: string | null
          class_instance_id?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_school_id_fkey"
            columns: ["school_id"]
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_class_instance_id_fkey"
            columns: ["class_instance_id"]
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          }
        ]
      }
      subjects: {
        Row: {
          id: string
          school_id: string
          name: string
          code: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          code: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          name?: string
          code?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            referencedRelation: "schools"
            referencedColumns: ["id"]
          }
        ]
      }
      timetable_slots: {
        Row: {
          id: string
          class_instance_id: string
          subject_id: string
          teacher_id: string
          day_of_week: number
          start_time: string
          end_time: string
          room: string | null
          is_taught: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_instance_id: string
          subject_id: string
          teacher_id: string
          day_of_week: number
          start_time: string
          end_time: string
          room?: string | null
          is_taught?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_instance_id?: string
          subject_id?: string
          teacher_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          room?: string | null
          is_taught?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_slots_class_instance_id_fkey"
            columns: ["class_instance_id"]
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_subject_id_fkey"
            columns: ["subject_id"]
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_teacher_id_fkey"
            columns: ["teacher_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      attendance: {
        Row: {
          id: string
          class_instance_id: string
          student_id: string
          date: string
          status: 'present' | 'absent' | 'late' | 'excused'
          marked_by: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_instance_id: string
          student_id: string
          date: string
          status: 'present' | 'absent' | 'late' | 'excused'
          marked_by: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_instance_id?: string
          student_id?: string
          date?: string
          status?: 'present' | 'absent' | 'late' | 'excused'
          marked_by?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_instance_id_fkey"
            columns: ["class_instance_id"]
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tests: {
        Row: {
          id: string
          class_instance_id: string
          subject_id: string
          title: string
          description: string | null
          test_date: string
          start_time: string
          end_time: string
          total_marks: number
          passing_marks: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_instance_id: string
          subject_id: string
          title: string
          description?: string | null
          test_date: string
          start_time: string
          end_time: string
          total_marks: number
          passing_marks: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_instance_id?: string
          subject_id?: string
          title?: string
          description?: string | null
          test_date?: string
          start_time?: string
          end_time?: string
          total_marks?: number
          passing_marks?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_class_instance_id_fkey"
            columns: ["class_instance_id"]
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_subject_id_fkey"
            columns: ["subject_id"]
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      test_submissions: {
        Row: {
          id: string
          test_id: string
          student_id: string
          marks_obtained: number | null
          submitted_at: string | null
          status: 'not_started' | 'in_progress' | 'submitted' | 'graded'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          test_id: string
          student_id: string
          marks_obtained?: number | null
          submitted_at?: string | null
          status?: 'not_started' | 'in_progress' | 'submitted' | 'graded'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          student_id?: string
          marks_obtained?: number | null
          submitted_at?: string | null
          status?: 'not_started' | 'in_progress' | 'submitted' | 'graded'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_submissions_test_id_fkey"
            columns: ["test_id"]
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_submissions_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      fees: {
        Row: {
          id: string
          student_id: string
          fee_type: string
          amount: number
          due_date: string
          status: 'pending' | 'paid' | 'overdue'
          paid_at: string | null
          payment_method: string | null
          receipt_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          fee_type: string
          amount: number
          due_date: string
          status?: 'pending' | 'paid' | 'overdue'
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          fee_type?: string
          amount?: number
          due_date?: string
          status?: 'pending' | 'paid' | 'overdue'
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      assignments: {
        Row: {
          id: string
          class_instance_id: string
          subject_id: string
          title: string
          description: string | null
          due_date: string
          total_marks: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_instance_id: string
          subject_id: string
          title: string
          description?: string | null
          due_date: string
          total_marks: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_instance_id?: string
          subject_id?: string
          title?: string
          description?: string | null
          due_date?: string
          total_marks?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_instance_id_fkey"
            columns: ["class_instance_id"]
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      assignment_submissions: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          submission_text: string | null
          attachment_url: string | null
          marks_obtained: number | null
          submitted_at: string | null
          status: 'not_started' | 'in_progress' | 'submitted' | 'graded'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          submission_text?: string | null
          attachment_url?: string | null
          marks_obtained?: number | null
          submitted_at?: string | null
          status?: 'not_started' | 'in_progress' | 'submitted' | 'graded'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          submission_text?: string | null
          attachment_url?: string | null
          marks_obtained?: number | null
          submitted_at?: string | null
          status?: 'not_started' | 'in_progress' | 'submitted' | 'graded'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      learning_resources: {
        Row: {
          id: string
          school_id: string
          subject_id: string | null
          title: string
          description: string | null
          resource_type: 'video' | 'document' | 'link' | 'quiz'
          resource_url: string
          thumbnail_url: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          subject_id?: string | null
          title: string
          description?: string | null
          resource_type: 'video' | 'document' | 'link' | 'quiz'
          resource_url: string
          thumbnail_url?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          subject_id?: string | null
          title?: string
          description?: string | null
          resource_type?: 'video' | 'document' | 'link' | 'quiz'
          resource_url?: string
          thumbnail_url?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_resources_school_id_fkey"
            columns: ["school_id"]
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_resources_subject_id_fkey"
            columns: ["subject_id"]
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_resources_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_attendance_stats: {
        Args: {
          class_instance_id: string
          start_date: string
          end_date: string
        }
        Returns: {
          total_students: number
          present_count: number
          absent_count: number
          late_count: number
          excused_count: number
          attendance_percentage: number
        }[]
      }
      get_fee_summary: {
        Args: {
          school_id: string
          month: string
        }
        Returns: {
          total_fees: number
          collected_fees: number
          pending_fees: number
          overdue_fees: number
        }[]
      }
      get_student_performance: {
        Args: {
          student_id: string
          academic_year_id: string
        }
        Returns: {
          subject_name: string
          average_marks: number
          total_tests: number
          attendance_percentage: number
        }[]
      }
    }
    Enums: {
      user_role: 'admin' | 'teacher' | 'student' | 'parent'
      attendance_status: 'present' | 'absent' | 'late' | 'excused'
      fee_status: 'pending' | 'paid' | 'overdue'
      test_status: 'not_started' | 'in_progress' | 'submitted' | 'graded'
      assignment_status: 'not_started' | 'in_progress' | 'submitted' | 'graded'
      resource_type: 'video' | 'document' | 'link' | 'quiz'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

// Helper types for common operations
export type User = Tables<'users'>
export type School = Tables<'schools'>
export type ClassInstance = Tables<'class_instances'>
export type Subject = Tables<'subjects'>
export type TimetableSlot = Tables<'timetable_slots'>
export type Attendance = Tables<'attendance'>
export type Test = Tables<'tests'>
export type TestSubmission = Tables<'test_submissions'>
export type Fee = Tables<'fees'>
export type Assignment = Tables<'assignments'>
export type AssignmentSubmission = Tables<'assignment_submissions'>
export type LearningResource = Tables<'learning_resources'>

// Insert types
export type UserInsert = TablesInsert<'users'>
export type SchoolInsert = TablesInsert<'schools'>
export type ClassInstanceInsert = TablesInsert<'class_instances'>
export type SubjectInsert = TablesInsert<'subjects'>
export type TimetableSlotInsert = TablesInsert<'timetable_slots'>
export type AttendanceInsert = TablesInsert<'attendance'>
export type TestInsert = TablesInsert<'tests'>
export type TestSubmissionInsert = TablesInsert<'test_submissions'>
export type FeeInsert = TablesInsert<'fees'>
export type AssignmentInsert = TablesInsert<'assignments'>
export type AssignmentSubmissionInsert = TablesInsert<'assignment_submissions'>
export type LearningResourceInsert = TablesInsert<'learning_resources'>

// Update types
export type UserUpdate = TablesUpdate<'users'>
export type SchoolUpdate = TablesUpdate<'schools'>
export type ClassInstanceUpdate = TablesUpdate<'class_instances'>
export type SubjectUpdate = TablesUpdate<'subjects'>
export type TimetableSlotUpdate = TablesUpdate<'timetable_slots'>
export type AttendanceUpdate = TablesUpdate<'attendance'>
export type TestUpdate = TablesUpdate<'tests'>
export type TestSubmissionUpdate = TablesUpdate<'test_submissions'>
export type FeeUpdate = TablesUpdate<'fees'>
export type AssignmentUpdate = TablesUpdate<'assignments'>
export type AssignmentSubmissionUpdate = TablesUpdate<'assignment_submissions'>
export type LearningResourceUpdate = TablesUpdate<'learning_resources'>
