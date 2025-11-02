# Analytics Refactoring Plan: Table-First Architecture

## Overview
Refactor Master Dashboard and module screens from RPC-based chart UI to table-first UI with direct Supabase queries, client-side aggregation, and ranked lists.

## Current State Analysis

### Existing Data Flow
```
Analytics Screen → RPC Functions → Aggregated JSON → Chart Components
├── get_super_admin_analytics(school_code, start_date, end_date)
├── get_admin_analytics(class_instance_id, start_date, end_date)
└── get_student_analytics(student_id, start_date, end_date)
```

### Problems with Current Approach
1. **Black box aggregation** - RPCs hide business logic in database
2. **All-or-nothing** - Must fetch entire analytics payload (can be large)
3. **Limited flexibility** - Can't filter, sort, or paginate within categories
4. **Chart-heavy UI** - Not optimized for mobile table browsing
5. **No drill-down** - Can't explore top-3 items in detail

## New Architecture

### Data Flow
```
Module Hooks → Base Tables → Client Aggregation → Ranked Tables → Detail Screens
                    ↓
        (school_code, academic_year_id, date_window filters)
                    ↓
            Client-side ranking, sorting, filtering
                    ↓
            Virtualized lists with infinite scroll
```

### Core Principles
1. **Query base tables directly** - `attendance`, `fees`, `tasks`, `tests`, etc.
2. **Scope queries early** - Always filter by `school_code`, `academic_year_id`, date range
3. **Client-side aggregation** - Use TypeScript utilities for ranking, filtering, trend calculation
4. **Lazy loading** - Fetch preview data (top-3) for dashboard, full data on demand
5. **Memoization** - Cache expensive calculations with `useMemo`
6. **Virtualization** - Use FlashList for large datasets

## Master Dashboard Structure

### 6 KPI Cards
Each card shows:
- **Primary metric** (e.g., "92% Attendance Rate")
- **Trend delta** (e.g., "+3% vs last month")
- **Top-3 preview rows** (tappable to navigate to detail screen)
- **"View All" action**

### Module Mapping
| # | Module | Primary Metric | Top-3 Preview |
|---|--------|---------------|---------------|
| 1 | Attendance | Avg attendance rate (current period) | Top 3 classes by rate |
| 2 | Fees | Fee realization rate (collected/billed) | Top 3 recent payments |
| 3 | Academics | Avg test score (current period) | Top 3 students by score |
| 4 | Tasks | Task submission rate (on-time) | Top 3 upcoming tasks |
| 5 | Syllabus | Curriculum completion % | Top 3 subjects by progress |
| 6 | Operations | Timetable coverage % (conducted/planned) | Top 3 teachers by load |

## Module Detail Screens

### Common Features
All module detail screens include:
1. **Sticky filters** (date range, class, subject, student, etc.)
2. **Ranked table** with sortable columns
3. **Trend delta column** (current vs previous period)
4. **Infinite scroll** (load 20 rows at a time)
5. **Pull-to-refresh**
6. **Search bar** (client-side filter)

### Module-Specific Tables

#### 1. Attendance Detail
**Query:** `attendance` table
**Columns:** Rank | Class | Attendance Rate | Trend | Present/Total | Last Updated
**Sortable by:** Rate, Trend, Class Name
**Filters:** Class, Date Range, Status (improving/declining)

#### 2. Fees Detail
**Query:** `fee_payments` + `fee_student_plans` tables
**Columns:** Rank | Student | Amount Due | Amount Paid | Status | Aging
**Sortable by:** Amount Due, Aging, Status
**Filters:** Class, Payment Status, Aging Bucket (current, 30-60, 60-90, 90+)

#### 3. Academics Detail
**Query:** `test_marks` + `tests` tables
**Columns:** Rank | Student | Subject | Avg Score | Trend | Test Count
**Sortable by:** Score, Trend, Test Count
**Filters:** Class, Subject, Date Range

