# ClassBridge Database Schema Report

**Project:** ClassBridge RN Mobile App  
**Database:** Supabase (Project ID: mvvzqouqxrtyzuzqbeud)  
**Generated:** 2025-10-24  
**RLS:** ✅ Enabled on all tables (20+ policies active)

## Core Tables Overview

### 1. `users` (Central Auth Table)
**Purpose:** Unified user authentication and profile  
**RLS:** ✅ Enabled  
**PK:** `id` (uuid, links to `auth.users.id`)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK, auth user ID |
| full_name | text | NO | Display name |
| email | text | YES | Email address |
| phone | text | YES | Contact number |
| role | text | NO | User role (superadmin, admin, teacher, student) |
| school_code | text | YES | School identifier (tenant isolation) |
| school_name | text | YES | School display name |
| class_instance_id | uuid | YES | FK to class_instances |
| created_at | timestamp | YES | Account creation |

**Key Points:**
- Primary authentication table
- Role-based access (`role` column)
- Tenant isolation via `school_code`

---

### 2. `student` (Student Records)
**Purpose:** Student-specific data and profiles  
**RLS:** ✅ Enabled (4 policies)  
**PK:** `id` (uuid)

| Column | Type | Nullable | Key Info |
|--------|------|----------|----------|
| id | uuid | NO | PK, unique |
| **student_code** | **text** | **NO** | **✅ UNIQUE - Use this, NOT roll_number** |
| full_name | text | NO | Student name |
| email | text | YES | Student email |
| phone | numeric | NO | Student contact |
| school_code | text | NO | FK to schools |
| school_name | text | NO | Denormalized |
| class_instance_id | uuid | YES | FK to class_instances |
| auth_user_id | uuid | YES | FK to auth.users |
| parent_phone | numeric | YES | Parent contact |
| created_by | text | NO | Creator identifier |
| role | text | NO | Always 'student' |

**❌ DOES NOT EXIST: `roll_number` column**  
**✅ USE INSTEAD:** `student_code` (e.g., "ST106", "ST107")

**RLS Policies:**
1. `student_select_own_record` - Students can view their own record
2. `admin_select_class_students` - Admins can view students in their school
3. `superadmin_select_school_students` - Superadmins can view all school students
4. `cb_admin_select_all_students` - CB admins have global access

---

### 3. `class_instances` (Active Classes)
**Purpose:** Represents a class for a specific academic year  
**RLS:** ✅ Enabled  
**PK:** `id` (uuid)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK |
| school_code | text | NO | Tenant isolation |
| academic_year_id | uuid | YES | FK to academic_years |
| class_id | uuid | YES | FK to classes (template) |
| grade | integer | YES | Grade level (1-12) |
| section | text | YES | Section (A, B, C, etc.) |
| class_teacher_id | uuid | YES | FK to admin (teacher) |
| created_by | text | NO | Creator |
| created_at | timestamp | YES | Creation date |

**Relationships:**
- `student.class_instance_id` → `class_instances.id`
- `class_instances.academic_year_id` → `academic_years.id`
- `class_instances.class_teacher_id` → `admin.id`

---

### 4. `attendance` (Daily Attendance)
**Purpose:** Student attendance tracking  
**RLS:** ✅ Enabled (8 policies)  
**PK:** `id` (uuid)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK |
| student_id | uuid | YES | FK to student |
| class_instance_id | uuid | YES | FK to class_instances |
| school_code | text | YES | Tenant filter |
| date | date | NO | Attendance date |
| status | text | NO | 'present', 'absent', 'late' |
| marked_by | text | NO | Marker identifier |
| marked_by_role_code | text | NO | Marker role |
| created_at | timestamp | YES | Record creation |

**Validation:** SCH019 Grade 1A has 31 attendance records per date ✅

**RLS Policies:**
- Superadmins: Full access to school data
- Admins: Access to owned classes
- Students: Read-only access to own attendance
- Insert allowed for authenticated users with class permissions

---

