import { QueryClient } from '@tanstack/react-query';

// Create React Query client with optimized configuration for mobile
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry logic: 0 for 4xx, 2 for 5xx
      retry: (failureCount, error: any) => {
        const status = error?.status || error?.response?.status;
        if (status >= 400 && status < 500) {
          return false; // Don't retry 4xx errors
        }
        return failureCount < 2; // Retry 5xx errors up to 2 times
      },
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus (useful for web)
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect by default (can be enabled per query)
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});

// Query key factories for consistent cache management
export const queryKeys = {
  // User related queries
  user: {
    all: ['user'],
    profile: (userId: string) => ['user', 'profile', userId],
    context: (userId: string) => ['user', 'context', userId],
  },
  
  // App scope related queries (include school_code, academic_year_id, class_instance_id)
  scope: {
    all: (schoolCode: string, academicYearId?: string, classInstanceId?: string) => 
      ['scope', schoolCode, academicYearId, classInstanceId].filter(Boolean),
  },
  
  // School related queries
  school: {
    all: ['school'],
    byId: (schoolId: string) => ['school', schoolId],
  },
  
  // Class instance related queries
  classInstance: {
    all: ['classInstance'],
    byId: (classInstanceId: string) => ['classInstance', classInstanceId],
    bySchool: (schoolCode: string, academicYearId?: string) => 
      ['classInstance', 'bySchool', schoolCode, academicYearId].filter(Boolean),
  },
  
  // Subject related queries
  subject: {
    all: ['subject'],
    byId: (subjectId: string) => ['subject', subjectId],
    bySchool: (schoolId: string) => ['subject', 'bySchool', schoolId],
  },
  
  // Timetable related queries
  timetable: {
    all: ['timetable'],
    byClass: (classInstanceId: string) => ['timetable', 'byClass', classInstanceId],
    byClassAndDate: (classInstanceId: string, date: string) => 
      ['timetable', 'byClass', classInstanceId, 'date', date],
  },
  
  // Attendance related queries
  attendance: {
    all: ['attendance'],
    byClass: (classInstanceId: string, schoolCode: string) => 
      ['attendance', 'byClass', classInstanceId, schoolCode],
    byClassAndDate: (classInstanceId: string, date: string, schoolCode: string) => 
      ['attendance', 'byClass', classInstanceId, 'date', date, schoolCode],
    stats: (classInstanceId: string, startDate: string, endDate: string, schoolCode: string) => 
      ['attendance', 'stats', classInstanceId, startDate, endDate, schoolCode],
  },
  
  // Test related queries
  test: {
    all: ['test'],
    byId: (testId: string) => ['test', testId],
    byClass: (classInstanceId: string) => ['test', 'byClass', classInstanceId],
    submissions: (testId: string) => ['test', 'submissions', testId],
  },
  
  // Fee related queries
  fee: {
    all: ['fee'],
    byStudent: (studentId: string, schoolCode: string, academicYearId: string) => 
      ['fee', 'byStudent', studentId, schoolCode, academicYearId],
    byClass: (classInstanceId: string, schoolCode: string, academicYearId: string) => 
      ['fee', 'byClass', classInstanceId, schoolCode, academicYearId],
    summary: (schoolCode: string, month: string) => ['fee', 'summary', schoolCode, month],
  },
  
  // Assignment related queries
  assignment: {
    all: ['assignment'],
    byId: (assignmentId: string) => ['assignment', assignmentId],
    byClass: (classInstanceId: string) => ['assignment', 'byClass', classInstanceId],
    submissions: (assignmentId: string) => ['assignment', 'submissions', assignmentId],
  },
  
  // Learning resource related queries
  learningResource: {
    all: ['learningResource'],
    byId: (resourceId: string) => ['learningResource', resourceId],
    bySchool: (schoolId: string) => ['learningResource', 'bySchool', schoolId],
    bySubject: (subjectId: string) => ['learningResource', 'bySubject', subjectId],
  },
  
  // Analytics related queries
  analytics: {
    all: ['analytics'],
    attendanceStats: (classInstanceId: string, startDate: string, endDate: string) => 
      ['analytics', 'attendanceStats', classInstanceId, startDate, endDate],
    feeSummary: (schoolId: string, month: string) => 
      ['analytics', 'feeSummary', schoolId, month],
    studentPerformance: (studentId: string, academicYearId: string) => 
      ['analytics', 'studentPerformance', studentId, academicYearId],
  },
};

// Helper function to invalidate related queries
export const invalidateQueries = {
  // Invalidate all user-related queries
  user: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.user.profile(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.user.context(userId) });
  },
  
  // Invalidate all class-related queries
  classInstance: (classInstanceId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.classInstance.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.classInstance.byId(classInstanceId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.timetable.byClass(classInstanceId) });
    // queryClient.invalidateQueries({ queryKey: queryKeys.attendance.byClass(classInstanceId, '') });
    queryClient.invalidateQueries({ queryKey: queryKeys.test.byClass(classInstanceId) });
    // queryClient.invalidateQueries({ queryKey: queryKeys.assignment.byClass(classInstanceId) });
  },
  
  // Invalidate all school-related queries
  school: (schoolId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.school.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.school.byId(schoolId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.classInstance.bySchool(schoolId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.subject.bySchool(schoolId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.learningResource.bySchool(schoolId) });
  },
};
