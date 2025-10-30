import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius, typography, shadows } from '../../../lib/design-system';
import { supabase } from '../../lib/supabase';
import { useClassSelection } from '../../contexts/ClassSelectionContext';
import { useAuth } from '../../contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStudents } from '../../hooks/useStudents';
import { Wallet, CreditCard, Landmark, Smartphone, Circle, Search, Filter } from 'lucide-react-native';

type PaymentRecord = {
  id: string;
  student_id: string;
  plan_id: string | null;
  component_type_id: string;
  amount_paise: number;
  payment_date: string; // YYYY-MM-DD
  payment_method: string | null;
  transaction_id: string | null;
  receipt_number: string | null;
  remarks: string | null;
  created_at: string | null;
  updated_at: string | null;
  // joined
  student?: { id: string; full_name: string | null; student_code: string | null } | null;
  component?: { id: string; name: string } | null;
  total_fee_paise?: number; // computed from plan items
};

function formatAmount(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDateDisplay(isoOrYmd: string): string {
  const d = new Date(isoOrYmd);
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
  const base = d.toLocaleDateString('en-GB', opts); // e.g., 30 Oct
  if (d.getFullYear() !== now.getFullYear()) return `${base} ${d.getFullYear()}`;
  return base;
}

export default function PaymentHistory() {
  const { scope, selectedClass, setSelectedClass, classes } = useClassSelection();
  const { profile } = useAuth();
  const schoolCode = scope.school_code;

  const [startDate, setStartDate] = useState<Date | null>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [methodFilter, setMethodFilter] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showHistoryDatePicker, setShowHistoryDatePicker] = useState<'start' | 'end' | null>(null);
  const [tempPickerDate, setTempPickerDate] = useState<Date | null>(null);
  // Always using range; no toggle UI
  const [activeTab, setActiveTab] = useState<'collected' | 'pending'>('collected');
  const [showMethodModal, setShowMethodModal] = useState(false);

  const { data: students = [] } = useStudents(selectedClass?.id, schoolCode || undefined);

  // Plans and dues for Pending tab
  const studentIds = useMemo(() => students.map((s: any) => s.id), [students]);
  const { data: planByStudent } = useQuery<{ student_id: string; id: string }[]>({
    queryKey: ['fee_student_plans', schoolCode, selectedClass?.id || 'all', studentIds.join(',')],
    enabled: activeTab === 'pending' && !!schoolCode && studentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_student_plans')
        .select('id, student_id')
        .eq('school_code', schoolCode)
        .in('student_id', studentIds);
      if (error) throw error;
      return data as any;
    }
  });

  const planIdsForClass = useMemo(() => Array.from(new Set((planByStudent || []).map(p => p.id))), [planByStudent]);

  const { data: planItems } = useQuery<{ plan_id: string; amount_paise: number }[]>({
    queryKey: ['fee_student_plan_items', planIdsForClass.join(',')],
    enabled: activeTab === 'pending' && planIdsForClass.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_student_plan_items')
        .select('plan_id, amount_paise')
        .in('plan_id', planIdsForClass);
      if (error) throw error;
      return data as any;
    }
  });

  const { data: planPayments } = useQuery<{ plan_id: string | null; amount_paise: number }[]>({
    queryKey: ['fee_payments_totals', planIdsForClass.join(',')],
    enabled: activeTab === 'pending' && planIdsForClass.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_payments')
        .select('plan_id, amount_paise')
        .eq('school_code', schoolCode)
        .in('plan_id', planIdsForClass);
      if (error) throw error;
      return data as any;
    }
  });

  const planTotalMapAll = useMemo(() => {
    const m = new Map<string, number>();
    (planItems || []).forEach(it => {
      if (!it.plan_id) return;
      m.set(it.plan_id, (m.get(it.plan_id) || 0) + (it.amount_paise || 0));
    });
    return m;
  }, [planItems]);

  const planPaidMapAll = useMemo(() => {
    const m = new Map<string, number>();
    (planPayments || []).forEach(p => {
      if (!p.plan_id) return;
      m.set(p.plan_id, (m.get(p.plan_id) || 0) + (p.amount_paise || 0));
    });
    return m;
  }, [planPayments]);

  const studentPlanMap = useMemo(() => {
    const m = new Map<string, string>();
    (planByStudent || []).forEach(p => m.set(p.student_id, p.id));
    return m;
  }, [planByStudent]);

  const {
    data: payments,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<PaymentRecord[]>({
    queryKey: [
      'fee_payments', 
      schoolCode, 
      selectedClass?.id || 'all', 
      startDate ? startDate.toISOString().slice(0,10) : null, 
      endDate ? endDate.toISOString().slice(0,10) : null,
      methodFilter || 'all',
      studentIds.join(',')
    ],
    queryFn: async () => {
      let query = supabase
        .from('fee_payments')
        .select(
          `
          id, student_id, plan_id, component_type_id, amount_paise, payment_date, payment_method,
          transaction_id, receipt_number, remarks, created_at, updated_at,
          student:student_id ( id, full_name, student_code, class_instance_id ),
          component:component_type_id ( id, name )
        `
        )
        .eq('school_code', schoolCode);

      if (selectedClass?.id && studentIds.length > 0) {
        // filter by students of the selected class
        query = query.in('student_id', studentIds);
      }

      if (startDate) {
        query = query.gte('payment_date', startDate.toISOString().slice(0,10));
      }
      if (endDate) {
        query = query.lte('payment_date', endDate.toISOString().slice(0,10));
      }
      if (methodFilter) {
        query = query.eq('payment_method', methodFilter);
      }

      query = query
        .order('payment_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(200);

      const { data, error } = await query;

      if (error) throw error;
      const payments = (data as unknown) as PaymentRecord[];
      const planIds = Array.from(new Set(payments.map(p => p.plan_id).filter(Boolean))) as string[];
      if (planIds.length === 0) return payments;

      // fetch plan items to compute totals
      const { data: items, error: itemsError } = await supabase
        .from('fee_student_plan_items')
        .select('plan_id, amount_paise')
        .in('plan_id', planIds);
      if (itemsError) throw itemsError;

      const planTotalMap = new Map<string, number>();
      for (const it of (items as any[])) {
        const pid = it.plan_id as string;
        const amt = it.amount_paise as number;
        planTotalMap.set(pid, (planTotalMap.get(pid) || 0) + (amt || 0));
      }

      return payments.map(p => ({
        ...p,
        total_fee_paise: p.plan_id ? (planTotalMap.get(p.plan_id) || 0) : undefined,
      }));
    },
  });

  const empty = !isLoading && (payments?.length ?? 0) === 0;

  const totalCollected = useMemo(() => {
    return (payments || []).reduce((sum, p) => sum + (p.amount_paise || 0), 0);
  }, [payments]);

  const filtered = useMemo(() => {
    const list = payments || [];
    return list.filter((p) => {
      // date range
      if (startDate) {
        if (new Date(p.payment_date) < new Date(startDate.toISOString().split('T')[0])) return false;
      }
      if (endDate) {
        if (new Date(p.payment_date) > new Date(endDate.toISOString().split('T')[0])) return false;
      }
      // method
      if (methodFilter && p.payment_method !== methodFilter) return false;
      // search by student
      if (searchText.trim().length > 0) {
        const name = (p.student?.full_name || '').toLowerCase();
        if (!name.includes(searchText.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [payments, startDate, endDate, methodFilter, searchText]);

  // Pending list (no payment in current filter)
  const pendingStudents = useMemo(() => {
    if (!students || students.length === 0) return [] as { id: string; full_name: string; student_code: string }[];
    const paidIds = new Set((filtered || []).map(p => p.student_id));
    return students
      .filter((s: any) => !paidIds.has(s.id))
      .map((s: any) => ({ id: s.id, full_name: s.full_name, student_code: s.student_code }));
  }, [students, filtered]);

  const headlineDateText = startDate ? (
    endDate ? `${formatDateDisplay(startDate.toISOString())} – ${formatDateDisplay(endDate.toISOString())}` : formatDateDisplay(startDate.toISOString())
  ) : 'All time';

  const pendingDueTotal = useMemo(() => {
    return pendingStudents.reduce((sum, s) => {
      const planId = studentPlanMap.get(s.id);
      if (!planId) return sum;
      const total = planTotalMapAll.get(planId) || 0;
      const paid = planPaidMapAll.get(planId) || 0;
      const due = Math.max(total - paid, 0);
      return sum + due;
    }, 0);
  }, [pendingStudents, studentPlanMap, planTotalMapAll, planPaidMapAll]);

  const formatMethod = (m?: string | null) => {
    if (!m) return '—';
    return m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
  };

  return (
    <View style={styles.container}>
      {/* Toggle: Collected | Pending */}
      <View style={styles.toggleRow}>
        <TouchableOpacity onPress={() => setActiveTab('collected')} style={[styles.toggleBtn, activeTab==='collected' && styles.toggleBtnActive]}> 
          <Text style={[styles.toggleText, activeTab==='collected' && styles.toggleTextActive]}>Collected</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('pending')} style={[styles.toggleBtn, activeTab==='pending' && styles.toggleBtnActive]}> 
          <Text style={[styles.toggleText, activeTab==='pending' && styles.toggleTextActive]}>Pending</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Filters - mirror Attendance history */}
      <View style={styles.filterSection}>
        <View style={styles.filterRow}>
          {/* Class Filter */}
          <TouchableOpacity
            style={styles.filterItem}
            onPress={() => setShowClassDropdown(true)}
          >
            <View style={styles.filterContent}>
              <Text style={styles.filterLabel}>Class</Text>
              <Text style={styles.filterValue} numberOfLines={1} ellipsizeMode="tail">
                {selectedClass ? `Grade ${selectedClass.grade} ${selectedClass.section}` : 'Select'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.filterDivider} />

          {/* Start Date */}
          <TouchableOpacity 
            style={styles.filterItem}
            onPress={() => { setTempPickerDate(startDate || new Date()); setShowHistoryDatePicker('start'); }}
          >
            <View style={styles.filterContent}>
              <Text style={styles.filterLabel}>Start</Text>
              <Text style={styles.filterValue} numberOfLines={1} ellipsizeMode="tail">
                {(startDate || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.filterDivider} />
          <TouchableOpacity 
            style={styles.filterItem}
            onPress={() => { setTempPickerDate(endDate || startDate || new Date()); setShowHistoryDatePicker('end'); }}
          >
            <View style={styles.filterContent}>
              <Text style={styles.filterLabel}>End</Text>
              <Text style={styles.filterValue} numberOfLines={1} ellipsizeMode="tail">
                {(endDate || startDate || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search input and method filter */}
      <View style={styles.filtersRow}> 
        <View style={[styles.filterBlock, { flex: 1 }]}> 
          <Text style={styles.filterLabel}>Student</Text>
          <View style={styles.searchInputWrap}>
            <Search size={16} color={colors.text.tertiary} style={styles.searchIcon} />
            <TouchableOpacity onPress={() => setShowMethodModal(true)}>
              <Filter size={16} color={colors.text.tertiary} style={styles.searchFilterIcon} />
            </TouchableOpacity>
            <TextInput
              placeholder="Search by student name…"
              placeholderTextColor={colors.text.tertiary}
              value={searchText}
              onChangeText={setSearchText}
              style={styles.searchInput}
            />
          </View>
        </View>
        <View style={[styles.filterBlock, { width: 140 }]}> 
          <Text style={styles.filterLabel}>Method</Text>
          <TouchableOpacity style={styles.methodPicker} onPress={() => setShowMethodModal(true)}>
            <Text style={styles.methodPickerText}>{methodFilter ? methodFilter.charAt(0).toUpperCase()+methodFilter.slice(1) : 'Any'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider before table */}
      <View style={styles.sectionDivider} />

      {/* Headline summary moved below filters */}
      <View style={[styles.headlineCard, activeTab==='pending' && styles.headlineCardPending]}>
        <View style={styles.headlineEdge} />
        <View style={styles.headlineContentCenter}>
          <Text style={styles.headlineAmount}>{activeTab==='pending' ? formatAmount(pendingDueTotal) : formatAmount(totalCollected)}</Text>
        </View>
      </View>
      

      {activeTab==='collected' && (
      <View style={styles.tableHeader}>
        <View style={styles.colStudent}><Text style={[styles.th, styles.alignLeft]}>Student</Text></View>
        <View style={styles.colComponent}><Text style={[styles.th, styles.alignLeft]}>Component</Text></View>
        <View style={styles.colAmount}><Text style={[styles.th, styles.alignRight]}>Amount</Text></View>
        <View style={styles.colMethod}><Text style={[styles.th, styles.alignCenter]}>Method</Text></View>
      </View>
      )}

      {activeTab==='collected' ? (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={[styles.row, index % 2 === 1 && styles.rowAlt]}>
            <View style={styles.colStudent}>
              <Text style={[styles.td, styles.alignLeft]} numberOfLines={1} ellipsizeMode="tail">
                {item.student?.full_name || '—'}
                {item.student?.student_code ? (
                  <Text style={styles.tdMeta}> ({item.student.student_code})</Text>
                ) : null}
              </Text>
            </View>
            <View style={styles.colComponent}><Text style={[styles.td, styles.alignLeft]} numberOfLines={1} ellipsizeMode="tail">{item.component?.name || '—'}</Text></View>
            <View style={styles.colAmount}><Text style={[styles.td, styles.alignRight]}>{formatAmount(item.amount_paise)}</Text></View>
            <View style={styles.colMethod}><Text style={[styles.td, styles.alignCenter]}>{formatMethod(item.payment_method)}</Text></View>
          </View>
        )}
        ListEmptyComponent={empty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No payments found. Try changing the date or method.</Text>
          </View>
        ) : null}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={payments && payments.length > 0 ? undefined : { flex: 1 }}
      />
      ) : (
        <FlatList
          data={pendingStudents}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={[styles.row, index % 2 === 1 && styles.rowAlt]}>
              <View style={styles.colStudent}><Text style={[styles.td, styles.alignLeft]} numberOfLines={1} ellipsizeMode="tail">{item.full_name}</Text></View>
              <View style={styles.colAmount}><Text style={[styles.td, styles.alignRight]}>
                {(() => {
                  const pid = studentPlanMap.get(item.id);
                  if (!pid) return '—';
                  const total = planTotalMapAll.get(pid) || 0;
                  const paid = planPaidMapAll.get(pid) || 0;
                  const due = Math.max(total - paid, 0);
                  return formatAmount(due);
                })()}
              </Text></View>
            </View>
          )}
          ListEmptyComponent={(
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Great! No pending payments for this selection.</Text>
            </View>
          )}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          contentContainerStyle={pendingStudents.length > 0 ? undefined : { flex: 1 }}
        />
      )}

      {/* Class Dropdown Modal */}
      {showClassDropdown && (
        <View style={styles.dropdownOverlay}>
          <View style={styles.dropdownModalContainer}>
            <Text style={styles.dropdownModalTitle}>Select Class ({classes?.length || 0} available)</Text>
            <FlatList
              data={classes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedClass(item);
                    setShowClassDropdown(false);
                  }}
                  style={[styles.dropdownItem, selectedClass?.id === item.id && styles.dropdownItemSelected]}
                >
                  <Text style={[styles.dropdownItemText, selectedClass?.id === item.id && styles.dropdownItemTextSelected]}>
                    Grade {item.grade} - Section {item.section}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.dropdownList}
            />
            <TouchableOpacity onPress={() => setShowClassDropdown(false)} style={styles.dropdownCloseButton}> 
              <Text style={styles.clearBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Method Modal */}
      {showMethodModal && (
        <View style={styles.dropdownOverlay}>
          <View style={styles.dropdownModalContainer}>
            <Text style={styles.dropdownModalTitle}>Select Method</Text>
            {['any','cash','cheque','online','card','other'].map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => {
                  setMethodFilter(m==='any'? null : m);
                  setShowMethodModal(false);
                }}
                style={[styles.dropdownItem, (methodFilter===null && m==='any') || methodFilter===m ? styles.dropdownItemSelected : undefined]}
              >
                <Text style={[styles.dropdownItemText, (methodFilter===null && m==='any') || methodFilter===m ? styles.dropdownItemTextSelected : undefined]}>
                  {m==='any' ? 'Any' : m.charAt(0).toUpperCase()+m.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowMethodModal(false)} style={styles.dropdownCloseButton}> 
              <Text style={styles.clearBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* History Date Picker - unified modal with explicit Done/Cancel */}
      {showHistoryDatePicker && (
        <View style={styles.iosPickerSheet}>
          <View style={styles.iosPickerInner}>
            <DateTimePicker
              value={tempPickerDate || new Date()}
              mode="date"
              display="spinner"
              onChange={(event, selected) => {
                if (selected) setTempPickerDate(selected);
              }}
              minimumDate={new Date(2020, 0, 1)}
              maximumDate={new Date(2030, 11, 31)}
            />
            <View style={styles.iosPickerActions}>
              <TouchableOpacity onPress={() => { setShowHistoryDatePicker(null); setTempPickerDate(null); }} style={[styles.cancelBtn, { backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.DEFAULT }]}>
                <Text style={[styles.cancelBtnText, { color: colors.text.primary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                if (tempPickerDate) {
                  if (showHistoryDatePicker === 'start') setStartDate(tempPickerDate); else setEndDate(tempPickerDate);
                }
                setShowHistoryDatePicker(null);
                setTempPickerDate(null);
              }} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    paddingTop: spacing.lg,
  },
  headerRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headlineCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    ...shadows.xs,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headlineCardPending: {
    backgroundColor: colors.error[50],
  },
  headlineEdge: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: colors.primary[500],
    borderRadius: 2,
    marginRight: spacing.md,
  },
  headlineTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  headlineSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  headlineAmountWrap: {
    alignItems: 'flex-end',
  },
  headlineContentCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headlineAmount: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.primary[700],
  },
  headlineLabel: { display: 'none' as any },
  headlineSubLabel: { display: 'none' as any },
  toggleRow: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  toggleText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.primary[700],
  },
  filterSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  filterRow: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.xs,
  },
  filterItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  filterContent: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  filterLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  filterValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
  },
  filterDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.DEFAULT,
    marginHorizontal: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalCollected: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  tableHeader: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    ...shadows.xs,
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  filtersRow: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterBlock: {
    width: 150,
  },
  // filterLabel used above for value row
  datePickerSm: {
    height: 36,
  },
  searchInput: {
    height: 36,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.sm,
    paddingLeft: spacing.lg + 8,
    paddingRight: spacing.sm,
    color: colors.text.primary,
  },
  searchInputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.sm,
    zIndex: 1,
  },
  searchFilterIcon: {
    position: 'absolute',
    right: spacing.sm,
    zIndex: 1,
  },
  methodRow: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  methodChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  methodChipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  methodChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  methodChipTextActive: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  methodPicker: {
    height: 36,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  methodPickerText: {
    color: colors.text.primary,
  },
  clearBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.full,
    marginLeft: 'auto',
  },
  clearBtnText: {
    color: colors.error[700],
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModalContainer: {
    backgroundColor: colors.surface.primary,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    width: '90%',
    maxHeight: '70%',
  },
  dropdownModalTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  dropdownList: {
    marginBottom: spacing.sm,
  },
  dropdownItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  dropdownItemSelected: {
    backgroundColor: colors.primary[50],
  },
  dropdownItemText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  dropdownItemTextSelected: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  dropdownCloseButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.full,
  },
  iosPickerSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  iosPickerInner: {},
  iosPickerActions: {
    marginTop: spacing.md,
    alignItems: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full,
  },
  cancelBtnText: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  th: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  alignLeft: { textAlign: 'left' as const },
  alignRight: { textAlign: 'right' as const },
  alignCenter: { textAlign: 'center' as const },
  row: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    ...shadows.xs,
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  rowAlt: {
    backgroundColor: colors.background.secondary,
  },
  td: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: '400',
  },
  tdMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontWeight: '400',
  },
  colStudent: { flex: 2, paddingRight: spacing.sm },
  colComponent: { flexBasis: 120, width: 120, paddingRight: spacing.sm },
  colAmount: { flexBasis: 110, width: 110, paddingRight: spacing.sm },
  colMethod: { flexBasis: 90, width: 90 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border.DEFAULT,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
});


