import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useClassSelection } from '../../src/contexts/ClassSelectionContext';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/design-system';
import { FeeComponents, FeePlans } from '../../src/components/fees';
import { Settings, CreditCard } from 'lucide-react-native';

export default function FeesScreen() {
  const { scope } = useClassSelection();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<'components' | 'plans'>('components');

  // Update active tab based on URL parameter
  useEffect(() => {
    if (tab === 'components' || tab === 'plans') {
      setActiveTab(tab);
    } else {
      // Default to components if no tab specified
      setActiveTab('components');
    }
  }, [tab]);


  return (
      <View style={styles.container}>
        {/* Segmented Control Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'components' && styles.tabButtonActive]}
            onPress={() => setActiveTab('components')}
          >
            <Settings size={18} color={activeTab === 'components' ? colors.primary[600] : colors.text.secondary} />
            <Text style={[styles.tabText, activeTab === 'components' && styles.tabTextActive]}>
              Components
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'plans' && styles.tabButtonActive]}
            onPress={() => setActiveTab('plans')}
          >
            <CreditCard size={18} color={activeTab === 'plans' ? colors.primary[600] : colors.text.secondary} />
            <Text style={[styles.tabText, activeTab === 'plans' && styles.tabTextActive]}>
              Fee Plans
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content - Each component handles its own ScrollView */}
        {activeTab === 'components' && (
          <FeeComponents schoolCode={scope.school_code} />
        )}
        {activeTab === 'plans' && (
        <FeePlans />
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface.primary,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    ...shadows.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  tabButtonActive: {
    backgroundColor: colors.primary[50],
  },
  tabText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold as any,
  },
});
