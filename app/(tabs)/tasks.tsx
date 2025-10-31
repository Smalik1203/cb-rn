import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Linking, Dimensions, Modal } from 'react-native';
import { Text, Card, Button, Chip, Checkbox, ActivityIndicator, Searchbar, Menu, IconButton, Portal, Modal as PaperModal } from 'react-native-paper';
import { File, Paths } from 'expo-file-system';
import { WebView } from 'react-native-webview';
import { Stack } from 'expo-router';
import { ClipboardList, Plus, Calendar, AlertCircle, CheckCircle, Clock, Edit, Trash2, MoreVertical, Users, BookOpen, AlertTriangle, X, BarChart3, FileCheck, FileText, Download } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../lib/design-system';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTasks, useStudentTasks, useTaskStats, useToggleTaskComplete, useCreateTask, useUpdateTask, useDeleteTask, Task, useTaskSubmissions } from '../../src/hooks/useTasks';
import { useClasses } from '../../src/hooks/useClasses';
import { useSubjects } from '../../src/hooks/useSubjects';
import { TaskFormModal } from '../../src/components/tasks/TaskFormModal';

// Task Detail Modal Component
interface TaskDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  task: Task | null;
  classes: any[] | undefined;
  subjects: any[] | undefined;
}

function TaskDetailModal({ visible, onDismiss, task, classes, subjects }: TaskDetailModalProps) {
  if (!task) return null;

  // Debug logging
  console.log('Task Detail Modal - Attachments:', {
    hasAttachments: !!task.attachments,
    attachmentsLength: task.attachments?.length,
    attachments: task.attachments,
  });

  const taskClass = classes?.find(c => c.id === task.class_instance_id);
  const taskSubject = subjects?.find(s => s.id === task.subject_id);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return colors.error[600];
      case 'high': return colors.error[500];
      case 'medium': return colors.warning[500];
      case 'low': return colors.success[500];
      default: return colors.neutral[500];
    }
  };

  const handleDownloadAttachment = async (attachment: any) => {
    try {
      if (attachment.url) {
        console.log('Opening file:', attachment.url);
        const supported = await Linking.canOpenURL(attachment.url);
        if (supported) {
          await Linking.openURL(attachment.url);
        } else {
          Alert.alert('Error', 'Cannot open this file type');
        }
      } else {
        Alert.alert('Error', 'File URL not available');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Error', 'Failed to open file');
    }
  };

  return (
    <Portal>
      <PaperModal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.detailModal}>
        <View style={styles.detailModalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailModalTitle}>{task.title}</Text>
            <View style={styles.detailModalMetaRow}>
              {taskClass && (
                <Text style={styles.detailModalMeta}>
                  Grade {taskClass.grade}-{taskClass.section}
                </Text>
              )}
              {taskSubject && (
                <Text style={styles.detailModalMeta}>
                  {taskClass ? ' • ' : ''}{taskSubject.subject_name}
                </Text>
              )}
            </View>
          </View>
          <IconButton
            icon={() => <X size={24} color={colors.text.primary} />}
            onPress={onDismiss}
            size={24}
          />
        </View>

        <ScrollView style={styles.detailModalContent}>
          {/* Priority and Dates */}
          <View style={styles.detailSection}>
            <View style={styles.detailRow}>
              <View style={styles.detailInfoItem}>
                <Text style={styles.detailLabel}>Priority</Text>
                <Chip
                  style={[styles.priorityChip, { backgroundColor: getPriorityColor(task.priority) + '20' }]}
                  textStyle={[styles.priorityChipText, { color: getPriorityColor(task.priority) }]}
                >
                  {task.priority.toUpperCase()}
                </Chip>
              </View>
            </View>
          </View>

          <View style={styles.detailSection}>
            <View style={styles.detailDateRow}>
              <View style={styles.detailDateItem}>
                <Text style={styles.detailLabel}>Assigned Date</Text>
                <View style={styles.detailDateValue}>
                  <Calendar size={14} color={colors.primary[600]} />
                  <Text style={styles.detailValueText}>
                    {new Date(task.assigned_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.detailDateItem}>
                <Text style={styles.detailLabel}>Due Date</Text>
                <View style={styles.detailDateValue}>
                  <Clock size={14} color={colors.error[600]} />
                  <Text style={styles.detailValueText}>
                    {new Date(task.due_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Description */}
          {task.description && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Description</Text>
              <Text style={styles.detailText}>{task.description}</Text>
            </View>
          )}

          {/* Instructions */}
          {task.instructions && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Instructions</Text>
              <Text style={styles.detailText}>{task.instructions}</Text>
            </View>
          )}

          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>
                Attachments ({task.attachments.length})
              </Text>
              {task.attachments.map((attachment: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.attachmentItem}
                  onPress={() => handleDownloadAttachment(attachment)}
                >
                  <FileText size={20} color={colors.primary[600]} />
                  <Text style={styles.attachmentItemName} numberOfLines={1}>
                    {attachment.name}
                  </Text>
                  <Download size={18} color={colors.primary[600]} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </PaperModal>
    </Portal>
  );
}

// Task Progress Modal Component
interface TaskProgressModalProps {
  visible: boolean;
  onDismiss: () => void;
  task: Task | null;
}

function TaskProgressModal({ visible, onDismiss, task }: TaskProgressModalProps) {
  const { data: submissions, isLoading } = useTaskSubmissions(task?.id || '');

  if (!task) return null;

  const totalStudents = submissions?.length || 0;
  const submittedCount = submissions?.filter((s: any) => s.status !== 'not_submitted').length || 0;
  const gradedCount = submissions?.filter((s: any) => s.status === 'graded').length || 0;
  const notSubmittedCount = submissions?.filter((s: any) => s.status === 'not_submitted').length || 0;
  const completionRate = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

  return (
    <Portal>
      <PaperModal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.progressModal}>
        <View style={styles.progressModalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.progressModalTitle}>Task Progress</Text>
            <Text style={styles.progressModalSubtitle}>{task.title}</Text>
          </View>
          <IconButton
            icon={() => <X size={24} color={colors.text.primary} />}
            onPress={onDismiss}
            size={24}
          />
        </View>

        <ScrollView style={styles.progressModalContent}>
          {/* Progress Stats */}
          <View style={styles.progressStatsContainer}>
            <View style={styles.progressStatCard}>
              <Users size={24} color={colors.primary[600]} />
              <Text style={styles.progressStatValue}>{totalStudents}</Text>
              <Text style={styles.progressStatLabel}>Total Students</Text>
            </View>
            <View style={styles.progressStatCard}>
              <FileCheck size={24} color={colors.success[600]} />
              <Text style={styles.progressStatValue}>{submittedCount}</Text>
              <Text style={styles.progressStatLabel}>Submitted</Text>
            </View>
            <View style={styles.progressStatCard}>
              <CheckCircle size={24} color={colors.info[600]} />
              <Text style={styles.progressStatValue}>{gradedCount}</Text>
              <Text style={styles.progressStatLabel}>Graded</Text>
            </View>
            <View style={styles.progressStatCard}>
              <BarChart3 size={24} color={colors.warning[600]} />
              <Text style={styles.progressStatValue}>{completionRate}%</Text>
              <Text style={styles.progressStatLabel}>Completion</Text>
            </View>
          </View>

          {/* Submissions List */}
          <Text style={styles.progressSectionTitle}>Student Submissions</Text>
          
          {isLoading ? (
            <View style={styles.progressLoadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[600]} />
            </View>
          ) : submissions && submissions.length > 0 ? (
            submissions.map((submission: any) => (
              <Card key={submission.id} style={styles.submissionCard}>
                <Card.Content>
                  <View style={styles.submissionHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.submissionStudentName}>
                        {submission.student?.full_name || 'Unknown Student'}
                      </Text>
                      <Text style={styles.submissionStudentCode}>
                        {submission.student?.student_code}
                      </Text>
                    </View>
                    <Chip
                      style={[
                        styles.submissionStatusChip,
                        { backgroundColor: getSubmissionStatusColor(submission.status) }
                      ]}
                      textStyle={styles.submissionStatusText}
                    >
                      {formatSubmissionStatus(submission.status)}
                    </Chip>
                  </View>
                  
                  {submission.submitted_at && (
                    <View style={styles.submissionMeta}>
                      <Clock size={12} color={colors.text.secondary} />
                      <Text style={styles.submissionDate}>
                        Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                      </Text>
                    </View>
                  )}

                  {submission.marks_obtained !== null && submission.max_marks && (
                    <View style={styles.submissionMarks}>
                      <Text style={styles.submissionMarksText}>
                        Marks: {submission.marks_obtained}/{submission.max_marks}
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))
          ) : (
            <View style={styles.progressEmptyState}>
              <AlertCircle size={48} color={colors.text.tertiary} />
              <Text style={styles.progressEmptyText}>
                {task.class_instance_id 
                  ? 'No students found in this class' 
                  : 'This task is not assigned to a specific class'}
              </Text>
            </View>
          )}
        </ScrollView>
      </PaperModal>
    </Portal>
  );
}

// Helper function for submission status colors
function getSubmissionStatusColor(status: string): string {
  switch (status) {
    case 'graded': return colors.success[100];
    case 'submitted': return colors.info[100];
    case 'late': return colors.warning[100];
    case 'not_submitted': return colors.neutral[100];
    default: return colors.neutral[100];
  }
}

// Helper function to format submission status text
function formatSubmissionStatus(status: string): string {
  switch (status) {
    case 'not_submitted': return 'Not Submitted';
    case 'submitted': return 'Submitted';
    case 'graded': return 'Graded';
    case 'late': return 'Late';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export default function TasksScreen() {
  const { profile } = useAuth();
  const isStudent = profile?.role === 'student';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  
  // Menu states
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [taskMenuVisible, setTaskMenuVisible] = useState<{ [key: string]: boolean }>({});
  
  // Task form modal
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Progress/Submissions modal
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState<Task | null>(null);
  
  // Task Detail modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  
  // Attachments modal
  const [attachmentsModalVisible, setAttachmentsModalVisible] = useState(false);
  const [selectedTaskForAttachments, setSelectedTaskForAttachments] = useState<Task | null>(null);
  
  // File viewer modal
  const [fileViewerVisible, setFileViewerVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ url: string; name: string; type: string } | null>(null);
  
  // Get student ID if student role
  const [studentId, setStudentId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    if (isStudent && profile?.auth_id) {
      // Fetch student ID from database
      import('../../src/data/supabaseClient').then(({ supabase }) => {
        supabase
          .from('student')
          .select('id')
          .eq('auth_user_id', profile.auth_id)
          .single()
          .then(({ data }) => {
            if (data) setStudentId(data.id);
          });
      });
    }
  }, [isStudent, profile?.auth_id]);

  // Fetch data based on role
  const schoolCode = profile?.school_code || '';
  
  // Fetch classes and subjects for filters
  const { data: classes } = useClasses(schoolCode);
  const { data: subjects } = useSubjects(schoolCode);
  
  const { data: adminTasks, isLoading: adminLoading, refetch: refetchAdmin } = useTasks(
    schoolCode,
    { 
      classInstanceId: selectedClassId,
      subjectId: selectedSubjectId,
      priority: selectedPriority || undefined,
      startDate,
      endDate,
    }
  );
  
  const { data: studentTasksData, isLoading: studentLoading, refetch: refetchStudent } = useStudentTasks(
    studentId || ''
  );
  
  const { data: stats, isLoading: statsLoading } = useTaskStats(schoolCode, selectedClassId);
  
  const toggleComplete = useToggleTaskComplete();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  
  // Get first academic year for creating tasks
  const [academicYearId, setAcademicYearId] = React.useState<string | undefined>(undefined);
  
  React.useEffect(() => {
    if (schoolCode && !isStudent) {
      import('../../src/data/supabaseClient').then(({ supabase }) => {
        supabase
          .from('academic_years')
          .select('id')
          .eq('school_code', schoolCode)
          .eq('is_active', true)
          .single()
          .then(({ data }) => {
            if (data) setAcademicYearId(data.id);
          });
      });
    }
  }, [schoolCode, isStudent]);

  const tasks = isStudent ? studentTasksData : adminTasks;
  const isLoading = isStudent ? studentLoading : adminLoading;

  // Filter tasks (client-side filtering for students, server-side for admins)
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = !selectedPriority || task.priority === selectedPriority;
      
      const matchesSubject = !selectedSubjectId || task.subject_id === selectedSubjectId;
      
      return matchesSearch && matchesPriority && matchesSubject;
    });
  }, [tasks, searchQuery, selectedPriority, selectedSubjectId]);

  // Get due date status
  const getDueDateStatus = (dueDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    const due = dueDate;
    
    if (due < today) return { status: 'overdue', color: colors.error[500], text: 'Overdue' };
    if (due === today) return { status: 'today', color: colors.warning[500], text: 'Due Today' };
    const daysUntil = Math.ceil((new Date(due).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 3) return { status: 'soon', color: colors.warning[400], text: 'Due Soon' };
    return { status: 'upcoming', color: colors.success[500], text: 'Upcoming' };
  };

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    if (!studentId) return;
    try {
      await toggleComplete.mutateAsync({ taskId, studentId, isCompleted });
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const onRefresh = () => {
    if (isStudent) {
      refetchStudent();
    } else {
      refetchAdmin();
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setFormModalVisible(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormModalVisible(true);
    setTaskMenuVisible({ ...taskMenuVisible, [task.id]: false });
  };

  const handleDeleteTask = (taskId: string) => {
    setTaskMenuVisible({ ...taskMenuVisible, [taskId]: false });
    
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask.mutateAsync(taskId);
              Alert.alert('Success', 'Task deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const handleViewProgress = (task: Task) => {
    setSelectedTaskForProgress(task);
    setProgressModalVisible(true);
    setTaskMenuVisible({ ...taskMenuVisible, [task.id]: false });
  };

  const handleViewTaskDetail = (task: Task) => {
    setSelectedTaskForDetail(task);
    setDetailModalVisible(true);
  };

  const handleViewAttachments = (task: Task) => {
    setSelectedTaskForAttachments(task);
    setAttachmentsModalVisible(true);
    setTaskMenuVisible({ ...taskMenuVisible, [task.id]: false });
  };

  const handleDownloadAttachments = async (task: Task) => {
    setTaskMenuVisible({ ...taskMenuVisible, [task.id]: false });
    if (!task.attachments || task.attachments.length === 0) return;
    
    try {
      Alert.alert(
        'Download Files',
        `Download ${task.attachments.length} file(s) to your device?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Download',
            onPress: async () => {
              try {
                let downloadedCount = 0;
                for (const attachment of task.attachments as any[]) {
                  if (attachment?.url && attachment?.name) {
                    await File.downloadFileAsync(
                      attachment.url,
                      Paths.cache
                    );
                    downloadedCount++;
                  }
                }
                Alert.alert('Success', `${downloadedCount} file(s) downloaded successfully!`);
              } catch (error) {
                console.error('Download error:', error);
                Alert.alert('Error', 'Failed to download some files');
              }
            }
          }
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to download attachment(s)');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return colors.error[600];
      case 'high': return colors.error[500];
      case 'medium': return colors.warning[500];
      case 'low': return colors.success[500];
      default: return colors.neutral[500];
    }
  };

  const handleSubmitTask = async (taskData: any) => {
    try {
      if (editingTask) {
        await updateTask.mutateAsync({ id: editingTask.id, ...taskData });
        Alert.alert('Success', 'Task updated successfully');
        return editingTask.id;
      } else {
        const newTask = await createTask.mutateAsync(taskData);
        Alert.alert('Success', 'Task created successfully');
        return newTask.id;
      }
    } catch (error) {
      throw error; // Let the modal handle it
    }
  };

  const toggleTaskMenu = (taskId: string) => {
    setTaskMenuVisible({
      ...taskMenuVisible,
      [taskId]: !taskMenuVisible[taskId],
    });
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: isStudent ? 'My Tasks' : 'Task Management',
          headerShown: true
        }} 
      />
      
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
          }
        >
          {/* Filter Row */}
          <View style={styles.filterSection}>
            <View style={styles.filterRow}>
              {/* Subject Filter */}
              <TouchableOpacity
                style={styles.filterItem}
                onPress={() => setShowSubjectModal(true)}
              >
                <View style={styles.filterIcon}>
                  <BookOpen size={16} color={colors.text.inverse} />
                </View>
                <View style={styles.filterContent}>
                  <Text style={styles.filterValue} numberOfLines={1}>
                    {selectedSubjectId
                      ? subjects?.find(s => s.id === selectedSubjectId)?.subject_name || 'Subject'
                      : 'Subject'
                    }
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.filterDivider} />

              {/* Priority Filter */}
              <TouchableOpacity 
                style={styles.filterItem}
                onPress={() => setShowPriorityModal(true)}
              >
                <View style={styles.filterIcon}>
                  <AlertTriangle size={16} color={colors.text.inverse} />
                </View>
                <View style={styles.filterContent}>
                  <Text style={styles.filterValue} numberOfLines={1}>
                    {selectedPriority 
                      ? selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1)
                      : 'Priority'
                    }
                  </Text>
                </View>
              </TouchableOpacity>

              {!isStudent && (
                <>
                  {/* Divider */}
                  <View style={styles.filterDivider} />
                  
                  {/* Class Filter */}
                  <TouchableOpacity
                    style={styles.filterItem}
                    onPress={() => setShowClassModal(true)}
                  >
                    <View style={styles.filterIcon}>
                      <Users size={16} color={colors.text.inverse} />
                    </View>
                    <View style={styles.filterContent}>
                      <Text style={styles.filterValue} numberOfLines={1}>
                        {selectedClassId 
                          ? classes?.find(c => c.id === selectedClassId)
                            ? `${classes.find(c => c.id === selectedClassId)?.grade}-${classes.find(c => c.id === selectedClassId)?.section}`
                            : 'Class'
                          : 'Class'
                        }
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          
          {/* Stats Cards */}
          {!statsLoading && stats && (
            <View style={styles.statsSection}>
              <View style={styles.statsGrid}>
                <Card style={styles.statCard}>
                  <View style={styles.statContent}>
                    <View style={[styles.statIcon, { backgroundColor: colors.primary[50] }]}>
                      <ClipboardList size={20} color={colors.primary[600]} />
                    </View>
                    <Text style={styles.statValue}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Total Tasks</Text>
                  </View>
                </Card>

                <Card style={styles.statCard}>
                  <View style={styles.statContent}>
                    <View style={[styles.statIcon, { backgroundColor: colors.warning[50] }]}>
                      <Clock size={20} color={colors.warning[600]} />
                    </View>
                    <Text style={styles.statValue}>{stats.upcoming}</Text>
                    <Text style={styles.statLabel}>Upcoming</Text>
                  </View>
                </Card>

                <Card style={styles.statCard}>
                  <View style={styles.statContent}>
                    <View style={[styles.statIcon, { backgroundColor: colors.error[50] }]}>
                      <AlertCircle size={20} color={colors.error[600]} />
                    </View>
                    <Text style={styles.statValue}>{stats.overdue}</Text>
                    <Text style={styles.statLabel}>Overdue</Text>
                  </View>
                </Card>
              </View>
            </View>
          )}

          {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={styles.loadingText}>Loading tasks...</Text>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && filteredTasks.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconCircle}>
              <ClipboardList size={48} color={colors.primary[600]} />
            </View>
            <Text style={styles.emptyTitle}>No Tasks Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'Try adjusting your search or filters to find what you\'re looking for'
                : isStudent 
                  ? 'You\'re all caught up! No tasks have been assigned yet.'
                  : 'Get started by creating your first task for your class'}
            </Text>
            {!isStudent && !searchQuery && (
              <Button
                mode="contained"
                onPress={handleCreateTask}
                style={styles.emptyButton}
                icon={() => <Plus size={20} color="white" />}
              >
                Create First Task
              </Button>
            )}
          </View>
        )}

        {/* Task List */}
        {!isLoading && filteredTasks.length > 0 && (
          <View style={styles.tasksListSection}>
            <View style={styles.tasksHeader}>
              <Text style={styles.sectionTitle}>Tasks</Text>
              <Text style={styles.tasksCount}>
                {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
              </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchSection}>
              <Searchbar
                placeholder="Search tasks..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
                iconColor={colors.primary[600]}
              />
            </View>

            {filteredTasks.map((task: any) => {
              const dueDateStatus = getDueDateStatus(task.due_date);
              const isCompleted = task.submission?.status === 'submitted';

              return (
                <View 
                  key={task.id} 
                  style={styles.taskCard}
                >
                  <View style={styles.taskCardHeader}>
                    <View style={styles.taskHeaderLeft}>
                      {isStudent && (
                        <Checkbox
                          status={isCompleted ? 'checked' : 'unchecked'}
                          onPress={() => handleToggleComplete(task.id, isCompleted)}
                          color={colors.primary[600]}
                        />
                      )}
                      <View style={styles.taskInfo}>
                        <Text style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]} numberOfLines={2}>
                          {task.title}
                        </Text>
                      </View>
                    </View>
                    
                    {!isStudent && (
                      <View style={styles.taskHeaderRight}>
                        <Menu
                          visible={taskMenuVisible[task.id] || false}
                          onDismiss={() => toggleTaskMenu(task.id)}
                          anchor={
                            <IconButton
                              icon={() => <MoreVertical size={20} color={colors.text.secondary} />}
                              size={20}
                              onPress={() => {
                                toggleTaskMenu(task.id);
                              }}
                              style={styles.menuButton}
                            />
                          }
                        >
                          {task.attachments && task.attachments.length > 0 && (
                            <>
                              <Menu.Item
                                onPress={() => handleViewAttachments(task)}
                                title="View Attachments"
                                leadingIcon={() => <FileText size={16} color={colors.primary[600]} />}
                              />
                              <Menu.Item
                                onPress={() => handleDownloadAttachments(task)}
                                title="Download File(s)"
                                leadingIcon={() => <Download size={16} color={colors.primary[600]} />}
                              />
                            </>
                          )}
                          <Menu.Item
                            onPress={() => handleViewProgress(task)}
                            title="View Progress"
                            leadingIcon={() => <BarChart3 size={16} color={colors.primary[600]} />}
                          />
                          <Menu.Item
                            onPress={() => handleEditTask(task)}
                            title="Edit"
                            leadingIcon={() => <Edit size={16} color={colors.text.primary} />}
                          />
                          <Menu.Item
                            onPress={() => handleDeleteTask(task.id)}
                            title="Delete"
                            leadingIcon={() => <Trash2 size={16} color={colors.error[600]} />}
                          />
                        </Menu>
                      </View>
                    )}
                  </View>

                  {/* Enhanced Metadata Section */}
                  <View style={styles.taskMetaSection}>
                    {/* Row 1: Subject and Priority */}
                    <View style={styles.taskMetaRow}>
                      {task.subjects && (
                        <View style={styles.taskMetaChip}>
                          <BookOpen size={14} color={colors.primary[600]} />
                          <Text style={styles.taskMetaChipText}>{task.subjects.subject_name}</Text>
                        </View>
                      )}
                      <View style={[styles.taskMetaChip, { backgroundColor: getPriorityColor(task.priority) + '15' }]}>
                        <AlertCircle size={14} color={getPriorityColor(task.priority)} />
                        <Text style={[styles.taskMetaChipText, { color: getPriorityColor(task.priority) }]}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                        </Text>
                      </View>
                    </View>

                    {/* Row 2: Due Date and Additional Info */}
                    <View style={styles.taskMetaRow}>
                      <View style={styles.taskMetaItem}>
                        <Clock size={14} color={dueDateStatus.status === 'overdue' ? colors.error[600] : colors.warning[600]} />
                        <Text style={styles.taskMetaLabel}>Due:</Text>
                        <Text style={[
                          styles.taskMetaValue,
                          dueDateStatus.status === 'overdue' && { color: colors.error[600], fontWeight: '600' }
                        ]}>
                          {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                      {task.class_instances && (
                        <>
                          <View style={styles.taskMetaDivider} />
                          <View style={styles.taskMetaItem}>
                            <Users size={14} color={colors.text.tertiary} />
                            <Text style={styles.taskMetaValue}>
                              Grade {task.class_instances.grade}-{task.class_instances.section}
                            </Text>
                          </View>
                        </>
                      )}
                      {task.attachments && task.attachments.length > 0 && (
                        <>
                          <View style={styles.taskMetaDivider} />
                          <View style={styles.taskMetaItem}>
                            <FileText size={14} color={colors.text.tertiary} />
                            <Text style={styles.taskMetaValue}>
                              {task.attachments.length} {task.attachments.length === 1 ? 'file' : 'files'}
                            </Text>
                          </View>
                        </>
                      )}
                      {!isStudent && task._count?.submissions !== undefined && (
                        <>
                          <View style={styles.taskMetaDivider} />
                          <View style={styles.taskMetaItem}>
                            <FileCheck size={14} color={colors.success[600]} />
                            <Text style={styles.taskMetaValue}>
                              {task._count.submissions} submitted
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Filter Modals */}
      {/* Subject Filter Modal - Bottom Sheet */}
      <Modal
        visible={showSubjectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowSubjectModal(false)}
          />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select Subject</Text>
            <ScrollView style={styles.sheetContent}>
              <TouchableOpacity
                style={[styles.sheetItem, !selectedSubjectId && styles.sheetItemActive]}
                onPress={() => {
                  setSelectedSubjectId(undefined);
                  setShowSubjectModal(false);
                }}
              >
                <Text style={[styles.sheetItemText, !selectedSubjectId && styles.sheetItemTextActive]}>
                  All Subjects
                </Text>
                {!selectedSubjectId && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              {subjects?.map(subject => (
                <TouchableOpacity
                  key={subject.id}
                  style={[styles.sheetItem, selectedSubjectId === subject.id && styles.sheetItemActive]}
                  onPress={() => {
                    setSelectedSubjectId(subject.id);
                    setShowSubjectModal(false);
                  }}
                >
                  <Text style={[styles.sheetItemText, selectedSubjectId === subject.id && styles.sheetItemTextActive]}>
                    {subject.subject_name}
                  </Text>
                  {selectedSubjectId === subject.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Priority Filter Modal - Bottom Sheet */}
      <Modal
        visible={showPriorityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPriorityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowPriorityModal(false)}
          />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select Priority</Text>
            <ScrollView style={styles.sheetContent}>
              {['all', 'urgent', 'high', 'medium', 'low'].map(priority => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.sheetItem,
                    (priority === 'all' ? !selectedPriority : selectedPriority === priority) && styles.sheetItemActive
                  ]}
                  onPress={() => {
                    setSelectedPriority(priority === 'all' ? null : priority);
                    setShowPriorityModal(false);
                  }}
                >
                  <Text style={[
                    styles.sheetItemText,
                    (priority === 'all' ? !selectedPriority : selectedPriority === priority) && styles.sheetItemTextActive
                  ]}>
                    {priority === 'all' ? 'All Priorities' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                  {(priority === 'all' ? !selectedPriority : selectedPriority === priority) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Class Filter Modal - Bottom Sheet (Admin/Teacher only) */}
      {!isStudent && (
        <Modal
          visible={showClassModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowClassModal(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowClassModal(false)}
            />
            <View style={styles.bottomSheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Select Class</Text>
              <ScrollView style={styles.sheetContent}>
                <TouchableOpacity
                  style={[styles.sheetItem, !selectedClassId && styles.sheetItemActive]}
                  onPress={() => {
                    setSelectedClassId(undefined);
                    setShowClassModal(false);
                  }}
                >
                  <Text style={[styles.sheetItemText, !selectedClassId && styles.sheetItemTextActive]}>
                    All Classes
                  </Text>
                  {!selectedClassId && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                {classes?.map(cls => (
                  <TouchableOpacity
                    key={cls.id}
                    style={[styles.sheetItem, selectedClassId === cls.id && styles.sheetItemActive]}
                    onPress={() => {
                      setSelectedClassId(cls.id);
                      setShowClassModal(false);
                    }}
                  >
                    <Text style={[styles.sheetItemText, selectedClassId === cls.id && styles.sheetItemTextActive]}>
                      Grade {cls.grade} - Section {cls.section}
                    </Text>
                    {selectedClassId === cls.id && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Task Form Modal */}
      <TaskFormModal
        visible={formModalVisible}
        onDismiss={() => {
          setFormModalVisible(false);
          setEditingTask(null);
        }}
        onSubmit={handleSubmitTask}
        task={editingTask}
        schoolCode={schoolCode}
        userId={profile?.auth_id || ''}
        academicYearId={academicYearId || ''}
      />

      {/* Progress/Submissions Modal */}
      <TaskProgressModal
        visible={progressModalVisible}
        onDismiss={() => {
          setProgressModalVisible(false);
          setSelectedTaskForProgress(null);
        }}
        task={selectedTaskForProgress}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        visible={detailModalVisible}
        onDismiss={() => {
          setDetailModalVisible(false);
          setSelectedTaskForDetail(null);
        }}
        task={selectedTaskForDetail}
        classes={classes}
        subjects={subjects}
      />

      {/* Simple Attachments Modal */}
      <Portal>
        <PaperModal
          visible={attachmentsModalVisible}
          onDismiss={() => {
            setAttachmentsModalVisible(false);
            setSelectedTaskForAttachments(null);
          }}
          contentContainerStyle={styles.simpleAttachmentsModal}
        >
          {selectedTaskForAttachments?.attachments && selectedTaskForAttachments.attachments.length > 0 && (
            selectedTaskForAttachments.attachments.map((attachment: any, index: number) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.simpleAttachmentItem,
                  index === selectedTaskForAttachments.attachments.length - 1 && styles.lastAttachmentItem
                ]}
                onPress={() => {
                  if (attachment.url) {
                    setSelectedFile({
                      url: attachment.url,
                      name: attachment.name,
                      type: attachment.type || 'application/octet-stream'
                    });
                    setFileViewerVisible(true);
                    setAttachmentsModalVisible(false);
                  } else {
                    Alert.alert('Error', 'File URL not available');
                  }
                }}
              >
                <View style={styles.attachmentIconContainer}>
                  <FileText size={20} color={colors.primary[600]} />
                </View>
                <Text style={styles.simpleAttachmentName} numberOfLines={2}>
                  {attachment.name}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </PaperModal>
      </Portal>

      {/* File Viewer Modal */}
      <Portal>
        <PaperModal
          visible={fileViewerVisible}
          onDismiss={() => {
            setFileViewerVisible(false);
            setSelectedFile(null);
          }}
          contentContainerStyle={styles.fileViewerModal}
        >
          <View style={styles.fileViewerHeader}>
            <Text style={styles.fileViewerTitle} numberOfLines={1}>
              {selectedFile?.name || 'File Preview'}
            </Text>
            <IconButton
              icon={() => <X size={24} color={colors.text.primary} />}
              onPress={() => {
                setFileViewerVisible(false);
                setSelectedFile(null);
              }}
              size={20}
            />
          </View>
          {selectedFile && (
            <View style={styles.fileViewerContent}>
              <WebView
                source={{ uri: selectedFile.url }}
                style={styles.webView}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.webViewLoading}>
                    <ActivityIndicator size="large" color={colors.primary[600]} />
                    <Text style={styles.webViewLoadingText}>Loading file...</Text>
                  </View>
                )}
              />
            </View>
          )}
        </PaperModal>
      </Portal>

        {/* Create Task FAB (Admin/Teacher only) */}
        {!isStudent && (
          <View style={styles.fabContainer}>
            <TouchableOpacity
              style={styles.fab}
              onPress={handleCreateTask}
            >
              <Plus size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  statsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statContent: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium as any,
    textAlign: 'center',
  },
  filterSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  filterContent: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  filterValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  filterDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.light,
  },
  searchSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    elevation: 0,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  emptyStateContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.lg,
  },
  tasksListSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  tasksCount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold as any,
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  taskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: spacing.sm,
  },
  taskInfo: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  taskTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    lineHeight: 24,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.secondary,
  },
  taskSubject: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  taskHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  priorityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.inverse,
  },
  menuButton: {
    margin: -spacing.xs,
  },
  taskDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    flex: 1,
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  taskMetaText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  // Enhanced Metadata Styles
  taskMetaSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  taskMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.full,
  },
  taskMetaChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.medium as any,
  },
  taskMetaLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginLeft: spacing.xs / 2,
  },
  taskMetaValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  taskMetaDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.border.DEFAULT,
    marginHorizontal: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  statusCompleted: {
    backgroundColor: colors.success[100],
  },
  statusOverdue: {
    backgroundColor: colors.error[100],
  },
  statusToday: {
    backgroundColor: colors.warning[100],
  },
  statusUpcoming: {
    backgroundColor: colors.primary[50],
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
  },
  statusTextCompleted: {
    color: colors.success[700],
  },
  statusTextOverdue: {
    color: colors.error[700],
  },
  statusTextToday: {
    color: colors.warning[700],
  },
  statusTextUpcoming: {
    color: colors.primary[700],
  },
  // Bottom Sheet Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    maxHeight: 400,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: 2,
  },
  sheetItemActive: {
    backgroundColor: '#EEF2FF',
  },
  sheetItemText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium as any,
  },
  sheetItemTextActive: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold as any,
  },
  checkmark: {
    fontSize: typography.fontSize.lg,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold as any,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  // Progress Modal Styles
  progressModal: {
    backgroundColor: colors.surface.primary,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    maxHeight: '85%',
  },
  progressModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  progressModalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  progressModalSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  progressModalContent: {
    padding: spacing.lg,
  },
  progressStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  progressStatCard: {
    flex: 1,
    backgroundColor: colors.surface.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStatValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  progressStatLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  progressSectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  progressLoadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressEmptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressEmptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  submissionCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface.primary,
  },
  submissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  submissionStudentName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  submissionStudentCode: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  submissionStatusChip: {
    height: 28,
  },
  submissionStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium as any,
  },
  submissionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  submissionDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  submissionMarks: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
  },
  submissionMarksText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.primary[600],
  },
  // Detail Modal Styles
  detailModal: {
    backgroundColor: colors.surface.primary,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    maxHeight: '85%',
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  detailModalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  detailModalMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  detailModalMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  detailModalContent: {
    padding: spacing.lg,
  },
  detailSection: {
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailInfoItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  detailDateRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  detailDateItem: {
    flex: 1,
  },
  detailDateValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailValueText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium as any,
  },
  detailSectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  detailText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: 22,
  },
  priorityChip: {
    alignSelf: 'flex-start',
  },
  priorityChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold as any,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  attachmentItemName: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  // Simple Attachments Modal
  simpleAttachmentsModal: {
    backgroundColor: colors.surface.primary,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    maxWidth: 500,
    alignSelf: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    minWidth: 280,
  },
  simpleAttachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  lastAttachmentItem: {
    borderBottomWidth: 0,
  },
  attachmentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  simpleAttachmentName: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium as any,
    lineHeight: 20,
  },
  // File Viewer Modal
  fileViewerModal: {
    backgroundColor: colors.surface.primary,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    height: Dimensions.get('window').height * 0.85,
    maxHeight: 800,
  },
  fileViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  fileViewerTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  fileViewerContent: {
    flex: 1,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  webViewLoadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
});

