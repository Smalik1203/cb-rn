import React from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import { StudentTimetableScreen } from '../../src/components/timetable/StudentTimetableScreen';
import { ModernTimetableScreen } from '../../src/components/timetable/ModernTimetableScreen';

export default function TimetableScreen() {
  const { profile } = useAuth();
  
  // Show appropriate timetable screen based on user role
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin' || profile?.role === 'cb_admin';
  
  if (isAdmin) {
    return <ModernTimetableScreen />;
  } else {
    return <StudentTimetableScreen />;
  }
}
