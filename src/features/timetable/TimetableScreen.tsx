import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { StudentTimetableScreen } from '../../components/timetable/StudentTimetableScreen';
import { ModernTimetableScreen } from '../../components/timetable/ModernTimetableScreen';

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