#### 4. Tasks Detail
**Query:** `tasks` + `task_submissions` tables
**Columns:** Rank | Task Name | Due Date | Submissions | On-Time % | Status
**Sortable by:** Due Date, On-Time %, Submissions
**Filters:** Class, Subject, Status (pending/completed/overdue)

#### 5. Syllabus Detail
**Query:** `syllabus_progress` + `syllabi` tables
**Columns:** Rank | Subject | Completed Topics | Total Topics | Progress % | Trend
**Sortable by:** Progress %, Trend, Subject
**Filters:** Class, Subject

#### 6. Operations Detail
**Query:** `timetable_slots` table
**Columns:** Rank | Teacher | Total Periods | Conducted | Coverage % | Trend
**Sortable by:** Coverage %, Conducted Periods, Teacher Name
**Filters:** Date Range, Class, Subject

## Technical Implementation

### 1. Type Definitions (`src/lib/analytics-table-types.ts`)
```typescript
// Base query filters
export interface AnalyticsQueryFilters {
  school_code: string;
  academic_year_id: string;
  start_date: string;
  end_date: string;
}

// Trend calculation result
export interface TrendDelta {
  current: number;
  previous: number;
  delta: number;
  deltaPercent: number;
  direction: 'up' | 'down' | 'stable';
}

// Ranked row (generic)
export interface RankedRow<T> {
  rank: number;
  data: T;
  trend: TrendDelta;
}

// Module-specific row types
export interface AttendanceRow {
  classId: string;
  className: string;
  presentCount: number;
  totalCount: number;
  rate: number;
  lastUpdated: string;
}

export interface FeeRow {
  studentId: string;
  studentName: string;
  className: string;
  totalBilled: number;
  totalPaid: number;
  totalDue: number;
  status: 'paid' | 'current' | 'overdue';
  agingDays: number;
}

// ... additional row types for each module
```

### 2. Aggregation Utilities (`src/lib/analytics-utils.ts`)
```typescript
export const analyticsUtils = {
  // Calculate trend between current and previous period
  calculateTrend(current: number, previous: number): TrendDelta,

  // Rank rows by specified field
  rankRows<T>(rows: T[], sortField: keyof T, order: 'asc' | 'desc'): RankedRow<T>[],

  // Client-side filter by multiple criteria
  filterRows<T>(rows: T[], filters: Record<string, any>): T[],

  // Group by period (day/week/month)
  groupByPeriod<T>(rows: T[], dateField: keyof T, period: 'day' | 'week' | 'month'): Record<string, T[]>,

  // Calculate percentage
  calculatePercentage(numerator: number, denominator: number, decimals = 2): number,
};
```

### 3. Typed Hooks (one per module)

