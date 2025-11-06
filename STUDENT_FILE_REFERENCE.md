# Complete File Reference - Student Implementation

## Student Screens (User-Facing)

### Fee Management
- `/Users/shoaibmalik/Desktop/cb-rn/src/features/fees/StudentFeesScreen.tsx` - Fee screen main component
- `/Users/shoaibmalik/Desktop/cb-rn/src/components/fees/StudentFeesView.tsx` - Fee view logic and UI
  - Queries: getStudentFees() from `/src/data/queries.ts`
  - Fetches academic year to scope fees
  - Uses student_id lookup via auth_user_id

### Attendance
- `/Users/shoaibmalik/Desktop/cb-rn/src/components/attendance/StudentAttendanceView.tsx` - Attendance display
  - Hook: useStudentAttendance() from `/src/hooks/useAttendance.ts`
  - API: api.attendance.getByStudent(studentId) from `/src/services/api.ts:306`

### Timetable
- `/Users/shoaibmalik/Desktop/cb-rn/src/components/timetable/StudentTimetableScreen.tsx` - Timetable display
  - Hook: useStudentTimetable() from `/src/hooks/useStudentTimetable.ts`
  - Filters: class_instance_id + date + school_code
  - Sub-queries: Subjects, Teachers, Syllabus progress

### Syllabus
- `/Users/shoaibmalik/Desktop/cb-rn/src/features/syllabus/StudentSyllabusScreen.tsx` - Syllabus view
  - Queries from timetable to get subjects
  - Loads syllabus tree by class_instance_id
  - Filters: class_instance_id + school_code

### Dashboard
- `/Users/shoaibmalik/Desktop/cb-rn/src/features/dashboard/DashboardScreen.tsx` - Home screen
  - Role-aware (student vs admin)
  - Multiple hooks for different data:
    - useDashboardStats(auth_id, class_instance_id)
    - useFeeOverview(auth_id)
    - useTaskOverview(auth_id, class_instance_id)
    - useSyllabusOverview(class_instance_id)

---

## Data Access Layers

### Query Functions
**File:** `/Users/shoaibmalik/Desktop/cb-rn/src/data/queries.ts`

Key functions:
- `getCurrentUserContext()` - Get user role and school context (lines 36-88)
- `getUserProfile(userId)` - Get full user profile (lines 90+)
- `listStudents(classInstanceId, schoolCode)` - List class students (lines 245-272)
- `getStudentDetails(studentId)` - Get student info (lines 274-294)
- `getStudentFees(studentId, academicYearId, schoolCode)` - Get fee data (lines 437-511)
- `getClassStudentsFees(...)` - Get fees for entire class (lines 513+)

### API Service Layer
**File:** `/Users/shoaibmalik/Desktop/cb-rn/src/services/api.ts`

Key API objects:
- `api.attendance.getByStudent(studentId)` (line 306)
- `api.attendance.getByClass(classId, date)` (line 270)
- `api.testMarks.getByStudent(studentId)` (line 975)
- `api.tests.getByStudent(studentId, testId)` (line 1058)

---

## Authentication & Authorization

**File:** `/Users/shoaibmalik/Desktop/cb-rn/src/contexts/AuthContext.tsx`

Key flows:
- `bootstrapUser()` - Validates user profile and sets auth state (lines 81-218)
- Profile validation checks (lines 134-182):
  - Must have profile in users table
  - Must have valid role (not 'unknown')
- Auth context provides:
  - status, session, user, profile
  - refresh(), signOut() methods
  - sessionVersion for invalidating stale work

**File:** `/Users/shoaibmalik/Desktop/cb-rn/src/contexts/ClassSelectionContext.tsx`
- Class selection context for role-based filtering

---

## Hooks for Data Fetching

### Student-Specific Hooks
- `/Users/shoaibmalik/Desktop/cb-rn/src/hooks/useStudents.ts` (lines 14-71)
  - Parameters: classInstanceId, schoolCode, pagination options
  - Query: listStudents()

- `/Users/shoaibmalik/Desktop/cb-rn/src/hooks/useStudentTimetable.ts` (lines 15-114)
  - Parameters: classInstanceId, dateStr
  - Queries: timetable_slots, subjects, admin (teachers), syllabus_progress
  - Filters: class_instance_id + class_date

