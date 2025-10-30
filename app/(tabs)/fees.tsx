import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useClassSelection } from '../../src/contexts/ClassSelectionContext';
import { colors, spacing } from '../../lib/design-system';
import { FeeComponents, FeePlans } from '../../src/components/fees';

export default function FeesScreen() {
  const { profile } = useAuth();
  const { selectedClass, scope, isSuperAdmin } = useClassSelection();
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
});
