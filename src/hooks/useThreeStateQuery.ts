import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export type ThreeState = 'loading' | 'error' | 'empty' | 'success';

export interface ThreeStateQueryResult<T> {
  state: ThreeState;
  data: T | undefined;
  error: Error | null;
  refetch: () => void;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  isSuccess: boolean;
}

export function useThreeStateQuery<T>(
  queryResult: UseQueryResult<T>,
  options: {
    emptyCondition?: (data: T | undefined) => boolean;
    timeout?: number; // in seconds
  } = {}
): ThreeStateQueryResult<T> {
  const { emptyCondition, timeout = 6 } = options;
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Handle timeout
  useEffect(() => {
    if (queryResult.isLoading && timeout > 0) {
      const timer = setTimeout(() => {
        setHasTimedOut(true);
      }, timeout * 1000);

      return () => clearTimeout(timer);
    } else {
      setHasTimedOut(false);
    }
  }, [queryResult.isLoading, timeout]);

  // Determine state
  const state: ThreeState = (() => {
    if (queryResult.isLoading && !hasTimedOut) {
      return 'loading';
    }
    
    if (queryResult.isError) {
      return 'error';
    }
    
    if (queryResult.isSuccess) {
      const isEmpty = emptyCondition ? emptyCondition(queryResult.data) : false;
      return isEmpty ? 'empty' : 'success';
    }
    
    return 'loading';
  })();

  return {
    state,
    data: queryResult.data,
    error: queryResult.error,
    refetch: queryResult.refetch,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    isEmpty: state === 'empty',
    isSuccess: state === 'success',
  };
}

// Common empty conditions
export const emptyConditions = {
  array: <T>(data: T[] | undefined) => !data || data.length === 0,
  object: <T>(data: T | undefined) => !data,
  string: (data: string | undefined) => !data || data.trim() === '',
};
