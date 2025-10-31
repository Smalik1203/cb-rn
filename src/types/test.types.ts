// Test Management Types

export type TestMode = 'online' | 'offline';
export type TestStatus = 'active' | 'inactive' | 'completed' | 'draft';
export type TestType = 'Unit Test' | 'Chapter Test' | 'Assignment' | 'Practical' | 'Project' | 'Quiz';

export type QuestionType = 'mcq' | 'one_word' | 'long_answer';
export type AttemptStatus = 'in_progress' | 'completed' | 'abandoned';

// Database table types

export interface Test {
  id: string;
  title: string;
  description: string | null;
  class_instance_id: string;
  subject_id: string;
  school_code: string;
  test_type: string;
  test_mode: TestMode;
  test_date: string | null;
  time_limit_seconds: number | null;
  status: TestStatus;
  chapter_id: string | null;
  allow_reattempts: boolean;
  created_at: string;
  created_by: string | null;
  max_marks?: number; // For offline tests
}

export interface TestQuestion {
  id: string;
  test_id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null;
  correct_index: number | null;
  correct_text: string | null;
  correct_answer: string | null;
  points: number;
  order_index: number;
  created_at: string;
}

export interface TestAttempt {
  id: string;
  test_id: string;
  student_id: string;
  answers: Record<string, any>;
  score: number | null;
  status: AttemptStatus;
  started_at: string;
  completed_at: string | null;
  earned_points: number | null;
  total_points: number | null;
  time_taken_seconds?: number | null;
}

export interface TestMark {
  id: string;
  test_id: string;
  student_id: string;
  marks_obtained: number;
  max_marks: number;
  remarks: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Extended types with relations

export interface TestWithDetails extends Test {
  class_name?: string;
  grade?: string;
  section?: string;
  subject_name?: string;
  question_count?: number;
  marks_uploaded?: number;
  total_students?: number;
  attempts_count?: number;
}

export interface TestQuestionWithAnswer extends TestQuestion {
  student_answer?: any;
  is_correct?: boolean;
}

// Input types for creating/updating

export interface TestInput {
  title: string;
  description?: string;
  class_instance_id: string;
  subject_id: string;
  school_code: string;
  test_type: string;
  test_mode: TestMode;
  test_date?: string;
  time_limit_seconds?: number;
  status: TestStatus;
  chapter_id?: string;
  allow_reattempts?: boolean;
  max_marks?: number;
  created_by?: string;
}

export interface TestQuestionInput {
  test_id: string;
  question_text: string;
  question_type: QuestionType;
  options?: string[];
  correct_index?: number;
  correct_text?: string;
  correct_answer?: string;
  points: number;
  order_index: number;
}

export interface TestMarkInput {
  test_id: string;
  student_id: string;
  marks_obtained: number;
  max_marks: number;
  remarks?: string;
  created_by?: string;
}

export interface TestAttemptInput {
  test_id: string;
  student_id: string;
  answers: Record<string, any>;
  status: AttemptStatus;
  earned_points?: number;
  total_points?: number;
  time_taken_seconds?: number;
}

// Analytics types

export interface TestAnalytics {
  test_id: string;
  test_title: string;
  total_students: number;
  attempted_count: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  pass_percentage: number;
  question_analytics?: QuestionAnalytics[];
}

export interface QuestionAnalytics {
  question_id: string;
  question_text: string;
  correct_count: number;
  incorrect_count: number;
  skipped_count: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
}

export interface StudentTestPerformance {
  student_id: string;
  student_name: string;
  student_code: string;
  tests_taken: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  subject_performance: SubjectPerformance[];
}

export interface SubjectPerformance {
  subject_id: string;
  subject_name: string;
  tests_count: number;
  average_score: number;
}
