import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { Calendar, X, Upload, FileText, Check } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { colors, spacing, typography, borderRadius } from '../../../lib/design-system';
import { useClasses } from '../../hooks/useClasses';
import { useSubjects } from '../../hooks/useSubjects';
import { Task } from '../../hooks/useTasks';
import { DatePickerModal } from '../common/DatePickerModal';
import { supabase } from '../../data/supabaseClient';

interface TaskFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (taskData: any) => Promise<string>;
  task?: Task | null;
  schoolCode: string;
  userId: string;
  academicYearId?: string;
}

const PRIORITIES = [
  { value: 'low', label: 'Low', color: colors.success[500] },
  { value: 'medium', label: 'Medium', color: colors.warning[500] },
  { value: 'high', label: 'High', color: colors.error[500] },
  { value: 'urgent', label: 'Urgent', color: colors.error[600] },
];

export function TaskFormModal({
  visible,
  onDismiss,
  onSubmit,
  task,
  schoolCode,
  userId,
  academicYearId,
}: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [assignedDate, setAssignedDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 86400000)); // Tomorrow
  const [showAssignedDatePicker, setShowAssignedDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);

  const { data: classes } = useClasses(schoolCode);
  const { data: subjects } = useSubjects(schoolCode);

  // Filter subjects by selected class (optional - you can remove this if subjects aren't class-specific)
  const filteredSubjects = subjects;

  // Populate form when editing
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setInstructions(task.instructions || '');
      setPriority(task.priority);
      setSelectedClassId(task.class_instance_id || '');
      setSelectedSubjectId(task.subject_id || '');
      setAssignedDate(new Date(task.assigned_date));
      setDueDate(new Date(task.due_date));
      setAttachments(task.attachments || []);
    } else {
      resetForm();
    }
  }, [task, visible]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setInstructions('');
    setPriority('medium');
    setSelectedClassId('');
    setSelectedSubjectId('');
    setAssignedDate(new Date());
    setDueDate(new Date(Date.now() + 86400000));
    setAttachments([]);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'image/*',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        
        // Validate file size (max 10MB)
        if (file.size && file.size > 10 * 1024 * 1024) {
          alert('File size must be less than 10MB');
          return;
        }

        setAttachments([...attachments, {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
          size: file.size,
        }]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      alert('Failed to pick document');
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const uploadFileToStorage = async (file: any, taskId: string): Promise<any> => {
    try {
      console.log('Uploading file:', file.name, 'Type:', file.type);
      
      // Create file path: school_code/task_id/timestamp_filename
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `${schoolCode}/${taskId}/${fileName}`;

      console.log('Uploading to path:', filePath);

      // Get file as ArrayBuffer for React Native compatibility
      console.log('Fetching file from URI:', file.uri);
      const fileResponse = await fetch(file.uri);
      const fileArrayBuffer = await fileResponse.arrayBuffer();
      console.log('File ArrayBuffer created, size:', fileArrayBuffer.byteLength);

      // Use Supabase SDK to upload with ArrayBuffer (React Native compatible)
      const { data, error } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, fileArrayBuffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }

      console.log('File uploaded successfully:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      return {
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        path: filePath,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }
    if (!selectedClassId) {
      alert('Please select a class');
      return;
    }
    if (!selectedSubjectId) {
      alert('Please select a subject');
      return;
    }
    if (dueDate < assignedDate) {
      alert('Due date must be on or after assigned date');
      return;
    }

    setSubmitting(true);
    try {
      let uploadedAttachments = [];

      // If we have attachments, show uploading message
      if (attachments.length > 0) {
        console.log(`Uploading ${attachments.length} file(s)...`);
      }

      // First create/update the task without attachments
      const tempTaskData = {
        title: title.trim(),
        description: description.trim() || null,
        instructions: instructions.trim() || null,
        priority,
        class_instance_id: selectedClassId || null,
        subject_id: selectedSubjectId || null,
        assigned_date: assignedDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        attachments: [], // Will update after upload
        school_code: schoolCode,
        academic_year_id: academicYearId || null,
        created_by: userId,
        is_active: true,
      };

      // Submit task and get the task ID
      const taskId = await onSubmit(tempTaskData);
      console.log('Task created with ID:', taskId);

      // Upload attachments if any
      if (attachments.length > 0) {
        try {
          console.log(`Uploading ${attachments.length} attachments to Supabase Storage...`);
          const uploadPromises = attachments.map(file => 
            uploadFileToStorage(file, taskId)
          );
          
          uploadedAttachments = await Promise.all(uploadPromises);
          console.log('All files uploaded successfully:', uploadedAttachments);
          console.log('Attachments JSON:', JSON.stringify(uploadedAttachments, null, 2));

          // Update task with attachment URLs
          const { data: updateData, error: updateError } = await supabase
            .from('tasks')
            .update({ 
              attachments: uploadedAttachments,
              updated_at: new Date().toISOString()
            })
            .eq('id', taskId)
            .select();

          console.log('Update response:', { updateData, updateError });

          if (updateError) {
            console.error('Error updating task with attachments:', updateError);
            Alert.alert(
              'Warning', 
              `Task created but failed to save attachments: ${updateError.message}. Please try editing the task to add files.`
            );
          } else {
            console.log('Task updated with attachments successfully:', updateData);
            Alert.alert('Success', `Task created with ${uploadedAttachments.length} file(s)!`);
          }
        } catch (uploadError: any) {
          console.error('Error uploading files:', uploadError);
          Alert.alert(
            'Warning', 
            `Task created but file upload failed: ${uploadError.message || 'Unknown error'}. Please try editing the task to add files.`
          );
        }
      } else {
        Alert.alert('Success', 'Task created successfully!');
      }

      resetForm();
      onDismiss();
    } catch (error) {
      console.error('Failed to submit task:', error);
      alert('Failed to save task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIconCircle}>
              <FileText size={24} color={colors.primary[600]} />
            </View>
            <View>
              <Text style={styles.headerTitle}>
                {task ? 'Edit Task' : 'Create New Task'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {task ? 'Update task details' : 'Fill in the task information below'}
              </Text>
            </View>
          </View>
          <IconButton
            icon={() => <X size={24} color={colors.text.secondary} />}
            onPress={onDismiss}
            size={20}
          />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Information Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>

          {/* Task Title */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Task Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              mode="outlined"
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task title"
              style={styles.input}
              outlineColor={colors.border.light}
              activeOutlineColor={colors.primary[600]}
            />
          </View>

          {/* Assignment Details Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assignment Details</Text>
          </View>

          {/* Priority */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Priority <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowPriorityModal(true)}
            >
              <View style={styles.selectButtonContent}>
                {priority && (
                  <View style={[
                    styles.priorityIndicator,
                    { backgroundColor: PRIORITIES.find(p => p.value === priority)?.color }
                  ]} />
                )}
                <Text style={[styles.selectButtonText, priority && styles.selectButtonTextSelected]}>
                  {priority ? PRIORITIES.find(p => p.value === priority)?.label : 'Select Priority'}
                </Text>
              </View>
              <X size={16} color={colors.text.secondary} style={{ transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>
          </View>

          {/* Class */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Class <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowClassModal(true)}
            >
              <Text style={[styles.selectButtonText, selectedClassId && styles.selectButtonTextSelected]}>
                {selectedClassId
                  ? `Grade ${classes?.find(c => c.id === selectedClassId)?.grade} - Section ${classes?.find(c => c.id === selectedClassId)?.section}`
                  : 'Select Class'}
              </Text>
              <X size={16} color={colors.text.secondary} style={{ transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>
          </View>

          {/* Subject */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Subject <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.selectButton, !selectedClassId && styles.selectButtonDisabled]}
              onPress={() => selectedClassId && setShowSubjectModal(true)}
              disabled={!selectedClassId}
            >
              <Text style={[
                styles.selectButtonText,
                selectedSubjectId && styles.selectButtonTextSelected,
                !selectedClassId && styles.selectButtonTextDisabled,
              ]}>
                {selectedSubjectId
                  ? subjects?.find(s => s.id === selectedSubjectId)?.subject_name
                  : 'Select Subject'}
              </Text>
              <X size={16} color={colors.text.secondary} style={{ transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>
            {!selectedClassId && (
              <Text style={styles.helperText}>Please select a class first</Text>
            )}
          </View>

          {/* Schedule Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Schedule</Text>
          </View>

          {/* Date Row */}
          <View style={styles.row}>
            <View style={[styles.fieldContainer, styles.halfWidth]}>
              <Text style={styles.label}>
                Assigned Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowAssignedDatePicker(true)}
              >
                <Calendar size={16} color={colors.text.secondary} />
                <Text style={styles.dateText}>{formatDate(assignedDate)}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.fieldContainer, styles.halfWidth]}>
              <Text style={styles.label}>
                Due Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDueDatePicker(true)}
              >
                <Calendar size={16} color={colors.text.secondary} />
                <Text style={styles.dateText}>{formatDate(dueDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Information Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
          </View>

          {/* File Attachments */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>File Attachments</Text>
            <Button
              mode="outlined"
              icon={() => <Upload size={16} color={colors.primary[600]} />}
              onPress={handlePickDocument}
              style={styles.uploadButton}
              labelStyle={styles.uploadButtonLabel}
            >
              Upload
            </Button>
            <Text style={styles.helperText}>
              Max 10MB per file. Supported: Images, PDF, DOC, DOCX, TXT
            </Text>
            
            {attachments.length > 0 && (
              <View style={styles.attachmentsList}>
                {attachments.map((file, index) => (
                  <View key={index} style={styles.attachmentItem}>
                    <FileText size={16} color={colors.text.secondary} />
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <IconButton
                      icon={() => <X size={16} color={colors.error[600]} />}
                      size={16}
                      onPress={() => handleRemoveAttachment(index)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              mode="outlined"
              value={description}
              onChangeText={setDescription}
              placeholder="Enter task description (optional)"
              multiline
              numberOfLines={3}
              style={styles.textArea}
              outlineColor={colors.border.light}
              activeOutlineColor={colors.primary[600]}
            />
            <Text style={styles.charCount}>{description.length} / 1000</Text>
          </View>

          {/* Instructions */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Instructions</Text>
            <TextInput
              mode="outlined"
              value={instructions}
              onChangeText={setInstructions}
              placeholder="Enter specific instructions for students (optional)"
              multiline
              numberOfLines={3}
              style={styles.textArea}
              outlineColor={colors.border.light}
              activeOutlineColor={colors.primary[600]}
            />
            <Text style={styles.charCount}>{instructions.length} / 1000</Text>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={styles.cancelButton}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={submitting}
            disabled={submitting}
          >
            {task ? 'Update Task' : 'Create Task'}
          </Button>
        </View>
      </Modal>

      {/* Priority Selection Modal */}
      <Modal
        visible={showPriorityModal}
        onDismiss={() => setShowPriorityModal(false)}
        contentContainerStyle={styles.selectionModal}
      >
        <Text style={styles.selectionModalTitle}>Select Priority</Text>
        <View style={styles.selectionList}>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[
                styles.selectionItem,
                priority === p.value && styles.selectionItemSelected,
              ]}
              onPress={() => {
                setPriority(p.value as any);
                setShowPriorityModal(false);
              }}
            >
              <View style={styles.selectionItemContent}>
                <View style={[styles.priorityIndicator, { backgroundColor: p.color }]} />
                <Text style={[
                  styles.selectionItemText,
                  priority === p.value && styles.selectionItemTextSelected,
                ]}>
                  {p.label}
                </Text>
              </View>
              {priority === p.value && (
                <Check size={18} color={colors.primary[600]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
        <Button mode="outlined" onPress={() => setShowPriorityModal(false)} style={styles.selectionModalButton}>
          Close
        </Button>
      </Modal>

      {/* Class Selection Modal */}
      <Modal
        visible={showClassModal}
        onDismiss={() => setShowClassModal(false)}
        contentContainerStyle={styles.selectionModal}
      >
        <Text style={styles.selectionModalTitle}>Select Class</Text>
        <ScrollView style={styles.selectionList} showsVerticalScrollIndicator={true}>
          {classes?.map((cls) => (
            <TouchableOpacity
              key={cls.id}
              style={[
                styles.selectionItem,
                selectedClassId === cls.id && styles.selectionItemSelected,
              ]}
              onPress={() => {
                setSelectedClassId(cls.id);
                setShowClassModal(false);
              }}
            >
              <Text style={[
                styles.selectionItemText,
                selectedClassId === cls.id && styles.selectionItemTextSelected,
              ]}>
                Grade {cls.grade} - Section {cls.section}
              </Text>
              {selectedClassId === cls.id && (
                <Check size={18} color={colors.primary[600]} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button mode="outlined" onPress={() => setShowClassModal(false)} style={styles.selectionModalButton}>
          Close
        </Button>
      </Modal>

      {/* Subject Selection Modal */}
      <Modal
        visible={showSubjectModal}
        onDismiss={() => setShowSubjectModal(false)}
        contentContainerStyle={styles.selectionModal}
      >
        <Text style={styles.selectionModalTitle}>Select Subject</Text>
        <ScrollView style={styles.selectionList} showsVerticalScrollIndicator={true}>
          {filteredSubjects?.map((subject) => (
            <TouchableOpacity
              key={subject.id}
              style={[
                styles.selectionItem,
                selectedSubjectId === subject.id && styles.selectionItemSelected,
              ]}
              onPress={() => {
                setSelectedSubjectId(subject.id);
                setShowSubjectModal(false);
              }}
            >
              <Text style={[
                styles.selectionItemText,
                selectedSubjectId === subject.id && styles.selectionItemTextSelected,
              ]}>
                {subject.subject_name}
              </Text>
              {selectedSubjectId === subject.id && (
                <Check size={18} color={colors.primary[600]} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button mode="outlined" onPress={() => setShowSubjectModal(false)} style={styles.selectionModalButton}>
          Close
        </Button>
      </Modal>

      {/* Date Picker Modals */}
      <DatePickerModal
        visible={showAssignedDatePicker}
        onDismiss={() => setShowAssignedDatePicker(false)}
        onConfirm={(date) => {
          setAssignedDate(date);
          setShowAssignedDatePicker(false);
        }}
        initialDate={assignedDate}
        title="Select Assigned Date"
      />

      <DatePickerModal
        visible={showDueDatePicker}
        onDismiss={() => setShowDueDatePicker(false)}
        onConfirm={(date) => {
          setDueDate(date);
          setShowDueDatePicker(false);
        }}
        initialDate={dueDate}
        minimumDate={assignedDate}
        title="Select Due Date"
      />
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: colors.surface.primary,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.secondary,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  headerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  content: {
    padding: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error[600],
  },
  input: {
    backgroundColor: colors.surface.primary,
    fontSize: typography.fontSize.base,
  },
  textArea: {
    backgroundColor: colors.surface.primary,
    minHeight: 100,
    fontSize: typography.fontSize.base,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfWidth: {
    flex: 1,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.primary,
  },
  selectButtonDisabled: {
    opacity: 0.5,
    backgroundColor: colors.background.secondary,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  selectButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  selectButtonTextSelected: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium as any,
  },
  selectButtonTextDisabled: {
    color: colors.text.secondary,
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  selectionModal: {
    backgroundColor: colors.surface.primary,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    maxHeight: '70%',
  },
  selectionModalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  selectionList: {
    maxHeight: 300,
    marginBottom: spacing.md,
  },
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  selectionItemSelected: {
    backgroundColor: colors.primary[50],
  },
  selectionItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  selectionItemText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  selectionItemTextSelected: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold as any,
  },
  selectionModalButton: {
    borderColor: colors.border.DEFAULT,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.primary,
  },
  dateText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  uploadButton: {
    borderColor: colors.primary[600],
    borderStyle: 'dashed',
  },
  uploadButtonLabel: {
    color: colors.primary[600],
  },
  attachmentsList: {
    marginTop: spacing.sm,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  attachmentName: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.secondary,
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.border.DEFAULT,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary[600],
    elevation: 2,
  },
});

