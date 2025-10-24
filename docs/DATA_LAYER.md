# Data Layer API Documentation

**Location:** `src/data/queries.ts`  
**Purpose:** Centralized, typed data access layer for all Supabase queries  
**Error Handling:** All errors mapped via `errorMapper.ts`

## Architecture

```
┌─────────────┐
│  React Hook │  (useQuery/useMutation)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ queries.ts  │  Typed functions with error mapping
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Supabase   │  Client with RLS
└─────────────┘
```

## Core Principles

1. **All queries return `{ data, error }`** - Consistent interface
2. **Errors are mapped** - User-friendly messages via `mapError()`
3. **School filtering mandatory** - Every query includes `school_code`
4. **Type-safe** - Uses generated `database.types.ts`
5. **No roll_number** - Uses `student_code` instead

---

## API Reference

### Authentication & Context

#### `getCurrentUserContext()`
Get current authenticated user's context.

**Returns:** `QueryResult<{ auth_id, role, school_code, class_instance_id }>`

**Usage:**
```typescript
const { data, error } = await getCurrentUserContext();
if (error) {
  // Handle error
}
// Use data.school_code, data.role, etc.
```

#### `getUserProfile(userId: string)`
Fetch user profile from `users` table.

**Returns:** `QueryResult<User>`

---

### Academic Years

#### `getActiveAcademicYear(schoolCode: string)`
Get the currently active academic year for a school.

**Returns:** `QueryResult<AcademicYear>`

**Usage:**
```typescript
const { data: year, error } = await getActiveAcademicYear('SCH019');
```

#### `listAcademicYears(schoolCode: string)`
List all academic years for a school (most recent first).

**Returns:** `QueryResult<AcademicYear[]>`

---

### Classes

#### `listClasses(schoolCode: string, academicYearId?: string)`
List all class instances for a school, optionally filtered by academic year.

**Returns:** `QueryResult<ClassInstance[]>`  
**Sorting:** Grade ascending, then section ascending

**Usage:**
```typescript
const { data: classes, error } = await listClasses('SCH019', yearId);
```

#### `getClassDetails(classInstanceId: string)`
Get details for a specific class instance.

**Returns:** `QueryResult<ClassInstance>`

---

### Students

#### `listStudents(classInstanceId: string, schoolCode: string)`
List all students in a class.

**Returns:** `QueryResult<Student[]>`  
**Fields:** `id, student_code, full_name, email, phone, class_instance_id, school_code`  
**Sorting:** By `full_name` ascending  
**Note:** ✅ Uses `student_code`, NOT `roll_number`

**Usage:**
```typescript
const { data: students, error } = await listStudents(classId, 'SCH019');
// students[0].student_code // "ST106"
```

#### `getStudentDetails(studentId: string)`
Get full details for a single student.

**Returns:** `QueryResult<Student>`

---

### Attendance

#### `getAttendanceForDate(classInstanceId, date, schoolCode)`
Get attendance records for a specific class and date.

**Returns:** `QueryResult<Attendance[]>`

**Usage:**
```typescript
const { data, error } = await getAttendanceForDate(
  classId,
  '2025-10-24',
  'SCH019'
);
```

#### `getAttendanceOverview(classInstanceId, [startDate, endDate], schoolCode)`
Get attendance for a date range.

**Returns:** `QueryResult<Attendance[]>`  
**Sorting:** Most recent first

#### `saveAttendance(records: AttendanceInsert[])`
Save attendance records (replaces existing for that class/date).

**Returns:** `QueryResult<Attendance[]>`

**Usage:**
```typescript
const records = [
  {
    student_id: 'uuid',
    class_instance_id: 'uuid',
    school_code: 'SCH019',
    date: '2025-10-24',
    status: 'present',
    marked_by: 'ADMIN001',
    marked_by_role_code: 'admin'
  }
];
const { data, error } = await saveAttendance(records);
```

#### `checkHoliday(schoolCode, date, classInstanceId?)`
Check if a date is a holiday/event.

**Returns:** `QueryResult<CalendarEvent | null>`  
**Note:** Returns `null` if no holiday, not an error

---

### Fees

#### `getStudentFees(studentId, academicYearId, schoolCode)`
Get complete fee information for a student.

**Returns:** `QueryResult<{ plan, payments, totalDue, totalPaid, balance }>`

**Usage:**
```typescript
const { data, error } = await getStudentFees(studentId, yearId, 'SCH019');
if (data) {
  console.log(`Balance: ₹${data.balance / 100}`); // Convert paise to rupees
}
```

#### `getClassStudentsFees(classInstanceId, academicYearId, schoolCode)`
Get fee information for all students in a class.

**Returns:** `QueryResult<StudentWithFees[]>`  
**Each student includes:** `id, student_code, full_name, feeDetails`

#### `getFeeComponentTypes(schoolCode)`
List all fee component types (tuition, transport, etc.).

**Returns:** `QueryResult<FeeComponentType[]>`

#### `recordPayment(payment: FeePaymentInsert)`
Record a fee payment.

