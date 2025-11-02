# ClassBridge Analytics Module

## Overview

The ClassBridge Analytics Module provides comprehensive, role-scoped dashboards for Super Admins, Admins/Teachers, and Students. The module uses server-side aggregates stored in Postgres with nightly refresh jobs to ensure fast performance (<800ms P95).

## Architecture

### Server-Side Components

#### Aggregation Tables
- `analytics_attendance_daily` - Daily attendance rates by class
- `analytics_fees_summary` - Fee collection and outstanding amounts
- `analytics_academics_summary` - Test scores and participation by student/subject
- `analytics_syllabus_summary` - Syllabus completion progress
- `analytics_timetable_coverage` - Timetable planning vs actual coverage

#### RPC Functions
- `get_super_admin_analytics(p_school_code, p_start_date, p_end_date)` - School-wide metrics
- `get_admin_analytics(p_class_instance_id, p_start_date, p_end_date)` - Class-scoped metrics
- `get_student_analytics(p_student_id, p_start_date, p_end_date)` - Personal progress

#### Refresh Functions
- `refresh_attendance_analytics()` - Updates attendance aggregates
- `refresh_fees_analytics()` - Updates fee collection data
- `refresh_academics_analytics()` - Updates test/quiz performance
- `refresh_syllabus_analytics()` - Updates syllabus progress
- `refresh_timetable_analytics()` - Updates timetable coverage
- `refresh_all_analytics()` - Master function to refresh all analytics

### Client-Side Components

#### Reusable UI Components
Located in `src/components/analytics/`:
- `KPICard` - Display key metrics with icons and trends
- `TrendChart` - Line chart for showing trends over time
- `ProgressRing` - Circular progress indicator

#### Dashboard Screens
Located in `app/(tabs)/analytics.tsx`:
- `SuperAdminDashboard` - School-wide overview for administrators
- `AdminDashboard` - Class-specific metrics for teachers
- `StudentDashboard` - Personal progress for students

## Role-Specific Dashboards

### Super Admin / CB Admin
**Scope:** Entire school

**Metrics:**
- **Attendance:** Avg rate, 7/30-day trends, classes with improving consistency
- **Academics:** Term avg by subject, improvement trends, participation rate
- **Fees:** Realization rate, MoM trends, aging buckets (current, 30-60, 60-90, 90+ days)
- **Operations:** Timetable coverage %, teacher load balance
- **Engagement:** Test participation %, task submission rate

**Design Philosophy:** Shows progress and trends, not individual rankings (diplomatic tone)

### Admin / Teacher
**Scope:** Specific class

**Metrics:**
- **Presence:** Weekly attendance trend, steady participation %
- **Learning:** Quiz avg trend, assignment on-time rate, syllabus progress by subject
- **Syllabus:** Progress % vs target per subject
- **Operations:** Planned vs conducted periods (coverage %)
- **Engagement:** Quiz/assignment participation rates

**Design Philosophy:** Focus on class progress, helping teachers identify areas needing attention

### Student
**Scope:** Personal

**Metrics:**
- **Attendance Rhythm:** Days attended this month, 4-week trend
- **Learning:** Subject-wise score trends, assignment on-time streak
- **Progress Highlights:** Personal best scores, syllabus progress
- **Fees:** Status summary (billed/paid/due)

**Design Philosophy:** Motivational tone, highlighting personal achievements and progress

## Data Refresh Schedule

### Automated Refresh
Analytics data is refreshed nightly at **06:00 AM IST** via a scheduled job.

To set up the cron job in Supabase:

```sql
SELECT cron.schedule(
  'refresh-analytics-nightly',
  '0 6 * * *',  -- Run at 6 AM IST daily
  $$ SELECT refresh_all_analytics(); $$
);
```

### Manual Refresh
To manually refresh analytics data:

```sql
SELECT refresh_all_analytics();
```

Or refresh individual components:
```sql
SELECT refresh_attendance_analytics();
SELECT refresh_fees_analytics();
SELECT refresh_academics_analytics();
SELECT refresh_syllabus_analytics();
SELECT refresh_timetable_analytics();
```

## Performance Optimization

### Caching Strategy
- React Query caches analytics data for **5 minutes** (staleTime)
- Data persists in cache for **10 minutes** (gcTime)
- Pull-to-refresh allows manual updates

### Query Optimization
- All analytics queries use pre-aggregated data (no heavy joins at query time)
- Indexes on frequently queried columns (school_code, date, class_instance_id)
- 90-day rolling window for historical data (older data auto-deleted)

### Target Performance
- **P95 < 800ms** after warm cache
- **P50 < 300ms** for cached queries

## Timezone Handling

All dates are aggregated by **IST (Asia/Kolkata)** timezone to ensure consistent daily boundaries regardless of where the server is located.

## Security

### Row-Level Security (RLS)
- All analytics tables have RLS enabled
- Users can only view analytics for their assigned school
- Direct table access is blocked; all queries go through RPC functions

### RPC Authorization
- Super Admin/CB Admin RPCs verify role and school access
- Admin RPCs verify class assignment (class teacher or assigned admin)
- Student RPCs verify student identity or admin override

## Offline Support

Analytics data is cached using React Query's persistence layer, allowing users to view the last fetched snapshot when offline.

## Usage

### Accessing Analytics
1. Navigate to the **Analytics** tab in the app
2. Dashboard automatically loads based on your role:
   - Super Admin → School-wide view
   - Admin → Class selector + class-specific view
   - Student → Personal progress view
3. Pull down to refresh data manually

### Interpreting Metrics

#### Attendance Rate
- **Green** (≥90%): Excellent attendance
- **Yellow** (80-89%): Good attendance, monitor for improvement
- **Red** (<80%): Needs attention

#### Fee Realization Rate
- Percentage of billed fees that have been collected
- Aging buckets help identify overdue payments

#### Syllabus Progress
- Tracks completion of topics in each subject
- Helps ensure curriculum stays on schedule

#### Timetable Coverage
- Percentage of planned periods that were actually conducted
- Helps identify scheduling gaps or cancellations

## Troubleshooting

### No Data Displayed
1. Check if analytics refresh has been run: `SELECT MAX(updated_at) FROM analytics_attendance_daily;`
2. Run manual refresh: `SELECT refresh_all_analytics();`
3. Verify you have data in source tables (attendance, tests, etc.)

### Slow Performance
1. Check database indexes are created
2. Verify analytics tables are updated (check `updated_at` timestamps)
3. Clear React Query cache and refetch

### Incorrect Role Access
1. Verify user role in `users` table
2. Check RLS policies are applied correctly
3. Ensure user has assigned school_code

## Future Enhancements

- [ ] Export analytics reports to PDF/Excel
- [ ] Email/push notifications for significant trends
- [ ] Custom date range selection
- [ ] Comparison with previous periods
- [ ] Predictive analytics using ML models
- [ ] Real-time analytics (currently daily refresh)

## Technical Specifications

**Frontend:**
- React Native with Expo Router
- React Query for data fetching and caching
- Custom SVG charts for mobile optimization
- Refresh control for manual updates

**Backend:**
- PostgreSQL with server-side aggregation
- Supabase RPC functions for secure access
- pg_cron for scheduled jobs
- RLS for multi-tenant security

**Performance:**
- Aggregation tables reduce query complexity
- Indexed lookups for fast retrieval
- Minimal data transfer (<50KB per dashboard load)
- Optimistic UI updates with stale-while-revalidate

---

**Version:** 1.0.0
**Last Updated:** November 2025
**Maintainer:** ClassBridge Team
