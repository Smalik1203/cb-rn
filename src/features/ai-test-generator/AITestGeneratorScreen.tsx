import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Upload,
  Sparkles,
  X,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../../lib/design-system';
import { generateQuestionsFromImage, GeneratedQuestion } from '../../services/aiTestGeneratorFetch';
import { useAuth } from '../../contexts/AuthContext';
import { useClasses } from '../../hooks/useClasses';
import { useSubjects } from '../../hooks/useSubjects';
import { useCreateTest } from '../../hooks/tests';
import { TestInput } from '../../types/test.types';
import { supabase } from '../../lib/supabase';

export default function AITestGeneratorScreen() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const { data: classes = [] } = useClasses(profile?.school_code || '');
  const { data: subjectsResult } = useSubjects(profile?.school_code || '');
  const subjects = subjectsResult?.data || [];
  const createTest = useCreateTest();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [testTitle, setTestTitle] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [saving, setSaving] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  // Request permissions
  React.useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.5, // Reduced quality for faster upload
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('[AI Test Generator] Image selected, size:', asset.fileSize ? (asset.fileSize / 1024).toFixed(0) + 'KB' : 'unknown');
        setSelectedImage(asset.uri);
        setGeneratedQuestions([]); // Reset questions when new image is selected
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleGenerateQuestions = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image first');
      return;
    }

    if (questionCount < 5 || questionCount > 20) {
      Alert.alert('Invalid Count', 'Please select between 5 and 20 questions');
      return;
    }

    try {
      setGenerating(true);
      setGeneratedQuestions([]);
      setStreamingText('🔄 Preparing image...');

      const result = await generateQuestionsFromImage(
        selectedImage,
        questionCount,
        additionalContext || undefined,
        (text) => {
          // Update streaming text with animation
          setStreamingText(text);
        }
      );

      console.log('[AI Test Generator UI] Generation complete');

      if (result.error) {
        Alert.alert('Generation Failed', result.error);
        return;
      }

      if (result.questions.length === 0) {
        Alert.alert('No Questions', 'No questions were generated. Please try again.');
        return;
      }

      setGeneratedQuestions(result.questions);
      setStreamingText(''); // Clear streaming text when done
      Alert.alert(
        'Success',
        `Generated ${result.totalGenerated} questions! Review and save as a test.`
      );
    } catch (error: any) {
      console.error('Error generating questions:', error);
      Alert.alert('Error', error.message || 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAsTest = async () => {
    if (!testTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a test title');
      return;
    }

    if (!selectedClassId) {
      Alert.alert('Missing Class', 'Please select a class');
      return;
    }

    if (!selectedSubjectId) {
      Alert.alert('Missing Subject', 'Please select a subject');
      return;
    }

    if (generatedQuestions.length === 0) {
      Alert.alert('No Questions', 'Generate questions first');
      return;
    }

    try {
      setSaving(true);

      console.log('[AI Test Generator] Creating test with', generatedQuestions.length, 'questions');

      // Create test
      const testData: TestInput = {
        title: testTitle.trim(),
        description: `AI-generated test with ${generatedQuestions.length} questions`,
        class_instance_id: selectedClassId,
        subject_id: selectedSubjectId,
        school_code: profile?.school_code || '',
        test_type: 'quiz',
        test_mode: 'online',
        time_limit_seconds: generatedQuestions.length * 60, // 1 minute per question
        status: 'active',
        created_by: user?.id || '',
      };

      const createdTest = await createTest.mutateAsync(testData);

      console.log('[AI Test Generator] Test created:', createdTest.id);
      console.log('[AI Test Generator] Now importing', generatedQuestions.length, 'questions...');

      // Prepare questions for bulk insert
      const questionsToCreate = generatedQuestions.map((q, index) => ({
        test_id: createdTest.id,
        question_text: q.question_text,
        question_type: 'mcq',
        options: q.options,
        correct_index: q.correct_index,
        correct_answer: null,
        points: 1,
        order_index: index,
      }));

      // Bulk create all questions using Supabase
      const { data: createdQuestions, error: questionsError } = await supabase
        .from('test_questions')
        .insert(questionsToCreate)
        .select();

      if (questionsError) {
        console.error('[AI Test Generator] Error creating questions:', questionsError);
        throw new Error(questionsError.message || 'Failed to create questions');
      }

      console.log('[AI Test Generator] Successfully created', createdQuestions?.length || 0, 'questions');

      // Success! Navigate back to assessments
      Alert.alert(
        'Success! 🎉',
        `Test "${testTitle}" created with ${generatedQuestions.length} AI-generated questions!`,
        [
          {
            text: 'View Test',
            onPress: () => router.push(`/test/${createdTest.id}/questions?testTitle=${encodeURIComponent(testTitle)}`),
          },
          {
            text: 'Done',
            onPress: () => router.back(),
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      console.error('[AI Test Generator] Error saving test:', error);
      Alert.alert('Error', error.message || 'Failed to save test');
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = (index: number) => {
    setGeneratedQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleRow}>
              <Sparkles size={24} color={colors.primary[600]} />
              <Text style={styles.headerTitle}>AI Test Generator</Text>
            </View>
            <Text style={styles.headerSubtitle}>Generate tests from images using AI</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Step 1: Upload Image */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Upload Image</Text>
            <Text style={styles.sectionDescription}>
              Upload a photo of textbook pages, notes, or study material
            </Text>

            {selectedImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={() => setSelectedImage(null)}>
                  <X size={20} color={colors.text.inverse} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Upload size={32} color={colors.primary[600]} />
                <Text style={styles.uploadButtonText}>Choose Image</Text>
                <Text style={styles.uploadButtonSubtext}>PNG, JPG up to 10MB</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Step 2: Configure Test */}
          {selectedImage && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. Configure Test</Text>

                {/* Question Count */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Number of Questions</Text>
                  <View style={styles.questionCountSelector}>
                    {[5, 10, 15, 20].map((count) => (
                      <TouchableOpacity
                        key={count}
                        style={[
                          styles.countButton,
                          questionCount === count && styles.countButtonActive,
                        ]}
                        onPress={() => setQuestionCount(count)}
                      >
                        <Text
                          style={[
                            styles.countButtonText,
                            questionCount === count && styles.countButtonTextActive,
                          ]}
                        >
                          {count}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Additional Context */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Additional Context (Optional)</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="e.g., Focus on photosynthesis, Include definitions..."
                    value={additionalContext}
                    onChangeText={setAdditionalContext}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={colors.text.tertiary}
                  />
                </View>

                {/* Generate Button */}
                <TouchableOpacity
                  style={[styles.generateButton, generating && styles.generateButtonDisabled]}
                  onPress={handleGenerateQuestions}
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <ActivityIndicator size="small" color={colors.text.inverse} />
                      <Text style={styles.generateButtonText}>Generating...</Text>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} color={colors.text.inverse} />
                      <Text style={styles.generateButtonText}>Generate Questions</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Streaming Animation Display */}
                {generating && streamingText && (
                  <View style={styles.streamingContainer}>
                    <View style={styles.streamingHeader}>
                      <Sparkles size={16} color={colors.primary[600]} />
                      <Text style={styles.streamingTitle}>AI is creating questions...</Text>
                    </View>
                    <ScrollView style={styles.streamingContent} nestedScrollEnabled>
                      <Text style={styles.streamingText}>{streamingText}</Text>
                      <View style={styles.typingIndicator}>
                        <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
                        <View style={[styles.typingDot, { animationDelay: '150ms' }]} />
                        <View style={[styles.typingDot, { animationDelay: '300ms' }]} />
                      </View>
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Step 3: Review Questions */}
              {generatedQuestions.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>3. Review & Save</Text>
                  <Text style={styles.sectionDescription}>
                    {generatedQuestions.length} questions generated
                  </Text>

                  {/* Test Details */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Test Title *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g., Biology Chapter 3 Quiz"
                      value={testTitle}
                      onChangeText={setTestTitle}
                      placeholderTextColor={colors.text.tertiary}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Class *</Text>
                    <View style={styles.pickerWrapper}>
                      {classes.length === 0 ? (
                        <Text style={styles.pickerPlaceholder}>No classes available</Text>
                      ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                          {classes.map((cls: any) => (
                            <TouchableOpacity
                              key={cls.id}
                              style={[
                                styles.chip,
                                selectedClassId === cls.id && styles.chipActive,
                              ]}
                              onPress={() => setSelectedClassId(cls.id)}
                            >
                              <Text
                                style={[
                                  styles.chipText,
                                  selectedClassId === cls.id && styles.chipTextActive,
                                ]}
                              >
                                Grade {cls.grade} - {cls.section}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Subject *</Text>
                    <View style={styles.pickerWrapper}>
                      {subjects.length === 0 ? (
                        <Text style={styles.pickerPlaceholder}>No subjects available</Text>
                      ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                          {subjects.map((subject: any) => (
                            <TouchableOpacity
                              key={subject.id}
                              style={[
                                styles.chip,
                                selectedSubjectId === subject.id && styles.chipActive,
                              ]}
                              onPress={() => setSelectedSubjectId(subject.id)}
                            >
                              <Text
                                style={[
                                  styles.chipText,
                                  selectedSubjectId === subject.id && styles.chipTextActive,
                                ]}
                              >
                                {subject.subject_name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  </View>

                  {/* Questions Preview */}
                  <View style={styles.questionsPreview}>
                    {generatedQuestions.map((question, index) => (
                      <View key={index} style={styles.questionCard}>
                        <View style={styles.questionHeader}>
                          <Text style={styles.questionNumber}>Q{index + 1}</Text>
                          <TouchableOpacity
                            onPress={() => removeQuestion(index)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <X size={18} color={colors.error[600]} />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.questionText}>{question.question_text}</Text>
                        {question.options.map((option, optIndex) => (
                          <View
                            key={optIndex}
                            style={[
                              styles.optionRow,
                              optIndex === question.correct_index && styles.optionRowCorrect,
                            ]}
                          >
                            <Text
                              style={[
                                styles.optionLabel,
                                optIndex === question.correct_index && styles.optionLabelCorrect,
                              ]}
                            >
                              {String.fromCharCode(65 + optIndex)}
                            </Text>
                            <Text
                              style={[
                                styles.optionText,
                                optIndex === question.correct_index && styles.optionTextCorrect,
                              ]}
                            >
                              {option}
                            </Text>
                            {optIndex === question.correct_index && (
                              <CheckCircle2 size={16} color={colors.success[600]} />
                            )}
                          </View>
                        ))}
                        {question.explanation && (
                          <View style={styles.explanationBox}>
                            <Text style={styles.explanationLabel}>Explanation:</Text>
                            <Text style={styles.explanationText}>{question.explanation}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>

                  {/* Save Button */}
                  <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSaveAsTest}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={colors.text.inverse} />
                    ) : (
                      <Text style={styles.saveButtonText}>Save as Test</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  uploadButton: {
    backgroundColor: colors.surface.primary,
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  uploadButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
    marginTop: spacing.sm,
  },
  uploadButtonSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[100],
  },
  removeImageButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.error[600],
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  questionCountSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  countButton: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  countButtonActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  countButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  countButtonTextActive: {
    color: colors.primary[600],
  },
  textArea: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textInput: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  pickerWrapper: {
    minHeight: 50,
  },
  pickerPlaceholder: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
    padding: spacing.md,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginRight: spacing.xs,
  },
  chipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    ...shadows.md,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
  streamingContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary[200],
    padding: spacing.md,
    maxHeight: 300,
  },
  streamingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  streamingTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
  streamingContent: {
    maxHeight: 250,
  },
  streamingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[600],
    opacity: 0.6,
  },
  questionsPreview: {
    marginTop: spacing.md,
  },
  questionCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  questionNumber: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  questionText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  optionRowCorrect: {
    backgroundColor: colors.success[50],
  },
  optionLabel: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  optionLabelCorrect: {
    backgroundColor: colors.success[600],
    color: colors.text.inverse,
  },
  optionText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  optionTextCorrect: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.success[700],
  },
  explanationBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[600],
  },
  explanationLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    marginBottom: spacing.xs,
  },
  explanationText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: colors.success[600],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    ...shadows.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
});
