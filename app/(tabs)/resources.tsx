import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen } from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useClassSelection } from '@/src/contexts/ClassSelectionContext';
import { ClassSelector } from '@/src/components/ClassSelector';
import { LearningResources } from '@/src/components/learning-resources/LearningResources';
import { colors, typography, spacing, borderRadius, shadows, gradients } from '@/lib/design-system';

export default function ResourcesScreen() {
  const { profile } = useAuth();
  const { isSuperAdmin } = useClassSelection();

  const role = profile?.role || 'student';
  const canManageResources = role === 'admin' || role === 'superadmin' || role === 'cb_admin';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.primary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <BookOpen size={32} color={colors.text.inverse} />
            </View>
            <View>
              <Text variant="headlineSmall" style={styles.headerTitle}>
                Learning Resources
              </Text>
              <Text variant="bodyLarge" style={styles.headerSubtitle}>
                {canManageResources ? 'Manage and access learning materials' : 'Access learning materials and assignments'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ClassSelector />

      <LearningResources />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    paddingTop: spacing['12'],
    paddingBottom: spacing['8'],
    paddingHorizontal: spacing['6'],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['4'],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    marginBottom: spacing['1'],
  },
  headerSubtitle: {
    color: colors.text.inverse,
    opacity: 0.9,
  },
});
