import { z } from 'zod';

// Role enum
export const roleEnum = z.enum(['student', 'teacher', 'admin', 'superadmin', 'cb_admin']);

// Gender enum
export const genderEnum = z.enum(['male', 'female', 'other']);

// Student validation
export const studentSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits').optional(),
  class_instance_id: z.string().uuid('Invalid class instance ID'),
  school_code: z.string().min(1, 'School code is required'),
  school_name: z.string().min(1, 'School name is required'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  gender: genderEnum.optional(),
  address: z.string().optional(),
  parent_name: z.string().optional(),
  parent_phone: z.string().regex(/^\d{10}$/, 'Parent phone must be 10 digits').optional(),
  admission_number: z.string().optional(),
  student_code: z.string().optional(),
});

export type StudentInput = z.infer<typeof studentSchema>;

// Admin/Teacher validation
export const adminSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.coerce.number().int('Phone must be a valid number').optional(),
  role: roleEnum.default('teacher'),
  school_code: z.string().min(1, 'School code is required'),
  school_name: z.string().min(1, 'School name is required'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  gender: genderEnum.optional(),
  address: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  employee_id: z.string().optional(),
  date_of_joining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
});

export type AdminInput = z.infer<typeof adminSchema>;

// User profile update validation
export const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits').optional(),
  address: z.string().optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  gender: genderEnum.optional(),
}).refine((data) => {
  // At least one field must be provided
  return Object.values(data).some(value => value !== undefined && value !== null);
}, {
  message: 'At least one field must be provided',
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Bulk student import validation
export const bulkStudentImportSchema = z.object({
  school_code: z.string().min(1, 'School code is required'),
  class_instance_id: z.string().uuid('Invalid class instance ID'),
  students: z.array(studentSchema.omit({ school_code: true, class_instance_id: true }))
    .min(1, 'At least one student is required')
    .max(100, 'Cannot import more than 100 students at once'),
}).refine((data) => {
  // Check for duplicate emails
  const emails = data.students.filter(s => s.email).map(s => s.email);
  return new Set(emails).size === emails.length;
}, {
  message: 'Duplicate emails found',
  path: ['students'],
}).refine((data) => {
  // Check for duplicate admission numbers
  const admissionNumbers = data.students.filter(s => s.admission_number).map(s => s.admission_number);
  return new Set(admissionNumbers).size === admissionNumbers.length;
}, {
  message: 'Duplicate admission numbers found',
  path: ['students'],
});

export type BulkStudentImportInput = z.infer<typeof bulkStudentImportSchema>;

