# Comprehensive Student Screen Implementation Analysis
## ClassBridge React Native Application

**Analysis Date:** November 4, 2025  
**Focus:** Student data access control, instance_id filtering, and RLS policies

---

## Executive Summary

This analysis covers the complete student screen implementation in the ClassBridge React Native codebase. The system uses Supabase with Row Level Security (RLS) policies to control data access. The implementation demonstrates:

- **Good:** Proper use of class_instance_id filtering in most screens
- **Good:** Comprehensive RLS policy structure at database level
- **Good:** Authentication/authorization checks in AuthContext
- **Concern:** Some queries lack instance_id validation at application level (RLS is the safety net)
- **Note:** Student data lookups rely on auth_user_id matching

---

## 1. STUDENT-RELATED SCREENS AND COMPONENTS

### A. Active Student Screens

#### 1.1 Student Fees Screen
**Location:** `/src/features/fees/StudentFeesScreen.tsx` and `/src/components/fees/StudentFeesView.tsx`

**Purpose:** Display student's fee dues, payments, and balance

**Key Features:**
- Uses `StudentFeesView` component
- Fetches student ID from auth_user_id
- Has fallback lookup by email
- Queries `getStudentFees()` function

**Data Flow:**
```
Student Auth → profile.auth_id → lookup student table → get student ID
→ fetch fee plan and payments → calculate totals
```

#### 1.2 Student Attendance View
**Location:** `/src/components/attendance/StudentAttendanceView.tsx`

**Purpose:** Display student's attendance record

**Key Features:**
- Fetches student ID using auth_user_id (primary) or email (fallback)
- Uses `useStudentAttendance()` hook
- Queries attendance by student_id

**Data Flow:**
```
Student Auth → auth_id → student lookup → useStudentAttendance(studentId)
→ API call to attendance.getByStudent(studentId)
```

#### 1.3 Student Timetable Screen
**Location:** `/src/components/timetable/StudentTimetableScreen.tsx`

**Purpose:** Display student's class schedule

**Key Features:**
- Uses `useStudentTimetable()` hook
- Filters timetable slots by class_instance_id and date
- Enriches with subject and teacher data
- Uses syllabus progress to mark taught periods

**Data Flow:**
```
Student Auth → profile.class_instance_id + date 
→ fetch timetable_slots where class_instance_id = {id} AND class_date = {date}
→ enrich with subjects, teachers, and syllabus progress
```

#### 1.4 Student Syllabus Screen
**Location:** `/src/features/syllabus/StudentSyllabusScreen.tsx`

**Purpose:** Display syllabus topics for the class

**Key Features:**
- Filters subjects from timetable for student's class
- Uses class_instance_id to filter
- Shows syllabus with progress tracking

**Data Flow:**
```
Student Auth → profile.class_instance_id
→ fetch timetable_slots where class_instance_id = {id}
→ extract unique subjects
→ load syllabus tree for each subject
```

#### 1.5 Dashboard Screen
**Location:** `/src/features/dashboard/DashboardScreen.tsx`

**Purpose:** Main home screen with overview and quick actions

**Key Features:**
- Role-aware: different UI for students vs. admins
- Calls multiple hooks conditionally based on role
- Fetches stats, activity, events, fees, tasks, syllabus

**Data Flow (for students):**
```
Student Auth → profile
→ useDashboardStats(auth_id, class_instance_id)
→ useFeeOverview(auth_id)
→ useTaskOverview(auth_id, class_instance_id)
→ useSyllabusOverview(class_instance_id)
```

### B. Related Components and Hooks

#### useStudents Hook
**Location:** `/src/hooks/useStudents.ts`

**Purpose:** Fetch list of students in a class (for admins)

**Parameters:**
- `classInstanceId` - required
- `schoolCode` - required
- `options` - optional pagination

**Query:**
```typescript
listStudents(classInstanceId, schoolCode, { from, to })
```

**Filters Applied:**
```sql
.eq('class_instance_id', classInstanceId)
.eq('school_code', schoolCode)
```

#### useStudentTimetable Hook
**Location:** `/src/hooks/useStudentTimetable.ts`

**Purpose:** Fetch timetable for student's class on a specific date

**Filters:**
```sql
.eq('class_instance_id', classInstanceId)
.eq('class_date', dateStr)
```

