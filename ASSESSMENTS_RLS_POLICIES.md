# Assessments RLS Policies Documentation

## Overview

This document describes the Row Level Security (RLS) policies for assessment-related tables in the ClassBridge application. All policies ensure proper access control based on user roles and school isolation.

## Tables Covered

1. **tests** - Test definitions
2. **test_questions** - Individual test questions
3. **test_attempts** - Student test attempts and answers
4. **test_marks** - Manual test marks

## Student Access Summary

✅ **Students have view access to:**

### 1. Tests (`tests` table)
- **Policy**: `students_view_available_tests`
- **Access**: SELECT
- **Condition**: Student can view tests assigned to their class
  - Student's `class_instance_id` must match test's `class_instance_id`
  - Student's `school_code` must match test's `school_code`

### 2. Test Questions (`test_questions` table)
- **Policy**: `students_view_test_questions`
- **Access**: SELECT
- **Condition**: Student can view questions for tests in their class
  - Test must belong to student's `class_instance_id`
  - Test must belong to student's `school_code`

### 3. Test Attempts (`test_attempts` table)
- **Policy**: `student_read_own_test_attempts` (SELECT)
- **Policy**: `students_manage_own_test_attempts` (INSERT/UPDATE)
- **Access**: SELECT, INSERT, UPDATE
- **Condition**: Student can view and manage their own test attempts
  - Attempt's `student_id` must match authenticated student's ID

### 4. Test Marks (`test_marks` table)
- **Policy**: `students_view_own_test_marks`
- **Access**: SELECT
- **Condition**: Student can view their own test marks
  - Mark's `student_id` must match authenticated student's ID

## Admin Access

Admins have **full access** (SELECT, INSERT, UPDATE, DELETE) to:
- All tests in their school
- All test questions for tests in their school
- All test attempts for tests in their school
- All test marks for tests in their school

**Policies**:
- `admin_school_crud_tests`
- `admin_school_crud_test_questions`
- `admin_school_crud_test_attempts`
- `admin_school_crud_test_marks`
- `select by owned class (admin)` - For class teachers to view their class's tests/attempts/marks

## Super Admin Access

Super Admins have **full access** (SELECT, INSERT, UPDATE, DELETE) to:
- All tests in their school
- All test questions for tests in their school
- All test attempts for tests in their school
- All test marks for tests in their school

**Policies**:
- `super_admin_school_isolated_tests`
- `super_admin_school_isolated_test_questions`
- `super_admin_school_isolated_test_attempts`
- `super_admin_school_isolated_test_marks`
- `select by school (superadmin)` - For viewing all school data

## Security Features

### School Isolation
- All policies enforce `school_code` matching to prevent cross-school data access
- Students can only access data from their own school

### Class Isolation (Students)
- Students can only view tests assigned to their `class_instance_id`
- Prevents students from accessing tests for other classes

### Ownership (Students)
- Students can only view and manage their own test attempts
- Students can only view their own test marks
- Prevents students from accessing other students' data

### Helper Functions Used

The policies use these helper functions:
- `get_user_role()` - Returns the authenticated user's role from `users` table
- `get_user_school_code()` - Returns the authenticated user's school code
- `auth.uid()` - Returns the authenticated user's UUID
- `jwt_role()` - Returns role from JWT token metadata
- `jwt_school_code()` - Returns school code from JWT token metadata

## Migration Applied

The migration `assessments_rls_policies` has been applied to the database. This migration:
1. ✅ Removed overly permissive policies (`tests_allow_all`, `test_marks_allow_all`)
2. ✅ Created student view policies for all assessment tables
3. ✅ Ensured proper admin and superadmin access
4. ✅ Maintained existing class-teacher access patterns

## Testing Recommendations

To verify the policies work correctly:

1. **Test Student Access**:
   - Student should be able to view tests for their class
   - Student should be able to view questions for their class tests
   - Student should be able to view and create their own test attempts
   - Student should be able to view their own test marks
   - Student should NOT be able to view tests from other classes
   - Student should NOT be able to view other students' attempts or marks

2. **Test Admin Access**:
   - Admin should be able to view all tests in their school
   - Admin should be able to create/edit/delete tests
   - Admin should be able to view all attempts and marks for their school's tests

3. **Test School Isolation**:
   - Users from School A should not be able to access data from School B
   - This should be enforced at all levels (tests, questions, attempts, marks)

## Notes

- All tables have RLS enabled
- Policies use `TO authenticated` to ensure only authenticated users can access data
- The policies respect the existing class-teacher relationship for admins
- Students can create and update their own test attempts, but cannot delete them (only admins can)

