/**
 * Input sanitization utilities
 * Prevents XSS and ensures data integrity
 */

/**
 * Sanitize a string by removing potentially dangerous characters
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }
  
  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters (except newline, carriage return, tab)
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Sanitize email by normalizing and validating format
 * @param email - Email to sanitize
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  const sanitized = sanitizeString(email).toLowerCase();
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }
  
  return sanitized;
}

/**
 * Sanitize phone number - keep only digits and optional + prefix
 * @param phone - Phone number to sanitize
 * @returns Sanitized phone number
 */
export function sanitizePhone(phone: string | number): string {
  if (typeof phone === 'number') {
    return String(phone);
  }
  
  if (!phone) return '';
  
  // Remove all non-digit characters except leading +
  const cleaned = String(phone).replace(/[^\d+]/g, '');
  
  // If starts with +, keep it, otherwise remove any remaining +
  if (cleaned.startsWith('+')) {
    return cleaned.replace(/\+/g, '+').replace(/\++/g, '+');
  }
  
  return cleaned.replace(/\+/g, '');
}

/**
 * Sanitize code/alphanumeric identifier
 * @param code - Code to sanitize
 * @returns Uppercase alphanumeric code
 */
export function sanitizeCode(code: string): string {
  if (!code) return '';
  
  return sanitizeString(code)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * Sanitize name - allow letters, spaces, hyphens, apostrophes
 * @param name - Name to sanitize
 * @returns Sanitized name
 */
export function sanitizeName(name: string): string {
  if (!name) return '';
  
  return sanitizeString(name)
    .replace(/[^a-zA-Z\s\-']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitize text content - remove HTML tags
 * @param text - Text to sanitize
 * @returns Plain text without HTML
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  return sanitizeString(text)
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode common HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with isValid and requirements
 */
export function validatePassword(password: string): {
  isValid: boolean;
  requirements: {
    minLength: boolean;
    hasLetter: boolean;
    hasNumber: boolean;
  };
  strength: 'weak' | 'medium' | 'strong';
} {
  const minLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  const isValid = minLength && hasLetter && hasNumber;
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (password.length >= 12 && hasLetter && hasNumber) {
    strength = 'strong';
  } else if (password.length >= 8 && (hasLetter || hasNumber)) {
    strength = 'medium';
  }
  
  return {
    isValid,
    requirements: {
      minLength,
      hasLetter,
      hasNumber,
    },
    strength,
  };
}

