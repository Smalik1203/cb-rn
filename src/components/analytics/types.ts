// Analytics Type Definitions

export interface SuperAdminAnalytics {
  attendance: {
    avgRate: number;
    trend7Days: Array<{ date: string; rate: number }>;
    trend30Days: Array<{ date: string; rate: number }>;
    classesByConsistency: Array<{
      classId: string;
      className: string;
      avgRate: number;
      trend: 'improving' | 'stable';
    }>;
  };
  academics: {
    avgScoreBySubject: Array<{
      subjectId: string;
      subjectName: string;
      avgScore: number;
      participationRate: number;
    }>;
    participationRate: number;
  };
  fees: {
    realizationRate: number;
    totalBilled: number;
    totalCollected: number;
    totalOutstanding: number;
    agingBuckets: {
      current: number;
      '30to60': number;
      '60to90': number;
      over90: number;
    };
  };
  operations: {
    timetableCoverage: number;
    teacherLoadBalance: Array<{
      teacherId: string;
      teacherName: string;
      totalPeriods: number;
      conductedPeriods: number;
    }>;
  };
  syllabus: {
    overallProgress: number;
    progressBySubject: Array<{
      subjectId: string;
      subjectName: string;
      completedTopics: number;
      totalTopics: number;
      progress: number;
    }>;
    progressByClass: Array<{
      classId: string;
      className: string;
      progress: number;
    }>;
  };
  engagement: {
    testParticipation: number;
    taskSubmissionRate: number;
  };
  summary: {
    totalStudents: number;
    totalClasses: number;
    totalTeachers: number;
    activeAcademicYear: string;
  };
}

export interface AdminAnalytics {
  presence: {
    weeklyTrend: Array<{
      date: string;
      rate: number;
      presentCount: number;
      totalStudents: number;
    }>;
    steadyParticipation: number;
    currentRate: number;
  };
  learning: {
    quizAvgTrend: Array<{ date: string; avgScore: number }>;
    assignmentOnTimeRate: number;
    subjectCompletion: Array<{
      subjectId: string;
      subjectName: string;
      completionPercent: number;
    }>;
  };
  syllabus: {
    progressBySubject: Array<{
      subjectId: string;
      subjectName: string;
      completedTopics: number;
      totalTopics: number;
      progress: number;
    }>;
  };
  operations: {
    plannedPeriods: number;
    conductedPeriods: number;
    coveragePercent: number;
    weeklyTrend: Array<{
      date: string;
      planned: number;
      conducted: number;
      coverage: number;
    }>;
  };
  engagement: {
    quizParticipation: number;
    assignmentParticipation: number;
  };
  summary: {
    className: string;
    totalStudents: number;
    classTeacher: string;
  };
}

export interface StudentAnalytics {
  attendanceRhythm: {
    daysAttendedThisMonth: number;
    totalDaysThisMonth: number;
    fourWeekTrend: Array<{
      week: number;
      presentDays: number;
      totalDays: number;
      rate: number;
    }>;
    currentRate: number;
  };
  learning: {
    subjectScoreTrend: Array<{
      subjectId: string;
      subjectName: string;
      avgScore: number;
      testCount: number;
      recentTrend: Array<{ date: string; score: number }>;
    }>;
    assignmentOnTimeStreak: number;
    totalAssignments: number;
  };
  progressHighlights: {
    closestToPersonalBest: {
      subjectId: string;
      subjectName: string;
      bestScore: number;
      recentScore: number;
    };
    syllabusProgress: Array<{
      subjectId: string;
      subjectName: string;
      completedTopics: number;
      totalTopics: number;
      progress: number;
    }>;
  };
  fees: {
    totalBilled: number;
    totalPaid: number;
    totalDue: number;
    lastPaymentDate: string | null;
    status: 'paid' | 'current' | 'overdue' | 'no_billing';
  };
  summary: {
    studentName: string;
    className: string;
    schoolName: string;
  };
}

export type TimePeriod = 'daily' | 'weekly' | 'monthly';
export type AnalyticsFeature = 'attendance' | 'fees' | 'learning' | 'operations' | 'overview';

// Helper function to calculate date range based on time period
export function getDateRangeForPeriod(timePeriod: TimePeriod): { startDate: string; endDate: string } {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999); // End of today
  
  const startDate = new Date();
  
  switch (timePeriod) {
    case 'daily':
      // Last 7 days
      startDate.setDate(startDate.getDate() - 6); // Include today (6 days ago + today = 7 days)
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      // Last 30 days (4 weeks + buffer)
      startDate.setDate(startDate.getDate() - 29); // Include today (29 days ago + today = 30 days)
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      // Last 90 days (3 months)
      startDate.setDate(startDate.getDate() - 89); // Include today (89 days ago + today = 90 days)
      startDate.setHours(0, 0, 0, 0);
      break;
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

