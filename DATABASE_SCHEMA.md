# Database Schema Documentation

## Overview
This document provides comprehensive documentation for the ClassBridge React Native application database schema. The database uses Supabase (PostgreSQL) with Row Level Security (RLS) enabled on all tables.

## Authentication & User Management

### Core User Tables

#### 1. `users` (Main User Table)
- **Purpose**: Central user table linked to Supabase Auth
- **Key Fields**:
  - `id` (uuid, PK) - Links to `auth.users.id`
  - `full_name` (text) - User's full name
  - `email` (text, nullable) - User's email
  - `phone` (text, nullable) - User's phone number
  - `role` (text) - User role (student, admin, superadmin, cb_admin)
  - `school_code` (text, nullable) - Associated school
  - `school_name` (text, nullable) - School name
  - `class_instance_id` (uuid, nullable) - Associated class for students
  - `created_at` (timestamptz) - Creation timestamp

#### 2. `student` (Student-Specific Data)
- **Purpose**: Extended student information
- **Key Fields**:
  - `id` (uuid, PK) - Student ID
  - `student_code` (text, unique) - Student identifier
  - `full_name` (text) - Student name
  - `email` (text, nullable, unique) - Student email
  - `phone` (numeric, unique) - Student phone
  - `parent_phone` (numeric, nullable) - Parent contact
  - `school_code` (text) - School identifier
  - `class_instance_id` (uuid, nullable) - Class assignment
  - `auth_user_id` (uuid, nullable, unique) - Links to `auth.users.id`
  - `role` (text) - Always 'student'

#### 3. `admin` (Admin/Teacher Data)
- **Purpose**: School administrators and teachers
- **Key Fields**:
  - `id` (uuid, PK) - Admin ID
  - `admin_code` (text, unique) - Admin identifier
  - `full_name` (text) - Admin name
  - `email` (text, nullable) - Admin email
  - `phone` (numeric) - Admin phone
  - `school_code` (text) - School identifier
  - `role` (text) - Admin role
  - `auth_user_id` (uuid, nullable, unique) - Links to `auth.users.id`

#### 4. `super_admin` (Super Admin Data)
- **Purpose**: Platform super administrators
- **Key Fields**:
  - `id` (uuid, PK) - Super admin ID
  - `super_admin_code` (text, nullable, unique) - Super admin identifier
  - `full_name` (text) - Super admin name
  - `email` (text, nullable) - Super admin email
  - `phone` (text) - Super admin phone
  - `school_code` (text) - Associated school
  - `role` (text) - Always 'superadmin'
  - `auth_user_id` (uuid, nullable, unique) - Links to `auth.users.id`

#### 5. `cb_admin` (ClassBridge Admin Data)
- **Purpose**: ClassBridge platform administrators
- **Key Fields**:
  - `id` (uuid, PK) - CB admin ID
  - `cb_admin_code` (text, unique) - CB admin identifier
  - `full_name` (text) - CB admin name
  - `email` (text, nullable) - CB admin email
  - `phone` (text) - CB admin phone
  - `school_code` (text) - Associated school
  - `role` (text) - CB admin role

### User Authentication Flow

1. **Supabase Auth**: Users authenticate through Supabase Auth (`auth.users`)
2. **Profile Lookup**: Application queries `users` table using `auth.users.id`
3. **Security Validation**: 
   - If no profile found in `users` table → **ACCESS DENIED** (user signed out)
   - If profile has role 'unknown' → **ACCESS DENIED** (user signed out)
4. **Role Resolution**: Based on `users.role`, additional data is fetched from specific tables:
   - `student` table for students
   - `admin` table for teachers/admins
   - `super_admin` table for super admins
   - `cb_admin` table for CB admins

### Security Measures
- **No Fallback Authentication**: Users without proper profiles are denied access
- **Database Triggers**: Prevent creation of orphaned user records
- **Role Validation**: Ensures users have corresponding role-specific records

## School Management

### 6. `schools` (School Information)
- **Purpose**: School master data
- **Key Fields**:
  - `id` (uuid, PK) - School ID
  - `school_code` (text, unique) - School identifier
  - `school_name` (text, unique) - School name
  - `school_address` (text) - School address
  - `school_email` (text, unique) - School email
  - `school_phone` (varchar, unique) - School phone
  - `is_active` (boolean) - School status
  - `created_at`, `updated_at` (timestamptz) - Timestamps

