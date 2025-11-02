# Required Database Indexes for Analytics Performance

## Overview
This document outlines the database indexes required to optimize the analytics queries in the refactored table-first architecture. All analytics hooks filter by `school_code`, `academic_year_id`, and date ranges, so composite indexes on these columns are critical for performance.

## Index Strategy

### Principles
1. **Composite indexes** for frequently used filter combinations
2. **Leading columns** should be the most selective (school_code, academic_year_id)
3. **Date columns** included for range queries
4. **Foreign key columns** for joins (class_instance_id, student_id, teacher_id)
5. **Cover indexes** where possible to avoid table lookups

### Performance Targets
- Query execution time: < 500ms
- Index scan time: < 100ms
- Aggregation time: < 100ms (client-side)

## Core Indexes

### 1. Attendance Module

#### Primary Index
```sql
CREATE INDEX idx_attendance_analytics ON attendance (
  class_instance_id,
  date,
  status
)
WHERE status IS NOT NULL;
```

**Rationale:**
- `class_instance_id` enables join with `class_instances` for school_code/academic_year_id filter
- `date` enables range queries (between start_date and end_date)
- `status` is used in WHERE clauses (present/absent filtering)
- Partial index with `WHERE status IS NOT NULL` reduces index size

#### Join Optimization
```sql
CREATE INDEX idx_class_instances_school_year ON class_instances (
  school_code,
  academic_year_id,
  id
) INCLUDE (class_name);
```

**Rationale:**
- Enables fast filtering by school_code and academic_year_id
- `INCLUDE (class_name)` covers the SELECT clause, avoiding table lookup
- Used by all analytics queries that join with class_instances

#### Query Example
```sql
-- Optimized query with indexes
EXPLAIN ANALYZE
SELECT ci.id, ci.class_name, COUNT(*) as total,
       SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present
FROM attendance a
INNER JOIN class_instances ci ON a.class_instance_id = ci.id
WHERE ci.school_code = 'SCH001'
  AND ci.academic_year_id = 'AY2024'
  AND a.date >= '2024-01-01'
  AND a.date <= '2024-01-31'
GROUP BY ci.id, ci.class_name;

-- Expected: Index Scan on idx_attendance_analytics
-- Expected: Index Scan on idx_class_instances_school_year
```

---

### 2. Fees Module

#### Primary Index
```sql
CREATE INDEX idx_fee_student_plans_analytics ON fee_student_plans (
  student_id,
  due_date,
  total_amount
);
```

#### Payments Index
```sql
CREATE INDEX idx_fee_payments_analytics ON fee_payments (
  student_id,
  created_at,
  amount
);
```

#### Join Optimization
```sql
CREATE INDEX idx_student_school_class ON student (
  school_code,
  class_instance_id,
  id
) INCLUDE (full_name);
```

**Rationale:**
- `student_id` enables join between fee_student_plans and fee_payments
- `created_at` enables date range filtering for payments
- `due_date` used for aging bucket calculations
- `INCLUDE (full_name)` covers SELECT clause

#### Query Example
```sql
EXPLAIN ANALYZE
SELECT s.id, s.full_name,
       SUM(fsp.total_amount) as total_billed,
       COALESCE(SUM(fp.amount), 0) as total_paid
FROM fee_student_plans fsp
INNER JOIN student s ON fsp.student_id = s.id
INNER JOIN class_instances ci ON s.class_instance_id = ci.id
LEFT JOIN fee_payments fp ON fp.student_id = s.id
  AND fp.created_at >= '2024-01-01'
  AND fp.created_at <= '2024-01-31'
WHERE s.school_code = 'SCH001'
  AND ci.academic_year_id = 'AY2024'
GROUP BY s.id, s.full_name;
```

---

### 3. Academics Module

#### Tests Index
```sql
CREATE INDEX idx_tests_analytics ON tests (
  class_instance_id,
  subject_id,
  created_at,
  id
) INCLUDE (name, max_marks);
```

