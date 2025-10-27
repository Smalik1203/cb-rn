import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Portal, Modal, TextInput, SegmentedButtons } from 'react-native-paper';
import { Calendar, Clock, ChevronLeft, ChevronRight, Plus, Edit, Trash2, CheckCircle, Circle, Settings } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useUnifiedTimetable } from '../../hooks/useUnifiedTimetable';
import { useSyllabusLoader } from '../../hooks/useSyllabusLoader';
import { useClasses } from '../../hooks/useClasses';
import { useSubjects, useAdmin } from '../../hooks/useSubjects';
import { colors, typography, spacing, borderRadius, shadows } from '../../../lib/design-system';
import dayjs from 'dayjs';

export function UnifiedTimetableScreen() {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [showQuickGenerateModal, setShowQuickGenerateModal] = useState(false);
  const [slotForm, setSlotForm] = useState({
    slot_type: 'period',
    name: '',
    start_time: '',
    end_time: '',
    subject_id: '',
    teacher_id: '',
    plan_text: '',
    syllabus_chapter_id: '',
    syllabus_topic_id: '',
  });

  const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
  const { data: classes } = useClasses(profile?.school_code);
  const { data: subjects } = useSubjects(profile?.school_code);
  const { data: admin } = useAdmin(profile?.school_code);
  const { slots, displayPeriodNumber, loading, error, refetch, createSlot, updateSlot, deleteSlot, quickGenerate, markSlotTaught, unmarkSlotTaught, taughtSlotIds } = useUnifiedTimetable(
    selectedClassId,
    dateStr
  );

  const { chaptersById, syllabusContentMap } = useSyllabusLoader(selectedClassId, profile?.school_code);

  // Navigation functions
  const goToPreviousDay = () => {
    setSelectedDate(prev => dayjs(prev).subtract(1, 'day').toDate());
  };

  const goToNextDay = () => {
    setSelectedDate(prev => dayjs(prev).add(1, 'day').toDate());
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Handle slot form changes
  const handleSlotFormChange = (field: string, value: any) => {
    setSlotForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle add slot
  const handleAddSlot = async () => {
    if (!selectedClassId || !profile?.school_code) return;

    try {
      await createSlot({
        class_instance_id: selectedClassId,
        school_code: profile.school_code,
        class_date: dateStr,
        period_number: slotForm.slot_type === 'break' ? 0 : slots.filter(s => s.slot_type === 'period').length + 1,
        slot_type: slotForm.slot_type,
        name: slotForm.slot_type === 'break' ? slotForm.name : null,
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
        subject_id: slotForm.slot_type === 'period' ? slotForm.subject_id : null,
        teacher_id: slotForm.slot_type === 'period' ? slotForm.teacher_id : null,
        plan_text: slotForm.slot_type === 'period' ? slotForm.plan_text : null,
        syllabus_chapter_id: slotForm.slot_type === 'period' ? slotForm.syllabus_chapter_id : null,
        syllabus_topic_id: slotForm.slot_type === 'period' ? slotForm.syllabus_topic_id : null,
      });
      
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to create slot');
    }
  };

  // Handle edit slot
  const handleEditSlot = async () => {
    if (!editingSlot) return;

    try {
      await updateSlot(editingSlot.id, {
        slot_type: slotForm.slot_type,
        name: slotForm.slot_type === 'break' ? slotForm.name : null,
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
        subject_id: slotForm.slot_type === 'period' ? slotForm.subject_id : null,
        teacher_id: slotForm.slot_type === 'period' ? slotForm.teacher_id : null,
        plan_text: slotForm.slot_type === 'period' ? slotForm.plan_text : null,
        syllabus_chapter_id: slotForm.slot_type === 'period' ? slotForm.syllabus_chapter_id : null,
        syllabus_topic_id: slotForm.slot_type === 'period' ? slotForm.syllabus_topic_id : null,
      });
      
      setEditingSlot(null);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to update slot');
    }
  };

  // Handle delete slot
  const handleDeleteSlot = async (slotId: string) => {
    Alert.alert(
      'Delete Slot',
      'Are you sure you want to delete this slot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSlot(slotId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete slot');
            }
          },
        },
      ]
    );
  };

  // Handle mark taught
  const handleMarkTaught = async (slotId: string) => {
    try {
      if (taughtSlotIds.has(slotId)) {
        await unmarkSlotTaught(slotId);
      } else {
        await markSlotTaught(slotId);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update slot status');
    }
  };

  // Handle quick generate
  const handleQuickGenerate = async () => {
    if (!selectedClassId || !profile?.school_code) return;

    Alert.alert(
      'Quick Generate',
      'This will create 8 periods with breaks. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              await quickGenerate({
                class_instance_id: selectedClassId,
                school_code: profile.school_code,
                class_date: dateStr,
                startTime: '08:00:00',
                periodDuration: 45,
                breakDuration: 15,
                numPeriods: 8,
                breakAfterPeriods: [2, 4, 6],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to generate timetable');
            }
          },
        },
      ]
    );
  };

  // Reset form
  const resetForm = () => {
    setSlotForm({
      slot_type: 'period',
      name: '',
      start_time: '',
      end_time: '',
      subject_id: '',
      teacher_id: '',
      plan_text: '',
      syllabus_chapter_id: '',
      syllabus_topic_id: '',
    });
  };

  // Open edit modal
  const openEditModal = (slot: any) => {
    setEditingSlot(slot);
    setSlotForm({
      slot_type: slot.slot_type,
      name: slot.name || '',
      start_time: slot.start_time,
      end_time: slot.end_time,
      subject_id: slot.subject_id || '',
      teacher_id: slot.teacher_id || '',
      plan_text: slot.plan_text || '',
      syllabus_chapter_id: slot.syllabus_chapter_id || '',
      syllabus_topic_id: slot.syllabus_topic_id || '',
    });
    setShowAddModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowAddModal(false);
    setEditingSlot(null);
    resetForm();
  };

  // Handle loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manage Timetable</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading timetable...</Text>
        </View>
      </View>
    );
  }

  // Handle error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manage Timetable</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Failed to load timetable</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <Button mode="contained" onPress={refetch} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Primary Header - Context over titles */}
      <View style={styles.primaryHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.contextTitle}>
              {selectedClassId ? 
                `${classes?.find(c => c.id === selectedClassId)?.grade} ${classes?.find(c => c.id === selectedClassId)?.section} • ${dayjs(selectedDate).format('MMM D, YYYY')}` :
                'Select a class to view timetable'
              }
            </Text>
          </View>
          <View style={styles.headerRight}>
            {/* Profile/Menu/Time can go here if needed */}
          </View>
        </View>
      </View>

      {/* Class Selector - Enhanced with elevation and scroll affordance */}
      <View style={styles.classSelector}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.classScrollContent}
          style={styles.classScrollView}
        >
          {classes?.map((cls) => (
            <TouchableOpacity
              key={cls.id}
              onPress={() => setSelectedClassId(cls.id)}
              style={[
                styles.classChip,
                selectedClassId === cls.id && styles.classChipSelected
              ]}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.classChipText,
                selectedClassId === cls.id && styles.classChipTextSelected
              ]}>
                {cls.grade} {cls.section}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Scroll fade indicators */}
        <View style={styles.scrollFadeLeft} />
        <View style={styles.scrollFadeRight} />
      </View>

      {/* Date Navigation - Enhanced with proper touch affordance */}
      <View style={styles.dateNavigation}>
        <TouchableOpacity 
          onPress={goToPreviousDay} 
          style={styles.dateNavButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.dateChipsContainer}>
          <TouchableOpacity style={styles.dateChip}>
            <Text style={styles.dateChipText}>
              {dayjs(selectedDate).subtract(1, 'day').format('MMM D')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.dateChip, styles.dateChipActive]}>
            <Text style={[styles.dateChipText, styles.dateChipTextActive]}>
              {dayjs(selectedDate).format('MMM D')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dateChip}>
            <Text style={styles.dateChipText}>
              {dayjs(selectedDate).add(1, 'day').format('MMM D')}
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          onPress={goToNextDay} 
          style={styles.dateNavButton}
          activeOpacity={0.7}
        >
          <ChevronRight size={24} color={colors.text.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={goToToday} 
          style={styles.todayButton}
          activeOpacity={0.7}
        >
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons - Enhanced with proper elevation and hierarchy */}
      {selectedClassId && (
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={() => setShowAddModal(true)}
            style={styles.addButton}
            labelStyle={styles.addButtonLabel}
            icon={() => <Plus size={18} color={colors.text.inverse} />}
            contentStyle={styles.addButtonContent}
          >
            Add Slot
          </Button>
          
          <TouchableOpacity
            onPress={() => setShowQuickGenerateModal(true)}
            style={styles.generateIconButton}
            activeOpacity={0.7}
          >
            <Settings size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State - No Class Selected */}
      {!selectedClassId && (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateTitle}>Select a Class</Text>
          <Text style={styles.emptyStateMessage}>
            Choose a class from the list above to view and manage its timetable.
          </Text>
        </View>
      )}

      {/* Timetable */}
      {selectedClassId && (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.slotsContainer}>
            {slots.length === 0 ? (
              <View style={styles.emptyTimetableContainer}>
                <Text style={styles.emptyTimetableTitle}>No timetable for this date</Text>
                <Text style={styles.emptyTimetableMessage}>
                  No slots have been scheduled for {dayjs(selectedDate).format('MMMM D, YYYY')}.
                </Text>
                <Button
                  mode="contained"
                  onPress={() => setShowAddModal(true)}
                  style={styles.emptyStateButton}
                  icon={() => <Plus size={20} color={colors.text.inverse} />}
                >
                  Add First Slot
                </Button>
              </View>
            ) : (
              slots.map((slot, index) => (
            <Card 
              key={slot.id} 
              style={[
                styles.slotCard,
                slot.slot_type === 'period' ? styles.periodCard : styles.breakCard
              ]}
              elevation={2}
            >
              <Card.Content style={styles.slotContent}>
                <View style={styles.slotHeader}>
                  <View style={styles.slotTimeContainer}>
                    <Clock size={16} color={colors.text.secondary} />
                    <Text style={styles.slotTime}>
                      {slot.start_time} - {slot.end_time}
                    </Text>
                    {slot.slot_type === 'period' && (
                      <View style={styles.periodBadge}>
                        <Text style={styles.periodBadgeText}>
                          Period {slot.displayPeriodNumber}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.slotActions}>
                    {slot.slot_type === 'period' && (
                      <TouchableOpacity
                        onPress={() => handleMarkTaught(slot.id)}
                        style={styles.taughtButton}
                        activeOpacity={0.7}
                      >
                        {taughtSlotIds.has(slot.id) ? (
                          <CheckCircle size={20} color={colors.success.main} />
                        ) : (
                          <Circle size={20} color={colors.text.secondary} />
                        )}
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      onPress={() => openEditModal(slot)}
                      style={styles.actionButton}
                      activeOpacity={0.7}
                    >
                      <Edit size={18} color={colors.text.primary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => handleDeleteSlot(slot.id)}
                      style={styles.actionButton}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={18} color={colors.error.main} />
                    </TouchableOpacity>
                  </View>
                </View>

                {slot.slot_type === 'period' ? (
                  <View style={styles.periodContent}>
                    <Text style={styles.subjectTitle}>
                      {slot.subject?.subject_name || 'Unknown Subject'}
                    </Text>
                    
                    <Text style={styles.teacherName}>
                      {slot.teacher?.full_name || 'Unknown Teacher'}
                    </Text>

                    {slot.plan_text && (
                      <Text style={styles.planText}>{slot.plan_text}</Text>
                    )}

                    {/* Syllabus Content */}
                    {slot.syllabus_chapter_id && (
                      <View style={styles.syllabusContainer}>
                        <Chip mode="outlined" compact style={styles.syllabusChip}>
                          {syllabusContentMap.get(`chapter_${slot.syllabus_chapter_id}`)?.title || 'Chapter'}
                        </Chip>
                        {slot.syllabus_topic_id && (
                          <Chip mode="outlined" compact style={styles.syllabusChip}>
                            {syllabusContentMap.get(`topic_${slot.syllabus_topic_id}`)?.title || 'Topic'}
                          </Chip>
                        )}
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.breakContent}>
                    <Text style={styles.breakTitle}>
                      {slot.name || 'Break'}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={closeModal}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>
            {editingSlot ? 'Edit Slot' : 'Add Slot'}
          </Text>

          <SegmentedButtons
            value={slotForm.slot_type}
            onValueChange={(value) => handleSlotFormChange('slot_type', value)}
            buttons={[
              { value: 'period', label: 'Period' },
              { value: 'break', label: 'Break' },
            ]}
            style={styles.segmentedButtons}
          />

          <TextInput
            label="Start Time"
            value={slotForm.start_time}
            onChangeText={(text) => handleSlotFormChange('start_time', text)}
            style={styles.input}
            placeholder="HH:MM:SS"
          />

          <TextInput
            label="End Time"
            value={slotForm.end_time}
            onChangeText={(text) => handleSlotFormChange('end_time', text)}
            style={styles.input}
            placeholder="HH:MM:SS"
          />

          {slotForm.slot_type === 'break' && (
            <TextInput
              label="Break Name"
              value={slotForm.name}
              onChangeText={(text) => handleSlotFormChange('name', text)}
              style={styles.input}
              placeholder="e.g., Lunch Break"
            />
          )}

          {slotForm.slot_type === 'period' && (
            <>
              <TouchableOpacity
                onPress={() => setShowSubjectDropdown(true)}
                style={styles.dropdownButton}
              >
                <Text style={styles.dropdownText}>
                  {subjects?.find(s => s.id === slotForm.subject_id)?.subject_name || 'Select Subject'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowTeacherDropdown(true)}
                style={styles.dropdownButton}
              >
                <Text style={styles.dropdownText}>
                  {admin?.find(a => a.id === slotForm.teacher_id)?.full_name || 'Select Teacher'}
                </Text>
              </TouchableOpacity>

              <TextInput
                label="Plan Text"
                value={slotForm.plan_text}
                onChangeText={(text) => handleSlotFormChange('plan_text', text)}
                style={styles.input}
                placeholder="Lesson plan..."
                multiline
                numberOfLines={3}
              />
            </>
          )}

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={closeModal} style={styles.cancelButton}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={editingSlot ? handleEditSlot : handleAddSlot}
              style={styles.saveButton}
            >
              {editingSlot ? 'Update' : 'Add'}
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Subject Dropdown Modal */}
      <Portal>
        <Modal
          visible={showSubjectDropdown}
          onDismiss={() => setShowSubjectDropdown(false)}
          contentContainerStyle={styles.dropdownModalContainer}
        >
          <Text style={styles.dropdownModalTitle}>Select Subject</Text>
          <ScrollView style={styles.dropdownList}>
            {subjects?.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                onPress={() => {
                  handleSlotFormChange('subject_id', subject.id);
                  setShowSubjectDropdown(false);
                }}
                style={styles.dropdownItem}
              >
                <Text style={styles.dropdownItemText}>{subject.subject_name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Button mode="outlined" onPress={() => setShowSubjectDropdown(false)} style={styles.dropdownCloseButton}>
            Cancel
          </Button>
        </Modal>
      </Portal>

      {/* Teacher Dropdown Modal */}
      <Portal>
        <Modal
          visible={showTeacherDropdown}
          onDismiss={() => setShowTeacherDropdown(false)}
          contentContainerStyle={styles.dropdownModalContainer}
        >
          <Text style={styles.dropdownModalTitle}>Select Teacher</Text>
          <ScrollView style={styles.dropdownList}>
            {admin?.map((teacher) => (
              <TouchableOpacity
                key={teacher.id}
                onPress={() => {
                  handleSlotFormChange('teacher_id', teacher.id);
                  setShowTeacherDropdown(false);
                }}
                style={styles.dropdownItem}
              >
                <Text style={styles.dropdownItemText}>{teacher.full_name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Button mode="outlined" onPress={() => setShowTeacherDropdown(false)} style={styles.dropdownCloseButton}>
            Cancel
          </Button>
        </Modal>
      </Portal>

      {/* Quick Generate Confirmation Modal */}
      <Portal>
        <Modal
          visible={showQuickGenerateModal}
          onDismiss={() => setShowQuickGenerateModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Quick Generate Timetable</Text>
          
          <Text style={styles.modalDescription}>
            This will create a standard timetable for {dayjs(selectedDate).format('MMMM D, YYYY')} with:
          </Text>
          
          <View style={styles.generatePreview}>
            <Text style={styles.generatePreviewText}>• 7 periods (45 minutes each)</Text>
            <Text style={styles.generatePreviewText}>• 2 breaks (15 minutes each)</Text>
            <Text style={styles.generatePreviewText}>• Starting at 8:00 AM</Text>
          </View>
          
          <Text style={styles.warningText}>
            ⚠️ This will replace any existing slots for this date.
          </Text>
          
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowQuickGenerateModal(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={async () => {
                setShowQuickGenerateModal(false);
                await handleQuickGenerate();
              }}
              style={styles.confirmButton}
            >
              Generate
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  // Primary Header - Context over titles
  primaryHeader: {
    backgroundColor: colors.surface.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    ...shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    // Reserved for profile/menu/time
  },
  contextTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
  },
  // Class Selector - Enhanced with elevation and scroll affordance
  classSelector: {
    backgroundColor: colors.surface.primary,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    position: 'relative',
  },
  classScrollView: {
    flexGrow: 0,
  },
  classScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  classChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.xs,
  },
  classChipSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
    borderWidth: 2,
    ...shadows.sm,
    elevation: 3,
  },
  classChipText: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '600',
  },
  classChipTextSelected: {
    color: colors.text.inverse,
  },
  scrollFadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  scrollFadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  // Date Navigation - Enhanced with proper touch affordance
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  dateNavButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.default,
    ...shadows.sm,
    elevation: 2,
  },
  dateChipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.xs,
  },
  dateChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
    ...shadows.sm,
  },
  dateChipText: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '500',
  },
  dateChipTextActive: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  todayButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
    ...shadows.xs,
  },
  todayButtonText: {
    ...typography.body2,
    color: colors.primary.main,
    fontWeight: '600',
  },
  // Action Buttons - Enhanced with proper elevation and hierarchy
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  addButton: {
    flex: 1,
    backgroundColor: colors.primary.main,
    ...shadows.sm,
    elevation: 2,
  },
  addButtonContent: {
    paddingVertical: spacing.sm,
  },
  addButtonLabel: {
    ...typography.button,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  generateIconButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.xs,
    marginLeft: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  slotsContainer: {
    padding: spacing.md,
  },
  // Slot Cards - Optimized density and visual hierarchy
  slotCard: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  periodCard: {
    backgroundColor: colors.primary[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.main,
  },
  breakCard: {
    backgroundColor: colors.neutral[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.neutral[300],
  },
  slotContent: {
    padding: spacing.md,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  slotTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  slotTime: {
    ...typography.body2,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  periodBadge: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  periodBadgeText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  slotActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  taughtButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.default,
    ...shadows.xs,
    elevation: 1,
  },
  periodContent: {
    gap: spacing.xs,
  },
  subjectTitle: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  teacherName: {
    ...typography.body2,
    color: colors.text.secondary,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  planText: {
    ...typography.body2,
    color: colors.text.primary,
    fontStyle: 'italic',
  },
  syllabusContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  syllabusChip: {
    backgroundColor: colors.background.light,
  },
  breakContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  breakTitle: {
    ...typography.h3,
    color: colors.text.secondary,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body1,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.error.main,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  errorMessage: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
  },
  modalContainer: {
    backgroundColor: colors.background.paper,
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  segmentedButtons: {
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.border.light,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary.main,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.background.default,
  },
  dropdownText: {
    ...typography.body1,
    color: colors.text.primary,
  },
  dropdownModalContainer: {
    backgroundColor: colors.background.paper,
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    maxHeight: '60%',
    ...shadows.lg,
  },
  dropdownModalTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  dropdownList: {
    maxHeight: 200,
    marginBottom: spacing.md,
  },
  dropdownItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  dropdownItemText: {
    ...typography.body1,
    color: colors.text.primary,
  },
  dropdownCloseButton: {
    borderColor: colors.border.light,
  },
  // Quick Generate Modal Styles
  modalDescription: {
    ...typography.body1,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  generatePreview: {
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  generatePreviewText: {
    ...typography.body2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  warningText: {
    ...typography.body2,
    color: colors.warning.main,
    fontWeight: '600',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.border.light,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.primary.main,
  },
  // Empty State Styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    backgroundColor: colors.background.default,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyStateMessage: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyTimetableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    backgroundColor: colors.background.default,
  },
  emptyTimetableTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyTimetableMessage: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  emptyStateButton: {
    marginTop: spacing.md,
  },
});
