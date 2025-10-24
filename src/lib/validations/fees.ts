import { z } from 'zod';

// Payment status enum
export const paymentStatusEnum = z.enum(['pending', 'completed', 'failed', 'refunded']);

// Payment method enum
export const paymentMethodEnum = z.enum(['cash', 'card', 'online', 'cheque', 'bank_transfer']);

// Fee payment validation
export const feePaymentSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  school_code: z.string().min(1, 'School code is required'),
  amount_paise: z.number().int('Amount must be an integer').positive('Amount must be positive'),
  payment_method: paymentMethodEnum,
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  transaction_id: z.string().optional(),
  remarks: z.string().optional(),
  receipt_number: z.string().optional(),
  component_type_id: z.string().uuid('Invalid component type ID').optional(),
});

export type FeePaymentInput = z.infer<typeof feePaymentSchema>;

// Fee component validation
export const feeComponentSchema = z.object({
  name: z.string().min(1, 'Component name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  amount_paise: z.number().int('Amount must be an integer').positive('Amount must be positive'),
  is_mandatory: z.boolean().default(true),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  academic_year_id: z.string().uuid('Invalid academic year ID'),
  school_code: z.string().min(1, 'School code is required'),
});

export type FeeComponentInput = z.infer<typeof feeComponentSchema>;

// Fee student plan validation
export const feeStudentPlanSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  academic_year_id: z.string().uuid('Invalid academic year ID'),
  school_code: z.string().min(1, 'School code is required'),
  discount_paise: z.number().int('Discount must be an integer').min(0, 'Discount cannot be negative').default(0),
  discount_reason: z.string().optional(),
  items: z.array(
    z.object({
      fee_component_id: z.string().uuid('Invalid component ID'),
      amount_paise: z.number().int('Amount must be an integer').positive('Amount must be positive'),
      quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive').default(1),
    })
  ).min(1, 'At least one fee component is required'),
});

export type FeeStudentPlanInput = z.infer<typeof feeStudentPlanSchema>;

// Fee receipt generation validation
export const feeReceiptSchema = z.object({
  payment_id: z.string().uuid('Invalid payment ID'),
  school_code: z.string().min(1, 'School code is required'),
  include_school_logo: z.boolean().default(true),
  include_terms: z.boolean().default(true),
});

export type FeeReceiptInput = z.infer<typeof feeReceiptSchema>;

// Fee query validation
export const feeQuerySchema = z.object({
  student_id: z.string().uuid('Invalid student ID').optional(),
  class_instance_id: z.string().uuid('Invalid class instance ID').optional(),
  academic_year_id: z.string().uuid('Invalid academic year ID').optional(),
  payment_status: paymentStatusEnum.optional(),
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

export type FeeQueryInput = z.infer<typeof feeQuerySchema>;

