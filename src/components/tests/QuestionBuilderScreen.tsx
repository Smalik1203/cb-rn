import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, ArrowLeft, Save, Image as ImageIcon, Upload } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTestQuestions, useCreateQuestion, useUpdateQuestion, useDeleteQuestion } from '../../hooks/tests';
import { TestQuestion, QuestionType } from '../../types/test.types';
import { colors, spacing, typography, borderRadius, shadows } from '../../../lib/design-system';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { ImportQuestionsModal } from './ImportQuestionsModal';
import { ParsedQuestion } from '../../utils/questionParsers';

export function QuestionBuilderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const testId = params.testId as string;
  const testTitle = params.testTitle as string;

  const { data: questions = [], isLoading } = useTestQuestions(testId);
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('mcq');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [correctText, setCorrectText] = useState('');
  const [points, setPoints] = useState('10');
  const [showImportModal, setShowImportModal] = useState(false);

  const resetForm = () => {
    setEditingQuestionId(null);
    setQuestionText('');
    setQuestionType('mcq');
    setOptions(['', '', '', '']);
    setCorrectIndex(0);
    setCorrectText('');
    setPoints('10');
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      // TODO: Upload image and get URL
      Alert.alert('Image Selected', 'Image upload functionality to be implemented');
    }
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
    });

    if (!result.canceled) {
      // TODO: Upload document and get URL
      Alert.alert('Document Selected', 'Document upload functionality to be implemented');
    }
  };

  const validateQuestion = () => {
    if (!questionText.trim()) {
      Alert.alert('Error', 'Please enter question text');
      return false;
    }

    if (questionType === 'mcq') {
      const filledOptions = options.filter((opt) => opt.trim() !== '');
      if (filledOptions.length < 2) {
        Alert.alert('Error', 'Please provide at least 2 options for MCQ');
        return false;
      }
      if (!options[correctIndex]?.trim()) {
        Alert.alert('Error', 'Please select a valid correct option');
        return false;
      }
    }

    if (questionType === 'one_word' && !correctText.trim()) {
      Alert.alert('Error', 'Please enter the correct answer');
      return false;
    }

    const pointsNum = parseInt(points);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      Alert.alert('Error', 'Please enter valid points (greater than 0)');
      return false;
    }

    return true;
  };

  const handleSaveQuestion = async () => {
    if (!validateQuestion()) return;

    const questionData = {
      test_id: testId,
      question_text: questionText.trim(),
      question_type: questionType,
      points: parseInt(points),
      order_index: editingQuestionId ? 0 : questions.length,
      options: questionType === 'mcq' ? options.filter((opt) => opt.trim()) : null,
      correct_index: questionType === 'mcq' ? correctIndex : null,
      correct_text: questionType === 'one_word' ? correctText.trim() : null,
      correct_answer: null,
    };

    try {
      if (editingQuestionId) {
        await updateQuestion.mutateAsync({ questionId: editingQuestionId, questionData });
        Alert.alert('Success', 'Question updated successfully');
      } else {
        await createQuestion.mutateAsync(questionData);
        Alert.alert('Success', 'Question added successfully');
      }
      resetForm();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save question');
    }
  };

  const handleEditQuestion = (question: TestQuestion) => {
    setEditingQuestionId(question.id);
    setQuestionText(question.question_text);
    setQuestionType(question.question_type);
    setPoints(String(question.points));

    if (question.question_type === 'mcq') {
      setOptions(question.options || ['', '', '', '']);
      setCorrectIndex(question.correct_index || 0);
    } else if (question.question_type === 'one_word') {
      setCorrectText(question.correct_text || '');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    Alert.alert('Delete Question', 'Are you sure you want to delete this question?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteQuestion.mutateAsync({ questionId, testId });
            Alert.alert('Success', 'Question deleted');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete question');
          }
        },
      },
    ]);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleImportQuestions = async (importedQuestions: ParsedQuestion[]) => {
    try {
      const currentMaxOrder = questions.length > 0
        ? Math.max(...questions.map((q) => q.order_index))
        : -1;

      // Create all questions
      for (let i = 0; i < importedQuestions.length; i++) {
        const q = importedQuestions[i];
        await createQuestion.mutateAsync({
          test_id: testId,
          question_text: q.question_text,
          question_type: q.question_type,
          points: q.points,
          options: q.options,
          correct_answer: q.correct_answer,
          order_index: currentMaxOrder + i + 1,
        });
      }

      Alert.alert('Success', `Imported ${importedQuestions.length} questions successfully`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to import questions');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Questions</Text>
          <Text style={styles.headerSubtitle}>{testTitle}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Import Button */}
        <TouchableOpacity
          style={styles.importButton}
          onPress={() => setShowImportModal(true)}
        >
          <Upload size={20} color={colors.primary[600]} />
          <Text style={styles.importButtonText}>Import Questions from File</Text>
        </TouchableOpacity>

        {/* Question Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {editingQuestionId ? 'Edit Question' : 'Add New Question'}
          </Text>

          {/* Question Type Selector */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Question Type *</Text>
            <View style={styles.typeSelector}>
              {[
                { value: 'mcq', label: 'Multiple Choice' },
                { value: 'one_word', label: 'One Word' },
                { value: 'long_answer', label: 'Long Answer' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    questionType === type.value && styles.typeButtonActive,
                  ]}
                  onPress={() => setQuestionType(type.value as QuestionType)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      questionType === type.value && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Question Text */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Question *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter question text..."
              value={questionText}
              onChangeText={setQuestionText}
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.text.secondary}
            />
            <View style={styles.attachmentButtons}>
              <TouchableOpacity style={styles.attachmentButton} onPress={handlePickImage}>
                <ImageIcon size={16} color={colors.primary[600]} />
                <Text style={styles.attachmentButtonText}>Add Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachmentButton} onPress={handlePickDocument}>
                <ImageIcon size={16} color={colors.primary[600]} />
                <Text style={styles.attachmentButtonText}>Add PDF</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* MCQ Options */}
          {questionType === 'mcq' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Options * (Select correct answer)</Text>
              {options.map((option, index) => (
                <View key={index} style={styles.optionRow}>
                  <TouchableOpacity
                    style={[
                      styles.radioButton,
                      correctIndex === index && styles.radioButtonActive,
                    ]}
                    onPress={() => setCorrectIndex(index)}
                  >
                    {correctIndex === index && <View style={styles.radioButtonInner} />}
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.input, styles.optionInput]}
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChangeText={(text) => updateOption(index, text)}
                    placeholderTextColor={colors.text.secondary}
                  />
                </View>
              ))}
            </View>
          )}

          {/* One Word Answer */}
          {questionType === 'one_word' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Correct Answer *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter correct answer..."
                value={correctText}
                onChangeText={setCorrectText}
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          )}

          {/* Long Answer Info */}
          {questionType === 'long_answer' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Long answer questions will be graded manually by the teacher.
              </Text>
            </View>
          )}

          {/* Points */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Points *</Text>
            <TextInput
              style={[styles.input, styles.pointsInput]}
              placeholder="10"
              value={points}
              onChangeText={setPoints}
              keyboardType="numeric"
              placeholderTextColor={colors.text.secondary}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.formActions}>
            {editingQuestionId && (
              <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.saveButton, { flex: editingQuestionId ? 1 : undefined }]}
              onPress={handleSaveQuestion}
            >
              <Save size={20} color={colors.text.inverse} />
              <Text style={styles.saveButtonText}>
                {editingQuestionId ? 'Update Question' : 'Add Question'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Questions List */}
        <View style={styles.questionsSection}>
          <View style={styles.questionsSectionHeader}>
            <Text style={styles.sectionTitle}>
              Questions ({questions.length})
            </Text>
          </View>

          {questions.length === 0 ? (
            <View style={styles.emptyState}>
              <Plus size={48} color={colors.text.secondary} />
              <Text style={styles.emptyStateText}>
                No questions added yet. Add your first question above.
              </Text>
            </View>
          ) : (
            questions.map((question, index) => (
              <View key={question.id} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNumber}>Q{index + 1}</Text>
                  <View style={styles.questionBadges}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {question.question_type.toUpperCase()}
                      </Text>
                    </View>
                    <View style={[styles.badge, styles.badgePoints]}>
                      <Text style={styles.badgeText}>{question.points} pts</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.questionText}>{question.question_text}</Text>

                {question.question_type === 'mcq' && question.options && (
                  <View style={styles.optionsList}>
                    {question.options.map((option, optIndex) => (
                      <View key={optIndex} style={styles.optionItem}>
                        <View
                          style={[
                            styles.optionBullet,
                            optIndex === question.correct_index &&
                              styles.optionBulletCorrect,
                          ]}
                        />
                        <Text
                          style={[
                            styles.optionText,
                            optIndex === question.correct_index &&
                              styles.optionTextCorrect,
                          ]}
                        >
                          {option}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {question.question_type === 'one_word' && (
                  <View style={styles.answerBox}>
                    <Text style={styles.answerLabel}>Answer:</Text>
                    <Text style={styles.answerText}>{question.correct_text}</Text>
                  </View>
                )}

                <View style={styles.questionActions}>
                  <TouchableOpacity
                    style={styles.questionActionButton}
                    onPress={() => handleEditQuestion(question as TestQuestion)}
                  >
                    <Text style={styles.questionActionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.questionActionButton, styles.questionActionButtonDanger]}
                    onPress={() => handleDeleteQuestion(question.id)}
                  >
                    <Trash2 size={16} color={colors.error[600]} />
                    <Text style={[styles.questionActionText, styles.questionActionTextDanger]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Import Questions Modal */}
      <ImportQuestionsModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportQuestions}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.primary,
    ...shadows.sm,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary[600],
    borderStyle: 'dashed',
    backgroundColor: colors.primary[50],
  },
  importButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
  formCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  formTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface.secondary,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.surface.secondary,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  typeButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  typeButtonTextActive: {
    color: colors.text.inverse,
  },
  attachmentButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
  },
  attachmentButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[600],
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonActive: {
    borderColor: colors.primary[600],
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[600],
  },
  optionInput: {
    flex: 1,
  },
  pointsInput: {
    width: 100,
  },
  infoBox: {
    backgroundColor: colors.warning[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning[700],
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.surface.secondary,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[600],
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
  questionsSection: {
    marginBottom: spacing.xl,
  },
  questionsSectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  emptyState: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  questionNumber: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  questionBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary[100],
  },
  badgePoints: {
    backgroundColor: colors.success[100],
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
  questionText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  optionsList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral[400],
  },
  optionBulletCorrect: {
    backgroundColor: colors.success[600],
  },
  optionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  optionTextCorrect: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.success[600],
  },
  answerBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.success[50],
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  answerLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success[700],
  },
  answerText: {
    fontSize: typography.fontSize.sm,
    color: colors.success[700],
  },
  questionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
    paddingTop: spacing.md,
  },
  questionActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.secondary,
  },
  questionActionButtonDanger: {
    backgroundColor: colors.error[50],
  },
  questionActionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  questionActionTextDanger: {
    color: colors.error[600],
  },
});
