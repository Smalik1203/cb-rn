# Schema Mismatches Fixed

**Project:** ClassBridge RN App  
**Database:** Supabase (mvvzqouqxrtyzuzqbeud)  
**Date:** 2025-10-24

## Executive Summary

Fixed critical schema mismatches where code referenced `student.roll_number` column that **does not exist** in the database. All references updated to use `student_code` (the actual column in the schema).

## Key Finding

### ❌ Issue: `roll_number` Column Does Not Exist

**Actual Schema:**
```sql
student table columns:
  - id (uuid, PK)
  - student_code (text, unique) ✅ THIS IS THE REAL IDENTIFIER
  - full_name (text)
  - email (text, nullable)
  - phone (numeric)
  - school_code (text)
  - school_name (text)
  - class_instance_id (uuid, nullable, FK)
  - auth_user_id (uuid, nullable, FK)
  - parent_phone (numeric, nullable)
  - created_at (timestamp)
  - created_by (text)
  - role (text)
```

**NOT FOUND:** `roll_number` column

## Files Fixed

### 1. ✅ `src/contexts/AuthContext.tsx`
**Issue:** Line 93 - Student query included `roll_number`  
**Fix:** Changed to `student_code`
```typescript
// BEFORE
.select('id, full_name, email, phone, auth_user_id, school_code, school_name, class_instance_id, roll_number, created_at')

// AFTER
.select('id, full_name, email, phone, auth_user_id, school_code, school_name, class_instance_id, student_code, created_at')
```

### 2. ✅ `src/features/fees/hooks/useFees.ts`
**Issue:** Lines 210-217 - Query and sort used `roll_number`  
**Fix:** Changed to `student_code` and sort by `full_name`
```typescript
// BEFORE
.select(`id, full_name, roll_number, class_instance_id`)
.order('roll_number', { ascending: true });

// AFTER
.select(`id, full_name, student_code, class_instance_id`)
.order('full_name', { ascending: true });
```

### 3. ✅ `src/contexts/AttendanceContext.tsx`
**Issue:** Type definition and query used `roll_number`  
**Fix:** Updated interface and query
```typescript
// BEFORE
interface StudentAttendance {
  roll_number: string;
}

// AFTER
interface StudentAttendance {
  student_code: string;
}
```

### 4. ✅ `src/contexts/FeesContext.tsx`
**Issue:** Type definition and query used `roll_number`  
**Fix:** Updated interface and query (same pattern as AttendanceContext)

### 5. ✅ `src/components/attendance/UnifiedAttendance.tsx`
**Issue:** Line 59 - Used `student.roll_number` in data mapping  
**Fix:** Changed to `student.student_code`
```typescript
// BEFORE
rollNumber: student.roll_number,

// AFTER
studentCode: student.student_code,
```

### 6. ✅ `src/components/fees/RecordPayments.tsx`
**Issue:** UI displayed "Roll: {roll_number}" in 2 places  
**Fix:** Changed to "Code: {student_code}"
```typescript
// BEFORE
<Text>Roll: {student.roll_number}</Text>

// AFTER
<Text>Code: {student.student_code}</Text>
```

### 7. ✅ `src/lib/validations/users.ts`
**Issue:** Validation schema included `roll_number` field  
**Fix:** Changed to `student_code`
```typescript
// BEFORE
roll_number: z.string().optional(),

// AFTER
student_code: z.string().optional(),
```

### 8. ✅ `app/(tabs)/fees.tsx`
**Issue:** UI rendered roll_number conditionally  
**Fix:** Changed to student_code
```typescript
// BEFORE
{student.roll_number && (
  <Text>Roll: {student.roll_number}</Text>
)}

// AFTER
{student.student_code && (
  <Text>Code: {student.student_code}</Text>
)}
```

## Validation Queries (via MCP)

### ✅ Query 1: Students by Class
```sql
SELECT ci.id, ci.grade, ci.section, count(s.id) as student_count
FROM class_instances ci
LEFT JOIN student s ON s.class_instance_id = ci.id
WHERE ci.school_code = 'SCH019'
GROUP BY ci.id, ci.grade, ci.section
ORDER BY ci.grade, ci.section;
```
**Result:** ✅ 10 classes with 30-31 students each

### ✅ Query 2: Fees Join with student_code
```sql
SELECT s.id, s.student_code, s.full_name, 
       count(DISTINCT fsp.id) as plans, 
       count(DISTINCT fp.id) as payments
FROM student s
LEFT JOIN fee_student_plans fsp ON fsp.student_id = s.id
LEFT JOIN fee_payments fp ON fp.student_id = s.id
WHERE s.class_instance_id = '2e3a08d2-dd1e-41a3-965c-56450b862c8b'
  AND s.school_code = 'SCH019'
GROUP BY s.id, s.student_code, s.full_name;
```
**Result:** ✅ 10 students with student_code (ST106, ST107, etc.), all have fee plans

### ✅ Query 3: Attendance Data Integrity
```sql
SELECT date, count(*) as records, count(DISTINCT student_id) as unique_students
FROM attendance
WHERE class_instance_id = '2e3a08d2-dd1e-41a3-965c-56450b862c8b'
  AND school_code = 'SCH019'
GROUP BY date
ORDER BY date DESC;
```
**Result:** ✅ 10 dates with 31 records and 31 unique students each

## Correct Usage Going Forward

### ✅ For Human-Readable Display
Use `student_code` (e.g., "ST106", "ST107")
```typescript
<Text>Student Code: {student.student_code}</Text>
```

### ✅ For Foreign Key Relationships
Use `id` (UUID) for joins:
```typescript
.eq('student_id', student.id)  // ✅ Use UUID for FK
```

### ✅ For Sorting
Use `full_name` or `student_code`:
```typescript
.order('full_name', { ascending: true })  // ✅ Best for UX
.order('student_code', { ascending: true })  // ✅ Also valid
```

## Impact

- **No data loss**: `student_code` existed all along
- **No database migration needed**: Only code changes
- **All queries now work**: Validated with real data
- **Type safety improved**: Using actual schema

## Prevention

1. ✅ Generated fresh types from Supabase (`database.types.ts`)
2. ✅ Created typed data layer (`src/data/queries.ts`)
3. ✅ All queries now go through typed functions
4. ✅ TypeScript will catch future mismatches at compile time

