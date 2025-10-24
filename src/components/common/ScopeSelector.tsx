import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Menu, Divider, Chip } from 'react-native-paper';
import { ChevronDown, School, Calendar, Users } from 'lucide-react-native';
import { useAppScope } from '@/src/contexts/AppScopeContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { listClasses, listAcademicYears } from '@/src/data/queries';
import { colors, spacing } from '@/lib/design-system';

interface ScopeSelectorProps {
  showClassSelector?: boolean;
  showYearSelector?: boolean;
  compact?: boolean;
}

export const ScopeSelector: React.FC<ScopeSelectorProps> = ({
  showClassSelector = true,
  showYearSelector = true,
  compact = false,
}) => {
  const { scope, setScope } = useAppScope();
  const { profile } = useAuth();
  const [showClassMenu, setShowClassMenu] = useState(false);
  const [showYearMenu, setShowYearMenu] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  // Only show for admins/superadmins with multiple classes
  const canChangeScope = profile?.role === 'admin' || profile?.role === 'superadmin';
  
  if (!canChangeScope || !scope.school_code) {
    return null;
  }

  const loadClasses = async () => {
    try {
      const result = await listClasses(scope.school_code!, scope.academic_year_id || undefined);
      if (result.data) {
        setClasses(result.data);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadAcademicYears = async () => {
    try {
      const result = await listAcademicYears(scope.school_code!);
      if (result.data) {
        setAcademicYears(result.data);
      }
    } catch (error) {
      console.error('Failed to load academic years:', error);
    }
  };

  const handleClassSelect = async (classInstance: any) => {
    await setScope({ class_instance_id: classInstance.id });
    setShowClassMenu(false);
  };

  const handleYearSelect = async (year: any) => {
    await setScope({ academic_year_id: year.id });
    setShowYearMenu(false);
    // Reload classes for the new academic year
    loadClasses();
  };

  const getCurrentClassName = () => {
    if (!scope.class_instance_id) return 'All Classes';
    const currentClass = classes.find(c => c.id === scope.class_instance_id);
    return currentClass ? `Grade ${currentClass.grade}-${currentClass.section}` : 'Select Class';
  };

  const getCurrentYearName = () => {
    if (!scope.academic_year_id) return 'Select Year';
    const currentYear = academicYears.find(y => y.id === scope.academic_year_id);
    return currentYear ? `${currentYear.year_start}-${currentYear.year_end}` : 'Select Year';
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Chip 
          icon={() => <School size={16} color={colors.primary} />}
          onPress={loadClasses}
          style={styles.compactChip}
        >
          {getCurrentClassName()}
        </Chip>
        {showYearSelector && (
          <Chip 
            icon={() => <Calendar size={16} color={colors.primary} />}
            onPress={loadAcademicYears}
            style={styles.compactChip}
          >
            {getCurrentYearName()}
          </Chip>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showClassSelector && (
        <Menu
          visible={showClassMenu}
          onDismiss={() => setShowClassMenu(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => {
                loadClasses();
                setShowClassMenu(true);
              }}
              icon={() => <Users size={16} color={colors.primary} />}
              contentStyle={styles.buttonContent}
            >
              {getCurrentClassName()}
            </Button>
          }
        >
          <Menu.Item
            onPress={() => handleClassSelect({ id: null })}
            title="All Classes"
            leadingIcon={() => <Users size={16} />}
          />
          <Divider />
          {classes.map((classInstance) => (
            <Menu.Item
              key={classInstance.id}
              onPress={() => handleClassSelect(classInstance)}
              title={`Grade ${classInstance.grade}-${classInstance.section}`}
              leadingIcon={() => <Users size={16} />}
            />
          ))}
        </Menu>
      )}

      {showYearSelector && (
        <Menu
          visible={showYearMenu}
          onDismiss={() => setShowYearMenu(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => {
                loadAcademicYears();
                setShowYearMenu(true);
              }}
              icon={() => <Calendar size={16} color={colors.primary} />}
              contentStyle={styles.buttonContent}
            >
              {getCurrentYearName()}
            </Button>
          }
        >
          {academicYears.map((year) => (
            <Menu.Item
              key={year.id}
              onPress={() => handleYearSelect(year)}
              title={`${year.year_start}-${year.year_end}`}
              leadingIcon={() => <Calendar size={16} />}
            />
          ))}
        </Menu>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  compactContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  compactChip: {
    backgroundColor: colors.surface.primary,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
