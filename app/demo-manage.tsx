import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Text, Card, Chip, FAB } from 'react-native-paper';
import { Users, BookOpen, Calendar, Settings, UserPlus, Plus } from 'lucide-react-native';

const MANAGEMENT_OPTIONS = [
  { id: '1', title: 'Manage Students', count: 450, icon: Users, color: '#667eea' },
  { id: '2', title: 'Manage Teachers', count: 35, icon: UserPlus, color: '#10b981' },
  { id: '3', title: 'Manage Classes', count: 15, icon: BookOpen, color: '#f59e0b' },
  { id: '4', title: 'Academic Calendar', count: 12, icon: Calendar, color: '#ec4899' },
  { id: '5', title: 'School Settings', count: null, icon: Settings, color: '#8b5cf6' },
];

export default function DemoManageScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />

      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Manage</Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>School Administration</Text>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.statsCard} elevation={2}>
          <Card.Content>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>450</Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>35</Text>
                <Text style={styles.statLabel}>Teachers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>15</Text>
                <Text style={styles.statLabel}>Classes</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.section}>
          {MANAGEMENT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => Alert.alert(option.title, 'Feature demo - Management interface')}
            >
              <Card style={styles.optionCard} elevation={1}>
                <Card.Content style={styles.optionContent}>
                  <View style={styles.optionLeft}>
                    <View style={[styles.optionIcon, { backgroundColor: `${option.color}20` }]}>
                      <option.icon size={24} color={option.color} />
                    </View>
                    <View style={styles.optionInfo}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      {option.count && (
                        <Text style={styles.optionCount}>{option.count} records</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.arrow}>→</Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <Card style={styles.quickCard} elevation={2}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.quickTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickAction}>
                <View style={[styles.quickIcon, { backgroundColor: '#dbeafe' }]}>
                  <UserPlus size={20} color="#667eea" />
                </View>
                <Text style={styles.quickText}>Add Student</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction}>
                <View style={[styles.quickIcon, { backgroundColor: '#d1fae5' }]}>
                  <Plus size={20} color="#10b981" />
                </View>
                <Text style={styles.quickText}>Create Class</Text>
              </TouchableOpacity>
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
  content: { flex: 1 },
  statsCard: { margin: 16, marginBottom: 12, backgroundColor: '#ffffff' },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#6b7280' },
  statDivider: { width: 1, backgroundColor: '#e5e7eb' },
  section: { padding: 16 },
  optionCard: { marginBottom: 8, backgroundColor: '#ffffff' },
  optionContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  optionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '500', color: '#111827', marginBottom: 2 },
  optionCount: { fontSize: 13, color: '#6b7280' },
  arrow: { fontSize: 20, color: '#6b7280' },
  quickCard: { margin: 16, backgroundColor: '#ffffff' },
  quickTitle: { fontWeight: '600', marginBottom: 16, color: '#111827' },
  quickActions: { flexDirection: 'row', gap: 12 },
  quickAction: { flex: 1, alignItems: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 12 },
  quickIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickText: { fontSize: 14, fontWeight: '500', color: '#111827' },
});
