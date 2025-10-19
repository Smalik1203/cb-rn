import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { userMetadata } = useAuth();
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.welcome}>
              Welcome to ClassBridge
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              {userMetadata?.email}
            </Text>
            <Text variant="bodyMedium" style={styles.role}>
              Role: {userMetadata?.role?.toUpperCase()}
            </Text>
            <Text variant="bodyMedium" style={styles.schoolCode}>
              School Code: {userMetadata?.schoolCode}
            </Text>
          </Card.Content>
        </Card>

        <Text variant="titleLarge" style={styles.sectionTitle}>
          Quick Actions
        </Text>

        <Card style={styles.card} onPress={() => router.push('/timetable')}>
          <Card.Content>
            <Text variant="titleMedium">View Timetable</Text>
            <Text variant="bodyMedium">Check your daily schedule</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card} onPress={() => router.push('/attendance')}>
          <Card.Content>
            <Text variant="titleMedium">Attendance</Text>
            <Text variant="bodyMedium">Mark or view attendance records</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card} onPress={() => router.push('/fees')}>
          <Card.Content>
            <Text variant="titleMedium">Fees</Text>
            <Text variant="bodyMedium">View fee details and payments</Text>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  welcomeCard: {
    marginBottom: 24,
    backgroundColor: '#667eea',
  },
  welcome: {
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    color: '#ffffff',
    marginBottom: 4,
  },
  role: {
    color: '#ffffff',
    marginBottom: 4,
  },
  schoolCode: {
    color: '#ffffff',
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 12,
  },
});