### 7. `academic_years` (Academic Year Management)
- **Purpose**: Academic year definitions
- **Key Fields**:
  - `id` (uuid, PK) - Academic year ID
  - `school_code` (text, nullable) - Associated school
  - `year_start` (integer) - Start year (e.g., 2024)
  - `year_end` (integer) - End year (e.g., 2025)
  - `is_active` (boolean) - Active status

## Class Management

### 8. `classes` (Class Templates)
- **Purpose**: Class definitions (grade + section combinations)
- **Key Fields**:
  - `id` (uuid, PK) - Class ID
  - `school_code` (text, nullable) - Associated school
  - `grade` (numeric) - Grade level
  - `section` (text) - Section identifier (A, B, C, etc.)
  - `created_by` (text) - Creator identifier

### 9. `class_instances` (Active Class Instances)
- **Purpose**: Specific class instances for academic years
- **Key Fields**:
  - `id` (uuid, PK) - Class instance ID
  - `class_id` (uuid, nullable) - Links to `classes.id`
  - `class_teacher_id` (uuid, nullable) - Links to `admin.id`
  - `school_code` (text) - Associated school
  - `academic_year_id` (uuid, nullable) - Links to `academic_years.id`
  - `grade` (integer, nullable) - Grade level
  - `section` (text, nullable) - Section identifier

### 10. `class_admins` (Class-Admin Relationships)
- **Purpose**: Many-to-many relationship between classes and admins
- **Key Fields**:
  - `class_instance_id` (uuid, PK) - Links to `class_instances.id`
  - `admin_user_id` (uuid, PK) - Links to `admin.id`
  - `school_code` (text) - Associated school

## Subject Management

### 11. `subjects` (Subject Definitions)
- **Purpose**: Subject master data
- **Key Fields**:
  - `id` (uuid, PK) - Subject ID
  - `subject_name` (text) - Subject name
  - `school_code` (text) - Associated school
  - `subject_name_norm` (text, generated) - Normalized subject name
  - `created_by` (text) - Creator identifier

## Attendance Management

### 12. `attendance` (Student Attendance Records)
- **Purpose**: Daily attendance tracking
- **Key Fields**:
  - `id` (uuid, PK) - Attendance record ID
  - `student_id` (uuid, nullable) - Links to `student.id`
  - `class_instance_id` (uuid, nullable) - Links to `class_instances.id`
  - `status` (text) - Attendance status (present, absent, late)
  - `date` (date) - Attendance date
  - `marked_by` (text) - Who marked attendance
  - `marked_by_role_code` (text) - Role of person who marked
  - `school_code` (text, nullable) - Associated school

## Timetable Management

### 13. `timetable_slots` (Daily Timetable)
- **Purpose**: Daily class schedule
- **Key Fields**:
  - `id` (uuid, PK) - Timetable slot ID
  - `school_code` (text) - Associated school
  - `class_instance_id` (uuid) - Links to `class_instances.id`
  - `class_date` (date) - Date of the class
  - `period_number` (integer) - Period number
  - `slot_type` (text) - Type (period, break)
  - `start_time`, `end_time` (time) - Time slots
  - `subject_id` (uuid, nullable) - Links to `subjects.id`
  - `teacher_id` (uuid, nullable) - Links to `admin.id`
  - `syllabus_chapter_id` (uuid, nullable) - Links to `syllabus_chapters.id`
  - `syllabus_topic_id` (uuid, nullable) - Links to `syllabus_topics.id`
  - `plan_text` (text, nullable) - Lesson plan
  - `status` (text) - Slot status (planned, done, cancelled)

## Syllabus Management

### 14. `syllabi` (Syllabus Definitions)
- **Purpose**: Subject-specific syllabus
- **Key Fields**:
  - `id` (uuid, PK) - Syllabus ID
  - `school_code` (text) - Associated school
  - `class_instance_id` (uuid) - Links to `class_instances.id`
  - `subject_id` (uuid) - Links to `subjects.id`
  - `created_by` (uuid) - Creator