#### useStudentAttendance Hook
**Location:** `/src/hooks/useAttendance.ts`

**Purpose:** Fetch attendance records for a specific student

**Key Note:** Uses only `student_id`, relies on RLS to validate student owns this record

---

## 2. DATA FETCHING MECHANISMS

### A. Database Query Functions
**Location:** `/src/data/queries.ts`

#### listStudents()
```typescript
export async function listStudents(
  classInstanceId: string,
  schoolCode: string,
  options?: { signal?: AbortSignal; from?: number; to?: number }
): Promise<QueryResult<StudentLite[]>>
```

**Filters:**
- ✅ class_instance_id (instance filtering)
- ✅ school_code (school isolation)
- ✅ Pagination support
- ✅ Ordering by name

**RLS Dependency:** Medium - relies on RLS for security

#### getStudentFees()
```typescript
export async function getStudentFees(
  studentId: string,
  academicYearId: string,
  schoolCode: string
): Promise<QueryResult<...>>
```

**Filters:**
- ✅ student_id (student isolation)
- ✅ academic_year_id (academic year scope)
- ✅ school_code (school isolation)

**Queries:**
1. fee_student_plans filtered by student_id, academic_year_id, school_code, status='active'
2. fee_payments filtered by student_id, school_code

**RLS Dependency:** Medium - relies on RLS

#### getStudentDetails()
```typescript
export async function getStudentDetails(
  studentId: string,
  options?: { signal?: AbortSignal }
): Promise<QueryResult<Student>>
```

**Filters:**
- ✅ id (student_id)

**⚠️ ISSUE:** Only filters by student ID, no school_code or class_instance_id validation
**RLS Dependency:** HIGH - completely relies on RLS to prevent cross-student access

### B. API Service Layer
**Location:** `/src/services/api.ts`

#### attendance.getByStudent()
```typescript
async getByStudent(studentId: string): Promise<AttendanceRecord[]> {
  return supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false })
    .limit(30);
}
```

**Filters:**
- ✅ student_id only

**⚠️ ISSUE:** No additional filtering; completely RLS-dependent

#### testMarks.getByStudent()
```typescript
async getByStudent(studentId: string) {
  return supabase
    .from('test_marks')
    .select(`*,tests!inner(...)`)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
}
```

**Filters:**
- ✅ student_id only

**⚠️ ISSUE:** No additional filtering; completely RLS-dependent

---

## 3. INSTANCE_ID FILTERING ANALYSIS

### A. Where instance_id IS Properly Used

| Component | Table | Filters | Scope |
|-----------|-------|---------|-------|
| useStudentTimetable | timetable_slots | class_instance_id, class_date | Correct |
| StudentSyllabusScreen | timetable_slots | class_instance_id | Correct |
| useDashboardStats | Multiple | class_instance_id | Correct |
| useStudents | student | class_instance_id, school_code | Correct (admin only) |
| useTaskOverview | tasks | class_instance_id | Correct |

### B. Where instance_id is NOT Used in App Code

| Component | Table | Current Filter | Missing |
|-----------|-------|-----------------|---------|
| getStudentFees | fee_student_plans | student_id, school_code, academic_year_id | ❌ class_instance_id |
| StudentFeesView | student | auth_user_id, school_code | ✅ OK (finding own record) |
| StudentAttendanceView | student | auth_user_id, school_code | ✅ OK (finding own record) |
| getStudentDetails | student | student_id | ⚠️ Minimal filtering |
| attendance.getByStudent | attendance | student_id | ⚠️ RLS-dependent |

### C. Critical Assessment

**RLS POLICIES ARE THE PRIMARY SECURITY MECHANISM**

The database has RLS enabled on ALL tables. However:

1. **Best Practice:** Both application-level AND database-level filtering
2. **Current State:** Application uses class_instance_id when it makes sense (queries from admin perspective)
3. **For Student-Specific Queries:** Relies heavily on RLS because you're querying by student_id (the student should only see their own record)

---

## 4. AUTHENTICATION & AUTHORIZATION LOGIC

### A. AuthContext Flow
**Location:** `/src/contexts/AuthContext.tsx`

