// @ts-nocheck
import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, Divider } from 'react-native-paper';
import { useAuth } from '@/src/contexts/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { profile } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Settings
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Account Information
          </Text>
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Email:
            </Text>
            <Text variant="bodyMedium">{profile?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Role:
            </Text>
            <Text variant="bodyMedium">{profile?.role?.toUpperCase()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              School Code:
            </Text>
            <Text variant="bodyMedium">{profile?.school_code}</Text>
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor="#dc2626"
      >
        Logout
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    marginBottom: 24,
  },
  card: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
    marginRight: 8,
    width: 100,
  },
  logoutButton: {
    marginTop: 16,
  },
});
