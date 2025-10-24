import { PostgrestError } from '@supabase/supabase-js';

export interface MappedError {
  userMessage: string;
  technicalDetails?: string;
  code?: string;
  table?: string;
  column?: string;
  queryName?: string;
  retryable: boolean;
}

/**
 * Maps Postgres/Supabase errors to user-friendly messages
 * @param error - The error from Supabase query
 * @param context - Additional context (query name, table, etc.)
 */
export function mapError(
  error: PostgrestError | Error | unknown,
  context?: {
    queryName?: string;
    table?: string;
    operation?: string;
  }
): MappedError {
  // Handle PostgrestError (Supabase errors)
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError;
    
    switch (pgError.code) {
      // RLS / Permission errors
      case '42501': // insufficient_privilege
        return {
          userMessage: 'Access denied. Please check your permissions.',
          technicalDetails: `RLS policy blocked access to ${context?.table || 'resource'}`,
          code: pgError.code,
          table: context?.table,
          queryName: context?.queryName,
          retryable: false,
        };
      
      // Schema mismatch errors
      case '42703': // undefined_column
        const columnMatch = pgError.message.match(/column "([^"]+)"/);
        const column = columnMatch ? columnMatch[1] : 'unknown';
        return {
          userMessage: 'Data structure mismatch. Please update the app.',
          technicalDetails: `Column "${column}" not found in table "${context?.table || 'unknown'}"`,
          code: pgError.code,
          table: context?.table,
          column,
          queryName: context?.queryName,
          retryable: false,
        };
      
      case '42P01': // undefined_table
        const tableMatch = pgError.message.match(/relation "([^"]+)"/);
        const table = tableMatch ? tableMatch[1] : context?.table || 'unknown';
        return {
          userMessage: 'Data structure mismatch. Please update the app.',
          technicalDetails: `Table "${table}" not found`,
          code: pgError.code,
          table,
          queryName: context?.queryName,
          retryable: false,
        };
      
      // Foreign key violations
      case '23503': // foreign_key_violation
        return {
          userMessage: 'Invalid reference. The related data may have been deleted.',
          technicalDetails: pgError.message,
          code: pgError.code,
          table: context?.table,
          queryName: context?.queryName,
          retryable: false,
        };
      
      // Unique constraint violations
      case '23505': // unique_violation
        return {
          userMessage: 'This record already exists.',
          technicalDetails: pgError.message,
          code: pgError.code,
          table: context?.table,
          queryName: context?.queryName,
          retryable: false,
        };
      
      // Check constraint violations
      case '23514': // check_violation
        return {
          userMessage: 'Invalid data. Please check your input.',
          technicalDetails: pgError.message,
          code: pgError.code,
          table: context?.table,
          queryName: context?.queryName,
          retryable: false,
        };
      
      // Not null violations
      case '23502': // not_null_violation
        return {
          userMessage: 'Required field is missing.',
          technicalDetails: pgError.message,
          code: pgError.code,
          table: context?.table,
          queryName: context?.queryName,
          retryable: false,
        };
      
      // Row not found (PGRST116)
      case 'PGRST116':
        return {
          userMessage: 'Record not found.',
          technicalDetails: `No data found for ${context?.operation || 'query'} in ${context?.table || 'table'}`,
          code: pgError.code,
          table: context?.table,
          queryName: context?.queryName,
          retryable: false,
        };
      
      default:
        return {
          userMessage: 'An unexpected database error occurred.',
          technicalDetails: pgError.message,
          code: pgError.code,
          table: context?.table,
          queryName: context?.queryName,
          retryable: false,
        };
    }
  }
  
  // Handle network/connection errors
  if (error instanceof Error) {
    if (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('connection') ||
      error.message.includes('timeout')
    ) {
      return {
        userMessage: 'Connection issue. Please check your internet connection.',
        technicalDetails: error.message,
        queryName: context?.queryName,
        retryable: true,
      };
    }
    
    // Auth errors
    if (error.message.includes('JWT') || error.message.includes('auth')) {
      return {
        userMessage: 'Authentication error. Please sign in again.',
        technicalDetails: error.message,
        queryName: context?.queryName,
        retryable: false,
      };
    }
    
    return {
      userMessage: 'An error occurred. Please try again.',
      technicalDetails: error.message,
      queryName: context?.queryName,
      retryable: true,
    };
  }
  
  // Unknown error type
  return {
    userMessage: 'An unexpected error occurred.',
    technicalDetails: String(error),
    queryName: context?.queryName,
    retryable: true,
  };
}

/**
 * Formats error for console logging (dev mode)
 */
export function formatErrorForLog(
  mappedError: MappedError,
  originalError?: unknown
): string {
  const parts = [
    `[${mappedError.queryName || 'Query'}]`,
    mappedError.userMessage,
  ];
  
  if (mappedError.technicalDetails) {
    parts.push(`\nDetails: ${mappedError.technicalDetails}`);
  }
  
  if (mappedError.code) {
    parts.push(`\nCode: ${mappedError.code}`);
  }
  
  if (mappedError.table) {
    parts.push(`\nTable: ${mappedError.table}`);
  }
  
  if (mappedError.column) {
    parts.push(`\nColumn: ${mappedError.column}`);
  }
  
  if (originalError) {
    parts.push(`\nOriginal: ${JSON.stringify(originalError, null, 2)}`);
  }
  
  return parts.join(' ');
}

/**
 * Helper to create RLS-specific error messages with hints
 */
export function createRLSError(resource: string, action: string): MappedError {
  return {
    userMessage: `You don't have permission to ${action} ${resource}.`,
    technicalDetails: `RLS policy blocked ${action} operation on ${resource}`,
    code: '42501',
    retryable: false,
  };
}

/**
 * Helper to create schema mismatch error with migration hint
 */
export function createSchemaMismatchError(
  table: string,
  column: string,
  queryName: string
): MappedError {
  return {
    userMessage: 'App needs an update. Please contact support.',
    technicalDetails: `Column "${column}" not found in table "${table}". Database schema may have changed.`,
    code: '42703',
    table,
    column,
    queryName,
    retryable: false,
  };
}

