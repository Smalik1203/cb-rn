/**
 * Safe timeout utilities that properly clear timers and handle soft timeouts
 */

export interface TimeoutOptions {
  /** Timeout duration in milliseconds */
  timeoutMs: number;
  /** Whether to throw on timeout (hard) or return undefined (soft) */
  throwOnTimeout?: boolean;
  /** Custom error message for timeout */
  timeoutMessage?: string;
}

export interface TimeoutResult<T> {
  result?: T;
  timedOut: boolean;
  error?: Error;
}

/**
 * Creates a timeout promise that can be properly cancelled
 */
export function createTimeoutPromise(options: TimeoutOptions): {
  promise: Promise<never>;
  clear: () => void;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  const promise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(options.timeoutMessage || `Operation timed out after ${options.timeoutMs}ms`);
      reject(error);
    }, options.timeoutMs);
  });
  
  const clear = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return { promise, clear };
}

/**
 * Safely races a promise against a timeout, with proper cleanup
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  options: TimeoutOptions
): Promise<TimeoutResult<T>> {
  const { promise: timeoutPromise, clear: clearTimeout } = createTimeoutPromise(options);
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(); // Clear timeout since we got the result
    return { result, timedOut: false };
  } catch (error) {
    clearTimeout(); // Always clear timeout
    
    if (error instanceof Error && error.message.includes('timed out')) {
      if (options.throwOnTimeout) {
        throw error;
      }
      return { timedOut: true, error };
    }
    
    // Re-throw non-timeout errors
    throw error;
  }
}

/**
 * Safely races a Supabase query against a timeout, with proper cleanup
 */
export async function withTimeoutSupabase<T>(
  query: Promise<{ data: T | null; error: any }>,
  options: TimeoutOptions
): Promise<TimeoutResult<{ data: T | null; error: any }>> {
  const { promise: timeoutPromise, clear: clearTimeout } = createTimeoutPromise(options);
  
  try {
    const result = await Promise.race([query, timeoutPromise]);
    clearTimeout(); // Clear timeout since we got the result
    return { result, timedOut: false };
  } catch (error) {
    clearTimeout(); // Always clear timeout
    
    if (error instanceof Error && error.message.includes('timed out')) {
      if (options.throwOnTimeout) {
        throw error;
      }
      return { timedOut: true, error };
    }
    
    // Re-throw non-timeout errors
    throw error;
  }
}

/**
 * Retry a promise with exponential backoff
 */
export async function withRetry<T>(
  promiseFactory: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 500,
    maxDelayMs = 2000,
    backoffMultiplier = 2
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await promiseFactory();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelayMs * Math.pow(backoffMultiplier, attempt - 1),
        maxDelayMs
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Single-flight promise cache to prevent duplicate requests
 */
export class SingleFlightCache<T> {
  private cache = new Map<string, Promise<T>>();
  
  async execute<R>(
    key: string,
    promiseFactory: () => Promise<R>
  ): Promise<R> {
    // Check if there's already a pending request
    const existing = this.cache.get(key);
    if (existing) {
      return existing as unknown as Promise<R>;
    }
    
    // Create new promise and cache it
    const promise = promiseFactory().finally(() => {
      // Remove from cache when done
      this.cache.delete(key);
    });
    
    this.cache.set(key, promise as unknown as Promise<T>);
    return promise;
  }
  
  clear(): void {
    this.cache.clear();
  }
}