### 15. `syllabus_chapters` (Syllabus Chapters)
- **Purpose**: Chapter-level syllabus organization
- **Key Fields**:
  - `id` (uuid, PK) - Chapter ID
  - `syllabus_id` (uuid) - Links to `syllabi.id`
  - `chapter_no` (integer) - Chapter number
  - `title` (text) - Chapter title
  - `description` (text, nullable) - Chapter description
  - `ref_code` (text, nullable) - Reference code

### 16. `syllabus_topics` (Syllabus Topics)
- **Purpose**: Topic-level syllabus organization
- **Key Fields**:
  - `id` (uuid, PK) - Topic ID
  - `chapter_id` (uuid) - Links to `syllabus_chapters.id`
  - `topic_no` (integer) - Topic number
  - `title` (text) - Topic title
  - `description` (text, nullable) - Topic description
  - `ref_code` (text, nullable) - Reference code

### 17. `syllabus_progress` (Syllabus Progress Tracking)
- **Purpose**: Track syllabus completion
- **Key Fields**:
  - `id` (uuid, PK) - Progress record ID
  - `school_code` (text) - Associated school
  - `class_instance_id` (uuid) - Links to `class_instances.id`
  - `date` (date) - Progress date
  - `timetable_slot_id` (uuid) - Links to `timetable_slots.id`
  - `subject_id` (uuid) - Links to `subjects.id`
  - `teacher_id` (uuid) - Links to `admin.id`
  - `syllabus_chapter_id` (uuid, nullable) - Links to `syllabus_chapters.id`
  - `syllabus_topic_id` (uuid, nullable) - Links to `syllabus_topics.id`

## Assessment Management

### 18. `tests` (Test Definitions)
- **Purpose**: Test and quiz management
- **Key Fields**:
  - `id` (uuid, PK) - Test ID
  - `title` (text) - Test title
  - `description` (text, nullable) - Test description
  - `class_instance_id` (uuid) - Links to `class_instances.id`
  - `subject_id` (uuid) - Links to `subjects.id`
  - `school_code` (text) - Associated school
  - `test_type` (text) - Test type
  - `time_limit_seconds` (integer, nullable) - Time limit
  - `test_mode` (text) - Test mode (online, offline)
  - `test_date` (date, nullable) - Test date
  - `status` (text) - Test status (active, inactive)
  - `chapter_id` (uuid, nullable) - Links to `syllabus_chapters.id`
  - `allow_reattempts` (boolean) - Allow multiple attempts

### 19. `test_questions` (Test Questions)
- **Purpose**: Individual test questions
- **Key Fields**:
  - `id` (uuid, PK) - Question ID
  - `test_id` (uuid) - Links to `tests.id`
  - `question_text` (text) - Question content
  - `question_type` (text) - Question type (mcq, one_word, long_answer)
  - `options` (text[]) - Answer options for MCQ
  - `correct_index` (integer, nullable) - Correct option index
  - `correct_text` (text, nullable) - Correct text answer
  - `correct_answer` (text, nullable) - Correct answer
  - `points` (integer) - Question points
  - `order_index` (integer) - Question order

### 20. `test_attempts` (Student Test Attempts)
- **Purpose**: Student test attempts and answers
- **Key Fields**:
  - `id` (uuid, PK) - Attempt ID
  - `test_id` (uuid) - Links to `tests.id`
  - `student_id` (uuid) - Links to `student.id`
  - `answers` (jsonb) - Student answers
  - `score` (integer, nullable) - Test score
  - `status` (text) - Attempt status (in_progress, completed, abandoned)
  - `started_at`, `completed_at` (timestamptz) - Timestamps
  - `earned_points`, `total_points` (integer) - Points earned/total

### 21. `test_marks` (Test Marks)
- **Purpose**: Manual test marking
- **Key Fields**:
  - `id` (uuid, PK) - Mark record ID
  - `test_id` (uuid) - Links to `tests.id`
  - `student_id` (uuid) - Links to `student.id`
  - `marks_obtained` (integer) - Marks obtained
  - `max_marks` (integer) - Maximum marks
  - `remarks` (text, nullable) - Teacher remarks
  - `created_by` (uuid, nullable) - Who marked

## Fee Management

