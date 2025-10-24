import { z } from 'zod';

// Attendance status enum
export const attendanceStatusEnum = z.enum(['present', 'absent', 'late', 'excused']);

// Mark attendance validation
export const markAttendanceSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  class_instance_id: z.string().uuid('Invalid class instance ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  status: attendanceStatusEnum,
  remarks: z.string().optional(),
  school_code: z.string().min(1, 'School code is required'),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;

// Bulk attendance validation
export const bulkAttendanceSchema = z.object({
  class_instance_id: z.string().uuid('Invalid class instance ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  school_code: z.string().min(1, 'School code is required'),
  attendance_records: z.array(
    z.object({
      student_id: z.string().uuid('Invalid student ID'),
      status: attendanceStatusEnum,
      remarks: z.string().optional(),
    })
  ).min(1, 'At least one attendance record is required'),
}).refine((data) => {
  // Check for duplicate student IDs
  const studentIds = data.attendance_records.map(r => r.student_id);
  return new Set(studentIds).size === studentIds.length;
}, {
  message: 'Duplicate student IDs found',
  path: ['attendance_records'],
});

export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;

// Attendance query validation
export const attendanceQuerySchema = z.object({
  class_instance_id: z.string().uuid('Invalid class instance ID').optional(),
  student_id: z.string().uuid('Invalid student ID').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  school_code: z.string().min(1, 'School code is required'),
}).refine((data) => {
  if (data.date_from && data.date_to) {
    return new Date(data.date_from) <= new Date(data.date_to);
  }
  return true;
}, {
  message: 'Start date must be before or equal to end date',
  path: ['date_to'],
});

export type AttendanceQueryInput = z.infer<typeof attendanceQuerySchema>;

