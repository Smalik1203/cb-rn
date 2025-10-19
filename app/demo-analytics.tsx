import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { Text, Card, SegmentedButtons, Chip } from 'react-native-paper';
import { TrendingUp, Users, Award, BookOpen, Target, BarChart } from 'lucide-react-native';

export default function DemoAnalyticsScreen() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />

      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Analytics</Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>Performance Insights</Text>
      </View>

      <SegmentedButtons
        value={period}
        onValueChange={(value) => setPeriod(value as any)}
        buttons={[
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
          { value: 'year', label: 'Year' },
        ]}
        style={styles.tabs}
      />

      <ScrollView style={styles.content}>
        <View style={styles.kpiGrid}>
          <Card style={styles.kpiCard} elevation={2}>
            <Card.Content style={styles.kpiContent}>
              <View style={[styles.kpiIcon, { backgroundColor: '#dbeafe' }]}>
                <Users size={24} color="#667eea" />
              </View>
              <Text style={styles.kpiValue}>92%</Text>
              <Text style={styles.kpiLabel}>Avg Attendance</Text>
              <Chip mode="flat" style={styles.trendChip}>↑ 5%</Chip>
            </Card.Content>
          </Card>

          <Card style={styles.kpiCard} elevation={2}>
            <Card.Content style={styles.kpiContent}>
              <View style={[styles.kpiIcon, { backgroundColor: '#d1fae5' }]}>
                <Award size={24} color="#10b981" />
              </View>
              <Text style={styles.kpiValue}>85%</Text>
              <Text style={styles.kpiLabel}>Pass Rate</Text>
              <Chip mode="flat" style={styles.trendChip}>↑ 12%</Chip>
            </Card.Content>
          </Card>

          <Card style={styles.kpiCard} elevation={2}>
            <Card.Content style={styles.kpiContent}>
              <View style={[styles.kpiIcon, { backgroundColor: '#fef3c7' }]}>
                <BookOpen size={24} color="#f59e0b" />
              </View>
              <Text style={styles.kpiValue}>78%</Text>
              <Text style={styles.kpiLabel}>Completion</Text>
              <Chip mode="flat" style={styles.trendChip}>↓ 3%</Chip>
            </Card.Content>
          </Card>

          <Card style={styles.kpiCard} elevation={2}>
            <Card.Content style={styles.kpiContent}>
              <View style={[styles.kpiIcon, { backgroundColor: '#fce7f3' }]}>
                <Target size={24} color="#ec4899" />
              </View>
              <Text style={styles.kpiValue}>4.2</Text>
              <Text style={styles.kpiLabel}>Avg Score</Text>
              <Chip mode="flat" style={styles.trendChip}>↑ 0.3</Chip>
            </Card.Content>
          </Card>
        </View>

        <Card style={styles.chartCard} elevation={2}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>Attendance Trend</Text>
            <View style={styles.chartPlaceholder}>
              <BarChart size={64} color="#d1d5db" />
              <Text style={styles.chartText}>Chart visualization coming soon</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.chartCard} elevation={2}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>Subject Performance</Text>
            <View style={styles.subjectList}>
              {['Mathematics', 'Physics', 'Chemistry', 'English'].map((subject) => (
                <View key={subject} style={styles.subjectItem}>
                  <Text style={styles.subjectName}>{subject}</Text>
                  <Text style={styles.subjectScore}>4.{Math.floor(Math.random() * 9)}/5.0</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#667eea', padding: 20, paddingTop: 50, elevation: 4 },
  headerTitle: { color: '#ffffff', fontWeight: 'bold' },
  headerSubtitle: { color: '#e0e7ff', marginTop: 4 },
  tabs: { margin: 16, marginBottom: 8 },
  content: { flex: 1 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  kpiCard: { flex: 1, minWidth: '45%', backgroundColor: '#ffffff' },
  kpiContent: { alignItems: 'center', paddingVertical: 12 },
  kpiIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  kpiValue: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  kpiLabel: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  trendChip: { backgroundColor: '#d1fae5' },
  chartCard: { margin: 16, marginTop: 8, backgroundColor: '#ffffff' },
  chartTitle: { fontWeight: '600', marginBottom: 16, color: '#111827' },
  chartPlaceholder: { alignItems: 'center', padding: 40 },
  chartText: { marginTop: 12, color: '#6b7280' },
  subjectList: { gap: 12 },
  subjectItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#f9fafb', borderRadius: 8 },
  subjectName: { fontSize: 15, fontWeight: '500', color: '#111827' },
  subjectScore: { fontSize: 15, fontWeight: 'bold', color: '#667eea' },
});