### 22. `fee_component_types` (Fee Component Types)
- **Purpose**: Fee component definitions
- **Key Fields**:
  - `id` (uuid, PK) - Component type ID
  - `school_code` (text) - Associated school
  - `code` (text) - Component code
  - `name` (text) - Component name
  - `is_recurring` (boolean) - Recurring fee
  - `period` (text) - Period (annual, term, monthly)
  - `default_amount_paise` (integer, nullable) - Default amount in paise
  - `is_optional` (boolean) - Optional fee
  - `meta` (jsonb) - Additional metadata

### 23. `fee_student_plans` (Student Fee Plans)
- **Purpose**: Individual student fee plans
- **Key Fields**:
  - `id` (uuid, PK) - Plan ID
  - `school_code` (text) - Associated school
  - `student_id` (uuid) - Links to `student.id`
  - `class_instance_id` (uuid) - Links to `class_instances.id`
  - `academic_year_id` (uuid) - Links to `academic_years.id`
  - `status` (text) - Plan status (active, inactive)

### 24. `fee_student_plan_items` (Fee Plan Items)
- **Purpose**: Individual fee items in student plans
- **Key Fields**:
  - `id` (uuid, PK) - Plan item ID
  - `plan_id` (uuid) - Links to `fee_student_plans.id`
  - `component_type_id` (uuid) - Links to `fee_component_types.id`
  - `amount_paise` (integer) - Amount in paise
  - `quantity` (integer) - Quantity
  - `meta` (jsonb) - Additional metadata

### 25. `fee_payments` (Fee Payments)
- **Purpose**: Fee payment records
- **Key Fields**:
  - `id` (uuid, PK) - Payment ID
  - `student_id` (uuid) - Links to `student.id`
  - `plan_id` (uuid, nullable) - Links to `fee_student_plans.id`
  - `component_type_id` (uuid) - Links to `fee_component_types.id`
  - `amount_paise` (integer) - Payment amount in paise
  - `payment_date` (date) - Payment date
  - `payment_method` (text, nullable) - Payment method
  - `transaction_id` (text, nullable) - Transaction ID
  - `receipt_number` (text, nullable, unique) - Receipt number
  - `remarks` (text, nullable) - Payment remarks

## Task Management

### 26. `tasks` (Tasks/Assignments)
- **Purpose**: Homework and assignment management
- **Key Fields**:
  - `id` (uuid, PK) - Task ID
  - `school_code` (text) - Associated school
  - `academic_year_id` (uuid, nullable) - Links to `academic_years.id`
  - `class_instance_id` (uuid, nullable) - Links to `class_instances.id`
  - `subject_id` (uuid, nullable) - Links to `subjects.id`
  - `title` (text) - Task title
  - `description` (text, nullable) - Task description
  - `priority` (text) - Priority (low, medium, high, urgent)
  - `assigned_date` (date) - Assignment date
  - `due_date` (date) - Due date
  - `max_marks` (integer, nullable) - Maximum marks
  - `instructions` (text, nullable) - Task instructions
  - `attachments` (jsonb) - File attachments
  - `is_active` (boolean) - Task status

### 27. `task_submissions` (Task Submissions)
- **Purpose**: Student task submissions
- **Key Fields**:
  - `id` (uuid, PK) - Submission ID
  - `task_id` (uuid) - Links to `tasks.id`
  - `student_id` (uuid) - Links to `student.id`
  - `submission_text` (text, nullable) - Text submission
  - `attachments` (jsonb) - File attachments
  - `submitted_at` (timestamptz, nullable) - Submission time
  - `marks_obtained` (integer, nullable) - Marks obtained
  - `max_marks` (integer, nullable) - Maximum marks
  - `feedback` (text, nullable) - Teacher feedback
  - `status` (text) - Submission status (submitted, graded, returned, late)
  - `graded_by` (uuid, nullable) - Who graded
  - `graded_at` (timestamptz, nullable) - Grading time

## Learning Management System

### 28. `learning_resources` (Learning Resources)
- **Purpose**: General learning resources
- **Key Fields**:
  - `id` (uuid, PK) - Resource ID
  - `title` (varchar) - Resource title
  - `description` (text, nullable) - Resource description
  - `resource_type` (varchar) - Resource type (video, pdf, quiz)
  - `content_url` (text) - Resource URL
  - `file_size` (bigint, nullable) - File size
  - `school_code` (varchar) - Associated school
  - `class_instance_id` (uuid, nullable) - Links to `class_instances.id`
  - `subject_id` (uuid, nullable) - Links to `subjects.id`
  - `uploaded_by` (uuid, nullable) - Who uploaded

