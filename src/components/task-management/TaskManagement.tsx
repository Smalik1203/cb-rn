import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Chip, SegmentedButtons, ActivityIndicator, Portal, Modal, TextInput } from 'react-native-paper';
import { CheckSquare, Calendar, Clock, User, BookOpen, AlertCircle, Plus, Edit, Trash2, Flag } from 'lucide-react-native';
import { useTaskManagement } from '@/src/contexts/TaskManagementContext';
import { useClassSelection } from '@/src/contexts/ClassSelectionContext';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/design-system';

export const TaskManagement: React.FC = () => {
  const { state, actions } = useTaskManagement();
  const { selectedClass } = useClassSelection();
  const [activeTab, setActiveTab] = useState<'all' | 'assignments' | 'projects'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    task_type: 'assignment' as 'assignment' | 'project' | 'homework' | 'exam' | 'other',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'overdue',
    total_marks: '',
    is_published: true,
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return colors.error[600];
      case 'high':
        return colors.warning[600];
      case 'medium':
        return colors.info[600];
      case 'low':
        return colors.success[600];
      default:
        return colors.text.secondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success[600];
      case 'in_progress':
        return colors.info[600];
      case 'overdue':
        return colors.error[600];
      case 'pending':
        return colors.warning[600];
      default:
        return colors.text.secondary;
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <CheckSquare size={16} color={colors.primary[600]} />;
      case 'project':
        return <BookOpen size={16} color={colors.info[600]} />;
      case 'homework':
        return <User size={16} color={colors.warning[600]} />;
      case 'exam':
        return <AlertCircle size={16} color={colors.error[600]} />;
      default:
        return <CheckSquare size={16} color={colors.text.secondary} />;
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      task_type: 'assignment',
      due_date: '',
      priority: 'medium',
      status: 'pending',
      total_marks: '',
      is_published: true,
    });
    setShowAddModal(true);
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      task_type: task.task_type,
      due_date: task.due_date || '',
      priority: task.priority,
      status: task.status,
      total_marks: task.total_marks?.toString() || '',
      is_published: task.is_published,
    });
    setShowAddModal(true);
  };

  const handleSaveTask = async () => {
    try {
      const taskData = {
        ...taskForm,
        total_marks: taskForm.total_marks ? parseInt(taskForm.total_marks) : undefined,
        subject_id: null, // Could be selected from a dropdown
        class_instance_id: selectedClass?.id || null,
        assigned_to: null, // For individual assignments
        school_code: '', // Will be set by the context
        assigned_by: '', // Will be set by the context
      };

      if (editingTask) {
        await actions.updateTask({
          ...editingTask,
          ...taskData,
        });
      } else {
        await actions.addTask(taskData);
      }
      
      setShowAddModal(false);
      setTaskForm({
        title: '',
        description: '',
        task_type: 'assignment',
        due_date: '',
        priority: 'medium',
        status: 'pending',
        total_marks: '',
        is_published: true,
      });
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await actions.deleteTask(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const renderTasks = (tasks: any[]) => {
    if (state.loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading tasks...
          </Text>
        </View>
      );
    }

    if (state.error) {
      return (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.errorText}>
              Error: {state.error}
            </Text>
            <Button mode="outlined" onPress={() => actions.loadTasks()} style={styles.retryButton}>
              Retry
            </Button>
          </Card.Content>
        </Card>
      );
    }

    if (tasks.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.emptyText}>
              No tasks available.
            </Text>
            <Button mode="contained" onPress={handleAddTask} style={styles.addButton}>
              Add Task
            </Button>
          </Card.Content>
        </Card>
      );
    }

    return (
      <ScrollView style={styles.tasksList} showsVerticalScrollIndicator={false}>
        {tasks.map((task) => (
          <Card key={task.id} style={styles.taskCard}>
            <Card.Content>
              <View style={styles.taskHeader}>
                <View style={styles.taskInfo}>
                  <View style={styles.taskTitleRow}>
                    {getTaskTypeIcon(task.task_type)}
                    <Text variant="titleMedium" style={styles.taskTitle}>
                      {task.title}
                    </Text>
                  </View>
                  {task.description && (
                    <Text variant="bodySmall" style={styles.taskDescription}>
                      {task.description}
                    </Text>
                  )}
                </View>
                <View style={styles.taskActions}>
                  <TouchableOpacity
                    onPress={() => handleEditTask(task)}
                    style={styles.actionButton}
                  >
                    <Edit size={16} color={colors.primary[600]} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteTask(task.id)}
                    style={styles.actionButton}
                  >
                    <Trash2 size={16} color={colors.error[600]} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.taskDetails}>
                <Chip
                  mode="outlined"
                  style={[styles.typeChip, { borderColor: getPriorityColor(task.priority) }]}
                  textStyle={{ color: getPriorityColor(task.priority) }}
                  icon={() => <Flag size={12} color={getPriorityColor(task.priority)} />}
                >
                  {task.priority.toUpperCase()}
                </Chip>
                
                <Chip
                  mode="flat"
                  style={[styles.statusChip, { backgroundColor: getStatusColor(task.status) + '20' }]}
                  textStyle={{ color: getStatusColor(task.status) }}
                >
                  {task.status.replace('_', ' ').toUpperCase()}
                </Chip>

                {task.total_marks && (
                  <Text variant="bodySmall" style={styles.marksText}>
                    {task.total_marks} marks
                  </Text>
                )}
              </View>

              <View style={styles.taskMeta}>
                {task.subject && (
                  <View style={styles.metaItem}>
                    <BookOpen size={14} color={colors.text.secondary} />
                    <Text variant="bodySmall" style={styles.metaText}>
                      {task.subject.subject_name}
                    </Text>
                  </View>
                )}
                {task.class_instance && (
                  <View style={styles.metaItem}>
                    <User size={14} color={colors.text.secondary} />
                    <Text variant="bodySmall" style={styles.metaText}>
                      Grade {task.class_instance.grade}-{task.class_instance.section}
                    </Text>
                  </View>
                )}
                {task.due_date && (
                  <View style={styles.metaItem}>
                    <Calendar size={14} color={isOverdue(task.due_date) ? colors.error[600] : colors.text.secondary} />
                    <Text 
                      variant="bodySmall" 
                      style={[
                        styles.metaText,
                        isOverdue(task.due_date) && { color: colors.error[600] }
                      ]}
                    >
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                <View style={styles.metaItem}>
                  <Clock size={14} color={colors.text.secondary} />
                  <Text variant="bodySmall" style={styles.metaText}>
                    {new Date(task.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    );
  };

  const getCurrentTasks = () => {
    switch (activeTab) {
      case 'assignments':
        return state.assignments;
      case 'projects':
        return state.projects;
      default:
        return state.tasks;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'all' | 'assignments' | 'projects')}
          buttons={[
            { value: 'all', label: 'All Tasks', icon: 'format-list-bulleted' },
            { value: 'assignments', label: 'Assignments', icon: 'assignment' },
            { value: 'projects', label: 'Projects', icon: 'folder' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            Task Management
          </Text>
          <Button
            mode="contained"
            onPress={handleAddTask}
            icon={() => <Plus size={16} color={colors.text.inverse} />}
            style={styles.addButton}
          >
            Add Task
          </Button>
        </View>
        {renderTasks(getCurrentTasks())}
      </View>

      {/* Add/Edit Task Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {editingTask ? 'Edit Task' : 'Add Task'}
          </Text>

          <TextInput
            label="Title"
            value={taskForm.title}
            onChangeText={(text) => setTaskForm({ ...taskForm, title: text })}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Description"
            value={taskForm.description}
            onChangeText={(text) => setTaskForm({ ...taskForm, description: text })}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
          />

          <SegmentedButtons
            value={taskForm.task_type}
            onValueChange={(value) => setTaskForm({ ...taskForm, task_type: value as any })}
            buttons={[
              { value: 'assignment', label: 'Assignment' },
              { value: 'project', label: 'Project' },
              { value: 'homework', label: 'Homework' },
              { value: 'exam', label: 'Exam' },
              { value: 'other', label: 'Other' },
            ]}
            style={styles.segmentedButtons}
          />

          <View style={styles.row}>
            <TextInput
              label="Due Date"
              value={taskForm.due_date}
              onChangeText={(text) => setTaskForm({ ...taskForm, due_date: text })}
              style={[styles.input, styles.halfInput]}
              mode="outlined"
              placeholder="YYYY-MM-DD"
            />
            <TextInput
              label="Total Marks"
              value={taskForm.total_marks}
              onChangeText={(text) => setTaskForm({ ...taskForm, total_marks: text })}
              style={[styles.input, styles.halfInput]}
              mode="outlined"
              keyboardType="numeric"
            />
          </View>

          <SegmentedButtons
            value={taskForm.priority}
            onValueChange={(value) => setTaskForm({ ...taskForm, priority: value as any })}
            buttons={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
            style={styles.segmentedButtons}
          />

          <SegmentedButtons
            value={taskForm.status}
            onValueChange={(value) => setTaskForm({ ...taskForm, status: value as any })}
            buttons={[
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
            ]}
            style={styles.segmentedButtons}
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowAddModal(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveTask}
              style={styles.saveButton}
            >
              {editingTask ? 'Update' : 'Save'}
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  tabContainer: {
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
  },
  segmentedButtons: {
    borderRadius: borderRadius.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing['4'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['4'],
  },
  headerTitle: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  addButton: {
    borderRadius: borderRadius.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['8'],
  },
  loadingText: {
    marginTop: spacing['2'],
    color: colors.text.secondary,
  },
  errorCard: {
    marginVertical: spacing['4'],
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.lg,
    borderColor: colors.error[200],
    borderWidth: 1,
  },
  errorText: {
    color: colors.error[600],
    marginBottom: spacing['2'],
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
  emptyCard: {
    marginVertical: spacing['4'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.secondary,
    marginBottom: spacing['3'],
  },
  tasksList: {
    flex: 1,
  },
  taskCard: {
    marginBottom: spacing['4'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing['3'],
  },
  taskInfo: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    marginBottom: spacing['1'],
  },
  taskTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  taskDescription: {
    color: colors.text.secondary,
  },
  taskActions: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  actionButton: {
    padding: spacing['1'],
  },
  taskDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    marginBottom: spacing['3'],
  },
  typeChip: {
    borderRadius: borderRadius.md,
  },
  statusChip: {
    borderRadius: borderRadius.md,
  },
  marksText: {
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: spacing['3'],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['1'],
  },
  metaText: {
    color: colors.text.secondary,
  },
  modal: {
    backgroundColor: colors.surface.primary,
    margin: spacing['4'],
    borderRadius: borderRadius.xl,
    padding: spacing['4'],
  },
  modalTitle: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing['4'],
    textAlign: 'center',
  },
  input: {
    marginBottom: spacing['3'],
  },
  row: {
    flexDirection: 'row',
    gap: spacing['3'],
  },
  halfInput: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing['3'],
  },
  cancelButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
  },
  saveButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
  },
});