**Returns:** `QueryResult<FeePayment>`

**Usage:**
```typescript
const payment = {
  student_id: 'uuid',
  component_type_id: 'uuid',
  amount_paise: 50000, // ₹500
  payment_method: 'cash',
  school_code: 'SCH019',
  payment_date: '2025-10-24',
  created_by: 'uuid'
};
const { data, error } = await recordPayment(payment);
```

---

### Resources & Learning

#### `listResources(classInstanceId, schoolCode, subjectId?)`
List learning resources for a class.

**Returns:** `QueryResult<LearningResource[]>`  
**Sorting:** Most recent first

#### `listQuizzes(classInstanceId, schoolCode, subjectId?)`
List tests/quizzes for a class.

**Returns:** `QueryResult<Test[]>`

#### `getQuizDetails(testId)`
Get quiz with all questions.

**Returns:** `QueryResult<{ test, questions }>`

---

### Timetable

#### `getTimetable(classInstanceId, date, schoolCode)`
Get timetable for a specific date.

**Returns:** `QueryResult<TimetableSlot[]>`  
**Includes:** Subject and teacher details via joins  
**Sorting:** Period number, then start time

**Usage:**
```typescript
const { data: slots, error } = await getTimetable(classId, '2025-10-24', 'SCH019');
// slots[0].subject.subject_name
// slots[0].teacher.full_name
```

#### `getTimetableWeek(classInstanceId, startDate, schoolCode)`
Get timetable for a 7-day week.

**Returns:** `QueryResult<TimetableSlot[]>`  
**Date range:** startDate to startDate + 6 days

---

### Calendar

#### `listCalendarEvents(schoolCode, month, classInstanceId?)`
List calendar events for a month.

**Returns:** `QueryResult<CalendarEvent[]>`  
**Format:** `month` as "YYYY-MM"  
**Filter:** Includes school-wide and class-specific events

**Usage:**
```typescript
const { data, error } = await listCalendarEvents('SCH019', '2025-10', classId);
```

---

### Tasks

#### `listTasks(classInstanceId, academicYearId, schoolCode)`
List active tasks/assignments for a class.

**Returns:** `QueryResult<Task[]>`  
**Sorting:** Due date ascending (earliest first)

---

### Subjects

#### `listSubjects(schoolCode)`
List all subjects for a school.

**Returns:** `QueryResult<Subject[]>`  
**Sorting:** Subject name ascending

---

## Error Handling

All functions use the error mapper for consistent error handling:

```typescript
const { data, error } = await someQuery();

if (error) {
  // error.userMessage: User-friendly message
  // error.technicalDetails: Dev-friendly details
  // error.code: Postgres error code
  // error.table: Affected table
  // error.queryName: Function name
  // error.retryable: Boolean - should retry?
  
  if (error.retryable) {
    // Show retry button
  }
}
```

### Common Error Codes

- `42501`: RLS blocked - "Access denied"
- `42703`: Column not found - "Schema mismatch"
- `42P01`: Table not found - "Schema mismatch"
- `23503`: FK violation - "Invalid reference"
- `PGRST116`: No rows found - Not an error, data is null

---

## Usage in Hooks

### Pattern: TanStack Query Integration

```typescript
import { listStudents } from '@/src/data/queries';
import { useQuery } from '@tanstack/react-query';
import { useAppScope } from '@/src/contexts/AppScopeContext';

export function useStudents(classInstanceId: string) {
  const { scope } = useAppScope();
  
  return useQuery({
    queryKey: ['students', classInstanceId, scope.school_code],
    queryFn: async () => {
      const result = await listStudents(classInstanceId, scope.school_code!);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!classInstanceId && !!scope.school_code,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

### Pattern: Mutations

```typescript
import { saveAttendance } from '@/src/data/queries';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useSaveAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (records: AttendanceInsert[]) => {
      const result = await saveAttendance(records);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}
```

---

## Best Practices

1. **Always check error first**
   ```typescript
   const { data, error } = await query();
   if (error) return handleError(error);
   // Use data safely
   ```

2. **Use AppScope for context**
   ```typescript
   const { scope } = useAppScope();
   await listStudents(classId, scope.school_code!);
   ```

3. **Include school_code in query keys**
   ```typescript
   queryKey: ['resource', id, scope.school_code]
   ```

4. **Handle loading/error/empty states**
   - Show skeleton while loading
   - Show error with retry button
   - Show empty state with CTA

5. **Never use roll_number**
   - Use `student_code` for display
   - Use `id` (UUID) for relationships

---

## Type Safety

All return types are inferred from `database.types.ts`:

```typescript
import type { Student, Attendance, ClassInstance } from '@/src/types/database.types';

// data is properly typed
const { data }: QueryResult<Student[]> = await listStudents(...);
```

---

## Testing

Validated with real data from SCH019:
- ✅ 10 classes with 30-31 students each
- ✅ Complete attendance records
- ✅ Fee plans and payments working
- ✅ All JOINs functioning correctly
- ✅ RLS policies allowing appropriate access

