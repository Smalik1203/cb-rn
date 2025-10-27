export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          id: string
          is_active: boolean | null
          school_code: string | null
          school_name: string | null
          year_end: number
          year_start: number
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          school_code?: string | null
          school_name?: string | null
          year_end: number
          year_start: number
        }
        Update: {
          id?: string
          is_active?: boolean | null
          school_code?: string | null
          school_name?: string | null
          year_end?: number
          year_start?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_ay_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_directory"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fk_ay_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_health"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fk_ay_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_code"]
          },
        ]
      }
      admin: {
        Row: {
          admin_code: string
          auth_user_id: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: number
          role: string
          school_code: string
          school_name: string
        }
        Insert: {
          admin_code: string
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone: number
          role: string
          school_code: string
          school_name: string
        }
        Update: {
          admin_code?: string
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: number
          role?: string
          school_code?: string
          school_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_admin_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_directory"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fk_admin_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_health"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fk_admin_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_code"]
          },
        ]
      }
      attendance: {
        Row: {
          class_instance_id: string | null
          created_at: string | null
          date: string
          id: string
          marked_by: string
          marked_by_role_code: string
          school_code: string | null
          status: string
          student_id: string | null
        }
        Insert: {
          class_instance_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          marked_by: string
          marked_by_role_code: string
          school_code?: string | null
          status: string
          student_id?: string | null
        }
        Update: {
          class_instance_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          marked_by?: string
          marked_by_role_code?: string
          school_code?: string | null
          status?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_attendance_class_instance"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_attendance_class_instance"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "fk_attendance_class_instance"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "fk_attendance_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fk_attendance_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_attendance_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      cb_admin: {
        Row: {
          cb_admin_code: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string
          role: string
          school_code: string
        }
        Insert: {
          cb_admin_code: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone: string
          role: string
          school_code: string
        }
        Update: {
          cb_admin_code?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string
          role?: string
          school_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_cb_admin_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_directory"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fk_cb_admin_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_health"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fk_cb_admin_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_code"]
          },
        ]
      }
      chapter_media_bindings: {
        Row: {
          bucket: string
          chapter_id: string
          class_instance_id: string
          created_at: string
          created_by: string
          id: string
          prefix: string
          school_code: string
          subject_id: string
          updated_at: string
          visibility: Database["public"]["Enums"]["media_visibility"]
        }
        Insert: {
          bucket: string
          chapter_id: string
          class_instance_id: string
          created_at?: string
          created_by: string
          id?: string
          prefix: string
          school_code: string
          subject_id: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["media_visibility"]
        }
        Update: {
          bucket?: string
          chapter_id?: string
          class_instance_id?: string
          created_at?: string
          created_by?: string
          id?: string
          prefix?: string
          school_code?: string
          subject_id?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["media_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "chapter_media_bindings_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "syllabus_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_media_bindings_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_media_bindings_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "chapter_media_bindings_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "chapter_media_bindings_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      class_admins: {
        Row: {
          admin_user_id: string
          class_instance_id: string
          created_at: string | null
          school_code: string
        }
        Insert: {
          admin_user_id: string
          class_instance_id: string
          created_at?: string | null
          school_code: string
        }
        Update: {
          admin_user_id?: string
          class_instance_id?: string
          created_at?: string | null
          school_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_admins_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_admins_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "class_admins_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["class_instance_id"]
          },
        ]
      }
      class_instances: {
        Row: {
          academic_year_id: string | null
          class_id: string | null
          class_teacher_id: string | null
          created_at: string | null
          created_by: string
          grade: number | null
          id: string
          school_code: string
          section: string | null
        }
        Insert: {
          academic_year_id?: string | null
          class_id?: string | null
          class_teacher_id?: string | null
          created_at?: string | null
          created_by: string
          grade?: number | null
          id?: string
          school_code: string
          section?: string | null
        }
        Update: {
          academic_year_id?: string | null
          class_id?: string | null
          class_teacher_id?: string | null
          created_at?: string | null
          created_by?: string
          grade?: number | null
          id?: string
          school_code?: string
          section?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_instances_class_teacher_id_fkey"
            columns: ["class_teacher_id"]
            isOneToOne: false
            referencedRelation: "admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_instances_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_directory"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "class_instances_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_health"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "class_instances_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fk_class_instance_ay"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_class_instance_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          created_by: string
          grade: number
          id: string
          school_code: string | null
          school_name: string | null
          section: string
        }
        Insert: {
          created_at?: string
          created_by: string
          grade: number
          id?: string
          school_code?: string | null
          school_name?: string | null
          section: string
        }
        Update: {
          created_at?: string
          created_by?: string
          grade?: number
          id?: string
          school_code?: string | null
          school_name?: string | null
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_class_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_directory"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fk_class_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_health"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fk_class_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_code"]
          },
        ]
      }
      exam_subjects: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          max_marks: number
          passing_marks: number
          subject_id: string
          updated_at: string
          weightage: number
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          max_marks: number
          passing_marks: number
          subject_id: string
          updated_at?: string
          weightage?: number
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          max_marks?: number
          passing_marks?: number
          subject_id?: string
          updated_at?: string
          weightage?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_subjects_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_subjects_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "subject_performance"
            referencedColumns: ["exam_id"]
          },
          {
            foreignKeyName: "exam_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          class_instance_id: string
          created_at: string
          created_by: string | null
          duration_minutes: number | null
          exam_date: string
          exam_name: string
          exam_type: string
          id: string
          instructions: string | null
          is_active: boolean
          passing_marks: number
          school_code: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          class_instance_id: string
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          exam_date: string
          exam_name: string
          exam_type: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          passing_marks?: number
          school_code: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          class_instance_id?: string
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          exam_date?: string
          exam_name?: string
          exam_type?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          passing_marks?: number
          school_code?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "exams_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["class_instance_id"]
          },
        ]
      }
      fee_component_types: {
        Row: {
          code: string
          created_at: string
          created_by: string
          default_amount_paise: number | null
          id: string
          is_optional: boolean
          is_recurring: boolean
          meta: Json
          name: string
          period: string
          school_code: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string
          default_amount_paise?: number | null
          id?: string
          is_optional?: boolean
          is_recurring?: boolean
          meta?: Json
          name: string
          period?: string
          school_code: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          default_amount_paise?: number | null
          id?: string
          is_optional?: boolean
          is_recurring?: boolean
          meta?: Json
          name?: string
          period?: string
          school_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_component_types_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_directory"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fee_component_types_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_health"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fee_component_types_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_code"]
          },
        ]
      }
      fee_payments: {
        Row: {
          amount_paise: number
          component_type_id: string
          created_at: string | null
          created_by: string
          id: string
          payment_date: string
          payment_method: string | null
          plan_id: string | null
          receipt_number: string | null
          remarks: string | null
          school_code: string
          student_id: string
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_paise: number
          component_type_id: string
          created_at?: string | null
          created_by: string
          id?: string
          payment_date?: string
          payment_method?: string | null
          plan_id?: string | null
          receipt_number?: string | null
          remarks?: string | null
          school_code: string
          student_id: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_paise?: number
          component_type_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          payment_date?: string
          payment_method?: string | null
          plan_id?: string | null
          receipt_number?: string | null
          remarks?: string | null
          school_code?: string
          student_id?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_component_type_id_fkey"
            columns: ["component_type_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["component_type_id"]
          },
          {
            foreignKeyName: "fee_payments_component_type_id_fkey"
            columns: ["component_type_id"]
            isOneToOne: false
            referencedRelation: "fee_component_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_component_type_id_fkey"
            columns: ["component_type_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["component_type_id"]
          },
          {
            foreignKeyName: "fee_payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "fee_payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "fee_student_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      fee_student_plan_items: {
        Row: {
          amount_paise: number
          component_type_id: string
          created_at: string
          id: string
          meta: Json
          plan_id: string
          quantity: number
        }
        Insert: {
          amount_paise: number
          component_type_id: string
          created_at?: string
          id?: string
          meta?: Json
          plan_id: string
          quantity?: number
        }
        Update: {
          amount_paise?: number
          component_type_id?: string
          created_at?: string
          id?: string
          meta?: Json
          plan_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "fee_student_plan_items_component_type_id_fkey"
            columns: ["component_type_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["component_type_id"]
          },
          {
            foreignKeyName: "fee_student_plan_items_component_type_id_fkey"
            columns: ["component_type_id"]
            isOneToOne: false
            referencedRelation: "fee_component_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_student_plan_items_component_type_id_fkey"
            columns: ["component_type_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["component_type_id"]
          },
          {
            foreignKeyName: "fee_student_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "fee_student_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "fee_student_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_student_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["plan_id"]
          },
        ]
      }
      fee_student_plans: {
        Row: {
          academic_year_id: string
          class_instance_id: string
          created_at: string
          created_by: string
          id: string
          school_code: string
          status: string
          student_id: string
        }
        Insert: {
          academic_year_id: string
          class_instance_id: string
          created_at?: string
          created_by?: string
          id?: string
          school_code: string
          status?: string
          student_id: string
        }
        Update: {
          academic_year_id?: string
          class_instance_id?: string
          created_at?: string
          created_by?: string
          id?: string
          school_code?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_student_plans_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_student_plans_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_student_plans_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "fee_student_plans_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "fee_student_plans_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_directory"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fee_student_plans_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_health"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fee_student_plans_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fee_student_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fee_student_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_student_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      learning_resources: {
        Row: {
          class_instance_id: string | null
          content_url: string
          created_at: string | null
          description: string | null
          file_size: number | null
          id: string
          resource_type: string
          school_code: string
          subject_id: string | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          class_instance_id?: string | null
          content_url: string
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          id?: string
          resource_type: string
          school_code: string
          subject_id?: string | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          class_instance_id?: string | null
          content_url?: string
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          id?: string
          resource_type?: string
          school_code?: string
          subject_id?: string | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_resources_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_resources_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "learning_resources_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "learning_resources_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_pdfs: {
        Row: {
          class_instance_id: string
          created_at: string
          description: string | null
          filename: string
          id: string
          mime: string | null
          school_code: string
          size_bytes: number | null
          storage_path: string
          subject_id: string
          syllabus_item_id: string
          title: string | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          class_instance_id: string
          created_at?: string
          description?: string | null
          filename: string
          id?: string
          mime?: string | null
          school_code: string
          size_bytes?: number | null
          storage_path: string
          subject_id: string
          syllabus_item_id: string
          title?: string | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          class_instance_id?: string
          created_at?: string
          description?: string | null
          filename?: string
          id?: string
          mime?: string | null
          school_code?: string
          size_bytes?: number | null
          storage_path?: string
          subject_id?: string
          syllabus_item_id?: string
          title?: string | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "lms_pdfs_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_pdfs_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "lms_pdfs_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "lms_pdfs_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_pdfs_syllabus_item_id_fkey"
            columns: ["syllabus_item_id"]
            isOneToOne: false
            referencedRelation: "syllabus_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_videos: {
        Row: {
          class_instance_id: string
          created_at: string
          description: string | null
          filename: string
          id: string
          mime: string | null
          school_code: string
          size_bytes: number | null
          storage_path: string
          subject_id: string
          syllabus_item_id: string
          title: string | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          class_instance_id: string
          created_at?: string
          description?: string | null
          filename: string
          id?: string
          mime?: string | null
          school_code: string
          size_bytes?: number | null
          storage_path: string
          subject_id: string
          syllabus_item_id: string
          title?: string | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          class_instance_id?: string
          created_at?: string
          description?: string | null
          filename?: string
          id?: string
          mime?: string | null
          school_code?: string
          size_bytes?: number | null
          storage_path?: string
          subject_id?: string
          syllabus_item_id?: string
          title?: string | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "lms_videos_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_videos_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "lms_videos_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "lms_videos_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_videos_syllabus_item_id_fkey"
            columns: ["syllabus_item_id"]
            isOneToOne: false
            referencedRelation: "syllabus_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      school_calendar_events: {
        Row: {
          academic_year_id: string | null
          class_instance_id: string | null
          color: string | null
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string | null
          end_time: string | null
          event_type: string
          id: string
          is_active: boolean | null
          is_all_day: boolean | null
          is_recurring: boolean | null
          recurrence_end_date: string | null
          recurrence_interval: number | null
          recurrence_pattern: string | null
          school_code: string
          start_date: string
          start_time: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          academic_year_id?: string | null
          class_instance_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_type: string
          id?: string
          is_active?: boolean | null
          is_all_day?: boolean | null
          is_recurring?: boolean | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          school_code: string
          start_date: string
          start_time?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string | null
          class_instance_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          is_all_day?: boolean | null
          is_recurring?: boolean | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          school_code?: string
          start_date?: string
          start_time?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_calendar_events_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_calendar_events_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_calendar_events_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "school_calendar_events_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "school_calendar_events_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_directory"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "school_calendar_events_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_health"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "school_calendar_events_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_code"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          school_address: string
          school_code: string
          school_email: string
          school_name: string
          school_phone: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          school_address: string
          school_code: string
          school_email: string
          school_name: string
          school_phone: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          school_address?: string
          school_code?: string
          school_email?: string
          school_name?: string
          school_phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      student: {
        Row: {
          auth_user_id: string | null
          class_instance_id: string | null
          created_at: string
          created_by: string
          email: string | null
          full_name: string
          id: string
          parent_phone: number | null
          phone: number
          role: string
          school_code: string
          school_name: string
          student_code: string
        }
        Insert: {
          auth_user_id?: string | null
          class_instance_id?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          full_name: string
          id?: string
          parent_phone?: number | null
          phone: number
          role: string
          school_code: string
          school_name: string
          student_code: string
        }
        Update: {
          auth_user_id?: string | null
          class_instance_id?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          full_name?: string
          id?: string
          parent_phone?: number | null
          phone?: number
          role?: string
          school_code?: string
          school_name?: string
          student_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_student_class_instance"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_student_class_instance"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "fk_student_class_instance"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "fk_student_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_directory"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fk_student_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_health"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fk_student_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_code"]
          },
        ]
      }
      student_results: {
        Row: {
          class_rank: number | null
          created_at: string
          created_by: string | null
          exam_id: string
          id: string
          is_published: boolean
          overall_grade: string
          percentage: number
          published_at: string | null
          remarks: string | null
          section_rank: number | null
          student_id: string
          total_max_marks: number
          total_obtained_marks: number
          updated_at: string
        }
        Insert: {
          class_rank?: number | null
          created_at?: string
          created_by?: string | null
          exam_id: string
          id?: string
          is_published?: boolean
          overall_grade?: string
          percentage?: number
          published_at?: string | null
          remarks?: string | null
          section_rank?: number | null
          student_id: string
          total_max_marks?: number
          total_obtained_marks: number
          updated_at?: string
        }
        Update: {
          class_rank?: number | null
          created_at?: string
          created_by?: string | null
          exam_id?: string
          id?: string
          is_published?: boolean
          overall_grade?: string
          percentage?: number
          published_at?: string | null
          remarks?: string | null
          section_rank?: number | null
          student_id?: string
          total_max_marks?: number
          total_obtained_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "subject_performance"
            referencedColumns: ["exam_id"]
          },
          {
            foreignKeyName: "student_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_user_links: {
        Row: {
          created_at: string
          student_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          student_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          student_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_user_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_user_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "student"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_user_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "student_fee_summary"
            referencedColumns: ["student_id"]
          },
        ]
      }
      subject_results: {
        Row: {
          created_at: string
          exam_subject_id: string
          grade: string
          id: string
          max_marks: number
          obtained_marks: number
          percentage: number
          remarks: string | null
          student_result_id: string
        }
        Insert: {
          created_at?: string
          exam_subject_id: string
          grade?: string
          id?: string
          max_marks: number
          obtained_marks: number
          percentage?: number
          remarks?: string | null
          student_result_id: string
        }
        Update: {
          created_at?: string
          exam_subject_id?: string
          grade?: string
          id?: string
          max_marks?: number
          obtained_marks?: number
          percentage?: number
          remarks?: string | null
          student_result_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_results_exam_subject_id_fkey"
            columns: ["exam_subject_id"]
            isOneToOne: false
            referencedRelation: "exam_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_results_student_result_id_fkey"
            columns: ["student_result_id"]
            isOneToOne: false
            referencedRelation: "student_results"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          school_code: string
          subject_name: string
          subject_name_norm: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          school_code: string
          subject_name: string
          subject_name_norm?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          school_code?: string
          subject_name?: string
          subject_name_norm?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_subjects_school"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_directory"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fk_subjects_school"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_health"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fk_subjects_school"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_code"]
          },
        ]
      }
      super_admin: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string
          role: string
          school_code: string
          school_name: string
          super_admin_code: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone: string
          role: string
          school_code: string
          school_name: string
          super_admin_code?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string
          role?: string
          school_code?: string
          school_name?: string
          super_admin_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_super_admin_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_directory"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fk_super_admin_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_health"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fk_super_admin_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_code"]
          },
        ]
      }
      syllabi: {
        Row: {
          class_instance_id: string
          created_at: string | null
          created_by: string
          id: string
          school_code: string
          subject_id: string
          updated_at: string | null
        }
        Insert: {
          class_instance_id: string
          created_at?: string | null
          created_by: string
          id?: string
          school_code: string
          subject_id: string
          updated_at?: string | null
        }
        Update: {
          class_instance_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          school_code?: string
          subject_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "syllabi_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabi_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "syllabi_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "syllabi_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_chapters: {
        Row: {
          chapter_no: number
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          ref_code: string | null
          syllabus_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          chapter_no: number
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          ref_code?: string | null
          syllabus_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          chapter_no?: number
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          ref_code?: string | null
          syllabus_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_chapters_syllabus_id_fkey"
            columns: ["syllabus_id"]
            isOneToOne: false
            referencedRelation: "syllabi"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_progress: {
        Row: {
          class_instance_id: string
          created_at: string | null
          created_by: string
          date: string
          id: string
          school_code: string
          subject_id: string
          syllabus_chapter_id: string | null
          syllabus_topic_id: string | null
          teacher_id: string
          timetable_slot_id: string
        }
        Insert: {
          class_instance_id: string
          created_at?: string | null
          created_by: string
          date: string
          id?: string
          school_code: string
          subject_id: string
          syllabus_chapter_id?: string | null
          syllabus_topic_id?: string | null
          teacher_id: string
          timetable_slot_id: string
        }
        Update: {
          class_instance_id?: string
          created_at?: string | null
          created_by?: string
          date?: string
          id?: string
          school_code?: string
          subject_id?: string
          syllabus_chapter_id?: string | null
          syllabus_topic_id?: string | null
          teacher_id?: string
          timetable_slot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_progress_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_progress_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "syllabus_progress_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "syllabus_progress_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_progress_syllabus_chapter_id_fkey"
            columns: ["syllabus_chapter_id"]
            isOneToOne: false
            referencedRelation: "syllabus_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_progress_syllabus_topic_id_fkey"
            columns: ["syllabus_topic_id"]
            isOneToOne: false
            referencedRelation: "syllabus_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_progress_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_progress_timetable_slot_id_fkey"
            columns: ["timetable_slot_id"]
            isOneToOne: false
            referencedRelation: "timetable_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_topics: {
        Row: {
          chapter_id: string
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          ref_code: string | null
          title: string
          topic_no: number
          updated_at: string | null
        }
        Insert: {
          chapter_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          ref_code?: string | null
          title: string
          topic_no: number
          updated_at?: string | null
        }
        Update: {
          chapter_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          ref_code?: string | null
          title?: string
          topic_no?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_topics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "syllabus_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      task_submissions: {
        Row: {
          attachments: Json | null
          created_at: string | null
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          marks_obtained: number | null
          max_marks: number | null
          status: string | null
          student_id: string
          submission_text: string | null
          submitted_at: string | null
          task_id: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          marks_obtained?: number | null
          max_marks?: number | null
          status?: string | null
          student_id: string
          submission_text?: string | null
          submitted_at?: string | null
          task_id: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          marks_obtained?: number | null
          max_marks?: number | null
          status?: string | null
          student_id?: string
          submission_text?: string | null
          submitted_at?: string | null
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_task_submissions_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fk_task_submissions_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_task_submissions_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fk_task_submissions_task"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          academic_year_id: string | null
          assigned_date: string
          attachments: Json | null
          class_instance_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string
          id: string
          instructions: string | null
          is_active: boolean | null
          max_marks: number | null
          priority: string | null
          school_code: string
          subject_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          academic_year_id?: string | null
          assigned_date?: string
          attachments?: Json | null
          class_instance_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          max_marks?: number | null
          priority?: string | null
          school_code: string
          subject_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string | null
          assigned_date?: string
          attachments?: Json | null
          class_instance_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          max_marks?: number | null
          priority?: string | null
          school_code?: string
          subject_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tasks_academic_year"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tasks_class_instance"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tasks_class_instance"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "fk_tasks_class_instance"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "fk_tasks_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_directory"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fk_tasks_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_health"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fk_tasks_school_code"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "fk_tasks_subject"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_security_audit: {
        Row: {
          action: string | null
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          school_code: string | null
          target_school_code: string | null
          user_agent: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          school_code?: string | null
          target_school_code?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          school_code?: string | null
          target_school_code?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      test_attempts: {
        Row: {
          answers: Json
          completed_at: string | null
          created_at: string | null
          earned_points: number | null
          evaluated_by: string | null
          id: string
          score: number | null
          started_at: string | null
          status: string
          student_id: string
          test_id: string
          total_points: number | null
        }
        Insert: {
          answers: Json
          completed_at?: string | null
          created_at?: string | null
          earned_points?: number | null
          evaluated_by?: string | null
          id?: string
          score?: number | null
          started_at?: string | null
          status?: string
          student_id: string
          test_id: string
          total_points?: number | null
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          created_at?: string | null
          earned_points?: number | null
          evaluated_by?: string | null
          id?: string
          score?: number | null
          started_at?: string | null
          status?: string
          student_id?: string
          test_id?: string
          total_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "test_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_marks: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          marks_obtained: number
          max_marks: number
          remarks: string | null
          student_id: string
          test_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          marks_obtained: number
          max_marks: number
          remarks?: string | null
          student_id: string
          test_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          marks_obtained?: number
          max_marks?: number
          remarks?: string | null
          student_id?: string
          test_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "test_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "test_marks_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_questions: {
        Row: {
          correct_answer: string | null
          correct_index: number | null
          correct_text: string | null
          created_at: string | null
          id: string
          options: string[] | null
          order_index: number | null
          points: number | null
          question_text: string
          question_type: string
          test_id: string
        }
        Insert: {
          correct_answer?: string | null
          correct_index?: number | null
          correct_text?: string | null
          created_at?: string | null
          id?: string
          options?: string[] | null
          order_index?: number | null
          points?: number | null
          question_text: string
          question_type: string
          test_id: string
        }
        Update: {
          correct_answer?: string | null
          correct_index?: number | null
          correct_text?: string | null
          created_at?: string | null
          id?: string
          options?: string[] | null
          order_index?: number | null
          points?: number | null
          question_text?: string
          question_type?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          allow_reattempts: boolean | null
          chapter_id: string | null
          class_instance_id: string
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          school_code: string
          status: string | null
          subject_id: string
          test_date: string | null
          test_mode: string | null
          test_type: string
          time_limit_seconds: number | null
          title: string
        }
        Insert: {
          allow_reattempts?: boolean | null
          chapter_id?: string | null
          class_instance_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          school_code: string
          status?: string | null
          subject_id: string
          test_date?: string | null
          test_mode?: string | null
          test_type: string
          time_limit_seconds?: number | null
          title: string
        }
        Update: {
          allow_reattempts?: boolean | null
          chapter_id?: string | null
          class_instance_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          school_code?: string
          status?: string | null
          subject_id?: string
          test_date?: string | null
          test_mode?: string | null
          test_type?: string
          time_limit_seconds?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "syllabus_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "tests_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "tests_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_directory"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "tests_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "cb_admin_school_health"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "tests_school_code_fkey"
            columns: ["school_code"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_code"]
          },
          {
            foreignKeyName: "tests_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_slots: {
        Row: {
          class_date: string
          class_instance_id: string
          created_at: string | null
          created_by: string
          end_time: string
          id: string
          name: string | null
          period_number: number
          plan_text: string | null
          school_code: string
          slot_type: string
          start_time: string
          status: string | null
          subject_id: string | null
          syllabus_chapter_id: string | null
          syllabus_item_id: string | null
          syllabus_topic_id: string | null
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          class_date: string
          class_instance_id: string
          created_at?: string | null
          created_by: string
          end_time: string
          id?: string
          name?: string | null
          period_number: number
          plan_text?: string | null
          school_code: string
          slot_type: string
          start_time: string
          status?: string | null
          subject_id?: string | null
          syllabus_chapter_id?: string | null
          syllabus_item_id?: string | null
          syllabus_topic_id?: string | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          class_date?: string
          class_instance_id?: string
          created_at?: string | null
          created_by?: string
          end_time?: string
          id?: string
          name?: string | null
          period_number?: number
          plan_text?: string | null
          school_code?: string
          slot_type?: string
          start_time?: string
          status?: string | null
          subject_id?: string | null
          syllabus_chapter_id?: string | null
          syllabus_item_id?: string | null
          syllabus_topic_id?: string | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_slots_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "timetable_slots_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "timetable_slots_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_syllabus_chapter_id_fkey"
            columns: ["syllabus_chapter_id"]
            isOneToOne: false
            referencedRelation: "syllabus_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_syllabus_topic_id_fkey"
            columns: ["syllabus_topic_id"]
            isOneToOne: false
            referencedRelation: "syllabus_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "admin"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          class_instance_id: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          role: string
          school_code: string | null
          school_name: string | null
        }
        Insert: {
          class_instance_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          phone?: string | null
          role: string
          school_code?: string | null
          school_name?: string | null
        }
        Update: {
          class_instance_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          school_code?: string | null
          school_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "fee_collection_summary"
            referencedColumns: ["class_instance_id"]
          },
          {
            foreignKeyName: "users_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["class_instance_id"]
          },
        ]
      }
    }
    Views: {
      _jwt_ctx: {
        Row: {
          v_school_code: string | null
        }
        Relationships: []
      }
      cb_admin_platform_metrics: {
        Row: {
          active_schools: number | null
          inactive_schools: number | null
          new_schools_30_days: number | null
          new_schools_7_days: number | null
          total_admins_platform: number | null
          total_classes_platform: number | null
          total_schools: number | null
          total_students_platform: number | null
        }
        Relationships: []
      }
      cb_admin_school_directory: {
        Row: {
          created_at: string | null
          is_active: boolean | null
          last_admin_activity: string | null
          last_student_activity: string | null
          owner_email: string | null
          owner_name: string | null
          school_code: string | null
          school_name: string | null
          super_admin_code: string | null
          total_admins: number | null
          total_classes: number | null
          total_students: number | null
        }
        Relationships: []
      }
      cb_admin_school_health: {
        Row: {
          admin_activity_status: string | null
          admin_count: number | null
          class_count: number | null
          is_active: boolean | null
          last_admin_activity: string | null
          last_student_activity: string | null
          school_code: string | null
          school_name: string | null
          student_activity_status: string | null
          student_count: number | null
        }
        Insert: {
          admin_activity_status?: never
          admin_count?: never
          class_count?: never
          is_active?: boolean | null
          last_admin_activity?: never
          last_student_activity?: never
          school_code?: string | null
          school_name?: string | null
          student_activity_status?: never
          student_count?: never
        }
        Update: {
          admin_activity_status?: never
          admin_count?: never
          class_count?: never
          is_active?: boolean | null
          last_admin_activity?: never
          last_student_activity?: never
          school_code?: string | null
          school_name?: string | null
          student_activity_status?: never
          student_count?: never
        }
        Relationships: []
      }
      fee_collection_summary: {
        Row: {
          class_instance_id: string | null
          collected_amount_paise: number | null
          collection_percentage: number | null
          component_name: string | null
          component_type_id: string | null
          grade: number | null
          outstanding_amount_paise: number | null
          plan_amount_paise: number | null
          plan_id: string | null
          section: string | null
          student_code: string | null
          student_id: string | null
          student_name: string | null
        }
        Relationships: []
      }
      fee_debug_view: {
        Row: {
          record_count: number | null
          school_code: string | null
          table_name: string | null
        }
        Relationships: []
      }
      student_fee_summary: {
        Row: {
          class_instance_id: string | null
          collected_amount_paise: number | null
          collection_percentage: number | null
          component_code: string | null
          component_name: string | null
          component_type_id: string | null
          grade: number | null
          outstanding_amount_paise: number | null
          plan_amount_paise: number | null
          plan_id: string | null
          section: string | null
          student_code: string | null
          student_id: string | null
          student_name: string | null
        }
        Relationships: []
      }
      subject_performance: {
        Row: {
          average_marks: number | null
          average_percentage: number | null
          exam_id: string | null
          exam_name: string | null
          max_marks: number | null
          max_percentage: number | null
          min_percentage: number | null
          subject_name: string | null
          total_students: number | null
        }
        Relationships: []
      }
      tenant_security_monitoring: {
        Row: {
          event_count: number | null
          event_type: string | null
          first_occurrence: string | null
          last_occurrence: string | null
          school_code: string | null
          unique_users: number | null
          user_role: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_payment_for_assignment: {
        Args: {
          p_amount_paise: number
          p_assignment_id: string
          p_method: string
          p_paid_at: string
          p_remarks: string
        }
        Returns: string
      }
      add_payment_for_plan: {
        Args: {
          p_amount_paise: number
          p_method: string
          p_paid_at: string
          p_plan_id: string
          p_remarks: string
        }
        Returns: string
      }
      assign_fee_to_class: {
        Args: { p_class_instance_id: string; p_fee_structure_id: string }
        Returns: number
      }
      assign_fee_to_students: {
        Args: { p_fee_structure_id: string; p_student_ids: string[] }
        Returns: number
      }
      attendance_analytics: {
        Args: { p_class_id?: string; p_end: string; p_start: string }
        Returns: Json
      }
      audit_data_access_attempt: {
        Args: {
          operation: string
          school_code_value?: string
          table_name: string
        }
        Returns: undefined
      }
      ay_period: {
        Args: { ay_id: string }
        Returns: {
          period_end: string
          period_start: string
        }[]
      }
      can_access_school_data: {
        Args: { target_school_code: string }
        Returns: boolean
      }
      class_plan_summary: {
        Args: { p_class_instance_id: string }
        Returns: {
          balance_paise: number
          base_paise: number
          full_name: string
          invoice_id: string
          paid_paise: number
          plan_id: string
          student_code: string
          student_id: string
        }[]
      }
      copy_student_plan: {
        Args: {
          p_from_student_id: string
          p_to_class_instance_id: string
          p_to_student_id: string
        }
        Returns: Json
      }
      create_fee_structure_with_components: {
        Args: {
          p_academic_year_id: string
          p_billing_cycle: Database["public"]["Enums"]["fee_billing_cycle"]
          p_class_instance_id: string
          p_components: Json
          p_due_day_of_month: number
          p_name: string
        }
        Returns: string
      }
      create_structure_and_assign: {
        Args: {
          p_class_instance_id: string
          p_components: Json
          p_due_day_of_month: number
          p_name: string
        }
        Returns: Json
      }
      current_admin_id: { Args: never; Returns: string }
      current_app_role: { Args: never; Returns: string }
      current_role: { Args: never; Returns: string }
      current_school_code: { Args: never; Returns: string }
      current_user_school_code: { Args: never; Returns: string }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      debug_current_user_auth: {
        Args: never
        Returns: {
          can_access_sch019: boolean
          current_user_id: string
          user_email: string
          user_exists: boolean
          user_role: string
          user_school_code: string
        }[]
      }
      debug_user_context: {
        Args: never
        Returns: {
          jwt_exists: boolean
          role: string
          school_code: string
          student_code: string
        }[]
      }
      debug_user_jwt: {
        Args: never
        Returns: {
          app_metadata: Json
          extracted_role: string
          extracted_school_code: string
          extracted_student_code: string
          jwt_exists: boolean
          raw_app_meta_data: Json
          raw_user_meta_data: Json
          user_metadata: Json
        }[]
      }
      detect_tenant_security_breaches: {
        Args: never
        Returns: {
          breach_type: string
          count: number
          last_occurrence: string
          school_code: string
          user_id: string
        }[]
      }
      enforce_school_isolation: {
        Args: { school_code_column?: string; table_name: string }
        Returns: string
      }
      ensure_invoice_for_assignment: {
        Args: { p_assignment_id: string }
        Returns: string
      }
      ensure_invoice_for_plan: { Args: { p_plan_id: string }; Returns: string }
      exams_analytics: {
        Args: {
          p_class_id?: string
          p_end: string
          p_pass_threshold?: number
          p_start: string
        }
        Returns: Json
      }
      fee_payments_sum: {
        Args: { p_school_code: string; p_student_id: string }
        Returns: number
      }
      fee_payments_sum_school: {
        Args: { p_school_code: string }
        Returns: number
      }
      fees_analytics: {
        Args: { p_class_id?: string; p_end: string; p_start: string }
        Returns: Json
      }
      fees_school_summary: {
        Args: { p_from?: string; p_school_code: string; p_to?: string }
        Returns: {
          total_paid: number
        }[]
      }
      fees_student_summary: {
        Args: {
          p_from?: string
          p_school_code: string
          p_student_id: string
          p_to?: string
        }
        Returns: {
          total_paid: number
          total_pending: number
          total_planned: number
        }[]
      }
      generate_receipt_number: { Args: never; Returns: string }
      get_calendar_events: {
        Args: {
          p_academic_year_id?: string
          p_end_date: string
          p_school_code: string
          p_start_date: string
        }
        Returns: {
          color: string
          description: string
          end_date: string
          end_time: string
          event_type: string
          id: string
          is_all_day: boolean
          start_date: string
          start_time: string
          title: string
        }[]
      }
      get_class_subject_progress: {
        Args: { p_class_instance_id: string }
        Returns: {
          completed: number
          in_progress: number
          pending: number
          subject_id: string
          subject_name: string
          syllabus_id: string
          total: number
        }[]
      }
      get_day_data_integrated: {
        Args: {
          p_class_instance_id?: string
          p_date: string
          p_school_code: string
        }
        Returns: {
          calendar_events: Json
          tests: Json
          timetable_slots: Json
        }[]
      }
      get_integrated_calendar_events: {
        Args: {
          p_class_instance_id?: string
          p_end_date: string
          p_school_code: string
          p_start_date: string
        }
        Returns: {
          class_instance_id: string
          color: string
          description: string
          end_date: string
          end_time: string
          event_type: string
          id: string
          is_all_day: boolean
          source_type: string
          start_date: string
          start_time: string
          title: string
        }[]
      }
      get_jwt: { Args: never; Returns: Json }
      get_platform_summary: { Args: never; Returns: Json }
      get_school_directory: {
        Args: never
        Returns: {
          admin_count: number
          class_count: number
          is_active: boolean
          last_activity: string
          owner_email: string
          owner_name: string
          school_code: string
          school_name: string
          student_count: number
        }[]
      }
      get_school_health_indicators: {
        Args: never
        Returns: {
          admin_activity_status: string
          admin_count: number
          class_count: number
          is_active: boolean
          last_admin_activity: string
          last_student_activity: string
          school_code: string
          school_name: string
          student_activity_status: string
          student_count: number
        }[]
      }
      get_syllabus_tree: {
        Args: { p_class_instance_id: string; p_subject_id: string }
        Returns: Json
      }
      get_user_class_instance_id: { Args: never; Returns: string }
      get_user_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      get_user_school_code: { Args: never; Returns: string }
      get_user_school_context: { Args: never; Returns: Json }
      get_user_student_code: { Args: never; Returns: string }
      grade_for_percentage: { Args: { p: number }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_admin_in_school: { Args: { p_school: string }; Returns: boolean }
      is_holiday_date: {
        Args: { p_date: string; p_school_code: string }
        Returns: boolean
      }
      is_school_internal_view: { Args: { view_name: string }; Returns: boolean }
      is_school_owner: { Args: never; Returns: boolean }
      is_student_in_class: {
        Args: { p_class: string; p_school: string }
        Returns: boolean
      }
      is_superadmin: { Args: never; Returns: boolean }
      is_test_generated_event: {
        Args: { p_event_id: string }
        Returns: boolean
      }
      jwt_role: { Args: never; Returns: string }
      jwt_school_code: { Args: never; Returns: string }
      learning_analytics: {
        Args: { p_class_id?: string; p_end: string; p_start: string }
        Returns: Json
      }
      log_cross_school_access_attempt: {
        Args: {
          action?: string
          resource_id?: string
          resource_type: string
          target_school_code: string
        }
        Returns: undefined
      }
      log_fee_access: {
        Args: {
          school_code_filter: string
          table_name: string
          user_role: string
          user_school_code: string
        }
        Returns: undefined
      }
      log_tenant_security_event: {
        Args: {
          p_action?: string
          p_details?: Json
          p_event_type: string
          p_ip_address?: unknown
          p_resource_id?: string
          p_resource_type?: string
          p_school_code?: string
          p_target_school_code?: string
          p_user_agent?: string
          p_user_id?: string
          p_user_role?: string
        }
        Returns: undefined
      }
      mark_syllabus_taught: {
        Args: {
          p_class_instance_id: string
          p_date: string
          p_school_code: string
          p_subject_id: string
          p_syllabus_chapter_id?: string
          p_syllabus_topic_id?: string
          p_teacher_id: string
          p_timetable_slot_id: string
        }
        Returns: string
      }
      plan_total_paise: { Args: { p_plan_id: string }; Returns: number }
      refresh_calendar_events: {
        Args: { p_school_code: string }
        Returns: undefined
      }
      refresh_overdue_invoice_statuses: { Args: never; Returns: number }
      refresh_rollups_for_class_subject: {
        Args: { _class: string; _subject: string }
        Returns: undefined
      }
      reorder_chapters: {
        Args: { p_ordered_ids: string[]; p_syllabus_id: string }
        Returns: undefined
      }
      reorder_topics: {
        Args: { p_chapter_id: string; p_ordered_ids: string[] }
        Returns: undefined
      }
      resolve_syllabus_item: {
        Args: { p_item_id: string; p_item_type: string }
        Returns: Json
      }
      set_student_discount: {
        Args: { p_assignment_id: string; p_discount_paise: number }
        Returns: undefined
      }
      structure_total_paise: {
        Args: { p_fee_structure_id: string }
        Returns: number
      }
      student_fee_summary: {
        Args: { p_class_instance_id: string }
        Returns: {
          assignment_id: string
          balance_paise: number
          base_paise: number
          discount_paise: number
          fee_structure_id: string
          full_name: string
          invoice_id: string
          net_paise: number
          paid_paise: number
          student_code: string
          student_id: string
        }[]
      }
      syllabus_progress_for_date: {
        Args: {
          p_class_instance_id: string
          p_date: string
          p_school_code: string
        }
        Returns: {
          created_at: string
          id: string
          subject_id: string
          syllabus_chapter_id: string
          syllabus_topic_id: string
          teacher_id: string
          timetable_slot_id: string
        }[]
      }
      sync_user_metadata_to_auth: { Args: never; Returns: undefined }
      teacher_time_conflicts: {
        Args: {
          p_class_date: string
          p_end: string
          p_ignore_id?: string
          p_start: string
          p_teacher_id: string
        }
        Returns: {
          class_instance_id: string
          end_time: string
          id: string
          start_time: string
        }[]
      }
      unmark_syllabus_taught: {
        Args: { p_school_code: string; p_timetable_slot_id: string }
        Returns: boolean
      }
      upsert_student_plan: {
        Args: {
          p_class_instance_id: string
          p_items: Json
          p_student_id: string
        }
        Returns: Json
      }
      validate_cb_admin_school_access: {
        Args: { target_school_code: string }
        Returns: boolean
      }
      validate_school_code_consistency: {
        Args: { context?: string; target_school_code: string }
        Returns: boolean
      }
      validate_school_data_access: {
        Args: { school_code_value: string; table_name: string }
        Returns: boolean
      }
      validate_super_admin_school_access: {
        Args: { target_school_code: string }
        Returns: boolean
      }
      whoami: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "superadmin" | "admin" | "teacher" | "student" | "parent"
      fee_adjustment_type: "concession" | "fine"
      fee_billing_cycle: "annual" | "term" | "monthly"
      fee_invoice_status: "pending" | "partial" | "paid" | "overdue"
      fee_payment_method: "Cash" | "Online" | "Cheque" | "Card"
      media_kind: "video" | "pdf"
      media_visibility: "active" | "archived"
      progress_status: "planned" | "in_progress" | "done"
      quiz_attempt_status: "in_progress" | "submitted" | "graded"
      quiz_visibility: "draft" | "active" | "archived"
      slot_type: "period" | "break"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["superadmin", "admin", "teacher", "student", "parent"],
      fee_adjustment_type: ["concession", "fine"],
      fee_billing_cycle: ["annual", "term", "monthly"],
      fee_invoice_status: ["pending", "partial", "paid", "overdue"],
      fee_payment_method: ["Cash", "Online", "Cheque", "Card"],
      media_kind: ["video", "pdf"],
      media_visibility: ["active", "archived"],
      progress_status: ["planned", "in_progress", "done"],
      quiz_attempt_status: ["in_progress", "submitted", "graded"],
      quiz_visibility: ["draft", "active", "archived"],
      slot_type: ["period", "break"],
    },
  },
} as const

// Convenience alias exports for common tables
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
