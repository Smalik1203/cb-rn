import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useRef, useEffect } from 'react';

export function useTimetable(classId?: string) {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return useQuery({
    queryKey: ['timetable', classId],
    queryFn: async () => {
      abortControllerRef.current = new AbortController();
      return api.timetable.getByClass(classId!);
    },
    enabled: !!classId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

export function useSchoolTimetable(schoolCode?: string) {
  return useQuery({
    queryKey: ['timetable', 'school', schoolCode],
    queryFn: async () => api.timetable.getBySchool(schoolCode!),
    enabled: !!schoolCode,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

export function useTimetableRange(classId?: string, startDate?: string, endDate?: string) {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return useQuery({
    queryKey: ['timetable', classId, startDate, endDate],
    queryFn: async () => {
      
      // TODO: Implement range-based timetable fetching
      // abortControllerRef.current = new AbortController();
      // return api.timetable.getByClassInRange(classId!, startDate!, endDate!, { signal: abortControllerRef.current.signal });
      return [];
    },
    enabled: !!classId && !!startDate && !!endDate,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}