#### Test Marks Index
```sql
CREATE INDEX idx_test_marks_analytics ON test_marks (
  test_id,
  student_id,
  marks_obtained
);
```

#### Student Reverse Lookup
```sql
CREATE INDEX idx_test_marks_student_lookup ON test_marks (
  student_id,
  test_id
);
```

**Rationale:**
- `test_id` enables join between tests and test_marks
- `student_id` enables student-level aggregation
- `created_at` enables date range filtering
- Reverse lookup index for student-centric queries

#### Query Example
```sql
EXPLAIN ANALYZE
SELECT s.id, s.full_name, sub.name as subject_name,
       AVG(tm.marks_obtained * 100.0 / t.max_marks) as avg_score,
       COUNT(tm.id) as test_count
FROM test_marks tm
INNER JOIN tests t ON tm.test_id = t.id
INNER JOIN student s ON tm.student_id = s.id
INNER JOIN subjects sub ON t.subject_id = sub.id
INNER JOIN class_instances ci ON t.class_instance_id = ci.id
WHERE ci.school_code = 'SCH001'
  AND ci.academic_year_id = 'AY2024'
  AND t.created_at >= '2024-01-01'
  AND t.created_at <= '2024-01-31'
GROUP BY s.id, s.full_name, sub.id, sub.name;
```

---

### 4. Tasks Module

#### Tasks Index
```sql
CREATE INDEX idx_tasks_analytics ON tasks (
  class_instance_id,
  subject_id,
  due_date,
  id
) INCLUDE (title);
```

#### Task Submissions Index
```sql
CREATE INDEX idx_task_submissions_analytics ON task_submissions (
  task_id,
  student_id,
  submitted_at
);
```

**Rationale:**
- `task_id` enables join between tasks and task_submissions
- `due_date` enables date range filtering and on-time calculation
- `submitted_at` compared with due_date for on-time rate

#### Query Example
```sql
EXPLAIN ANALYZE
SELECT t.id, t.title, t.due_date,
       COUNT(ts.id) as submitted_count,
       SUM(CASE WHEN ts.submitted_at <= t.due_date THEN 1 ELSE 0 END) as on_time_count
FROM tasks t
INNER JOIN class_instances ci ON t.class_instance_id = ci.id
LEFT JOIN task_submissions ts ON ts.task_id = t.id
WHERE ci.school_code = 'SCH001'
  AND ci.academic_year_id = 'AY2024'
  AND t.due_date >= '2024-01-01'
  AND t.due_date <= '2024-01-31'
GROUP BY t.id, t.title, t.due_date;
```

---

### 5. Syllabus Module

#### Syllabus Progress Index
```sql
CREATE INDEX idx_syllabus_progress_analytics ON syllabus_progress (
  class_instance_id,
  chapter_id,
  is_completed,
  updated_at
);
```

#### Syllabus Chapters Index
```sql
CREATE INDEX idx_syllabus_chapters_subject ON syllabus_chapters (
  subject_id,
  id
) INCLUDE (title);
```

**Rationale:**
- `class_instance_id` enables join with class_instances
- `chapter_id` enables join with syllabus_chapters
- `is_completed` used for progress calculation
- `updated_at` enables trend tracking

#### Query Example
```sql
EXPLAIN ANALYZE
SELECT ci.id, ci.class_name, sub.name as subject_name,
       COUNT(CASE WHEN sp.is_completed THEN 1 END) as completed_topics,
       COUNT(sc.id) as total_topics
FROM syllabus_progress sp
INNER JOIN class_instances ci ON sp.class_instance_id = ci.id
INNER JOIN syllabus_chapters sc ON sp.chapter_id = sc.id
INNER JOIN syllabi syl ON sc.syllabus_id = syl.id
INNER JOIN subjects sub ON syl.subject_id = sub.id
WHERE ci.school_code = 'SCH001'
  AND ci.academic_year_id = 'AY2024'
GROUP BY ci.id, ci.class_name, sub.id, sub.name;
```