- `/Users/shoaibmalik/Desktop/cb-rn/src/hooks/useAttendance.ts` (lines 43-57)
  - useStudentAttendance(studentId)
  - Calls: api.attendance.getByStudent(studentId)

### Dashboard Hooks
- `/Users/shoaibmalik/Desktop/cb-rn/src/hooks/useDashboard.ts`
  - useDashboardStats(auth_id, class_instance_id)
  - useRecentActivity(auth_id, class_instance_id)
  - useUpcomingEvents(school_code, class_instance_id)
  - useFeeOverview(auth_id)
  - useTaskOverview(auth_id, class_instance_id)
  - useSyllabusOverview(class_instance_id)

---

## Database Schema & RLS

**File:** `/Users/shoaibmalik/Desktop/cb-rn/DATABASE_SCHEMA.md`

Critical tables with RLS:
- `users` (main user table linked to auth.users.id)
- `student` (student-specific data)
- `admin` (teacher/admin data)
- `attendance` (attendance records)
- `fee_student_plans` (fee plans)
- `fee_payments` (fee payments)
- `timetable_slots` (class schedule)
- `test_marks` (test results)
- `test_attempts` (test responses)
- `tasks` (assignments)
- `task_submissions` (student submissions)

---

## RLS Testing & Diagnostics

**File:** `/Users/shoaibmalik/Desktop/cb-rn/src/data/rlsCheck.ts`

Key functions:
- `checkRLSAccess(schoolCode, classInstanceId, academicYearId)` (lines 18-172)
  - Tests access to all major tables
  - Returns accessibility status and record counts
  
- `checkTableAccess(table, schoolCode, additionalFilters)` (lines 177-233)
  - Check specific table access
  
- `checkUserPermissions(userId, schoolCode)` (lines 238-311)
  - Check user role and class access
  
- `formatRLSResults(results)` - Format results for display (lines 316-339)

- `quickRLSCheck(schoolCode)` - Quick health check (lines 344-355)

---

## Type Definitions

**File:** `/Users/shoaibmalik/Desktop/cb-rn/src/types/database.types.ts`

Generated Supabase types for:
- All tables and their columns
- Row and Insert types
- Database structure

**File:** `/Users/shoaibmalik/Desktop/cb-rn/src/types/db.constants.ts`

Constants for:
- Table names
- Column names
- Database references

---

## Supporting Files

### Utilities
- `/Users/shoaibmalik/Desktop/cb-rn/src/utils/verifyDataFetch.ts` - Data validation
- `/Users/shoaibmalik/Desktop/cb-rn/src/data/errorMapper.ts` - Error handling
- `/Users/shoaibmalik/Desktop/cb-rn/src/data/rlsCheck.ts` - RLS verification
- `/Users/shoaibmalik/Desktop/cb-rn/src/lib/supabase.ts` - Supabase client

### Components
- `/Users/shoaibmalik/Desktop/cb-rn/src/components/common/ThreeStateView.tsx` - Loading/error/data states
- `/Users/shoaibmalik/Desktop/cb-rn/src/components/ui/` - UI components

---

## Key Code Patterns

### Student Data Access Pattern
```
1. useAuth() → get profile with auth_id, class_instance_id, school_code
2. Component mounts → validate role === 'student'
3. Look up student ID → query student table where auth_user_id = auth_id
4. Call data hooks → pass student_id, class_instance_id, school_code
5. RLS policies validate access
6. Display data
```

### Admin Data Access Pattern
```
1. useAuth() → get profile with role, class_instance_id, school_code
2. Component mounts → validate role === 'admin' || 'superadmin'
3. Call data hooks → pass class_instance_id, school_code
4. RLS policies enforce access for user's school only
5. Display data
```

---

## Summary Statistics

**Total Student-Related Files:** 15+
**Main Screens:** 5
**Supporting Hooks:** 10+
**Database Tables with RLS:** 30+
**Key Security Mechanisms:**
- Supabase Auth
- AuthContext validation
- RLS policies
- school_code isolation
- class_instance_id scoping
- auth_user_id linking