#### Example: `src/hooks/analytics/useAttendanceAnalytics.ts`
```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { AnalyticsQueryFilters, AttendanceRow, RankedRow } from '../../lib/analytics-table-types';
import { analyticsUtils } from '../../lib/analytics-utils';

export function useAttendanceAnalytics(filters: AnalyticsQueryFilters, limit?: number) {
  return useQuery({
    queryKey: ['analytics', 'attendance', filters],
    queryFn: async () => {
      // 1. Fetch current period data
      const { data: currentData, error: currentError } = await supabase
        .from('attendance')
        .select(`
          id,
          class_instance_id,
          student_id,
          date,
          status,
          class_instances!inner(id, class_name, school_code, academic_year_id)
        `)
        .eq('class_instances.school_code', filters.school_code)
        .eq('class_instances.academic_year_id', filters.academic_year_id)
        .gte('date', filters.start_date)
        .lte('date', filters.end_date);

      if (currentError) throw currentError;

      // 2. Fetch previous period data (for trend calculation)
      const periodLength = new Date(filters.end_date).getTime() - new Date(filters.start_date).getTime();
      const prevStartDate = new Date(new Date(filters.start_date).getTime() - periodLength).toISOString().split('T')[0];
      const prevEndDate = new Date(new Date(filters.end_date).getTime() - periodLength).toISOString().split('T')[0];

      const { data: prevData } = await supabase
        .from('attendance')
        .select(`
          id,
          class_instance_id,
          status,
          class_instances!inner(school_code, academic_year_id)
        `)
        .eq('class_instances.school_code', filters.school_code)
        .eq('class_instances.academic_year_id', filters.academic_year_id)
        .gte('date', prevStartDate)
        .lte('date', prevEndDate);

      // 3. Aggregate by class
      const classMap = new Map<string, AttendanceRow>();

      currentData?.forEach(record => {
        const classId = record.class_instance_id;
        const className = record.class_instances.class_name;

        if (!classMap.has(classId)) {
          classMap.set(classId, {
            classId,
            className,
            presentCount: 0,
            totalCount: 0,
            rate: 0,
            lastUpdated: record.date,
          });
        }

        const row = classMap.get(classId)!;
        row.totalCount++;
        if (record.status === 'present') row.presentCount++;
        if (record.date > row.lastUpdated) row.lastUpdated = record.date;
      });

      // 4. Calculate rates and trends
      const rows: RankedRow<AttendanceRow>[] = Array.from(classMap.values()).map(row => {
        row.rate = analyticsUtils.calculatePercentage(row.presentCount, row.totalCount);

        // Calculate previous period rate for trend
        const prevClassData = prevData?.filter(r => r.class_instance_id === row.classId) || [];
        const prevPresentCount = prevClassData.filter(r => r.status === 'present').length;
        const prevTotalCount = prevClassData.length;
        const prevRate = analyticsUtils.calculatePercentage(prevPresentCount, prevTotalCount);

        const trend = analyticsUtils.calculateTrend(row.rate, prevRate);

        return { rank: 0, data: row, trend };
      });

      // 5. Rank by attendance rate
      const rankedRows = analyticsUtils.rankRows(rows, row => row.data.rate, 'desc');

      // 6. Apply limit if specified (for dashboard preview)
      return limit ? rankedRows.slice(0, limit) : rankedRows;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 4. Reusable RankedTable Component
```typescript
// src/components/analytics/RankedTable.tsx
import { FlashList } from '@shopify/flash-list';

interface RankedTableProps<T> {
  data: RankedRow<T>[];
  columns: ColumnDef<T>[];
  onRowPress?: (row: RankedRow<T>) => void;
  loading?: boolean;
  onEndReached?: () => void;
}

export function RankedTable<T>({ data, columns, onRowPress, loading, onEndReached }: RankedTableProps<T>) {
  // FlashList for virtualization
  // Sticky header with column sorting
  // Trend indicators (up/down arrows with colors)
  // Pull-to-refresh
  // ...
}
```

## Performance Optimizations

### 1. Query Optimization
- Always filter by `school_code`, `academic_year_id`, date range at query level
- Use `.select()` to fetch only required columns
- Limit initial fetch (e.g., top 20 rows)
- Request indexes on: `(school_code, academic_year_id, date)`, `class_instance_id`, `student_id`

### 2. Client-Side Optimization
- `useMemo` for expensive aggregations
- `useCallback` for event handlers
- Debounce search input (300ms)
- Virtualize lists with FlashList
- Lazy load detail screens (don't fetch until navigated)

### 3. Caching Strategy
- Dashboard preview data: 5 min stale time
- Detail screen data: 2 min stale time
- Use React Query's `keepPreviousData` for pagination
- Invalidate on mutations (mark attendance, add payment, etc.)

## Required Database Indexes

```sql
-- Attendance
CREATE INDEX idx_attendance_class_date ON attendance(class_instance_id, date);
CREATE INDEX idx_attendance_school_year_date ON attendance USING btree ((class_instances.school_code), (class_instances.academic_year_id), date);

-- Fees
CREATE INDEX idx_fee_payments_student ON fee_payments(student_id, created_at);
CREATE INDEX idx_fee_student_plans_school ON fee_student_plans(school_code, academic_year_id);