---

### 6. Operations Module

#### Timetable Slots Index
```sql
CREATE INDEX idx_timetable_slots_analytics ON timetable_slots (
  class_instance_id,
  teacher_id,
  class_date,
  is_conducted
) INCLUDE (period_number, subject_id);
```

#### Teacher Lookup
```sql
CREATE INDEX idx_timetable_slots_teacher_date ON timetable_slots (
  teacher_id,
  class_date
) WHERE is_conducted IS NOT NULL;
```

**Rationale:**
- `teacher_id` enables teacher-level aggregation
- `class_date` enables date range filtering
- `is_conducted` used for coverage calculation
- Partial index on non-null is_conducted reduces size

#### Query Example
```sql
EXPLAIN ANALYZE
SELECT a.id, a.full_name,
       COUNT(*) as total_periods,
       SUM(CASE WHEN ts.is_conducted THEN 1 ELSE 0 END) as conducted_periods,
       COUNT(DISTINCT ts.class_instance_id) as class_count,
       COUNT(DISTINCT ts.subject_id) as subject_count
FROM timetable_slots ts
INNER JOIN admin a ON ts.teacher_id = a.id
INNER JOIN class_instances ci ON ts.class_instance_id = ci.id
WHERE ci.school_code = 'SCH001'
  AND ci.academic_year_id = 'AY2024'
  AND ts.class_date >= '2024-01-01'
  AND ts.class_date <= '2024-01-31'
GROUP BY a.id, a.full_name;
```

---

## Maintenance Indexes

### Academic Years
```sql
CREATE INDEX idx_academic_years_active ON academic_years (
  school_code,
  is_active
) WHERE is_active = true;
```

### Subjects
```sql
CREATE INDEX idx_subjects_school ON subjects (
  school_code,
  id
) INCLUDE (name);
```

---

## Index Monitoring

### Check Index Usage
```sql
-- Check index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Identify unused indexes
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
  AND indexname NOT LIKE 'pg_toast%';
```

### Check Index Size
```sql
SELECT
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Analyze Query Performance
```sql
-- Enable timing
\timing on

-- Run EXPLAIN ANALYZE on analytics queries
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT ...;
```

---

## Migration Script

### Apply All Indexes
```sql
-- analytics_indexes.sql

BEGIN;

-- Attendance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_analytics
ON attendance (class_instance_id, date, status)
WHERE status IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_class_instances_school_year
ON class_instances (school_code, academic_year_id, id)
INCLUDE (class_name);

-- Fees indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fee_student_plans_analytics
ON fee_student_plans (student_id, due_date, total_amount);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fee_payments_analytics
ON fee_payments (student_id, created_at, amount);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_school_class
ON student (school_code, class_instance_id, id)
INCLUDE (full_name);

-- Academics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tests_analytics
ON tests (class_instance_id, subject_id, created_at, id)
INCLUDE (name, max_marks);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_marks_analytics
ON test_marks (test_id, student_id, marks_obtained);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_marks_student_lookup
ON test_marks (student_id, test_id);

-- Tasks indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_analytics
ON tasks (class_instance_id, subject_id, due_date, id)
INCLUDE (title);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_submissions_analytics
ON task_submissions (task_id, student_id, submitted_at);

