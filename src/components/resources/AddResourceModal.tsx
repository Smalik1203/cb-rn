import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal as RNModal, Animated } from 'react-native';
import { Text, Button, Portal, Modal, TextInput, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Upload, X, FileText, Video, HelpCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
// no need for expo-file-system here; we fetch the file URI directly to Blob
import { colors, typography, spacing, borderRadius } from '../../../lib/design-system';
import { useAuth } from '../../contexts/AuthContext';
import { useClasses } from '../../hooks/useClasses';
import { useSubjects } from '../../hooks/useSubjects';
import { supabase } from '../../lib/supabase';

interface AddResourceModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
  editingResource?: any;
}

const STORAGE_BUCKET = 'Lms';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Modern file picker with validation
const pickFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['video/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return null;
    
    const file = result.assets[0];
    
    // Validate file size
    if (file.size && file.size > MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }
    
    return file;
  } catch (error) {
    console.error('Error picking file:', error);
    throw error;
  }
};

// Modern file upload using FormData (works reliably in React Native)
const uploadToSupabase = async (file: any, pathPrefix: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${pathPrefix}/${fileName}`;

  try {
    console.log('Uploading file to Supabase Storage:', file.name, file.mimeType);
    
    // Create FormData with the file
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.mimeType || 'application/octet-stream',
      name: file.name,
    } as any);

    // Upload using Supabase Storage with FormData
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, formData, {
        contentType: file.mimeType || 'application/octet-stream',
        upsert: false, // Don't overwrite existing files
      });

    if (uploadError) {
      console.error('Upload error details:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    console.log('✅ File uploaded successfully to:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

export const AddResourceModal: React.FC<AddResourceModalProps> = ({
  visible,
  onDismiss,
  onSuccess,
  editingResource
}) => {
  const { profile } = useAuth();
  const { data: classes = [] } = useClasses(profile?.school_code);
  const { data: subjects = [] } = useSubjects(profile?.school_code);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resource_type: 'video',
    subject_id: '',
    class_instance_id: '',
    content_url: ''
  });
  
  const [useFileUpload, setUseFileUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      if (editingResource) {
        setFormData({
          title: editingResource.title || '',
          description: editingResource.description || '',
          resource_type: editingResource.resource_type || 'video',
          subject_id: editingResource.subject_id || '',
          class_instance_id: editingResource.class_instance_id || '',
          content_url: editingResource.content_url || ''
        });
      } else {
        setFormData({
          title: '',
          description: '',
          resource_type: 'video',
          subject_id: '',
          class_instance_id: '',
          content_url: ''
        });
      }
      setUseFileUpload(false);
      setSelectedFile(null);
    }
  }, [visible, editingResource]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFilePick = async () => {
    try {
      const file = await pickFile();
      if (file) {
        setSelectedFile(file);
        setFormData(prev => ({ ...prev, content_url: file.uri }));
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', error.message || 'Failed to pick file');
    }
  };

  // Modern file upload using helper function
  const uploadFileToStorage = async (file: any): Promise<string> => {
    if (!profile?.school_code) {
      throw new Error('School code not found');
    }

    if (!formData.class_instance_id || !formData.subject_id) {
      throw new Error('Please select both class and subject before uploading');
    }

    const pathPrefix = `${profile.school_code}/${formData.class_instance_id}/${formData.subject_id}`;
    return await uploadToSupabase(file, pathPrefix);
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.title.trim()) {
        Alert.alert('Error', 'Please enter a title');
        return;
      }
      if (!formData.description.trim()) {
        Alert.alert('Error', 'Please enter a description');
        return;
      }
      if (!formData.subject_id) {
        Alert.alert('Error', 'Please select a subject');
        return;
      }
      if (!formData.class_instance_id) {
        Alert.alert('Error', 'Please select a class');
        return;
      }
      if (!formData.content_url.trim()) {
        Alert.alert('Error', 'Please provide content URL or upload a file');
        return;
      }

      setUploading(true);

      let contentUrl = formData.content_url;

      // Upload file if selected
      if (useFileUpload && selectedFile) {
        contentUrl = await uploadFileToStorage(selectedFile);
      }

      const resourceData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        resource_type: formData.resource_type,
        content_url: contentUrl,
        school_code: profile?.school_code,
        subject_id: formData.subject_id,
        class_instance_id: formData.class_instance_id,
        uploaded_by: profile?.auth_id
      };

      console.log('Saving resource with data:', resourceData);

      if (editingResource) {
        // Update existing resource
        const { data, error } = await supabase
          .from('learning_resources')
          .update(resourceData)
          .eq('id', editingResource.id)
          .select();

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        console.log('Resource updated:', data);
        Alert.alert('Success', 'Resource updated successfully');
      } else {
        // Create new resource
        const { data, error } = await supabase
          .from('learning_resources')
          .insert([resourceData])
          .select();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        console.log('Resource created:', data);
        Alert.alert('Success', 'Resource created successfully');
      }

      onSuccess();
      onDismiss();
    } catch (error) {
      console.error('Error saving resource:', error);
      Alert.alert('Error', error.message || 'Failed to save resource');
    } finally {
      setUploading(false);
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video size={20} color={colors.primary[600]} />;
      case 'pdf':
        return <FileText size={20} color={colors.primary[600]} />;
      case 'quiz':
        return <HelpCircle size={20} color={colors.primary[600]} />;
      default:
        return <FileText size={20} color={colors.primary[600]} />;
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {editingResource ? 'Edit Resource' : 'Add New Resource'}
          </Text>
          <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
            <X size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Resource Title *</Text>
              <TextInput
                value={formData.title}
                onChangeText={(text) => handleInputChange('title', text)}
                placeholder="Enter resource title"
                style={styles.input}
                mode="outlined"
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                placeholder="Enter resource description"
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Resource Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Resource Type *</Text>
              <SegmentedButtons
                value={formData.resource_type}
                onValueChange={(value) => handleInputChange('resource_type', value)}
                buttons={[
                  {
                    value: 'video',
                    label: 'Video',
                    icon: 'video',
                  },
                  {
                    value: 'pdf',
                    label: 'PDF',
                    icon: 'file-pdf-box',
                  },
                  {
                    value: 'quiz',
                    label: 'Quiz',
                    icon: 'help-circle',
                  },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            {/* Subject Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subject *</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowSubjectDropdown(true)}
              >
                <Text style={styles.dropdownText}>
                  {formData.subject_id 
                    ? subjects.find(s => s.id === formData.subject_id)?.subject_name || 'Select Subject'
                    : 'Select Subject'
                  }
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Class Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Class *</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowClassDropdown(true)}
              >
                <Text style={styles.dropdownText}>
                  {formData.class_instance_id 
                    ? classes.find(c => c.id === formData.class_instance_id) 
                        ? `Grade ${classes.find(c => c.id === formData.class_instance_id)?.grade} - ${classes.find(c => c.id === formData.class_instance_id)?.section}`
                        : 'Select Class'
                    : 'Select Class'
                  }
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Content Source Toggle */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Content Source</Text>
              <SegmentedButtons
                value={useFileUpload ? 'upload' : 'url'}
                onValueChange={(value) => setUseFileUpload(value === 'upload')}
                buttons={[
                  { value: 'url', label: 'Use URL' },
                  { value: 'upload', label: 'Upload File' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            {/* Content URL or File Upload */}
            {!useFileUpload ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Content URL *</Text>
                <TextInput
                  value={formData.content_url}
                  onChangeText={(text) => handleInputChange('content_url', text)}
                  placeholder="Enter URL to video, PDF, or quiz content"
                  style={styles.input}
                  mode="outlined"
                />
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Upload File *</Text>
                <TouchableOpacity style={styles.fileUploadButton} onPress={handleFilePick}>
                  <Upload size={20} color={colors.primary[600]} />
                  <Text style={styles.fileUploadText}>
                    {selectedFile ? selectedFile.name : 'Choose File'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.fileUploadHint}>
                  Supported: Videos (mp4, etc.), PDFs. Max size: 10MB. File will be stored in Supabase Storage.
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={onDismiss}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={uploading}
                disabled={uploading}
                style={styles.submitButton}
              >
                {editingResource ? 'Update Resource' : 'Create Resource'}
              </Button>
            </View>
          </View>
        </ScrollView>

        {/* Subject Dropdown Modal */}
        <RNModal
          visible={showSubjectDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSubjectDropdown(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowSubjectDropdown(false)}
            />
            <View style={styles.dropdownModal}>
              <Text style={styles.dropdownTitle}>Select Subject</Text>
              <ScrollView style={styles.dropdownList}>
                {subjects.map((subject) => (
                  <TouchableOpacity
                    key={subject.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      handleInputChange('subject_id', subject.id);
                      setShowSubjectDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{subject.subject_name}</Text>
                    {formData.subject_id === subject.id && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </RNModal>

        {/* Class Dropdown Modal */}
        <RNModal
          visible={showClassDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowClassDropdown(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowClassDropdown(false)}
            />
            <View style={styles.dropdownModal}>
              <Text style={styles.dropdownTitle}>Select Class</Text>
              <ScrollView style={styles.dropdownList}>
                {classes.map((cls) => (
                  <TouchableOpacity
                    key={cls.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      handleInputChange('class_instance_id', cls.id);
                      setShowClassDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>
                      Grade {cls.grade} - Section {cls.section}
                    </Text>
                    {formData.class_instance_id === cls.id && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </RNModal>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: colors.surface.primary,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    maxHeight: '90%',
  },
  scrollView: {
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  form: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface.primary,
  },
  segmentedButtons: {
    marginTop: spacing.xs,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  dropdownText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  fileUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderStyle: 'dashed',
  },
  fileUploadText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  fileUploadHint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    margin: spacing.lg,
    maxHeight: '60%',
    minWidth: 300,
  },
  dropdownTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  dropdownItemText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
  checkmark: {
    fontSize: typography.fontSize.base,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },
});