### 5. `fee_student_plans` (Student Fee Structure)
**Purpose:** Fee plan assigned to each student per academic year  
**RLS:** ✅ Enabled  
**PK:** `id` (uuid)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK |
| student_id | uuid | NO | FK to student |
| school_code | text | NO | Tenant isolation |
| academic_year_id | uuid | NO | FK to academic_years |
| class_instance_id | uuid | NO | FK to class_instances |
| status | text | NO | 'active' or 'inactive' |
| created_by | uuid | NO | Creator (auth.uid) |
| created_at | timestamp | NO | Creation date |

**Related Tables:**
- `fee_student_plan_items` - Line items (component, amount, quantity)
- `fee_component_types` - Fee categories (tuition, transport, etc.)
- `fee_payments` - Payment records

---

### 6. `fee_payments` (Payment Records)
**Purpose:** Track fee payments made by students  
**RLS:** ✅ Enabled  
**PK:** `id` (uuid)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK |
| student_id | uuid | NO | FK to student |
| plan_id | uuid | YES | FK to fee_student_plans |
| component_type_id | uuid | NO | FK to fee_component_types |
| amount_paise | integer | NO | Amount in paise (₹1 = 100 paise) |
| payment_date | date | NO | Payment date |
| payment_method | text | YES | 'cash', 'online', 'cheque', 'card' |
| receipt_number | text | YES | Unique receipt |
| transaction_id | text | YES | External reference |
| school_code | text | NO | Tenant filter |
| created_by | uuid | NO | Recorder |

**Validation:** SCH019 Grade 1A has students with fee plans and payments ✅

---

### 7. `timetable_slots` (Daily Schedule)
**Purpose:** Period-by-period timetable for each class  
**RLS:** ✅ Enabled  
**PK:** `id` (uuid)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK |
| school_code | text | NO | Tenant filter |
| class_instance_id | uuid | NO | FK to class_instances |
| class_date | date | NO | Schedule date |
| period_number | integer | NO | Period (1, 2, 3, ...) |
| slot_type | text | NO | 'period' or 'break' |
| name | text | YES | For breaks ("Lunch", "Short Break") |
| start_time | time | NO | Period start |
| end_time | time | NO | Period end |
| subject_id | uuid | YES | FK to subjects |
| teacher_id | uuid | YES | FK to admin |
| status | text | YES | 'planned', 'done', 'cancelled' |
| syllabus_chapter_id | uuid | YES | FK to syllabus_chapters |
| syllabus_topic_id | uuid | YES | FK to syllabus_topics |
| plan_text | text | YES | Lesson plan notes |
| created_by | uuid | NO | Creator |

---

### 8. `school_calendar_events` (Calendar/Holidays)
**Purpose:** School-wide and class-specific events  
**RLS:** ✅ Enabled  
**PK:** `id` (uuid)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK |
| school_code | text | NO | Tenant filter |
| academic_year_id | uuid | YES | FK to academic_years |
| class_instance_id | uuid | YES | NULL = school-wide, UUID = class-specific |
| title | text | NO | Event name |
| description | text | YES | Details |
| event_type | text | NO | Custom type (Holiday, Exam, PTM, etc.) |
| start_date | date | NO | Event start |
| end_date | date | YES | Event end (for multi-day) |
| is_all_day | boolean | YES | Default true |
| start_time | time | YES | For timed events |
| end_time | time | YES | For timed events |
| is_recurring | boolean | YES | For repeating events |
| color | text | YES | UI color code |
| is_active | boolean | YES | Soft delete |
| created_by | uuid | NO | Creator |

---

### 9. `learning_resources` (Videos/PDFs/Materials)
**Purpose:** Educational content for classes  
**RLS:** ✅ Enabled  
**PK:** `id` (uuid)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK |
| title | varchar | NO | Resource title |
| description | text | YES | Details |
| resource_type | varchar | NO | 'video', 'pdf', 'quiz' |
| content_url | text | NO | Storage URL |
| file_size | bigint | YES | Size in bytes |
| school_code | varchar | NO | Tenant filter |
| class_instance_id | uuid | YES | FK to class_instances |
| subject_id | uuid | YES | FK to subjects |
| uploaded_by | uuid | YES | FK to users |
| created_at | timestamp | YES | Upload date |

