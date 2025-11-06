-- ============================================================================
-- Create Task Submissions Storage Bucket and RLS Policies
-- ============================================================================
-- This script creates a storage bucket for student task submissions
-- and sets up proper RLS policies for access control

-- ============================================================================
-- 1. CREATE STORAGE BUCKET
-- ============================================================================

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-submissions',
  'task-submissions',
  false, -- Private bucket
  10485760, -- 10MB file size limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. RLS POLICIES FOR STORAGE BUCKET
-- ============================================================================

-- Policy: Students can upload their own submissions
CREATE POLICY "Students can upload task submissions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-submissions'
  AND (
    -- Check if user is a student
    EXISTS (
      SELECT 1
      FROM student
      WHERE student.auth_user_id = auth.uid()
    )
  )
  -- Path format: task_id/student_id/filename
  -- Verify the second folder (student_id) matches the authenticated student
  AND (
    (storage.foldername(name))[2] IN (
      SELECT id::text
      FROM student
      WHERE auth_user_id = auth.uid()
    )
  )
);

-- Policy: Students can view their own submissions
CREATE POLICY "Students can view own task submissions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-submissions'
  AND (
    -- Check if user is a student viewing their own files
    EXISTS (
      SELECT 1
      FROM student
      WHERE student.auth_user_id = auth.uid()
        AND (storage.foldername(name))[2] = student.id::text
    )
    -- OR if user is admin/teacher viewing any submission
    OR EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'superadmin')
        AND users.school_code = (
          SELECT school_code
          FROM tasks
          WHERE tasks.id::text = (storage.foldername(name))[1]
          LIMIT 1
        )
    )
  )
);

-- Policy: Students can update their own submissions (before grading)
CREATE POLICY "Students can update own task submissions"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'task-submissions'
  AND EXISTS (
    SELECT 1
    FROM student
    WHERE student.auth_user_id = auth.uid()
      AND (storage.foldername(name))[2] = student.id::text
  )
  -- Only allow update if submission hasn't been graded yet
  AND NOT EXISTS (
    SELECT 1
    FROM task_submissions ts
    JOIN student s ON s.id = ts.student_id
    WHERE s.auth_user_id = auth.uid()
      AND ts.status IN ('graded', 'returned')
      AND ts.task_id::text = (storage.foldername(name))[1]
  )
);

-- Policy: Students can delete their own submissions (before grading)
CREATE POLICY "Students can delete own task submissions"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-submissions'
  AND EXISTS (
    SELECT 1
    FROM student
    WHERE student.auth_user_id = auth.uid()
      AND (storage.foldername(name))[2] = student.id::text
  )
  -- Only allow delete if submission hasn't been graded yet
  AND NOT EXISTS (
    SELECT 1
    FROM task_submissions ts
    JOIN student s ON s.id = ts.student_id
    WHERE s.auth_user_id = auth.uid()
      AND ts.status IN ('graded', 'returned')
      AND ts.task_id::text = (storage.foldername(name))[1]
  )
);

-- Policy: Admins and Teachers can view all submissions in their school
CREATE POLICY "Admins can view all task submissions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-submissions'
  AND EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'superadmin')
      -- Verify the task belongs to their school
      AND EXISTS (
        SELECT 1
        FROM tasks
        WHERE tasks.id::text = (storage.foldername(name))[1]
          AND tasks.school_code = users.school_code
      )
  )
);

-- Policy: Admins and Teachers can delete submissions (for moderation)
CREATE POLICY "Admins can delete task submissions"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-submissions'
  AND EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'superadmin')
      -- Verify the task belongs to their school
      AND EXISTS (
        SELECT 1
        FROM tasks
        WHERE tasks.id::text = (storage.foldername(name))[1]
          AND tasks.school_code = users.school_code
      )
  )
);

-- ============================================================================
-- Summary:
-- ============================================================================
-- ✅ Created 'task-submissions' storage bucket
-- ✅ Students can upload/view/update/delete their own submissions
-- ✅ Admins/Teachers can view/delete all submissions in their school
-- ✅ Students cannot modify submissions after they're graded
-- ============================================================================