### 29. `lms_videos` (LMS Videos)
- **Purpose**: Video resources for LMS
- **Key Fields**:
  - `id` (uuid, PK) - Video ID
  - `school_code` (text) - Associated school
  - `class_instance_id` (uuid) - Links to `class_instances.id`
  - `subject_id` (uuid) - Links to `subjects.id`
  - `syllabus_item_id` (uuid) - Links to `syllabus_chapters.id`
  - `storage_path` (text) - Storage path
  - `filename` (text) - File name
  - `title` (text, nullable) - Video title
  - `description` (text, nullable) - Video description
  - `uploaded_by` (uuid) - Who uploaded

### 30. `lms_pdfs` (LMS PDFs)
- **Purpose**: PDF resources for LMS
- **Key Fields**:
  - `id` (uuid, PK) - PDF ID
  - `school_code` (text) - Associated school
  - `class_instance_id` (uuid) - Links to `class_instances.id`
  - `subject_id` (uuid) - Links to `subjects.id`
  - `syllabus_item_id` (uuid) - Links to `syllabus_chapters.id`
  - `storage_path` (text) - Storage path
  - `filename` (text) - File name
  - `title` (text, nullable) - PDF title
  - `description` (text, nullable) - PDF description
  - `uploaded_by` (uuid) - Who uploaded

### 31. `chapter_media_bindings` (Chapter Media Bindings)
- **Purpose**: Media bindings for syllabus chapters
- **Key Fields**:
  - `id` (uuid, PK) - Binding ID
  - `school_code` (text) - Associated school
  - `class_instance_id` (uuid) - Links to `class_instances.id`
  - `subject_id` (uuid) - Links to `subjects.id`
  - `chapter_id` (uuid) - Links to `syllabus_chapters.id`
  - `bucket` (text) - Storage bucket
  - `prefix` (text) - Storage prefix
  - `visibility` (media_visibility) - Visibility (active, archived)

## Calendar Management

### 32. `school_calendar_events` (School Calendar Events)
- **Purpose**: School calendar and events
- **Key Fields**:
  - `id` (uuid, PK) - Event ID
  - `school_code` (text) - Associated school
  - `academic_year_id` (uuid, nullable) - Links to `academic_years.id`
  - `title` (text) - Event title
  - `description` (text, nullable) - Event description
  - `event_type` (text) - Event type (Holiday, Assembly, Exam, PTM, etc.)
  - `start_date` (date) - Event start date
  - `end_date` (date, nullable) - Event end date
  - `is_all_day` (boolean) - All-day event
  - `start_time`, `end_time` (time, nullable) - Event times
  - `is_recurring` (boolean) - Recurring event
  - `recurrence_pattern` (text) - Recurrence pattern (none, daily, weekly, monthly, yearly)
  - `recurrence_interval` (integer) - Recurrence interval
  - `recurrence_end_date` (date, nullable) - Recurrence end date
  - `color` (text) - Event color
  - `is_active` (boolean) - Event status
  - `class_instance_id` (uuid, nullable) - Links to `class_instances.id`

## Security & Audit

### 33. `tenant_security_audit` (Security Audit Log)
- **Purpose**: Security audit trail
- **Key Fields**:
  - `id` (uuid, PK) - Audit record ID
  - `event_type` (text) - Event type
  - `user_id` (uuid, nullable) - User ID
  - `school_code` (text, nullable) - Associated school
  - `user_role` (text, nullable) - User role
  - `target_school_code` (text, nullable) - Target school
  - `resource_type` (text, nullable) - Resource type
  - `resource_id` (uuid, nullable) - Resource ID
  - `action` (text, nullable) - Action performed
  - `details` (jsonb, nullable) - Additional details
  - `ip_address` (inet, nullable) - IP address
  - `user_agent` (text, nullable) - User agent
  - `created_at` (timestamptz, nullable) - Event timestamp

## User Linking

### 34. `student_user_links` (Student-User Links)
- **Purpose**: Links students to auth users
- **Key Fields**:
  - `student_id` (uuid, PK) - Links to `student.id`
  - `user_id` (uuid, nullable, unique) - Links to `auth.users.id`
  - `created_at` (timestamptz) - Creation timestamp