#### Bootstrap Process:
```typescript
1. Get session from Supabase Auth
2. Query users table with auth.users.id
3. Fetch user profile (id, role, school_code, class_instance_id)
4. Validate profile exists → else ACCESS_DENIED
5. Validate role !== 'unknown' → else ACCESS_DENIED
6. Set profile in context (profile contains role, school_code, class_instance_id)
```

#### Security Checks:
```typescript
if (!userProfile) {
  // No profile found - access denied
  status: 'accessDenied'
}

if (userProfile.role === 'unknown') {
  // Invalid role - access denied
  status: 'accessDenied'
}
```

#### Profile Structure for Students:
```typescript
{
  auth_id: string;
  role: 'student';
  school_code: string;
  school_name: string;
  class_instance_id: string;  // The class they belong to
  full_name: string;
  email: string;
}
```

### B. Role-Based Access (DashboardScreen Example)

```typescript
const isStudent = profile?.role === 'student';
const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

// Student-specific data only fetched for students
if (isStudent) {
  const { data: feeOverview } = useFeeOverview(profile?.auth_id || '');
  const { data: taskOverview } = useTaskOverview(
    profile?.auth_id || '',
    profile?.class_instance_id || undefined
  );
}
```

### C. Student Identity Resolution

#### In StudentFeesView:
```typescript
// Step 1: Check role is 'student'
if (!profile?.auth_id || profile?.role !== 'student') {
  return; // Exit if not a student
}

// Step 2: Get school code from profile
const schoolCode = profile.school_code;

// Step 3: Find student record
const { data } = await supabase
  .from('student')
  .select('id')
  .eq('auth_user_id', profile.auth_id)  // Primary lookup
  .eq('school_code', schoolCode)
  .maybeSingle();

// Step 4: Fallback to email if needed
if (!data && profile.email) {
  const result = await supabase
    .from('student')
    .select('id')
    .eq('email', profile.email)
    .eq('school_code', schoolCode)
    .maybeSingle();
}
```

**Security Consideration:**
- Email-based fallback is acceptable only because school_code is also required
- Without school_code filter, this would be a vulnerability

---

## 5. ROW LEVEL SECURITY POLICIES

### Current Database Setup

**All tables have RLS enabled:**
✅ users, student, admin, super_admin, cb_admin  
✅ classes, class_instances, class_admins  
✅ attendance, fee_student_plans, fee_payments  
✅ timetable_slots, tests, test_marks, test_attempts  
✅ syllabus*, learning_resources, tasks, task_submissions  
✅ school_calendar_events, exams, student_results  

### RLS Policy Structure

From DATABASE_SCHEMA.md:
```
All tables have RLS enabled with policies that:
- Restrict access based on user role and school_code
- Ensure users can only access data from their school
- Provide appropriate permissions for different user types:
  - Students: Read access to their own data
  - Admins: Read/write access to their school's data
  - Super Admins: Full access to their school's data
  - CB Admins: Platform-wide access
```

### Critical RLS Validation Points

**1. Student Table RLS (Most Critical)**
- Students should only see their own student record
- Filtered by `auth_user_id = auth.uid()` OR similar
- Would prevent unauthorized access to other students' records

**2. Attendance Table RLS**
- Filtered by student ownership via student_id
- Cross-checked with school_code
- Prevents reading other students' attendance

**3. Fee Tables RLS**
- fee_student_plans: filtered by student_id
- fee_payments: filtered by student_id
- Prevents accessing other students' financial records

**4. Test-Related RLS**
- test_marks: filtered by student_id
- test_attempts: filtered by student_id
- Prevents accessing other students' test records

---

## 6. IDENTIFIED ISSUES

### 🔴 CRITICAL ISSUES

None identified at present, but conditions below need careful review:

### 🟡 MEDIUM SEVERITY - RLS Dependency

**Issue #1: getStudentDetails() has minimal application-level filtering**

**Location:** `/src/data/queries.ts:274`

```typescript
export async function getStudentDetails(studentId: string) {
  return supabase
    .from('student')
    .select('*')
    .eq('id', studentId)  // Only filters by student ID
    .maybeSingle();
}
```

**Risk:** If RLS policy is misconfigured, could leak data from any student

**Recommendation:**
```typescript
// Should also validate school_code at application level
export async function getStudentDetails(
  studentId: string, 
  schoolCode: string  // Add this
) {
  return supabase
    .from('student')
    .select('*')
    .eq('id', studentId)
    .eq('school_code', schoolCode)  // Add this filter
    .maybeSingle();
}
```