---

### 10. `tests` (Quizzes/Exams)
**Purpose:** Online and offline tests  
**RLS:** ✅ Enabled  
**PK:** `id` (uuid)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK |
| title | text | NO | Test name |
| description | text | YES | Details |
| school_code | text | NO | Tenant filter |
| class_instance_id | uuid | NO | FK to class_instances |
| subject_id | uuid | NO | FK to subjects |
| test_type | text | NO | Test category |
| test_mode | text | YES | 'online' or 'offline' |
| test_date | date | YES | Scheduled date |
| time_limit_seconds | integer | YES | Duration |
| allow_reattempts | boolean | YES | Default false |
| status | text | YES | 'active' or 'inactive' |
| chapter_id | uuid | YES | FK to syllabus_chapters |
| created_by | uuid | NO | Creator |

**Related Tables:**
- `test_questions` - Questions with answers
- `test_attempts` - Student submissions
- `test_marks` - Offline test scoring

---

### 11. `tasks` (Homework/Assignments)
**Purpose:** Task management for classes  
**RLS:** ✅ Enabled  
**PK:** `id` (uuid)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK |
| school_code | text | NO | Tenant filter |
| academic_year_id | uuid | YES | FK to academic_years |
| class_instance_id | uuid | YES | FK to class_instances |
| subject_id | uuid | YES | FK to subjects |
| title | text | NO | Task name |
| description | text | YES | Details |
| priority | text | YES | 'low', 'medium', 'high', 'urgent' |
| assigned_date | date | NO | Assignment date |
| due_date | date | NO | Deadline |
| max_marks | integer | YES | Total points |
| instructions | text | YES | Task instructions |
| attachments | jsonb | YES | File references |
| is_active | boolean | YES | Soft delete |
| created_by | uuid | NO | Creator |

---

## Key Schema Patterns

### Tenant Isolation
✅ All tables filtered by `school_code`  
✅ RLS policies enforce school-level access  
✅ No cross-school data leakage

### Foreign Key Relationships
- `student_id` → `student.id` (UUID)
- `class_instance_id` → `class_instances.id` (UUID)
- `academic_year_id` → `academic_years.id` (UUID)
- `school_code` → `schools.school_code` (text)

### Denormalization
Some tables include `school_name` alongside `school_code` for display purposes.

### Soft Deletes
Many tables use `is_active` boolean instead of hard deletes.

### Timestamps
Most tables include `created_at` and some include `updated_at`.

---

## RLS Policy Summary

**Total Policies:** 20+ active  
**Coverage:** All critical tables  
**Isolation:** School-level tenant separation  

**Key Policies:**
1. **Superadmin:** Full access to own school data only
2. **Admin/Teacher:** Access to assigned classes
3. **Students:** Read-only access to own records
4. **Authenticated:** Write access with permission checks

**Policy Functions Used:**
- `get_user_role()` - Extract role from JWT
- `get_user_school_code()` - Extract school_code from JWT
- `jwt_role()` / `jwt_school_code()` - JWT helpers

---

## Validation Results ✅

### Test School: SCH019

**Classes:** 10 classes (Grades 1-10, Section A)  
**Students:** 30-31 students per class  
**Attendance:** Complete records (31 per date)  
**Fees:** Plans assigned, payments recorded  
**Student Codes:** Format "ST###" (e.g., ST106, ST107)

### All Queries Passing
✅ Student listing with `student_code`  
✅ Fees joins working correctly  
✅ Attendance integrity maintained  
✅ No orphaned records found

---

## Migration Status

**No migrations needed** - Schema already correct  
**Code fixed** - All `roll_number` → `student_code`  
**Type safety** - Fresh types generated from DB  
**Data layer** - Typed queries created (`src/data/queries.ts`)