## Database Views

### Materialized Views for Analytics

#### `cb_admin_platform_metrics`
- Platform-wide metrics for CB admins
- Includes total schools, active schools, student counts, etc.

#### `cb_admin_school_directory`
- School directory with health metrics
- Includes school status, owner info, activity metrics

#### `cb_admin_school_health`
- School health monitoring
- Includes activity status, user counts, last activity

#### `fee_collection_summary`
- Fee collection summary by student
- Includes collected amounts, outstanding amounts, collection percentages

#### `student_fee_summary`
- Student fee summary
- Includes fee plans, components, amounts, collection status

#### `subject_performance`
- Subject performance analytics
- Includes average marks, percentages, student counts

#### `fee_debug_view`
- Fee system debugging view
- Shows record counts by table and school

#### `tenant_security_monitoring`
- Security monitoring aggregations
- Includes event counts, unique users, occurrence timestamps

## Key Relationships

### User Authentication Flow
1. User authenticates via Supabase Auth (`auth.users`)
2. Application queries `users` table using `auth.users.id`
3. Based on `users.role`, additional data fetched from:
   - `student` table (for students)
   - `admin` table (for teachers/admins)
   - `super_admin` table (for super admins)
   - `cb_admin` table (for CB admins)

### School Hierarchy
- `schools` → `academic_years` → `class_instances` → `student`
- `schools` → `subjects` → `syllabi` → `syllabus_chapters` → `syllabus_topics`

### Class Management
- `classes` (templates) → `class_instances` (active instances)
- `class_instances` → `class_admins` (many-to-many with admins)
- `class_instances` → `student` (student assignments)

### Assessment Flow
- `tests` → `test_questions` → `test_attempts` → `test_marks`
- `tests` linked to `class_instances`, `subjects`, `syllabus_chapters`

### Fee Management Flow
- `fee_component_types` → `fee_student_plan_items` → `fee_payments`
- `fee_student_plans` links students to fee plans
- `fee_student_plan_items` defines individual fee components

## Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Restrict access based on user role and school_code
- Ensure users can only access data from their school
- Provide appropriate permissions for different user types:
  - Students: Read access to their own data
  - Admins: Read/write access to their school's data
  - Super Admins: Full access to their school's data
  - CB Admins: Platform-wide access

## Common Query Patterns

### User Profile Resolution
```sql
-- Get user profile with role-specific data
SELECT u.*, 
       CASE 
         WHEN s.id IS NOT NULL THEN 'student'
         WHEN a.id IS NOT NULL THEN 'admin'
         WHEN sa.id IS NOT NULL THEN 'super_admin'
         WHEN ca.id IS NOT NULL THEN 'cb_admin'
         ELSE 'unknown'
       END as actual_role
FROM users u
LEFT JOIN student s ON u.id = s.auth_user_id
LEFT JOIN admin a ON u.id = a.auth_user_id
LEFT JOIN super_admin sa ON u.id = sa.auth_user_id
LEFT JOIN cb_admin ca ON u.id = ca.id
WHERE u.id = $1;
```

### Class Data with Student Count
```sql
-- Get classes with student counts
SELECT ci.*, 
       COUNT(s.id) as student_count,
       a.full_name as class_teacher_name
FROM class_instances ci
LEFT JOIN student s ON ci.id = s.class_instance_id
LEFT JOIN admin a ON ci.class_teacher_id = a.id
WHERE ci.school_code = $1
GROUP BY ci.id, a.full_name;
```

### Attendance Summary
```sql
-- Get attendance summary for a class
SELECT s.full_name,
       COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
       COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
       COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
       COUNT(a.id) as total_days
FROM student s
LEFT JOIN attendance a ON s.id = a.student_id
WHERE s.class_instance_id = $1
GROUP BY s.id, s.full_name;
```

## Notes

- All timestamps use `timestamptz` for timezone awareness
- UUIDs are used for all primary keys
- Foreign key constraints ensure referential integrity
- RLS policies provide security at the database level
- Materialized views provide efficient analytics queries
- JSONB fields store flexible metadata
- All tables include `created_at` and `updated_at` timestamps where appropriate
