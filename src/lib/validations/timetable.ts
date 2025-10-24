import { z } from 'zod';

// Slot type enum
export const slotTypeEnum = z.enum(['period', 'break', 'lunch', 'assembly']);

// Day of week enum
export const dayOfWeekEnum = z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);

// Timetable slot validation
export const timetableSlotSchema = z.object({
  class_instance_id: z.string().uuid('Invalid class instance ID'),
  school_code: z.string().min(1, 'School code is required'),
  class_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  day_of_week: dayOfWeekEnum.optional(),
  period_number: z.number().int('Period number must be an integer').positive('Period number must be positive').max(20, 'Period number too high'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  subject_id: z.string().uuid('Invalid subject ID').optional(),
  teacher_id: z.string().uuid('Invalid teacher ID').optional(),
  slot_type: slotTypeEnum.default('period'),
  name: z.string().optional(),
  plan_text: z.string().max(500, 'Plan text too long').optional(),
  room_number: z.string().max(50, 'Room number too long').optional(),
}).refine((data) => {
  // Validate that start_time is before end_time
  const [startHour, startMin] = data.start_time.split(':').map(Number);
  const [endHour, endMin] = data.end_time.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return startMinutes < endMinutes;
}, {
  message: 'Start time must be before end time',
  path: ['end_time'],
}).refine((data) => {
  // If slot_type is 'period', subject_id should be provided
  if (data.slot_type === 'period' && !data.subject_id) {
    return false;
  }
  return true;
}, {
  message: 'Subject is required for period slots',
  path: ['subject_id'],
});

export type TimetableSlotInput = z.infer<typeof timetableSlotSchema>;

// Bulk timetable slots validation
export const bulkTimetableSchema = z.object({
  class_instance_id: z.string().uuid('Invalid class instance ID'),
  school_code: z.string().min(1, 'School code is required'),
  class_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  slots: z.array(z.object({
    subject_id: z.string().uuid('Invalid subject ID'),
    teacher_id: z.string().uuid('Invalid teacher ID'),
    day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
    room: z.string().optional(),
    is_taught: z.boolean().default(true),
  }))
    .min(1, 'At least one slot is required'),
}).refine((data) => {
  // Check for overlapping time slots
  const slots = data.slots;
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const slot1 = slots[i];
      const slot2 = slots[j];
      
      const [start1Hour, start1Min] = slot1.start_time.split(':').map(Number);
      const [end1Hour, end1Min] = slot1.end_time.split(':').map(Number);
      const [start2Hour, start2Min] = slot2.start_time.split(':').map(Number);
      const [end2Hour, end2Min] = slot2.end_time.split(':').map(Number);
      
      const start1 = start1Hour * 60 + start1Min;
      const end1 = end1Hour * 60 + end1Min;
      const start2 = start2Hour * 60 + start2Min;
      const end2 = end2Hour * 60 + end2Min;
      
      // Check for overlap
      if ((start1 < end2 && end1 > start2)) {
        return false;
      }
    }
  }
  return true;
}, {
  message: 'Slots have overlapping times',
  path: ['slots'],
});

export type BulkTimetableInput = z.infer<typeof bulkTimetableSchema>;

// Copy timetable validation
export const copyTimetableSchema = z.object({
  source_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  class_instance_id: z.string().uuid('Invalid class instance ID'),
  school_code: z.string().min(1, 'School code is required'),
  overwrite: z.boolean().default(false),
}).refine((data) => data.source_date !== data.target_date, {
  message: 'Source and target dates must be different',
  path: ['target_date'],
});

export type CopyTimetableInput = z.infer<typeof copyTimetableSchema>;

// Timetable query validation
export const timetableQuerySchema = z.object({
  class_instance_id: z.string().uuid('Invalid class instance ID').optional(),
  teacher_id: z.string().uuid('Invalid teacher ID').optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  day_of_week: dayOfWeekEnum.optional(),
  slot_type: slotTypeEnum.optional(),
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

export type TimetableQueryInput = z.infer<typeof timetableQuerySchema>;