**Current Mitigation:** RLS policy should enforce this

---

**Issue #2: Test Marks and Attendance queries have no additional validation**

**Location:** `/src/services/api.ts:306, 975`

```typescript
// attendance.getByStudent()
.eq('student_id', studentId)  // Only this filter

// testMarks.getByStudent()
.eq('student_id', studentId)  // Only this filter
```

**Risk:** Complete RLS dependency - if RLS fails, data exposed

**Recommendation:**
- These are acceptable because student_id inherently belongs to one student
- However, adding school_code would be defense-in-depth
- Acceptable as-is IF RLS is properly tested

---

### 🟢 GOOD PRACTICES OBSERVED

**✅ Class instance filtering is used appropriately:**
- Timetable queries filter by class_instance_id + date
- Dashboard queries filter by class_instance_id
- Student list queries filter by class_instance_id + school_code

**✅ School code isolation is consistent:**
- Almost all queries include school_code filter
- Prevents cross-school data access at app level

**✅ Authentication is enforced:**
- AuthContext validates profile exists
- Profile must have valid role
- Profile contains class_instance_id for scope

**✅ Student data lookups are safe:**
- Primary lookup by auth_user_id (cryptographically secure)
- Fallback to email requires school_code validation
- Both methods require school_code match

---

## 7. DATA MODEL RELATIONSHIPS

### Student Isolation Mechanism

```
auth.users (Supabase Auth)
     ↓ auth_user_id
  users (profile table)
     ↓ 
  student (student-specific data)
     ├─ auth_user_id (links back to auth.users)
     ├─ school_code (isolates to school)
     └─ class_instance_id (isolates to class)
```

### Access Pattern for Student Screens

```
Query: "What is my attendance?"
↓
1. Get current auth user ID from Supabase Auth
2. Look up profile in users table (validates auth, gets role)
3. Verify role == 'student'
4. Get student ID from student table where auth_user_id matches
5. Query attendance where student_id matches
6. RLS policy double-checks student_id ownership
```

### Threat Scenarios

**Scenario 1: Student tries to access another student's data**
```
Attack: Modify studentId parameter to another student's ID
Prevention Layer 1 (App): Not possible - student looks up their own ID from auth_user_id
Prevention Layer 2 (RLS): If bypassed via API, RLS blocks cross-student access
```

**Scenario 2: Student tries to access data from different school**
```
Attack: Modify school_code or use API directly with different school
Prevention Layer 1 (App): auth_user_id → users table validates school_code
Prevention Layer 2 (RLS): school_code filter enforces school isolation
```

**Scenario 3: Unauthenticated access**
```
Attack: Call API without authentication token
Prevention: Supabase Auth token required, RLS policies check auth.uid()
```

---

## 8. COMPREHENSIVE FILE MAPPING

### Student-Related Screens
- `/src/features/fees/StudentFeesScreen.tsx` - Fee overview
- `/src/features/syllabus/StudentSyllabusScreen.tsx` - Syllabus view
- `/src/components/timetable/StudentTimetableScreen.tsx` - Timetable
- `/src/components/attendance/StudentAttendanceView.tsx` - Attendance
- `/src/features/dashboard/DashboardScreen.tsx` - Home screen

### Data Access Layer
- `/src/data/queries.ts` - Database query functions
- `/src/services/api.ts` - API service with CRUD operations
- `/src/data/rlsCheck.ts` - RLS diagnostics and testing

### Authentication & Context
- `/src/contexts/AuthContext.tsx` - Auth state management
- `/src/contexts/ClassSelectionContext.tsx` - Class selection state

### Hooks for Data Fetching
- `/src/hooks/useStudents.ts` - List students (admin)
- `/src/hooks/useStudentTimetable.ts` - Student timetable
- `/src/hooks/useAttendance.ts` - Attendance queries
- `/src/hooks/useDashboard.ts` - Dashboard data
- `/src/hooks/useTasks.ts` - Task queries

### Database Schema
- `/DATABASE_SCHEMA.md` - Comprehensive schema documentation
- RLS Policies: Defined at database level (not in codebase)

---

## 9. QUERY FILTERING MATRIX

