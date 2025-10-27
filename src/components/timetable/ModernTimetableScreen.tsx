import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, RefreshControl, Animated, Vibration } from 'react-native';
import { Text, Card, Button, Chip, Portal, Modal, TextInput, SegmentedButtons, Snackbar } from 'react-native-paper';
import { Calendar, Clock, ChevronLeft, ChevronRight, Plus, Edit, Trash2, CheckCircle, Circle, Settings, Users, BookOpen, MapPin, Filter, RotateCcw, User } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useUnifiedTimetable } from '../../hooks/useUnifiedTimetable';
import { useSyllabusLoader } from '../../hooks/useSyllabusLoader';
import { useClasses } from '../../hooks/useClasses';
import { useSubjects, useAdmin } from '../../hooks/useSubjects';
import { colors, typography, spacing, borderRadius, shadows } from '../../../lib/design-system';
import dayjs from 'dayjs';
import { router } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isSmallScreen = screenWidth < 375;
const isVerySmallScreen = screenWidth < 320;

const { width } = Dimensions.get('window');

export function ModernTimetableScreen() {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showClassSelector, setShowClassSelector] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
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
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [compactView, setCompactView] = useState(false);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
  const { data: classes } = useClasses(profile?.school_code);
  const { data: subjects } = useSubjects(profile?.school_code);
  const { data: admin } = useAdmin(profile?.school_code);
  const { slots, displayPeriodNumber, loading, error, refetch, createSlot, updateSlot, deleteSlot, quickGenerate, markSlotTaught, unmarkSlotTaught, updateSlotStatus, taughtSlotIds } = useUnifiedTimetable(
    selectedClassId,
    dateStr
  );

  const { chaptersById, syllabusContentMap } = useSyllabusLoader(selectedClassId, profile?.school_code);

  // Helper function to format time in 12-hour format
  const formatTime12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Helper function to get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  // Helper function to determine if a period is currently active
  const isCurrentPeriod = (slot: any) => {
    if (!slot || slot.slot_type !== 'period') return false;
    const currentTime = getCurrentTime();
    return currentTime >= slot.start_time && currentTime <= slot.end_time;
  };

  // Helper function to determine if a period is upcoming today
  const isUpcomingPeriod = (slot: any) => {
    if (!slot || slot.slot_type !== 'period') return false;
    const currentTime = getCurrentTime();
    return slot.start_time > currentTime;
  };

  // Helper function to determine if a period is completed
  const isCompletedPeriod = (slot: any) => {
    if (!slot || slot.slot_type !== 'period') return false;
    const currentTime = getCurrentTime();
    return slot.end_time < currentTime;
  };

  // Helper function to get teacher initials for avatar
  const getTeacherInitials = (teacherName: string) => {
    if (!teacherName) return '?';
    return teacherName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to get teacher avatar color
  const getTeacherAvatarColor = (teacherName: string) => {
    if (!teacherName) return '#9ca3af';
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4'];
    const hash = teacherName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Haptic feedback functions
  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      if (type === 'light') {
        Vibration.vibrate(10);
      } else if (type === 'medium') {
        Vibration.vibrate(50);
      } else if (type === 'heavy') {
        Vibration.vibrate(100);
      }
    } catch (error) {
      // Haptic feedback not available on this device
    }
  };

  // Animation functions
  const animateButtonPress = (callback?: () => void) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
    });
  };

  // Clean up modal states when class or date changes
  useEffect(() => {
    closeModal();
    setShowClassSelector(false);
    setShowDatePicker(false);
    setShowQuickGenerateModal(false);
  }, [selectedClassId, selectedDate]);

  // Clean up modal states when component unmounts
  useEffect(() => {
    return () => {
      closeModal();
      setShowClassSelector(false);
      setShowDatePicker(false);
      setShowQuickGenerateModal(false);
    };
  }, []);

  // Helper functions for syllabus selection
  const getChaptersForSubject = (subjectId: string) => {
    if (!chaptersById || !subjectId) return [];
    return Array.from(chaptersById.values()).filter(
      chapter => chapter.type === 'chapter' && chapter.subject_id === subjectId
    );
  };

  const getTopicsForSubject = (subjectId: string) => {
    if (!chaptersById || !subjectId) return [];
    return Array.from(chaptersById.values()).filter(
      topic => topic.type === 'topic' && topic.subject_id === subjectId
    );
  };

  const getChapterName = (chapterId: string) => {
    if (!chapterId || !syllabusContentMap) return '';
    const content = syllabusContentMap.get(`chapter_${chapterId}`);
    return content ? `${content.chapter_no}. ${content.title}` : '';
  };

  const getTopicName = (topicId: string) => {
    if (!topicId || !syllabusContentMap) return '';
    const content = syllabusContentMap.get(`topic_${topicId}`);
    return content ? `${content.chapter_no}.${content.topic_no} ${content.title}` : '';
  };

  // Helper function to show error messages
  const showError = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };


  // Get selected class info
  const selectedClass = classes?.find(c => c.id === selectedClassId);

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
    setSlotForm(prev => {
      const newForm = { ...prev, [field]: value };
      
      // Clear chapter and topic when subject changes
      if (field === 'subject_id') {
        newForm.syllabus_chapter_id = '';
        newForm.syllabus_topic_id = '';
      }
      
      return newForm;
    });
  };

  // Handle add slot
  const handleAddSlot = async () => {
    if (!selectedClassId || !profile?.school_code) {
      return;
    }

    // Validate required fields
    if (!slotForm.start_time || !slotForm.end_time) {
      showError('Please enter start and end times');
      return;
    }

    if (slotForm.slot_type === 'period') {
      if (!slotForm.subject_id || !slotForm.teacher_id) {
        showError('Please select subject and teacher for the period');
        return;
      }
    } else if (slotForm.slot_type === 'break') {
      if (!slotForm.name) {
        showError('Please enter break name');
        return;
      }
    }

    // Show confirmation dialog
    Alert.alert(
      'Confirm Add Slot',
      `Are you sure you want to add this ${slotForm.slot_type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async () => {
            try {
              const payload = {
                class_instance_id: selectedClassId,
                school_code: profile.school_code,
                class_date: dateStr,
                period_number: 999, // Temporary value, will be renumbered by the hook
                slot_type: slotForm.slot_type as 'period' | 'break',
                name: slotForm.slot_type === 'break' ? slotForm.name : null,
                start_time: slotForm.start_time,
                end_time: slotForm.end_time,
                subject_id: slotForm.slot_type === 'period' ? slotForm.subject_id : null,
                teacher_id: slotForm.slot_type === 'period' ? slotForm.teacher_id : null,
                plan_text: slotForm.slot_type === 'period' ? slotForm.plan_text : null,
                syllabus_chapter_id: slotForm.slot_type === 'period' ? slotForm.syllabus_chapter_id : null,
                syllabus_topic_id: slotForm.slot_type === 'period' ? slotForm.syllabus_topic_id : null,
              };

              await createSlot(payload);
              closeModal();
              closeAllDropdowns();
            } catch (error) {
              showError('Failed to create slot. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle edit slot
  const handleEditSlot = async () => {
    if (!editingSlot) return;

    // Validate required fields
    if (!slotForm.start_time || !slotForm.end_time) {
      showError('Please enter start and end times');
      return;
    }

    if (slotForm.slot_type === 'period') {
      if (!slotForm.subject_id || !slotForm.teacher_id) {
        showError('Please select subject and teacher for the period');
        return;
      }
    } else if (slotForm.slot_type === 'break') {
      if (!slotForm.name) {
        showError('Please enter break name');
        return;
      }
    }

    // Show confirmation dialog
    Alert.alert(
      'Confirm Update Slot',
      `Are you sure you want to update this ${slotForm.slot_type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              await updateSlot(editingSlot.id, {
                slot_type: slotForm.slot_type as 'period' | 'break',
                name: slotForm.slot_type === 'break' ? slotForm.name : null,
                start_time: slotForm.start_time,
                end_time: slotForm.end_time,
                subject_id: slotForm.slot_type === 'period' ? slotForm.subject_id : null,
                teacher_id: slotForm.slot_type === 'period' ? slotForm.teacher_id : null,
                plan_text: slotForm.slot_type === 'period' ? slotForm.plan_text : null,
                syllabus_chapter_id: slotForm.slot_type === 'period' ? slotForm.syllabus_chapter_id : null,
                syllabus_topic_id: slotForm.slot_type === 'period' ? slotForm.syllabus_topic_id : null,
              });
              
              closeModal();
              closeAllDropdowns();
            } catch (error) {
              showError('Failed to update slot. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle delete slot
  const handleDeleteSlot = async (slotId: string) => {
    const slot = slots.find(s => s.id === slotId);
    const slotDescription = slot ? 
      `${slot.slot_type === 'period' ? 'Period' : 'Break'}: ${slot.slot_type === 'period' ? slot.subject_name : slot.name} (${slot.start_time} - ${slot.end_time})` :
      'this slot';

    Alert.alert(
      'Delete Slot',
      `Are you sure you want to delete ${slotDescription}?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSlot(slotId);
            } catch (error) {
              showError('Failed to delete slot. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle mark taught
  const handleMarkTaught = async (slotId: string) => {
    const slot = slots.find(s => s.id === slotId);
    const isTaught = taughtSlotIds.has(slotId);
    const action = isTaught ? 'unmark as taught' : 'mark as taught';
    const slotDescription = slot ? `${slot.subject_name} (${slot.start_time} - ${slot.end_time})` : 'this slot';

    Alert.alert(
      `Mark Slot ${isTaught ? 'Not Taught' : 'Taught'}`,
      `Are you sure you want to ${action} ${slotDescription}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isTaught ? 'Unmark' : 'Mark',
          onPress: async () => {
            try {
              if (isTaught) {
                await unmarkSlotTaught(slotId);
              } else {
                await markSlotTaught(slotId);
              }
            } catch (error) {
              showError(`Failed to ${action}. Please try again.`);
            }
          },
        },
      ]
    );
  };

  // Handle status update
  const handleStatusUpdate = async (slotId: string, newStatus: 'planned' | 'done' | 'cancelled') => {
    const slot = slots.find(s => s.id === slotId);
    const slotDescription = slot ? `${slot.subject_name || 'Period'} (${slot.start_time} - ${slot.end_time})` : 'this slot';

    Alert.alert(
      `Update Status`,
      `Are you sure you want to mark ${slotDescription} as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              await updateSlotStatus(slotId, newStatus);
            } catch (error) {
              showError(`Failed to update status. Please try again.`);
            }
          },
        },
      ]
    );
  };

  // Handle quick generate
  const handleQuickGenerate = async () => {
    if (!selectedClassId || !profile?.school_code) return;

    const selectedClass = classes?.find(c => c.id === selectedClassId);
    const className = selectedClass ? `${selectedClass.grade} ${selectedClass.section}` : 'this class';
    const formattedDate = dayjs(selectedDate).format('MMMM D, YYYY');

    Alert.alert(
      'Quick Generate Timetable',
      `This will create a standard timetable for ${className} on ${formattedDate}:\n\n• 6 periods (45 minutes each)\n• 2 breaks (15 minutes each)\n• Starting at 8:00 AM\n\n⚠️ This will REPLACE all existing slots for ${className} on this date.\n\nAre you sure you want to continue?`,
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
                startTime: '08:00',
                numPeriods: 6,
                periodDurationMin: 45,
                breaks: [
                  { afterPeriod: 2, durationMin: 15, name: 'Break' },
                  { afterPeriod: 4, durationMin: 15, name: 'Break' },
                ],
              });
            } catch (error) {
              showError(`Failed to generate timetable: ${error.message}`);
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
    // Close any open dropdowns before opening edit modal
    closeAllDropdowns();
    setShowAddModal(true);
  };

  // Close modal and reset all states
  const closeModal = () => {
    setShowAddModal(false);
    setEditingSlot(null);
    setShowSubjectDropdown(false);
    setShowTeacherDropdown(false);
    setShowChapterDropdown(false);
    setShowTopicDropdown(false);
    resetForm();
  };

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowSubjectDropdown(false);
    setShowTeacherDropdown(false);
    setShowChapterDropdown(false);
    setShowTopicDropdown(false);
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      showError('Failed to refresh timetable. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <View style={styles.loadingSpinner} />
            <Text style={styles.loadingText}>Loading timetable...</Text>
          </View>
        </View>
      </View>
    );
  }

  // Handle error state
  if (error) {
    return (
      <View style={styles.container}>
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
      {/* Modern Header - Contextual Info Only */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => {
                router.back();
              }}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ChevronLeft size={24} color="#6366f1" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>
              {selectedClass ? 'Timetable' : 'Select a class to view timetable'}
            </Text>
            {selectedClass && (
              <View style={styles.refreshHint}>
                <RotateCcw size={12} color={refreshing ? "#6366f1" : "#9ca3af"} />
                <Text style={[styles.refreshHintText, refreshing && { color: "#6366f1" }]}>
                  {refreshing ? 'Refreshing...' : 'Pull down to refresh'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.headerActions}>
            {/* Jump to Current Period Button */}
            {selectedClass && slots.some(slot => isCurrentPeriod(slot) || isUpcomingPeriod(slot)) && (
              <TouchableOpacity
                onPress={() => {
                  const currentSlot = slots.find(slot => isCurrentPeriod(slot));
                  const nextSlot = slots.find(slot => isUpcomingPeriod(slot));
                  const targetSlot = currentSlot || nextSlot;
                  if (targetSlot) {
                    // Scroll to the target slot
                  }
                }}
                style={[styles.headerActionButton, styles.jumpToCurrentButton]}
                activeOpacity={0.7}
              >
                <Clock size={16} color="#6366f1" />
                <Text style={styles.jumpToCurrentText}>Now</Text>
              </TouchableOpacity>
            )}
            
            {/* Compact View Toggle */}
            <TouchableOpacity
              onPress={() => {
                triggerHapticFeedback('light');
                setCompactView(!compactView);
              }}
              style={[styles.headerActionButton, compactView && styles.compactViewActive]}
              activeOpacity={0.7}
            >
              <Filter size={16} color={compactView ? "#6366f1" : "#6b7280"} />
              <Text style={[styles.compactViewText, compactView && styles.compactViewTextActive]}>
                {compactView ? 'Full' : 'Compact'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setShowQuickGenerateModal(true)}
              style={styles.headerActionButton}
              activeOpacity={0.7}
            >
              <Settings size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Single Line Filters */}
      <View style={styles.filtersContainer}>
        {/* Class Selector */}
        <TouchableOpacity
          onPress={() => setShowClassSelector(true)}
          style={styles.filterButton}
          activeOpacity={0.7}
        >
          <Users size={18} color="#6b7280" />
          <View style={styles.filterText}>
            <Text style={styles.filterLabel}>Class</Text>
            <Text style={styles.filterValue}>
              {selectedClass ? `${selectedClass.grade} ${selectedClass.section}` : 'Select'}
            </Text>
          </View>
          <ChevronRight size={14} color="#6b7280" />
        </TouchableOpacity>

        {/* Date Selector */}
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.filterButton}
          activeOpacity={0.7}
        >
          <Calendar size={18} color="#6b7280" />
          <View style={styles.filterText}>
            <Text style={styles.filterLabel}>Date</Text>
            <Text style={styles.filterValue}>
              {dayjs(selectedDate).format('MMM D, YYYY')}
            </Text>
          </View>
          <ChevronRight size={14} color="#6b7280" />
        </TouchableOpacity>
      </View>


      {/* Empty State - No Class Selected */}
      {!selectedClassId && (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateIcon}>
            <Users size={48} color={colors.text.tertiary} />
          </View>
          <Text style={styles.emptyStateTitle}>Select a Class</Text>
          <Text style={styles.emptyStateMessage}>
            Choose a class from the list above to view and manage its timetable.
          </Text>
        </View>
      )}

      {/* Timetable */}
      {selectedClassId && (
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6366f1']} // Android
              tintColor="#6366f1" // iOS
              title="Pull to refresh timetable"
              titleColor="#6b7280"
            />
          }
        >
          <View style={styles.slotsContainer}>
            {slots.length === 0 ? (
              <View style={styles.emptyTimetableContainer}>
                <View style={styles.emptyTimetableIcon}>
                  <Calendar size={48} color={colors.text.tertiary} />
                </View>
                <Text style={styles.emptyTimetableTitle}>No timetable for this date</Text>
                <Text style={styles.emptyTimetableMessage}>
                  No slots have been scheduled for {dayjs(selectedDate).format('MMMM D, YYYY')}.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setSlotForm(prev => ({ ...prev, slot_type: 'period' }));
                    setShowAddModal(true);
                  }}
                  style={styles.emptyStateButton}
                  activeOpacity={0.7}
                >
                  <Plus size={20} color={colors.text.inverse} />
                  <Text style={styles.emptyStateButtonText}>Add First Period</Text>
                </TouchableOpacity>
              </View>
            ) : (
              slots.map((slot, index) => {
                // Compact view logic - hide completed periods
                if (compactView && isCompletedPeriod(slot) && slot.slot_type === 'period') {
                  return null;
                }

                return (
                <Card 
                  key={slot.id} 
                  style={[
                    styles.slotCard,
                    slot.slot_type === 'period' ? styles.periodCard : styles.breakCard,
                    isCurrentPeriod(slot) && styles.currentPeriodCard,
                    isUpcomingPeriod(slot) && styles.upcomingPeriodCard,
                    compactView && styles.compactSlotCard,
                    isSmallScreen && styles.smallScreenSlotCard
                  ]}
                  elevation={isCurrentPeriod(slot) ? 4 : 2}
                >
                  <Card.Content style={[
                    styles.slotContent,
                    slot.slot_type === 'break' && styles.breakSlotContent
                  ]}>
                    <View style={[
                      styles.slotHeader,
                      isSmallScreen && styles.smallScreenSlotHeader
                    ]}>
                      <View style={[
                        styles.slotTimeContainer,
                        isSmallScreen && styles.smallScreenTimeContainer
                      ]}>
                        <Clock size={isSmallScreen ? 14 : 16} color={colors.text.secondary} />
                        <Text style={[
                          styles.slotTime,
                          isCurrentPeriod(slot) && styles.currentPeriodTime,
                          isUpcomingPeriod(slot) && styles.upcomingPeriodTime,
                          isSmallScreen && styles.smallScreenSlotTime
                        ]}>
                          {formatTime12Hour(slot.start_time)} - {formatTime12Hour(slot.end_time)}
                        </Text>
                        {slot.slot_type === 'period' && (
                          <View style={[
                            styles.periodBadge,
                            isSmallScreen && styles.smallScreenPeriodBadge
                          ]}>
                            <Text style={[
                              styles.periodBadgeText,
                              isSmallScreen && styles.smallScreenPeriodBadgeText
                            ]}>
                              {isSmallScreen ? `P${slot.period_number}` : `Period ${slot.period_number}`}
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.slotActions}>
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
                        <View style={styles.subjectTeacherRow}>
                          <View style={styles.subjectInfo}>
                            <Text style={[
                              styles.subjectTitle,
                              isSmallScreen && styles.smallScreenSubjectTitle
                            ]}>
                              {slot.subject_name ? slot.subject_name : (
                                <Text style={styles.unassignedText}>Unassigned</Text>
                              )}
                            </Text>
                            
                            <Text style={[
                              styles.teacherName,
                              isSmallScreen && styles.smallScreenTeacherName
                            ]}>
                              {slot.teacher_name ? slot.teacher_name : (
                                <Text style={styles.unassignedText}>Unassigned</Text>
                              )}
                            </Text>
                          </View>
                          
                          {/* Teacher Avatar */}
                          {slot.teacher_name && (
                            <View style={[
                              styles.teacherAvatar,
                              isSmallScreen && styles.smallScreenTeacherAvatar,
                              { backgroundColor: getTeacherAvatarColor(slot.teacher_name) }
                            ]}>
                              <Text style={[
                                styles.teacherAvatarText,
                                isSmallScreen && styles.smallScreenTeacherAvatarText
                              ]}>
                                {getTeacherInitials(slot.teacher_name)}
                              </Text>
                            </View>
                          )}
                        </View>

                        {slot.plan_text && (
                          <Text style={styles.planText}>{slot.plan_text}</Text>
                        )}

                        {/* Status Field */}
                        <View style={styles.statusField}>
                          <Text style={styles.statusLabel}>Status:</Text>
                          <TouchableOpacity
                            onPress={() => {
                              const currentStatus = slot.status || 'planned';
                              const statusOptions = ['planned', 'done', 'cancelled'];
                              const currentIndex = statusOptions.indexOf(currentStatus);
                              const nextStatus = statusOptions[(currentIndex + 1) % statusOptions.length];
                              handleStatusUpdate(slot.id, nextStatus as 'planned' | 'done' | 'cancelled');
                            }}
                            style={[
                              styles.statusFieldButton,
                              slot.status === 'done' && styles.statusFieldButtonDone,
                              slot.status === 'cancelled' && styles.statusFieldButtonCancelled,
                              slot.status === 'planned' && styles.statusFieldButtonPlanned,
                            ]}
                            activeOpacity={0.7}
                          >
                            <Text style={[
                              styles.statusFieldText,
                              slot.status === 'done' && styles.statusFieldTextDone,
                              slot.status === 'cancelled' && styles.statusFieldTextCancelled,
                              slot.status === 'planned' && styles.statusFieldTextPlanned,
                            ]}>
                              {slot.status === 'done' ? '✓ Done' : 
                               slot.status === 'cancelled' ? '✗ Cancelled' : 
                               '○ Planned'}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Syllabus Content */}
                        {slot.syllabus_chapter_id && (
                          <View style={styles.syllabusContainer}>
                            <Chip mode="outlined" compact style={styles.syllabusChip}>
                              {getChapterName(slot.syllabus_chapter_id)}
                            </Chip>
                            {slot.syllabus_topic_id && (
                              <Chip mode="outlined" compact style={styles.syllabusChip}>
                                {getTopicName(slot.syllabus_topic_id)}
                              </Chip>
                            )}
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={[
                        styles.breakContent,
                        isSmallScreen && styles.smallScreenBreakContent
                      ]}>
                        <View style={[
                          styles.breakIcon,
                          isSmallScreen && styles.smallScreenBreakIcon
                        ]}>
                          <Text style={[
                            styles.breakIconText,
                            isSmallScreen && styles.smallScreenBreakIconText
                          ]}>☕</Text>
                        </View>
                        <View style={styles.breakTextContainer}>
                          <Text style={[
                            styles.breakTitle,
                            isSmallScreen && styles.smallScreenBreakTitle
                          ]}>
                            {slot.name || 'Break'}
                          </Text>
                          <Text style={[
                            styles.breakSubtitle,
                            isSmallScreen && styles.smallScreenBreakSubtitle
                          ]}>
                            {formatTime12Hour(slot.start_time)} - {formatTime12Hour(slot.end_time)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </Card.Content>
                </Card>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* Bottom Action Buttons */}
      {selectedClassId && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            onPress={() => {
              resetForm();
              setSlotForm(prev => ({ ...prev, slot_type: 'period' }));
              closeAllDropdowns();
              setShowAddModal(true);
            }}
            style={styles.bottomActionButton}
            activeOpacity={0.7}
          >
            <Plus size={20} color="#ffffff" />
            <Text style={styles.bottomActionText}>Add Period</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              resetForm();
              setSlotForm(prev => ({ ...prev, slot_type: 'break' }));
              closeAllDropdowns();
              setShowAddModal(true);
            }}
            style={[styles.bottomActionButton, styles.bottomActionButtonSecondary]}
            activeOpacity={0.7}
          >
            <Clock size={20} color="#6366f1" />
            <Text style={[styles.bottomActionText, styles.bottomActionTextSecondary]}>Add Break</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              closeAllDropdowns();
              setShowQuickGenerateModal(true);
            }}
            style={[styles.bottomActionButton, styles.bottomActionButtonTertiary]}
            activeOpacity={0.7}
          >
            <Settings size={20} color="#6366f1" />
            <Text style={[styles.bottomActionText, styles.bottomActionTextTertiary]}>Quick Generate</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Class Selector Modal */}
      <Portal>
        <Modal
          visible={showClassSelector}
          onDismiss={() => setShowClassSelector(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Select Class</Text>
          <ScrollView style={styles.modalScrollView}>
            {classes?.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                onPress={() => {
                  setSelectedClassId(cls.id);
                  setShowClassSelector(false);
                }}
                style={[
                  styles.modalItem,
                  selectedClassId === cls.id && styles.modalItemSelected
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.modalItemText,
                  selectedClassId === cls.id && styles.modalItemTextSelected
                ]}>
                  {cls.grade} {cls.section}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Button 
            mode="outlined" 
            onPress={() => setShowClassSelector(false)} 
            style={styles.modalCloseButton}
            buttonColor="#ffffff"
            textColor="#374151"
            labelStyle={styles.buttonLabel}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>

      {/* Date Picker Modal */}
      <Portal>
        <Modal
          visible={showDatePicker}
          onDismiss={() => setShowDatePicker(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Select Date</Text>
          
          <View style={styles.dateNavigation}>
            <TouchableOpacity 
              onPress={goToPreviousDay} 
              style={styles.dateNavButton}
              activeOpacity={0.7}
            >
              <ChevronLeft size={24} color={colors.text.primary} />
            </TouchableOpacity>
            
            <View style={styles.dateDisplay}>
              <Text style={styles.dateText}>
                {dayjs(selectedDate).format('MMM D, YYYY')}
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={goToNextDay} 
              style={styles.dateNavButton}
              activeOpacity={0.7}
            >
              <ChevronRight size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={() => {
              goToToday();
              setShowDatePicker(false);
            }} 
            style={styles.todayButton}
            activeOpacity={0.7}
          >
            <Text style={styles.todayButtonText}>Go to Today</Text>
          </TouchableOpacity>

          <Button 
            mode="outlined" 
            onPress={() => setShowDatePicker(false)} 
            style={styles.modalCloseButton}
            buttonColor="#ffffff"
            textColor="#374151"
            labelStyle={styles.buttonLabel}
          >
            Done
          </Button>
        </Modal>
      </Portal>

      {/* Add/Edit Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={closeModal}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>
            {editingSlot ? 'Edit Slot' : `Add ${slotForm.slot_type === 'period' ? 'Period' : 'Break'}`}
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
            style={styles.textInput}
            mode="outlined"
            placeholder="HH:MM:SS"
            outlineColor="#e2e8f0"
            activeOutlineColor="#6366f1"
            textColor="#000000"
            placeholderTextColor="#9ca3af"
          />

          <TextInput
            label="End Time"
            value={slotForm.end_time}
            onChangeText={(text) => handleSlotFormChange('end_time', text)}
            style={styles.textInput}
            mode="outlined"
            placeholder="HH:MM:SS"
            outlineColor="#e2e8f0"
            activeOutlineColor="#6366f1"
            textColor="#000000"
            placeholderTextColor="#9ca3af"
          />

          {slotForm.slot_type === 'break' && (
            <TextInput
              label="Break Name"
              value={slotForm.name}
              onChangeText={(text) => handleSlotFormChange('name', text)}
              style={styles.textInput}
              mode="outlined"
              placeholder="e.g., Lunch Break"
              outlineColor="#e2e8f0"
              activeOutlineColor="#6366f1"
              textColor="#000000"
              placeholderTextColor="#9ca3af"
            />
          )}

          {slotForm.slot_type === 'period' && (
            <>
              {/* Subject Selection Button */}
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowSubjectDropdown(true)}
              >
                <Text style={styles.dropdownButtonText}>
                  {subjects?.find(s => s.id === slotForm.subject_id)?.subject_name || 'Select Subject'}
                </Text>
                <ChevronRight size={20} color="#6b7280" />
              </TouchableOpacity>

              {/* Teacher Selection Button */}
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowTeacherDropdown(true)}
              >
                <Text style={styles.dropdownButtonText}>
                  {admin?.find(t => t.id === slotForm.teacher_id)?.full_name || 'Select Teacher'}
                </Text>
                <ChevronRight size={20} color="#6b7280" />
              </TouchableOpacity>

              {/* Chapter Selection Button */}
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowChapterDropdown(true)}
              >
                <Text style={styles.dropdownButtonText}>
                  {getChapterName(slotForm.syllabus_chapter_id) || 'Select Chapter'}
                </Text>
                <ChevronRight size={20} color="#6b7280" />
              </TouchableOpacity>

              {/* Topic Selection Button */}
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowTopicDropdown(true)}
              >
                <Text style={styles.dropdownButtonText}>
                  {getTopicName(slotForm.syllabus_topic_id) || 'Select Topic'}
                </Text>
                <ChevronRight size={20} color="#6b7280" />
              </TouchableOpacity>

              <TextInput
                label="Plan Text"
                value={slotForm.plan_text}
                onChangeText={(text) => handleSlotFormChange('plan_text', text)}
                style={styles.textInput}
                mode="outlined"
                placeholder="Lesson plan..."
                multiline
                numberOfLines={3}
                outlineColor="#e2e8f0"
                activeOutlineColor="#6366f1"
                textColor="#000000"
                placeholderTextColor="#9ca3af"
              />
            </>
          )}

          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={closeModal} 
              style={styles.cancelButton}
              buttonColor="#ffffff"
              textColor="#374151"
              labelStyle={styles.buttonLabel}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={editingSlot ? handleEditSlot : handleAddSlot}
              style={styles.saveButton}
              buttonColor="#6366f1"
              textColor="#ffffff"
              labelStyle={styles.buttonLabel}
            >
              {editingSlot ? 'Update' : 'Add'}
            </Button>
          </View>
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
              buttonColor="#ffffff"
              textColor="#374151"
              labelStyle={styles.buttonLabel}
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
              buttonColor="#6366f1"
              textColor="#ffffff"
              labelStyle={styles.buttonLabel}
            >
              Generate
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Subject Selection Modal */}
      <Portal>
        <Modal
          visible={showSubjectDropdown}
          onDismiss={() => setShowSubjectDropdown(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Subject</Text>
            <TouchableOpacity
              onPress={() => setShowSubjectDropdown(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScrollView}>
            {subjects?.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                onPress={() => {
                  handleSlotFormChange('subject_id', subject.id);
                  setShowSubjectDropdown(false);
                }}
                style={[
                  styles.modalItem,
                  slotForm.subject_id === subject.id && styles.modalItemSelected
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.modalItemText,
                  slotForm.subject_id === subject.id && styles.modalItemTextSelected
                ]}>
                  {subject.subject_name}
                </Text>
                {slotForm.subject_id === subject.id && (
                  <CheckCircle size={20} color="#6366f1" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Teacher Selection Modal */}
      <Portal>
        <Modal
          visible={showTeacherDropdown}
          onDismiss={() => setShowTeacherDropdown(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Teacher</Text>
            <TouchableOpacity
              onPress={() => setShowTeacherDropdown(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScrollView}>
            {admin?.map((teacher) => (
              <TouchableOpacity
                key={teacher.id}
                onPress={() => {
                  handleSlotFormChange('teacher_id', teacher.id);
                  setShowTeacherDropdown(false);
                }}
                style={[
                  styles.modalItem,
                  slotForm.teacher_id === teacher.id && styles.modalItemSelected
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.modalItemText,
                  slotForm.teacher_id === teacher.id && styles.modalItemTextSelected
                ]}>
                  {teacher.full_name}
                </Text>
                {slotForm.teacher_id === teacher.id && (
                  <CheckCircle size={20} color="#6366f1" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Chapter Selection Modal */}
      <Portal>
        <Modal
          visible={showChapterDropdown}
          onDismiss={() => setShowChapterDropdown(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Chapter</Text>
            <TouchableOpacity
              onPress={() => setShowChapterDropdown(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScrollView}>
            {getChaptersForSubject(slotForm.subject_id).map((chapter) => (
              <TouchableOpacity
                key={chapter.chapter_id}
                onPress={() => {
                  handleSlotFormChange('syllabus_chapter_id', chapter.chapter_id);
                  setShowChapterDropdown(false);
                }}
                style={[
                  styles.modalItem,
                  slotForm.syllabus_chapter_id === chapter.chapter_id && styles.modalItemSelected
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.modalItemText,
                  slotForm.syllabus_chapter_id === chapter.chapter_id && styles.modalItemTextSelected
                ]}>
                  {getChapterName(chapter.chapter_id)}
                </Text>
                {slotForm.syllabus_chapter_id === chapter.chapter_id && (
                  <CheckCircle size={20} color="#6366f1" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Topic Selection Modal */}
      <Portal>
        <Modal
          visible={showTopicDropdown}
          onDismiss={() => setShowTopicDropdown(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Topic</Text>
            <TouchableOpacity
              onPress={() => setShowTopicDropdown(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScrollView}>
            {getTopicsForSubject(slotForm.subject_id).map((topic) => (
              <TouchableOpacity
                key={topic.topic_id}
                onPress={() => {
                  handleSlotFormChange('syllabus_topic_id', topic.topic_id);
                  setShowTopicDropdown(false);
                }}
                style={[
                  styles.modalItem,
                  slotForm.syllabus_topic_id === topic.topic_id && styles.modalItemSelected
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.modalItemText,
                  slotForm.syllabus_topic_id === topic.topic_id && styles.modalItemTextSelected
                ]}>
                  {getTopicName(topic.topic_id)}
                </Text>
                {slotForm.syllabus_topic_id === topic.topic_id && (
                  <CheckCircle size={20} color="#6366f1" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Error Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Modern Header
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    ...shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: '#f0f4ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    ...shadows.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  refreshHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
  refreshHintText: {
    fontSize: 11,
    color: '#9ca3af',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerActionButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: '#f8fafc',
    ...shadows.xs,
  },

  // Single Line Filters
  filtersContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: spacing.md,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: spacing.sm,
    ...shadows.xs,
  },
  filterText: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  filterValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#6366f1',
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  quickActionButtonSecondary: {
    backgroundColor: '#f0f4ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  quickActionText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  quickActionTextSecondary: {
    color: '#6366f1',
  },
  quickActionButtonTertiary: {
    backgroundColor: '#f0f4ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  quickActionTextTertiary: {
    color: '#6366f1',
  },

  // Bottom Action Buttons
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    ...shadows.lg,
  },
  bottomActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#6366f1',
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  bottomActionButtonSecondary: {
    backgroundColor: '#f0f4ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  bottomActionButtonTertiary: {
    backgroundColor: '#f0f4ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  bottomActionText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  bottomActionTextSecondary: {
    color: '#6366f1',
  },
  bottomActionTextTertiary: {
    color: '#6366f1',
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingContent: {
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#c7d2fe',
    borderTopColor: '#6366f1',
    // Add rotation animation here if needed
  },
  loadingText: {
    fontSize: 16,
    color: '#374151',
  },

  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: 24,
    color: '#ef4444',
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: '#6366f1',
  },

  // Empty States
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 80,
    backgroundColor: '#ffffff',
  },
  emptyStateIcon: {
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: 24,
    color: '#000000',
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Timetable
  scrollView: {
    flex: 1,
  },
  slotsContainer: {
    padding: spacing.lg,
  },
  emptyTimetableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 80,
    backgroundColor: '#ffffff',
  },
  emptyTimetableIcon: {
    marginBottom: spacing.lg,
  },
  emptyTimetableTitle: {
    fontSize: 24,
    color: '#000000',
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyTimetableMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#6366f1',
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  emptyStateButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },

  // Slot Cards
  slotCard: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    ...shadows.xs,
  },
  periodCard: {
    backgroundColor: '#ffffff',
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  breakCard: {
    backgroundColor: '#f9fafb',
    borderLeftWidth: 3,
    borderLeftColor: '#d1d5db',
    minHeight: 50,
  },
  slotContent: {
    padding: spacing.md,
  },
  breakSlotContent: {
    padding: spacing.sm,
    paddingVertical: spacing.xs,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  slotTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  slotTime: {
    fontSize: 14,
    color: '#374151',
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  periodBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  periodBadgeText: {
    fontSize: 12,
    color: '#ffffff',
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
    backgroundColor: '#ffffff',
    ...shadows.xs,
    elevation: 1,
  },
  periodContent: {
    gap: spacing.xs,
  },
  subjectTitle: {
    fontSize: 20,
    color: '#000000',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  teacherName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  unassignedText: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgePlanned: {
    backgroundColor: '#f3f4f6',
  },
  statusBadgeDone: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeCancelled: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusBadgeTextPlanned: {
    color: '#6b7280',
  },
  statusBadgeTextDone: {
    color: '#16a34a',
  },
  statusBadgeTextCancelled: {
    color: '#dc2626',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 8,
  },
  statusButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  statusButtonActive: {
    backgroundColor: '#6366f1',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  statusButtonTextActive: {
    color: '#ffffff',
  },
  planText: {
    fontSize: 14,
    color: '#000000',
    fontStyle: 'italic',
  },
  syllabusContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  syllabusChip: {
    backgroundColor: '#f8fafc',
  },
  breakContent: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  breakIconContainer: {
    marginBottom: 0,
  },
  breakTextContainer: {
    alignItems: 'center',
  },
  breakIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  breakIconText: {
    fontSize: 16,
  },
  breakTitle: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    fontStyle: 'italic',
    marginBottom: 0,
  },
  breakSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },

  // Modals
  modalContainer: {
    backgroundColor: '#ffffff',
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: 24,
    color: '#000000',
    fontWeight: '600',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: 200,
    marginBottom: spacing.md,
  },
  modalItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalItemSelected: {
    backgroundColor: '#f0f4ff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#000000',
  },
  modalItemTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  modalCloseButton: {
    borderColor: '#e2e8f0',
  },

  // Date Navigation in Modal
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  dateNavButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: '#f8fafc',
    ...shadows.sm,
    elevation: 2,
  },
  dateDisplay: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 20,
    color: '#000000',
    fontWeight: '600',
  },
  todayButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: '#f0f4ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.xs,
  },
  todayButtonText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },

  // Form Elements
  segmentedButtons: {
    marginBottom: spacing.md,
  },
  textInput: {
    marginBottom: spacing.md,
    backgroundColor: '#ffffff',
  },
  
  // Dropdown Button Styles
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    minHeight: 56,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },

  // Modal Header Styles
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: '#f8fafc',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '600',
  },

  // Modal Actions
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    borderColor: '#e2e8f0',
    borderRadius: borderRadius.lg,
  },
  saveButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
  },
  confirmButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Quick Generate Modal
  modalDescription: {
    fontSize: 16,
    color: '#374151',
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  generatePreview: {
    backgroundColor: '#f0f4ff',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  generatePreviewText: {
    fontSize: 14,
    color: '#000000',
    marginBottom: spacing.xs,
  },
  warningText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  
  // Visual Hierarchy Styles
  currentPeriodCard: {
    backgroundColor: '#e0f2fe',
    borderLeftColor: '#0284c7',
    borderLeftWidth: 6,
    transform: [{ scale: 1.02 }],
  },
  upcomingPeriodCard: {
    backgroundColor: '#f0fdf4',
    borderLeftColor: '#16a34a',
    borderLeftWidth: 4,
  },
  currentPeriodTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0284c7',
  },
  upcomingPeriodTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16a34a',
  },
  
  // Jump to Current Button
  jumpToCurrentButton: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jumpToCurrentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  
  // Compact View Styles
  compactViewActive: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  compactViewText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 4,
  },
  compactViewTextActive: {
    color: '#6366f1',
  },
  compactSlotCard: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
  },
  
  // Mobile Responsive Styles
  smallScreenSlotCard: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  
  // Teacher Avatar Styles
  subjectTeacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  subjectInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  teacherAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  teacherAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  // Mobile Responsive Styles
  smallScreenSlotHeader: {
    marginBottom: spacing.sm,
  },
  smallScreenTimeContainer: {
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  smallScreenSlotTime: {
    fontSize: 12,
  },
  smallScreenPeriodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  smallScreenPeriodBadgeText: {
    fontSize: 10,
  },
  smallScreenStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  smallScreenStatusBadgeText: {
    fontSize: 10,
  },
  smallScreenSubjectTitle: {
    fontSize: 16,
  },
  smallScreenTeacherName: {
    fontSize: 12,
  },
  smallScreenTeacherAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  smallScreenTeacherAvatarText: {
    fontSize: 12,
  },
  
  // Mobile Break Styles
  smallScreenBreakContent: {
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  smallScreenBreakIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  smallScreenBreakIconText: {
    fontSize: 12,
  },
  smallScreenBreakTitle: {
    fontSize: 14,
  },
  smallScreenBreakSubtitle: {
    fontSize: 10,
  },
  
  // Mobile Header Styles
  smallScreenHeaderTitle: {
    fontSize: 16,
  },
  
  // Status Field Styles
  statusField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginRight: spacing.sm,
  },
  statusFieldButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  statusFieldButtonDone: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  statusFieldButtonCancelled: {
    backgroundColor: '#fef2f2',
    borderColor: '#dc2626',
  },
  statusFieldButtonPlanned: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  statusFieldText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  statusFieldTextDone: {
    color: '#16a34a',
  },
  statusFieldTextCancelled: {
    color: '#dc2626',
  },
  statusFieldTextPlanned: {
    color: '#2563eb',
  },
});
