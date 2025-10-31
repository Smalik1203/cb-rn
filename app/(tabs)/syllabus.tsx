import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Card, List, ActivityIndicator, Button, Text, IconButton, TextInput } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';
import { BookOpen, FileText } from 'lucide-react-native';
import StudentSyllabusTab from './syllabus-student';
import { colors, spacing, borderRadius, typography } from '../../lib/design-system';
import { EmptyState } from '../../src/components/ui';
// removed import/export UI
import { useAuth } from '../../src/contexts/AuthContext';
import { computeProgress, fetchClassesForSchool, fetchProgress, fetchSubjectsForSchool, fetchSyllabusTree, ensureSyllabusId, addChapter, updateChapter, deleteChapter, addTopic, updateTopic, deleteTopic, type SyllabusTree } from '../../src/services/syllabus';

function useInitialData() {
    const { profile } = useAuth();
    const [subjects, setSubjects] = useState<{ id: string; subject_name: string }[]>([]);
    const [classes, setClasses] = useState<{ id: string; grade: number | null; section: string | null }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const reload = useCallback(async () => {
        if (!profile?.school_code) return;
        setLoading(true);
        setError(null);
        try {
            const [subs, cls] = await Promise.all([
                fetchSubjectsForSchool(profile.school_code),
                fetchClassesForSchool(profile.school_code),
            ]);
            setSubjects(subs);
            setClasses(cls);
        } catch (e: any) {
            setError(e?.message || 'Failed loading data');
        } finally {
            setLoading(false);
        }
    }, [profile?.school_code]);
    useEffect(() => { reload(); }, [reload]);
    return { subjects, classes, loading, error, reload };
}

