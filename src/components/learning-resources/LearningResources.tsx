import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Text, Card, Button, Chip, SegmentedButtons, ActivityIndicator, Portal, Modal, TextInput } from 'react-native-paper';
import { FileText, Video, Image, Link, Download, Eye, Edit, Trash2, Plus, BookOpen, Clock, Users } from 'lucide-react-native';
import { useLearningResources } from '@/src/contexts/LearningResourcesContext';
import { useClassSelection } from '@/src/contexts/ClassSelectionContext';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/design-system';

export const LearningResources: React.FC = () => {
  const { state, actions } = useLearningResources();
  const { selectedClass } = useClassSelection();
  const [activeTab, setActiveTab] = useState<'resources' | 'quizzes' | 'assignments'>('resources');

  // Load data on mount and when selected class changes
  useEffect(() => {
    const filters = selectedClass ? { classId: selectedClass.id } : undefined;
    actions.loadResources(filters);
    actions.loadQuizzes(filters);
    actions.loadAssignments(filters);
  }, [selectedClass?.id]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    resource_type: 'pdf' as 'pdf' | 'video' | 'image' | 'document' | 'link',
    file_url: '',
    is_public: true,
    tags: '',
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText size={20} color={colors.error[600]} />;
      case 'video':
        return <Video size={20} color={colors.primary[600]} />;
      case 'image':
        return <Image size={20} color={colors.success[600]} />;
      case 'link':
        return <Link size={20} color={colors.info[600]} />;
      default:
        return <FileText size={20} color={colors.text.secondary} />;
    }
  };

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return colors.error[600];
      case 'video':
        return colors.primary[600];
      case 'image':
        return colors.success[600];
      case 'link':
        return colors.info[600];
      default:
        return colors.text.secondary;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleAddResource = () => {
    setEditingResource(null);
    setResourceForm({
      title: '',
      description: '',
      resource_type: 'pdf',
      file_url: '',
      is_public: true,
      tags: '',
    });
    setShowAddModal(true);
  };

  const handleEditResource = (resource: any) => {
    setEditingResource(resource);
    setResourceForm({
      title: resource.title,
      description: resource.description || '',
      resource_type: resource.resource_type,
      file_url: resource.file_url || '',
      is_public: resource.is_public,
      tags: resource.tags?.join(', ') || '',
    });
    setShowAddModal(true);
  };

  const handleSaveResource = async () => {
    try {
      const resourceData = {
        ...resourceForm,
        tags: resourceForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        subject_id: null, // Could be selected from a dropdown
        class_instance_id: selectedClass?.id || null,
        school_code: '', // Will be set by the context
        uploaded_by: '', // Will be set by the context
      };

      if (editingResource) {
        await actions.updateResource({
          ...editingResource,
          ...resourceData,
        });
      } else {
        await actions.addResource(resourceData);
      }
      
      setShowAddModal(false);
      setResourceForm({
        title: '',
        description: '',
        resource_type: 'pdf',
        file_url: '',
        is_public: true,
        tags: '',
      });
    } catch (error) {
      console.error('Failed to save resource:', error);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      await actions.deleteResource(resourceId);
    } catch (error) {
      console.error('Failed to delete resource:', error);
    }
  };

  const handleOpenResource = async (resource: any) => {
    if (resource.file_url) {
      try {
        await Linking.openURL(resource.file_url);
      } catch (error) {
        console.error('Failed to open resource:', error);
      }
    }
  };

  const renderResources = () => {
    if (state.loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading resources...
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
            <Button mode="outlined" onPress={() => actions.loadResources()} style={styles.retryButton}>
              Retry
            </Button>
          </Card.Content>
        </Card>
      );
    }

    if (state.resources.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.emptyText}>
              No learning resources available.
            </Text>
            <Button mode="contained" onPress={handleAddResource} style={styles.addButton}>
              Add Resource
            </Button>
          </Card.Content>
        </Card>
      );
    }

    return (
      <ScrollView style={styles.resourcesList} showsVerticalScrollIndicator={false}>
        {state.resources.map((resource) => (
          <Card key={resource.id} style={styles.resourceCard}>
            <Card.Content>
              <View style={styles.resourceHeader}>
                <View style={styles.resourceInfo}>
                  <View style={styles.resourceTitleRow}>
                    {getResourceIcon(resource.resource_type)}
                    <Text variant="titleMedium" style={styles.resourceTitle}>
                      {resource.title}
                    </Text>
                  </View>
                  {resource.description && (
                    <Text variant="bodySmall" style={styles.resourceDescription}>
                      {resource.description}
                    </Text>
                  )}
                </View>
                <View style={styles.resourceActions}>
                  <TouchableOpacity
                    onPress={() => handleOpenResource(resource)}
                    style={styles.actionButton}
                  >
                    <Eye size={16} color={colors.primary[600]} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleEditResource(resource)}
                    style={styles.actionButton}
                  >
                    <Edit size={16} color={colors.warning[600]} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteResource(resource.id)}
                    style={styles.actionButton}
                  >
                    <Trash2 size={16} color={colors.error[600]} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.resourceDetails}>
                <Chip
                  mode="outlined"
                  style={[styles.typeChip, { borderColor: getResourceTypeColor(resource.resource_type) }]}
                  textStyle={{ color: getResourceTypeColor(resource.resource_type) }}
                >
                  {resource.resource_type.toUpperCase()}
                </Chip>
                
                {resource.file_size && (
                  <Text variant="bodySmall" style={styles.fileSize}>
                    {formatFileSize(resource.file_size)}
                  </Text>
                )}

                {resource.tags && resource.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {resource.tags.map((tag, index) => (
                      <Chip key={index} mode="outlined" style={styles.tagChip}>
                        {tag}
                      </Chip>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.resourceMeta}>
                {resource.subject && (
                  <View style={styles.metaItem}>
                    <BookOpen size={14} color={colors.text.secondary} />
                    <Text variant="bodySmall" style={styles.metaText}>
                      {resource.subject.subject_name}
                    </Text>
                  </View>
                )}
                {resource.class_instance && (
                  <View style={styles.metaItem}>
                    <Users size={14} color={colors.text.secondary} />
                    <Text variant="bodySmall" style={styles.metaText}>
                      Grade {resource.class_instance.grade}-{resource.class_instance.section}
                    </Text>
                  </View>
                )}
                <View style={styles.metaItem}>
                  <Clock size={14} color={colors.text.secondary} />
                  <Text variant="bodySmall" style={styles.metaText}>
                    {new Date(resource.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    );
  };

  const renderQuizzes = () => {
    if (state.loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading quizzes...
          </Text>
        </View>
      );
    }

    if (state.quizzes.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.emptyText}>
              No quizzes available.
            </Text>
          </Card.Content>
        </Card>
      );
    }

    return (
      <ScrollView style={styles.resourcesList} showsVerticalScrollIndicator={false}>
        {state.quizzes.map((quiz) => (
          <Card key={quiz.id} style={styles.resourceCard}>
            <Card.Content>
              <View style={styles.resourceHeader}>
                <View style={styles.resourceInfo}>
                  <Text variant="titleMedium" style={styles.resourceTitle}>
                    {quiz.title}
                  </Text>
                  {quiz.description && (
                    <Text variant="bodySmall" style={styles.resourceDescription}>
                      {quiz.description}
                    </Text>
                  )}
                </View>
                <Chip
                  mode={quiz.is_published ? 'flat' : 'outlined'}
                  style={[
                    styles.statusChip,
                    { backgroundColor: quiz.is_published ? colors.success[50] : colors.warning[50] }
                  ]}
                  textStyle={{ color: quiz.is_published ? colors.success[600] : colors.warning[600] }}
                >
                  {quiz.is_published ? 'Published' : 'Draft'}
                </Chip>
              </View>

              <View style={styles.quizDetails}>
                <View style={styles.quizStat}>
                  <Text variant="bodySmall" style={styles.quizStatLabel}>Questions</Text>
                  <Text variant="titleSmall" style={styles.quizStatValue}>{quiz.total_questions}</Text>
                </View>
                <View style={styles.quizStat}>
                  <Text variant="bodySmall" style={styles.quizStatLabel}>Marks</Text>
                  <Text variant="titleSmall" style={styles.quizStatValue}>{quiz.total_marks}</Text>
                </View>
                {quiz.time_limit && (
                  <View style={styles.quizStat}>
                    <Text variant="bodySmall" style={styles.quizStatLabel}>Time</Text>
                    <Text variant="titleSmall" style={styles.quizStatValue}>{quiz.time_limit}m</Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    );
  };

  const renderAssignments = () => {
    if (state.loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading assignments...
          </Text>
        </View>
      );
    }

    if (state.assignments.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.emptyText}>
              No assignments available.
            </Text>
          </Card.Content>
        </Card>
      );
    }

    return (
      <ScrollView style={styles.resourcesList} showsVerticalScrollIndicator={false}>
        {state.assignments.map((assignment) => (
          <Card key={assignment.id} style={styles.resourceCard}>
            <Card.Content>
              <View style={styles.resourceHeader}>
                <View style={styles.resourceInfo}>
                  <Text variant="titleMedium" style={styles.resourceTitle}>
                    {assignment.title}
                  </Text>
                  {assignment.description && (
                    <Text variant="bodySmall" style={styles.resourceDescription}>
                      {assignment.description}
                    </Text>
                  )}
                </View>
                <Chip
                  mode={assignment.is_published ? 'flat' : 'outlined'}
                  style={[
                    styles.statusChip,
                    { backgroundColor: assignment.is_published ? colors.success[50] : colors.warning[50] }
                  ]}
                  textStyle={{ color: assignment.is_published ? colors.success[600] : colors.warning[600] }}
                >
                  {assignment.is_published ? 'Published' : 'Draft'}
                </Chip>
              </View>

              <View style={styles.assignmentDetails}>
                <View style={styles.assignmentStat}>
                  <Text variant="bodySmall" style={styles.assignmentStatLabel}>Marks</Text>
                  <Text variant="titleSmall" style={styles.assignmentStatValue}>{assignment.total_marks}</Text>
                </View>
                {assignment.due_date && (
                  <View style={styles.assignmentStat}>
                    <Text variant="bodySmall" style={styles.assignmentStatLabel}>Due Date</Text>
                    <Text variant="titleSmall" style={styles.assignmentStatValue}>
                      {new Date(assignment.due_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'resources' | 'quizzes' | 'assignments')}
          buttons={[
            { value: 'resources', label: 'Resources', icon: 'file-document' },
            { value: 'quizzes', label: 'Quizzes', icon: 'help-circle' },
            { value: 'assignments', label: 'Assignments', icon: 'clipboard-text' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {activeTab === 'resources' && (
        <View style={styles.content}>
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.headerTitle}>
              Learning Resources
            </Text>
            <Button
              mode="contained"
              onPress={handleAddResource}
              icon={() => <Plus size={16} color={colors.text.inverse} />}
              style={styles.addButton}
            >
              Add Resource
            </Button>
          </View>
          {renderResources()}
        </View>
      )}

      {activeTab === 'quizzes' && (
        <View style={styles.content}>
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.headerTitle}>
              Quizzes
            </Text>
          </View>
          {renderQuizzes()}
        </View>
      )}

      {activeTab === 'assignments' && (
        <View style={styles.content}>
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.headerTitle}>
              Assignments
            </Text>
          </View>
          {renderAssignments()}
        </View>
      )}

      {/* Add/Edit Resource Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {editingResource ? 'Edit Resource' : 'Add Resource'}
          </Text>

          <TextInput
            label="Title"
            value={resourceForm.title}
            onChangeText={(text) => setResourceForm({ ...resourceForm, title: text })}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Description"
            value={resourceForm.description}
            onChangeText={(text) => setResourceForm({ ...resourceForm, description: text })}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
          />

          <SegmentedButtons
            value={resourceForm.resource_type}
            onValueChange={(value) => setResourceForm({ ...resourceForm, resource_type: value as any })}
            buttons={[
              { value: 'pdf', label: 'PDF' },
              { value: 'video', label: 'Video' },
              { value: 'image', label: 'Image' },
              { value: 'document', label: 'Document' },
              { value: 'link', label: 'Link' },
            ]}
            style={styles.segmentedButtons}
          />

          <TextInput
            label="File URL or Link"
            value={resourceForm.file_url}
            onChangeText={(text) => setResourceForm({ ...resourceForm, file_url: text })}
            style={styles.input}
            mode="outlined"
            placeholder="https://example.com/file.pdf"
          />

          <TextInput
            label="Tags (comma separated)"
            value={resourceForm.tags}
            onChangeText={(text) => setResourceForm({ ...resourceForm, tags: text })}
            style={styles.input}
            mode="outlined"
            placeholder="math, algebra, homework"
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
              onPress={handleSaveResource}
              style={styles.saveButton}
            >
              {editingResource ? 'Update' : 'Save'}
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
  resourcesList: {
    flex: 1,
  },
  resourceCard: {
    marginBottom: spacing['4'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing['3'],
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    marginBottom: spacing['1'],
  },
  resourceTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  resourceDescription: {
    color: colors.text.secondary,
  },
  resourceActions: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  actionButton: {
    padding: spacing['1'],
  },
  resourceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    marginBottom: spacing['3'],
  },
  typeChip: {
    borderRadius: borderRadius.md,
  },
  fileSize: {
    color: colors.text.secondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['1'],
  },
  tagChip: {
    borderRadius: borderRadius.md,
  },
  resourceMeta: {
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
  statusChip: {
    borderRadius: borderRadius.md,
  },
  quizDetails: {
    flexDirection: 'row',
    gap: spacing['4'],
  },
  quizStat: {
    alignItems: 'center',
  },
  quizStatLabel: {
    color: colors.text.secondary,
    marginBottom: spacing['1'],
  },
  quizStatValue: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  assignmentDetails: {
    flexDirection: 'row',
    gap: spacing['4'],
  },
  assignmentStat: {
    alignItems: 'center',
  },
  assignmentStatLabel: {
    color: colors.text.secondary,
    marginBottom: spacing['1'],
  },
  assignmentStatValue: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
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
