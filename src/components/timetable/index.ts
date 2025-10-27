// Test file to verify imports work correctly
import { StudentTimetableScreen } from './StudentTimetableScreen';
import { UnifiedTimetableScreen } from './UnifiedTimetableScreen';
import { ModernTimetableScreen } from './ModernTimetableScreen';
import { useSyllabusLoader } from '../../hooks/useSyllabusLoader';
import { useStudentTimetable } from '../../hooks/useStudentTimetable';
import { useUnifiedTimetable } from '../../hooks/useUnifiedTimetable';
import { useSubjects, useAdmin } from '../../hooks/useSubjects';

// This file is just to test imports - it should not be used in production
export {
  StudentTimetableScreen,
  UnifiedTimetableScreen,
  ModernTimetableScreen,
  useSyllabusLoader,
  useStudentTimetable,
  useUnifiedTimetable,
  useSubjects,
  useAdmin,
};