-- Test Marks
CREATE INDEX idx_test_marks_student ON test_marks(student_id, test_id);
CREATE INDEX idx_tests_class_date ON tests(class_instance_id, created_at);

-- Tasks
CREATE INDEX idx_tasks_class_due ON tasks(class_instance_id, due_date);
CREATE INDEX idx_task_submissions_task ON task_submissions(task_id, submitted_at);

-- Syllabus Progress
CREATE INDEX idx_syllabus_progress_class ON syllabus_progress(class_instance_id, subject_id);

-- Timetable Slots
CREATE INDEX idx_timetable_slots_class_date ON timetable_slots(class_instance_id, class_date);
CREATE INDEX idx_timetable_slots_teacher ON timetable_slots(teacher_id, class_date);
```

## Security & Compliance

### RLS Enforcement
- All base table queries respect existing RLS policies
- Superadmin: Can query all schools
- Admin: Filtered to their school_code and assigned classes
- Student: Filtered to their student_id only

### PII Protection
- Dashboard previews: Show aggregated metrics only (no student names)
- Detail screens: Student names visible only to authorized roles
- Never expose sensitive data (contact info, addresses) in analytics

## Testing Strategy

### Unit Tests
```typescript
// tests/analytics/filters.test.ts
describe('analyticsUtils.filterRows', () => {
  it('should filter attendance by date range', () => {});
  it('should filter fees by status', () => {});
});

// tests/analytics/ranking.test.ts
describe('analyticsUtils.rankRows', () => {
  it('should rank classes by attendance rate descending', () => {});
  it('should handle ties correctly', () => {});
});

// tests/analytics/trends.test.ts
describe('analyticsUtils.calculateTrend', () => {
  it('should calculate positive trend correctly', () => {});
  it('should calculate negative trend correctly', () => {});
  it('should handle zero division', () => {});
});
```

### Integration Tests
- Test hooks with mock Supabase responses
- Verify RLS is applied correctly
- Test pagination and infinite scroll

## Migration Path

### Phase 1: Build New Architecture (Current)
- Create types, utils, hooks in parallel with existing code
- No breaking changes to existing screens

### Phase 2: Refactor Master Dashboard
- Replace RPC calls with new hooks
- Replace charts with KPI cards + top-3 tables
- Keep existing analytics screen as fallback

### Phase 3: Refactor Module Details
- One module at a time (Attendance → Fees → Academics → Tasks → Syllabus → Operations)
- A/B test performance and user experience

### Phase 4: Deprecate Old Code
- Remove RPC calls and chart components
- Remove old analytics screen
- Clean up unused code

## File Structure
```
src/
├── lib/
│   ├── analytics-table-types.ts       # Type definitions
│   ├── analytics-utils.ts             # Aggregation, ranking, filtering utils
│   └── analytics-utils.test.ts        # Unit tests for utils
├── hooks/
│   └── analytics/
│       ├── useAttendanceAnalytics.ts
│       ├── useFeesAnalytics.ts
│       ├── useAcademicsAnalytics.ts
│       ├── useTasksAnalytics.ts
│       ├── useSyllabusAnalytics.ts
│       ├── useOperationsAnalytics.ts
│       └── index.ts                   # Re-export all hooks
├── components/
│   └── analytics/
│       ├── RankedTable.tsx            # Reusable table component
│       ├── KPICard.tsx                # Updated for new design
│       ├── TrendIndicator.tsx         # Up/down arrow with color
│       └── FilterBar.tsx              # Sticky filters
└── app/
    └── (tabs)/
        ├── index.tsx                  # Master Dashboard (refactored)
        └── analytics.tsx              # Keep for backward compat (deprecated)
```

## Success Metrics
1. **Performance:** Page load < 500ms, scroll FPS > 55
2. **Data freshness:** Stale time < 5 min for dashboard
3. **UX:** 3-tap navigation from dashboard to any detail row
4. **Code quality:** 80%+ test coverage for utils
5. **Bundle size:** No increase vs current (remove chart libraries)
