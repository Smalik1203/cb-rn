import { z, ZodSchema } from 'zod';

// Export all validation schemas from a single entry point
export * from './auth';
export * from './attendance';
export * from './fees';
export * from './timetable';
export * from './users';

// Helper function to validate data
export function validateData<T>(schema: ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string[]> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(err.message);
  });
  
  return { success: false, errors };
}

// Helper to get first error message
export function getFirstError(errors: Record<string, string[]>): string | null {
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return null;
  return errors[firstKey][0] || null;
}