-- Syllabus indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_syllabus_progress_analytics
ON syllabus_progress (class_instance_id, chapter_id, is_completed, updated_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_syllabus_chapters_subject
ON syllabus_chapters (subject_id, id)
INCLUDE (title);

-- Operations indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timetable_slots_analytics
ON timetable_slots (class_instance_id, teacher_id, class_date, is_conducted)
INCLUDE (period_number, subject_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timetable_slots_teacher_date
ON timetable_slots (teacher_id, class_date)
WHERE is_conducted IS NOT NULL;

-- Supporting indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_academic_years_active
ON academic_years (school_code, is_active)
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subjects_school
ON subjects (school_code, id)
INCLUDE (name);

COMMIT;

-- Analyze tables to update statistics
ANALYZE attendance;
ANALYZE fee_student_plans;
ANALYZE fee_payments;
ANALYZE tests;
ANALYZE test_marks;
ANALYZE tasks;
ANALYZE task_submissions;
ANALYZE syllabus_progress;
ANALYZE timetable_slots;
ANALYZE class_instances;
ANALYZE student;
```

---

## Rollback Script

```sql
-- rollback_analytics_indexes.sql

BEGIN;

DROP INDEX CONCURRENTLY IF EXISTS idx_attendance_analytics;
DROP INDEX CONCURRENTLY IF EXISTS idx_class_instances_school_year;
DROP INDEX CONCURRENTLY IF EXISTS idx_fee_student_plans_analytics;
DROP INDEX CONCURRENTLY IF EXISTS idx_fee_payments_analytics;
DROP INDEX CONCURRENTLY IF EXISTS idx_student_school_class;
DROP INDEX CONCURRENTLY IF EXISTS idx_tests_analytics;
DROP INDEX CONCURRENTLY IF EXISTS idx_test_marks_analytics;
DROP INDEX CONCURRENTLY IF EXISTS idx_test_marks_student_lookup;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_analytics;
DROP INDEX CONCURRENTLY IF EXISTS idx_task_submissions_analytics;
DROP INDEX CONCURRENTLY IF EXISTS idx_syllabus_progress_analytics;
DROP INDEX CONCURRENTLY IF EXISTS idx_syllabus_chapters_subject;
DROP INDEX CONCURRENTLY IF EXISTS idx_timetable_slots_analytics;
DROP INDEX CONCURRENTLY IF EXISTS idx_timetable_slots_teacher_date;
DROP INDEX CONCURRENTLY IF EXISTS idx_academic_years_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_subjects_school;

COMMIT;
```

---

## Performance Testing

### Test Scenarios

1. **Dashboard Load Test**
   - Fetch top-3 for all 6 modules concurrently
   - Target: < 1s total (6 parallel queries)

2. **Detail Screen Scroll Test**
   - Fetch 20 rows at a time with pagination
   - Target: < 300ms per page

3. **Filter/Sort Test**
   - Client-side filtering and sorting
   - Target: < 100ms for 1000 rows

### Load Testing Script
```typescript
// performance-test.ts
import { useAttendanceAnalytics } from '@/hooks/analytics';

async function testDashboardLoad() {
  const start = performance.now();

  const promises = [
    useAttendanceAnalytics({ ...filters, limit: 3 }),
    useFeesAnalytics({ ...filters, limit: 3 }),
    useAcademicsAnalytics({ ...filters, limit: 3 }),
    useTasksAnalytics({ ...filters, limit: 3 }),
    useSyllabusAnalytics({ ...filters, limit: 3 }),
    useOperationsAnalytics({ ...filters, limit: 3 }),
  ];

  await Promise.all(promises);

  const duration = performance.now() - start;
  console.log(`Dashboard load time: ${duration}ms`);

  // Assert: duration < 1000ms
  expect(duration).toBeLessThan(1000);
}
```

---

## Best Practices

1. **Use CONCURRENTLY** when creating indexes on production to avoid table locks
2. **Monitor index size** - drop unused indexes to reduce write overhead
3. **Analyze tables** after creating indexes to update query planner statistics
4. **Vacuum tables** periodically to reclaim space and update statistics
5. **Test with production-like data** - index performance varies with data volume
6. **Use EXPLAIN ANALYZE** to verify indexes are being used
7. **Consider partial indexes** for frequently filtered columns (e.g., WHERE is_active = true)
8. **Include covering columns** to avoid table lookups when possible

---

**Next Steps:**
1. Review and approve index strategy
2. Apply migration script in staging environment
3. Run performance tests and compare with baseline
4. Monitor query performance in production
5. Adjust indexes based on actual usage patterns