function TeacherSyllabusScreen() {
    const { subjects, classes, loading: metaLoading } = useInitialData();
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [showClassDropdown, setShowClassDropdown] = useState(false);
    const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
    const [tree, setTree] = useState<SyllabusTree>({ chapters: [] });
    const [refreshing, setRefreshing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [taught, setTaught] = useState<{ taughtChapters: Set<string>; taughtTopics: Set<string> }>({ taughtChapters: new Set(), taughtTopics: new Set() });
    const [editingTopic, setEditingTopic] = useState<{ id: string; title: string; description: string | null } | null>(null);
    const [editingChapter, setEditingChapter] = useState<{ id: string; title: string } | null>(null);
    const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
    // Add form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [addMode, setAddMode] = useState<'chapter' | 'topic'>('chapter');
    const [targetChapterId, setTargetChapterId] = useState<string | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');

    const loadDetails = useCallback(async () => {
        if (!selectedSubjectId || !selectedClassId) return;
        setRefreshing(true);
        try {
            const [treeRes, progressRes] = await Promise.all([
                fetchSyllabusTree(selectedClassId, selectedSubjectId),
                fetchProgress(selectedClassId, selectedSubjectId),
            ]);
            setTree(treeRes);
            setTaught(progressRes);
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to load syllabus');
        } finally {
            setRefreshing(false);
        }
    }, [selectedClassId, selectedSubjectId]);

    useEffect(() => { loadDetails(); }, [loadDetails]);

    const progress = useMemo(() => computeProgress(tree, taught), [tree, taught]);
    const emptyCardMinHeight = useMemo(() => {
        const h = Dimensions.get('window').height;
        return Math.max(280, Math.round(h * 0.35));
    }, []);
    const selectedSubjectName = useMemo(() => {
        return subjects.find(s => s.id === selectedSubjectId)?.subject_name || 'this subject';
    }, [subjects, selectedSubjectId]);

    const CircularRing = ({ size = 70, strokeWidth = 6, progress = 0, label = '' }: { size?: number; strokeWidth?: number; progress: number; label: string }) => {
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const clamped = Math.max(0, Math.min(1, isFinite(progress) ? progress : 0));
        const dashOffset = circumference * (1 - clamped);
        return (
            <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={size} height={size}>
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={colors.neutral[200]}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={colors.primary[600]}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        fill="none"
                        rotation={-90}
                        origin={`${size / 2}, ${size / 2}`}
                    />
                </Svg>
                <Text style={[styles.progressValue, { position: 'absolute' }]}>{label}</Text>
            </View>
        );
    };

    const onAddChapter = async () => {
        try {
            setBusy(true);
            const sid = await ensureSyllabusId(selectedClassId, selectedSubjectId);
            await addChapter(sid, { title: formTitle.trim(), description: formDescription.trim() || '' });
            await loadDetails();
            setShowAddForm(false);
        } catch (e: any) {
            Alert.alert('Add Chapter Failed', e?.message || '');
        } finally {
            setBusy(false);
        }
    };

    const onUpdateChapter = async (chapterId: string, next: { title?: string; description?: string }) => {
        try {
            setBusy(true);
            await updateChapter(chapterId, next);
            await loadDetails();
        } catch (e: any) {
            Alert.alert('Update Chapter Failed', e?.message || '');
        } finally { setBusy(false); }
    };

    const onDeleteChapter = async (chapterId: string) => {
        Alert.alert('Delete Chapter', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                try { setBusy(true); await deleteChapter(chapterId); await loadDetails(); }
                catch (e: any) { Alert.alert('Delete Failed', e?.message || ''); }
                finally { setBusy(false); }
            }},
        ]);
    };

    const onAddTopic = async (chapterId: string) => {
        try {
            setBusy(true);
            await addTopic(chapterId, { title: formTitle.trim(), description: formDescription.trim() || '' });
            await loadDetails();
            setShowAddForm(false);
        } catch (e: any) {
            Alert.alert('Add Topic Failed', e?.message || '');
        } finally { setBusy(false); }
    };

    const onUpdateTopic = async (topicId: string, next: { title?: string; description?: string }) => {
        try {
            setBusy(true);
            await updateTopic(topicId, next);
            await loadDetails();
        } catch (e: any) {
            Alert.alert('Update Topic Failed', e?.message || '');
        } finally { setBusy(false); }
    };

    const onDeleteTopic = async (topicId: string) => {
        Alert.alert('Delete Topic', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                try { setBusy(true); await deleteTopic(topicId); await loadDetails(); }
                catch (e: any) { Alert.alert('Delete Failed', e?.message || ''); }
                finally { setBusy(false); }
            }},
        ]);
    };

    // removed CSV import/export actions per request

    return (
        <View style={styles.container}>
            <View style={styles.filterSection}>
                <View style={styles.filterRow}>
                    <TouchableOpacity style={styles.filterItem} onPress={() => setShowClassDropdown(true)}>
                        <View style={styles.filterIcon}><BookOpen size={16} color={colors.text.inverse} /></View>
                        <View style={styles.filterContent}>
                            <Text style={styles.filterValue}>
                                {selectedClassId ? `${classes.find(c => c.id === selectedClassId)?.grade}-${classes.find(c => c.id === selectedClassId)?.section}` : 'Class'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.filterDivider} />
                    <TouchableOpacity style={styles.filterItem} onPress={() => setShowSubjectDropdown(true)}>
                        <View style={styles.filterIcon}><FileText size={16} color={colors.text.inverse} /></View>
                        <View style={styles.filterContent}>
                            <Text style={styles.filterValue}>
                                {selectedSubjectId ? (subjects.find(s => s.id === selectedSubjectId)?.subject_name || 'Subject') : 'Subject'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {(metaLoading) && (
                <View style={styles.center}><ActivityIndicator /></View>
            )}

            {/* Empty meta data states */}
            {!metaLoading && (!classes?.length || !subjects?.length) && (
                <View style={styles.emptyFill}>
                <View style={[styles.largeEmptyCard, styles.largeEmptyCardFill]}>
                    <EmptyState
                        title="No classes or subjects yet"
                        message="Create classes and subjects to start building your syllabus."
                        icon={<BookOpen size={64} color={colors.neutral[300]} />}
                        variant="card"
                    />
                </View>
                </View>
            )}

            {/* Prompt to choose filters */}
            {!metaLoading && (classes?.length ?? 0) > 0 && (subjects?.length ?? 0) > 0 && (!selectedClassId || !selectedSubjectId) && (
                <View style={styles.emptyFill}>
                <View style={[styles.largeEmptyCard, styles.largeEmptyCardFill]}>
                    <EmptyState
                        title="Select a Class"
                        message="Choose a class and subject from the list above to view and manage its syllabus."
                        icon={<BookOpen size={64} color={colors.neutral[300]} />}
                        variant="card"
                    />
                </View>
                </View>
            )}

            {!!selectedClassId && !!selectedSubjectId && tree.chapters.length === 0 && (
                <View style={styles.emptyFill}>
                <View style={[styles.largeEmptyCard, styles.largeEmptyCardFill]}>
                    <EmptyState
                        title="No syllabus yet"
                        message={`Tap '+ Add Chapter' to start building your syllabus for ${selectedSubjectName}.`}
                        actionLabel="Add Chapter"
                        onAction={onAddChapter}
                        icon={<BookOpen size={64} color={colors.neutral[300]} />}
                        variant="card"
                    />
                </View>
                </View>
            )}

            {!!selectedClassId && !!selectedSubjectId && tree.chapters.length > 0 && (
                <ScrollView 
                    contentContainerStyle={styles.contentContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDetails} />}
                > 
            {/* Circular Progress Indicators */}
            <View style={styles.progressIndicatorsContainer}>
                <View style={styles.progressIndicator}>
                    <CircularRing progress={(progress.overallPct || 0) / 100} label={`${Math.round(progress.overallPct || 0)}%`} />
                    <Text style={styles.progressLabel}>Overall</Text>
                </View>
                
                <View style={styles.progressIndicator}>
                    <CircularRing progress={progress.totalTopics > 0 ? (progress.completedTopics / progress.totalTopics) : 0} label={`${progress.completedTopics}/${progress.totalTopics}`} />
                    <Text style={styles.progressLabel}>Topics</Text>
                </View>
                
                <View style={styles.progressIndicator}>
                    <CircularRing progress={progress.totalChapters > 0 ? (progress.startedChapters / progress.totalChapters) : 0} label={`${progress.startedChapters}/${progress.totalChapters}`} />
                    <Text style={styles.progressLabel}>Chapters</Text>
                </View>
            </View>

                    <View style={styles.cardList}>
                    {tree.chapters.map(node => (
                        <Card 
                            key={node.chapter.id} 
                            style={styles.card}
                        >
                            <TouchableOpacity 
                                style={styles.chapterCardHeader}
                                onPress={() => setExpandedChapterId(prev => prev === node.chapter.id ? null : node.chapter.id)}
                            >
                                <View style={styles.chapterCardContent}>
                                    <View style={styles.chapterInfo}>
                                        <View style={styles.chapterIconContainer}>
                                            <List.Icon
                                                icon="book-outline"
                                                color={colors.primary[600]}
                                            />
                                        </View>
                                        <View style={styles.chapterTextContainer}>
                                            <Text style={styles.chapterTitle} numberOfLines={2}>
                                                {node.chapter.title}
                                            </Text>
                                            {node.chapter.description && (
                                                <Text style={styles.chapterDescription} numberOfLines={1}>
                                                    {node.chapter.description}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                    <View style={styles.chapterActionsRow}>
                                        <IconButton
                                            icon="pencil"
                                            size={18}
                                            onPress={() => setEditingChapter({ id: node.chapter.id, title: node.chapter.title })}
                                            accessibilityLabel="Edit Chapter"
                                        />
                                        <IconButton
                                            icon="delete"
                                            size={18}
                                            onPress={() => onDeleteChapter(node.chapter.id)}
                                            accessibilityLabel="Delete Chapter"
                                            iconColor={colors.error[600]}
                                        />
                                        <List.Icon 
                                            icon={expandedChapterId === node.chapter.id ? "chevron-up" : "chevron-down"} 
                                            color={colors.text.secondary}
                                        />
                                    </View>
                                </View>
                            </TouchableOpacity>
                            {expandedChapterId === node.chapter.id && (
                                <View style={styles.expandedContent}>
                                    <View style={styles.topicHeader}>
                                        <Text style={styles.topicHeaderTitle}>Topics</Text>
                                        <IconButton
                                            icon="plus"
                                            onPress={() => { setAddMode('topic'); setTargetChapterId(node.chapter.id); setFormTitle(''); setFormDescription(''); setShowAddForm(true); }}
                                            accessibilityLabel="Add Topic"
                                            size={22}
                                            iconColor={colors.text.inverse}
                                            containerColor={colors.primary[600]}
                                            style={styles.addTopicFab}
                                        />
                                    </View>
                                    {node.topics.map(t => (
                                        <List.Item
                                            key={t.id}
                                            title={t.title}
                                            description={t.description || undefined}
                                            onPress={() => {
                                                Alert.alert('Progress Tracking', 'Marking as taught is managed from the Timetable. This view shows progress only.');
                                            }}
                                            left={props => (
                                                <TouchableOpacity onPress={() => {
                                                    Alert.alert('Progress Tracking', 'Mark/Unmark taught from the Timetable screen.');
                                                }}>
                                                    <List.Icon
                                                        {...props}
                                                        icon={taught.taughtTopics.has(t.id) ? 'checkbox-marked-circle-outline' : 'checkbox-blank-circle-outline'}
                                                        color={taught.taughtTopics.has(t.id) ? '#16a34a' : props.color}
                                                    />
                                                </TouchableOpacity>
                                            )}
                                            right={() => (
                                                <View style={styles.topicActions}>
                                                    <IconButton icon="pencil" onPress={() => setEditingTopic({ id: t.id, title: t.title, description: t.description || '' })} />
                                                    <IconButton icon="delete" onPress={() => onDeleteTopic(t.id)} />
                                                </View>
                                            )}
                                        />
                                    ))}
                                </View>
                            )}
                        </Card>
                    ))}
                    </View>
                </ScrollView>
            )}
            
            {/* Floating Action Button */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => { setAddMode('chapter'); setTargetChapterId(null); setFormTitle(''); setFormDescription(''); setShowAddForm(true); }}
                    disabled={busy}
                >
                    <List.Icon icon="plus" color="white" />
                </TouchableOpacity>
            </View>
            
            {/* Topic Edit Modal */}
            <Modal visible={!!editingTopic} transparent animationType="fade" onRequestClose={() => setEditingTopic(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.sheet}>
                        <Text style={styles.sheetTitle}>Edit Topic</Text>
                        {editingTopic && (
                            <>
                                <Text style={styles.inputLabel}>Title</Text>
                                <TextInput mode="outlined" value={editingTopic.title} onChangeText={(v) => setEditingTopic({ ...editingTopic, title: v })} style={styles.input} dense />
                                <Text style={[styles.inputLabel, { marginTop: 8 }]}>Description</Text>
                                <TextInput mode="outlined" value={editingTopic.description || ''} onChangeText={(v) => setEditingTopic({ ...editingTopic, description: v })} style={styles.input} dense multiline />
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                                    <Button onPress={() => setEditingTopic(null)}>Cancel</Button>
                                    <Button mode="contained" onPress={async () => {
                                        try {
                                            if (!editingTopic) return;
                                            await onUpdateTopic(editingTopic.id, { title: editingTopic.title, description: editingTopic.description || '' });
                                            setEditingTopic(null);
                                            await loadDetails();
                                        } catch (e: any) {
                                            Alert.alert('Save Failed', e?.message || '');
                                        }
                                    }}>Save</Button>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Add Chapter/Topic Modal */}
            <Modal visible={showAddForm} transparent animationType="fade" onRequestClose={() => setShowAddForm(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.sheet}>
                        <Text style={styles.sheetTitle}>{addMode === 'chapter' ? 'Add Chapter' : 'Add Topic'}</Text>
                        <Text style={styles.inputLabel}>Title</Text>
                        <TextInput mode="outlined" value={formTitle} onChangeText={setFormTitle} style={styles.input} dense />
                        <Text style={[styles.inputLabel, { marginTop: 8 }]}>Description</Text>
                        <TextInput mode="outlined" value={formDescription} onChangeText={setFormDescription} style={styles.input} dense multiline />
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                            <Button onPress={() => setShowAddForm(false)}>Cancel</Button>
                            <Button mode="contained" disabled={!formTitle.trim() || busy} onPress={async () => {
                                if (!formTitle.trim()) return;
                                if (addMode === 'chapter') { await onAddChapter(); }
                                else if (addMode === 'topic' && targetChapterId) { await onAddTopic(targetChapterId); }
                            }}>Create</Button>
                        </View>
                    </View>
                </View>
            </Modal>
            {/* Chapter Edit Modal */}
            <Modal visible={!!editingChapter} transparent animationType="fade" onRequestClose={() => setEditingChapter(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.sheet}>
                        <Text style={styles.sheetTitle}>Edit Chapter</Text>
                        {editingChapter && (
                            <>
                                <Text style={styles.inputLabel}>Title</Text>
                                <TextInput
                                    mode="outlined"
                                    value={editingChapter.title}
                                    onChangeText={(v) => setEditingChapter({ ...editingChapter, title: v })}
                                    style={styles.input}
                                    dense
                                />
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                                    <Button onPress={() => setEditingChapter(null)}>Cancel</Button>
                                    <Button mode="contained" onPress={async () => {
                                        try {
                                            if (!editingChapter) return;
                                            await onUpdateChapter(editingChapter.id, { title: editingChapter.title });
                                            setEditingChapter(null);
                                            await loadDetails();
                                        } catch (e: any) {
                                            Alert.alert('Save Failed', e?.message || '');
                                        }
                                    }}>Save</Button>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
            {/* Class Selector Modal */}
            <Modal visible={showClassDropdown} transparent animationType="fade" onRequestClose={() => setShowClassDropdown(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.sheet}>
                        <Text style={styles.sheetTitle}>Select Class</Text>
                        <ScrollView style={styles.sheetList}>
                            {classes.map(c => (
                                <TouchableOpacity key={c.id} style={styles.sheetItem} onPress={() => { setSelectedClassId(c.id); setShowClassDropdown(false); }}>
                                    <Text style={styles.sheetItemText}>{c.grade}-{c.section}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <Button onPress={() => setShowClassDropdown(false)}>Close</Button>
                    </View>
                </View>
            </Modal>

            {/* Subject Selector Modal */}
            <Modal visible={showSubjectDropdown} transparent animationType="fade" onRequestClose={() => setShowSubjectDropdown(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.sheet}>
                        <Text style={styles.sheetTitle}>Select Subject</Text>
                        <ScrollView style={styles.sheetList}>
                            {subjects.map(s => (
                                <TouchableOpacity key={s.id} style={styles.sheetItem} onPress={() => { setSelectedSubjectId(s.id); setShowSubjectDropdown(false); }}>
                                    <Text style={styles.sheetItemText}>{s.subject_name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <Button onPress={() => setShowSubjectDropdown(false)}>Close</Button>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

export default function SyllabusTab() {
    const { profile } = useAuth();
    const role = profile?.role || 'unknown';
    const isStaff = role === 'teacher' || role === 'admin' || role === 'superadmin' || role === 'cb_admin';
    if (!isStaff) {
        return <StudentSyllabusTab />;
    }
    return <TeacherSyllabusScreen />;
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { padding: 24, alignItems: 'center', justifyContent: 'center' },
    filterSection: { paddingHorizontal: spacing.lg, paddingTop: 12, paddingBottom: spacing.md },
    filterRow: {
        backgroundColor: colors.surface.primary,
        borderRadius: borderRadius.xl || 16,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.primary[200] || '#93c5fd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    filterItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    filterIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary[600], alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
    filterContent: { flex: 1 },
    filterValue: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text.primary },
    filterDivider: { width: 1, height: 40, backgroundColor: colors.border.DEFAULT, marginHorizontal: spacing.sm },
    summaryCard: { margin: 12 },
    progressIndicatorsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.lg,
        backgroundColor: colors.surface.primary,
        marginHorizontal: spacing.md,
        marginVertical: spacing.sm,
        borderRadius: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    progressIndicator: {
        alignItems: 'center',
        flex: 1,
    },
    progressCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: colors.neutral[100],
        borderWidth: 4,
        borderColor: colors.primary[600],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
        position: 'relative',
    },
    progressValue: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        textAlign: 'center',
    },
    progressLabel: { 
        fontSize: typography.fontSize.xs, 
        color: colors.text.secondary, 
        textAlign: 'center',
        fontWeight: '500',
    },
    selectButtonContainer: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    selectButton: { 
        borderRadius: 24,
        width: '60%',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    selectButtonContent: { height: 48 },
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
    contentContainer: {
        paddingBottom: 140,
    },
    cardList: {
        paddingHorizontal: spacing.md,
        gap: spacing.md,
        paddingTop: spacing.sm,
    },
    card: { 
        marginHorizontal: 0, 
        marginBottom: 0, 
        borderRadius: 16, 
        overflow: 'hidden',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        backgroundColor: colors.surface.primary,
    },
    cardDone: { borderColor: '#22c55e', borderWidth: 2 },
    chapterCardHeader: { 
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        minHeight: 88,
    },
    chapterCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    chapterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    chapterIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primary[50],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    chapterTextContainer: {
        flex: 1,
    },
    chapterTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: 2,
    },
    chapterDescription: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        lineHeight: 16,
    },
    chapterActions: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: spacing.sm,
    },
    chapterActionsRow: { flexDirection: 'row', alignItems: 'center' },
    selectedCard: { borderColor: colors.primary[600], borderWidth: 2 },
    selectionIndicator: { paddingRight: spacing.sm },
    selectedChapterActions: { flexDirection: 'row', alignItems: 'center', marginLeft: spacing.md, gap: spacing.sm },
    selectionModeActions: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: spacing.sm,
        width: '100%',
        justifyContent: 'center'
    },
    actionButton: { 
        borderRadius: 20,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    inlineEdit: { padding: 12, gap: 4 },
    inputLabel: { fontSize: typography.fontSize.xs, color: colors.text.secondary },
    input: { marginBottom: 4 },
    expandedContent: { padding: spacing.md },
    topicHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
    topicHeaderTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
    addTopicButton: { borderRadius: 20 },
    addTopicButtonContent: { height: 36 },
    deleteButton: { borderRadius: 20 },
    addTopicFab: { borderRadius: 18, marginRight: -4 },
    topicActions: { flexDirection: 'row', alignItems: 'center' },
    segmented: { padding: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    sheet: { backgroundColor: colors.surface.primary, borderRadius: 16, padding: 16, maxHeight: '70%' },
    sheetTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold as any, color: colors.text.primary, marginBottom: 8 },
    sheetList: { maxHeight: 400, marginBottom: 8 },
    sheetItem: { paddingVertical: 12 },
    sheetItemText: { fontSize: typography.fontSize.base, color: colors.text.primary },
    emptyFill: { flex: 1 },
    largeEmptyCard: {
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        marginBottom: spacing.lg,
        backgroundColor: colors.surface.primary,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.border.light,
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.xl,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    largeEmptyCardFill: { flex: 1 },
});