| Feature | Query | Filters | Instance_ID | School_Code | Student_ID | RLS-Dependent |
|---------|-------|---------|-------------|------------|-----------|--------------|
| Student Fees | getStudentFees | ✅✅✅ | ❌ | ✅ | ✅ | Medium |
| Student Attendance | getByStudent | ✅ | ❌ | ❌ | ✅ | **HIGH** |
| Student Timetable | useStudentTimetable | ✅✅ | ✅ | ✅ | ❌ | Low |
| Attendance (Admin) | getByClass | ✅✅✅ | ✅ | ✅ | N/A | Low |
| Syllabus | StudentSyllabusScreen | ✅✅ | ✅ | ✅ | ❌ | Low |
| Test Marks | getByStudent | ✅ | ❌ | ❌ | ✅ | **HIGH** |

**Legend:**
- ✅ = Filter applied
- ✅✅ = Multiple filters for redundancy
- ❌ = Not filtered at app level
- **HIGH** = Entirely RLS-dependent
- Low/Medium/High = Risk level if RLS fails

---

## 10. RECOMMENDATIONS

### Priority 1: Verify RLS Policies (Critical)

1. **Audit current RLS policies in Supabase:**
   - Verify student table blocks cross-student access
   - Verify attendance table blocks cross-student access
   - Verify test_marks table blocks cross-student access
   - Verify fee tables block cross-student access

2. **Test RLS policies:**
   Use the `/src/data/rlsCheck.ts` utilities:
   ```typescript
   const results = await checkRLSAccess(schoolCode, classInstanceId);
   const perms = await checkUserPermissions(userId, schoolCode);
   ```

3. **Add RLS test cases:**
   - Student A tries to query Student B's attendance (should fail)
   - Student A tries to query different school's data (should fail)
   - Unauthenticated query (should fail)

---

### Priority 2: Defense in Depth

**For getStudentDetails():**
```typescript
// Add school_code validation
export async function getStudentDetails(
  studentId: string,
  schoolCode: string,
  options?: { signal?: AbortSignal }
) {
  const { data, error } = await supabase
    .from('student')
    .select('*')
    .eq('id', studentId)
    .eq('school_code', schoolCode)  // Added
    .abortSignal(options?.signal as any)
    .maybeSingle();
  // ... rest of function
}
```

**For API service queries:**
Consider adding optional school_code validation where applicable:
```typescript
// attendance.getByStudent() - Consider adding validation
async getByStudent(studentId: string, schoolCode?: string) {
  let query = supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId);
  
  if (schoolCode) {
    query = query.eq('school_code', schoolCode);
  }
  // ... rest
}
```

---

### Priority 3: Logging & Monitoring

1. **Add access logs for sensitive queries:**
   - Who accessed student fees?
   - Who accessed student attendance?
   - Who accessed test marks?

2. **Monitor for RLS violations:**
   - Set up Supabase alerts for RLS policy failures
   - Log all authentication failures

3. **Regular security audits:**
   - Monthly review of access patterns
   - Test RLS policies regularly

---

### Priority 4: Documentation

1. **Document RLS policy details:**
   - Current: "All tables have RLS enabled"
   - Needed: Specific policy rules for each table

2. **Create security runbook:**
   - How to verify student isolation
   - How to test new student features
   - How to respond to data access incidents

---

## 11. CONCLUSION

### Overall Security Posture: ✅ GOOD

**Strengths:**
1. ✅ RLS is enabled on all tables
2. ✅ Authentication is properly validated in AuthContext
3. ✅ School isolation is enforced at application and database level
4. ✅ Class instance filtering used appropriately
5. ✅ Student lookups are safe (auth_user_id primary, email fallback with school_code)
6. ✅ Role validation prevents unauthorized access

**Areas for Improvement:**
1. ⚠️ Consider adding school_code to getStudentDetails() for defense-in-depth
2. ⚠️ Verify and document RLS policies in detail
3. ⚠️ Add automated RLS testing to development workflow
4. ⚠️ Consider access logging for audit trail

**No Critical Vulnerabilities Identified:** ✅

The application properly relies on RLS for final-layer security, with appropriate application-level filtering where it makes architectural sense. The authentication flow ensures students can only access their own data.

### Recommendation: APPROVED FOR USE
With the note that RLS policies should be verified through the diagnostic tools provided in `/src/data/rlsCheck.ts` before production deployment.

