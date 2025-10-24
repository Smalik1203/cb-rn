import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useClassesList } from '@/src/features/classes/hooks/useClasses';
import { ClassListItem } from '@/src/features/classes/hooks/useClasses';

interface ClassSelectionContextType {
  selectedClass: ClassListItem | null;
  setSelectedClass: (classItem: ClassListItem | null) => void;
  classes: ClassListItem[];
  isLoading: boolean;
  error: Error | null;
  isSuperAdmin: boolean;
  shouldShowClassSelector: boolean;
}

const ClassSelectionContext = createContext<ClassSelectionContextType>({
  selectedClass: null,
  setSelectedClass: () => {},
  classes: [],
  isLoading: false,
  error: null,
  isSuperAdmin: false,
  shouldShowClassSelector: false,
});

export const useClassSelection = () => {
  const context = useContext(ClassSelectionContext);
  if (!context) {
    throw new Error('useClassSelection must be used within ClassSelectionProvider');
  }
  return context;
};

export const ClassSelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [selectedClass, setSelectedClass] = useState<ClassListItem | null>(null);
  
  const isSuperAdmin = profile?.role === 'superadmin' || profile?.role === 'cb_admin';
  const shouldShowClassSelector = isSuperAdmin;
  
  const { data: classes = [], isLoading, error } = useClassesList();


  // Auto-select first class for super admin if none selected
  useEffect(() => {
    if (isSuperAdmin && classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]);
    }
  }, [isSuperAdmin, classes, selectedClass]);

  // For non-super admins, use their assigned class
  useEffect(() => {
    if (!isSuperAdmin && profile?.class_instance_id && classes.length > 0) {
      const userClass = classes.find(cls => cls.id === profile.class_instance_id);
      if (userClass) {
        setSelectedClass(userClass);
      }
    }
  }, [isSuperAdmin, profile?.class_instance_id, classes]);

  const value: ClassSelectionContextType = {
    selectedClass,
    setSelectedClass,
    classes,
    isLoading,
    error,
    isSuperAdmin,
    shouldShowClassSelector,
  };

  return (
    <ClassSelectionContext.Provider value={value}>
      {children}
    </ClassSelectionContext.Provider>
  );
};
