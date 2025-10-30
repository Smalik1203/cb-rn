import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Portal, Modal as PaperModal, Button } from 'react-native-paper';
import { 
  Users, 
  Search, 
  Filter, 
  Check, 
  X, 
  Plus, 
  Edit3, 
  Edit,
  CreditCard,
  ChevronRight,
  DollarSign,
  Calendar,
  User,
  ChevronDown,
  Trash2
} from 'lucide-react-native';
import { format } from 'date-fns';

import { useAuth } from '../../contexts/AuthContext';
import { useClassSelection } from '../../contexts/ClassSelectionContext';
import { useClasses } from '../../hooks/useClasses';
import { useStudents } from '../../hooks/useStudents';
import { ClassSelector } from '../ClassSelector';
import { DatePickerModal } from '../common/DatePickerModal';
import { supabase } from '../../data/supabaseClient';
import { getClassStudentsFees, getFeeComponentTypes } from '../../data/queries';
import { colors, spacing, borderRadius, typography, shadows } from '../../../lib/design-system';
// Helper function for formatting amounts
const formatAmount = (paise: number): string => {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
};

const formatAmountCompact = (paise: number): string => {
  const amount = paise / 100;
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

type FilterType = 'all' | 'has_plan' | 'no_plan';

interface StudentFeeData {
  student_id: string;
  student_name: string;
  student_code: string;
  class_instance_id: string;
  plan_id: string;
  component_type_id: string;
  component_name: string;
  plan_amount_paise: number;
  collected_amount_paise: number;
  outstanding_amount_paise: number;
  collection_percentage: number;
}

export default function FeePlans() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showClassSelector, setShowClassSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>('');
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedComponentName, setSelectedComponentName] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClassPlanModal, setShowClassPlanModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [planItems, setPlanItems] = useState<any[]>([]);
  const [savingPlan, setSavingPlan] = useState(false);
  const [classPlanItems, setClassPlanItems] = useState<any[]>([]);
  const [savingClassPlan, setSavingClassPlan] = useState(false);
  const [showComponentSelector, setShowComponentSelector] = useState(false);
  const [componentSearch, setComponentSearch] = useState('');
  const [editingComponentIndex, setEditingComponentIndex] = useState<number | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { selectedClass, scope, setSelectedClass } = useClassSelection();
  const { data: classes = [] } = useClasses(scope.school_code);
  const { data: students = [], isLoading: studentsLoading } = useStudents(
    selectedClass?.id,
    scope.school_code
  );

  const schoolCode = scope.school_code;
  const selectedClassId = selectedClass?.id;
  const academicYearId = scope.academic_year_id;

  // Fetch fee data for all students in the class
  const { data: studentsWithFees = [], isLoading: feesLoading } = useQuery({
    queryKey: ['classStudentsFees', selectedClassId, academicYearId, schoolCode],
    queryFn: () => getClassStudentsFees(
      selectedClassId!,
      academicYearId!,
      schoolCode!
    ).then(result => result.data || []),
    enabled: !!selectedClassId && !!academicYearId && !!schoolCode,
  });

  // Fetch fee components for the school
  const { data: feeComponents = [], isLoading: componentsLoading } = useQuery({
    queryKey: ['feeComponents', schoolCode],
    queryFn: () => getFeeComponentTypes(schoolCode!).then(result => {
      const components = result.data || [];
      // Remove duplicates using Map for better performance
      const componentMap = new Map();
      components.forEach((comp: any) => {
        if (!componentMap.has(comp.id)) {
          componentMap.set(comp.id, comp);
        }
      });
      const uniqueComponents = Array.from(componentMap.values());
      console.log('Original components:', components.length, 'Unique components:', uniqueComponents.length);
      console.log('Component names:', components.map((c: any) => c.name));
      return uniqueComponents;
    }),
    enabled: !!schoolCode,
  });
  // Merge students with fee data
  const studentsWithFeeData = useMemo(() => {
    return students.map(student => {
      const feeData = studentsWithFees.find((s: any) => s.id === student.id);
    return {
        ...student,
        feeDetails: feeData?.feeDetails || {
          plan: null,
          payments: [],
          totalDue: 0,
          totalPaid: 0,
          balance: 0,
        }
    };
      });
  }, [students, studentsWithFees]);

  // Filter students
  const filteredStudents = useMemo(() => {
    let result = studentsWithFeeData.filter(student => {
      const matches = !searchQuery || 
        student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_code?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matches;
    });

    // Apply status filter based on actual fee plan data
    if (filter === 'has_plan') {
      result = result.filter(student => student.feeDetails.plan !== null);
    } else if (filter === 'no_plan') {
      result = result.filter(student => student.feeDetails.plan === null);
    }

    return result.sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [studentsWithFeeData, searchQuery, filter]);

  // Aggregate summary for the currently visible list
  const { summaryTotalAssigned, summaryTotalPending } = useMemo(() => {
    let total = 0;
    let pending = 0;
    try {
      for (const s of filteredStudents) {
        total += s.feeDetails?.totalDue || 0;
        pending += s.feeDetails?.balance || 0;
      }
    } catch {}
    return { summaryTotalAssigned: total, summaryTotalPending: pending };
  }, [filteredStudents]);

  // Refresh data
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      await queryClient.invalidateQueries({ queryKey: ['classStudentsFees'] });
      await queryClient.invalidateQueries({ queryKey: ['feeComponents'] });
      await queryClient.refetchQueries({ queryKey: ['students'] });
      await queryClient.refetchQueries({ queryKey: ['classStudentsFees'] });
      await queryClient.refetchQueries({ queryKey: ['feeComponents'] });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle payment collection
  const handleCollectPayment = (studentId: string, studentName: string, componentTypeId: string, componentName: string) => {
    setSelectedStudentId(studentId);
    setSelectedStudentName(studentName);
    setSelectedComponentId(componentTypeId);
    setSelectedComponentName(componentName);
    setPaymentAmount('');
    setPaymentMethod('cash');
    setReceiptNumber('');
    setRemarks('');
    setShowPaymentModal(true);
  };


  // Submit payment
  const handleSubmitPayment = async () => {
    try {
      if (!selectedStudentId || !selectedComponentId || !paymentAmount) {
        Alert.alert('Error', 'Please select a component and enter payment amount');
        return;
      }

      const amountPaise = Math.round(parseFloat(paymentAmount) * 100);
      
      if (amountPaise <= 0) {
        Alert.alert('Error', 'Please enter a valid payment amount');
        return;
      }

      // Get the plan_id for this student and component
      const student = filteredStudents.find(s => s.id === selectedStudentId);
      const planId = student?.feeDetails?.plan?.id;

      // Insert payment record
      const { data, error } = await supabase
        .from('fee_payments')
        .insert({
          school_code: schoolCode,
          student_id: selectedStudentId,
          plan_id: planId || null,
          component_type_id: selectedComponentId,
          amount_paise: amountPaise,
          payment_method: paymentMethod,
          payment_date: paymentDate.toISOString().split('T')[0],
          transaction_id: receiptNumber || null,
          receipt_number: receiptNumber || null,
          remarks: remarks || null,
          created_by: profile?.auth_id
        })
        .select()
        .single();

      if (error) {
        console.error('Payment error:', error);
        Alert.alert('Error', error.message || 'Failed to record payment');
        return;
      }

      Alert.alert('Success', 'Payment recorded successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setShowPaymentModal(false);
            setSelectedStudentId(null);
            setSelectedStudentName('');
            setSelectedComponentId(null);
            setSelectedComponentName('');
            setPaymentAmount('');
            setPaymentMethod('cash');
            setReceiptNumber('');
            setRemarks('');
            setPaymentDate(new Date());
            
            // Refresh data
            refreshData();
          }
        }
      ]);

    } catch (error: any) {
      console.error('Payment submission error:', error);
      Alert.alert('Error', error.message || 'Failed to record payment');
    }
  };
  
  // Handle edit plan
  const handleEditPlan = async (student: any) => {
    try {
      let planId = student.feeDetails?.plan?.id;

      // Create plan if missing
      if (!planId) {
        if (!academicYearId) {
          Alert.alert('Error', 'No active academic year found. Please set up an active academic year first.');
      return;
    }

        // First check if plan already exists (might not be in our current data)
        const { data: existingPlan, error: checkErr } = await supabase
          .from('fee_student_plans')
          .select('id')
          .eq('student_id', student.id)
          .eq('academic_year_id', academicYearId)
        .eq('school_code', schoolCode)
        .maybeSingle();

        if (checkErr) throw checkErr;

        if (existingPlan) {
          planId = existingPlan.id;
      } else {
          // Create new plan
          const { data: ins, error: iErr } = await supabase
        .from('fee_student_plans')
            .insert({
              school_code: schoolCode,
              student_id: student.id,
              class_instance_id: selectedClassId,
              academic_year_id: academicYearId,
              created_by: profile?.auth_id
            })
            .select('id')
            .single();
          if (iErr) throw iErr;
          planId = ins.id;
    }
      }

      // Load existing items
      const { data: items, error: itemsErr } = await supabase
        .from('fee_student_plan_items')
        .select('component_type_id, amount_paise')
        .eq('plan_id', planId);
      if (itemsErr) throw itemsErr;

      setEditingStudent({
        ...student,
        planId
      });
  
      const mappedItems = (items || []).map((it: any) => ({
        component_type_id: it.component_type_id,
        amount_inr: (Number(it.amount_paise || 0) / 100)
      }));
      
      console.log('Plan items loaded:', mappedItems);
      console.log('Fee components available:', feeComponents?.length || 0);
      
      // If no items exist, add one empty item to start
      setPlanItems(mappedItems.length > 0 ? mappedItems : [{ component_type_id: null, amount_inr: 0 }]);
      setShowEditPlanModal(true);
    } catch (e: any) {
      console.error('Edit plan error:', e);
      Alert.alert('Error', e.message || 'Failed to open editor');
    }
  };

  // Handle record payment
  const handleRecordPayment = (student: any) => {
    if (!student.feeDetails?.plan) {
      Alert.alert('No Fee Plan', 'This student does not have a fee plan. Please create a fee plan first.');
      return;
    }
    
    // For now, show a simple alert. This can be enhanced with a proper payment modal later
    Alert.alert(
      'Record Payment',
      `Record payment for ${student.full_name}?\n\nTotal Due: ${formatAmount(student.feeDetails?.balance || 0)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Record Payment', 
          onPress: () => {
            // TODO: Implement payment recording logic
            Alert.alert('Success', 'Payment recorded successfully!');
          }
        }
      ]
    );
  };

  // Handle student selection
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedStudentIds.size === filteredStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  // Handle bulk actions
  const handleBulkEdit = async () => {
    if (selectedStudentIds.size === 0) return;
    
    try {
      // For bulk edit, we'll work with the first selected student's plan as a template
      const firstStudentId = Array.from(selectedStudentIds)[0];
      const student = filteredStudents.find(s => s.id === firstStudentId);
      
      if (!student) return;
      
      // Load existing plan items for the first student
      const existingPlan = student.feeDetails?.plan;
      let mappedItems: any[] = [];
      
      if (existingPlan?.items && existingPlan.items.length > 0) {
        mappedItems = existingPlan.items.map((it: any) => ({
          component_type_id: it.component_type_id,
          amount_inr: (Number(it.amount_paise || 0) / 100)
        }));
        console.log('Loaded existing plan items:', mappedItems);
      } else {
        // If no items exist, add one empty item to start
        mappedItems = [{ component_type_id: null, amount_inr: 0 }];
        console.log('No existing plan items, starting with empty item');
      }
      
      setPlanItems(mappedItems);
      setShowEditPlanModal(true);
    } catch (e: any) {
      console.error('Bulk edit error:', e);
      Alert.alert('Error', e.message || 'Failed to open editor');
    }
  };

  const handleBulkPayment = () => {
    if (selectedStudentIds.size === 0) return;
    
    // For bulk payment, we'll work with the first selected student
    const firstStudentId = Array.from(selectedStudentIds)[0];
    const student = filteredStudents.find(s => s.id === firstStudentId);
    
    if (student) {
      setSelectedStudentId(student.id);
      setSelectedStudentName(student.full_name);
      
      // Load the student's fee components for payment
      const existingPlan = student.feeDetails?.plan;
      if (existingPlan?.items && existingPlan.items.length > 0) {
        // Set the first component as default
        const firstComponent = existingPlan.items[0];
        setSelectedComponentId(firstComponent.component_type_id);
        const componentName = feeComponents?.find((c: any) => c.id === firstComponent.component_type_id)?.name || 'Unknown Component';
        setSelectedComponentName(componentName);
        
        // Calculate outstanding amount for this component
        const componentPaid = 0; // TODO: Calculate from payments
        const componentOutstanding = (firstComponent.amount_paise || 0) / 100 - componentPaid;
        setPaymentAmount(componentOutstanding > 0 ? String(componentOutstanding) : '');
      } else {
        setSelectedComponentId(null);
        setSelectedComponentName('No components available');
        setPaymentAmount('');
      }
      
      setPaymentMethod('cash');
      setReceiptNumber('');
      setRemarks('');
    }
    
    setShowPaymentModal(true);
  };

  // Add plan item
  const addPlanItem = () => {
    setShowComponentSelector(true);
  };

  // Select component and add to plan
  const selectComponent = (componentId: string) => {
    if (editingComponentIndex !== null) {
      // Update existing component
      updatePlanItem(editingComponentIndex, 'component_type_id', componentId);
      setEditingComponentIndex(null);
    } else {
      // Add new component
      setPlanItems(prev => [...prev, { component_type_id: componentId, amount_inr: 0 }]);
    }
    setShowComponentSelector(false);
  };

  // Remove plan item
  const removePlanItem = (index: number) => {
    setPlanItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update plan item
  const updatePlanItem = (index: number, field: string, value: any) => {
    setPlanItems(prev => {
      const newItems = [...prev];

      if (field === 'component_type_id' && value) {
        // Prevent duplicate components
        const already = newItems.some((it, i) => i !== index && it.component_type_id === value);
        if (already) {
          Alert.alert('Warning', 'This component is already added.');
          return prev;
        }
      }

      newItems[index] = { ...newItems[index], [field]: value };

      // Auto-set amount if component has default
      if (field === 'component_type_id' && value && feeComponents) {
        const component = feeComponents.find((c: any) => c.id === value);
        if (component?.default_amount_paise) {
          newItems[index].amount_inr = component.default_amount_paise / 100;
        }
      }
      return newItems;
    });
  };

  // Save plan
  const savePlan = async () => {
    if (!editingStudent?.planId) return;
    
    // Validate all items have component selected
    const invalidItems = planItems.filter(item => !item.component_type_id);
    if (invalidItems.length > 0) {
      Alert.alert('Error', 'Please select a component for all items');
      return;
    }

    const totalAmount = planItems.reduce((sum, item) => sum + (item.amount_inr || 0), 0);
    const componentNames = planItems.map(item => {
      const comp = feeComponents?.find((c: any) => c.id === item.component_type_id);
      return `${comp?.name || 'Unknown'}: ₹${(item.amount_inr || 0).toLocaleString('en-IN')}`;
    }).join('\n');

    Alert.alert(
      'Confirm Fee Plan',
      `Student: ${editingStudent.full_name}\n\nComponents:\n${componentNames}\n\nTotal: ₹${totalAmount.toLocaleString('en-IN')}\n\nSave this plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            setSavingPlan(true);
            try {
              // Get existing items to compare
              const { data: existing, error: existingErr } = await supabase
                .from('fee_student_plan_items')
                .select('component_type_id')
                .eq('plan_id', editingStudent.planId);
              if (existingErr) throw existingErr;

              const existingIds = new Set((existing || []).map((e: any) => e.component_type_id));
              const newIds = new Set(planItems.map(i => i.component_type_id));
    
              // Delete removed items
              const toDelete = Array.from(existingIds).filter(id => !newIds.has(id));
              if (toDelete.length > 0) {
                const { error: delErr } = await supabase
                  .from('fee_student_plan_items')
                  .delete()
                  .eq('plan_id', editingStudent.planId)
                  .in('component_type_id', toDelete);
                if (delErr) throw delErr;
    }
    
              // Upsert new/updated items
              const toUpsert = planItems.map(item => ({
                plan_id: editingStudent.planId,
                component_type_id: item.component_type_id,
                amount_paise: Math.round((item.amount_inr || 0) * 100)
              }));

              if (toUpsert.length > 0) {
                const { error: upsertErr } = await supabase
                  .from('fee_student_plan_items')
                  .upsert(toUpsert, { onConflict: 'plan_id,component_type_id' });
                if (upsertErr) throw upsertErr;
              }

              Alert.alert('Success', 'Fee plan saved successfully');
              setShowEditPlanModal(false);
              setEditingStudent(null);
              setPlanItems([]);
              
              // Refresh data
              await refreshData();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to save plan');
            } finally {
              setSavingPlan(false);
            }
          }
        }
      ]
    );
  };

  // Open class plan editor
  const openClassPlanEditor = () => {
    // Seed with components that have defaults
    const defaults = (feeComponents || [])
      .filter((c: any) => Number(c.default_amount_paise || 0) > 0)
      .map((c: any) => ({ 
        component_type_id: c.id, 
        amount_inr: Number(c.default_amount_paise) / 100 
      }));

    setClassPlanItems(defaults.length > 0 ? defaults : [{ component_type_id: null, amount_inr: 0 }]);
    setShowClassPlanModal(true);
  };

  // Add class plan item
  const addClassPlanItem = () => {
    setClassPlanItems(prev => [...prev, { component_type_id: null, amount_inr: 0 }]);
  };

  // Remove class plan item
  const removeClassPlanItem = (index: number) => {
    setClassPlanItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update class plan item
  const updateClassPlanItem = (index: number, field: string, value: any) => {
    setClassPlanItems(prev => {
      const newItems = [...prev];

      if (field === 'component_type_id' && value) {
        // Prevent duplicate components
        const already = newItems.some((it, i) => i !== index && it.component_type_id === value);
        if (already) {
          Alert.alert('Warning', 'This component is already added.');
          return prev;
        }
      }

      newItems[index] = { ...newItems[index], [field]: value };

      // Auto-set amount if component has default
      if (field === 'component_type_id' && value && feeComponents) {
        const component = feeComponents.find((c: any) => c.id === value);
        if (component?.default_amount_paise) {
          newItems[index].amount_inr = component.default_amount_paise / 100;
        }
      }
      return newItems;
    });
  };

  // Apply class plan to all students
  const applyClassPlanToAll = async () => {
    if (!classPlanItems || classPlanItems.length === 0) {
      Alert.alert('Warning', 'Add at least one component to apply.');
      return;
    }

    // Validate all items have component selected
    const invalidItems = classPlanItems.filter(item => !item.component_type_id);
    if (invalidItems.length > 0) {
      Alert.alert('Error', 'Please select a component for all items');
      return;
    }

    if (!selectedClassId) {
      Alert.alert('Error', 'Select a class first.');
        return;
      }
      
    if (!academicYearId) {
      Alert.alert('Error', 'No active academic year found. Please set up an active academic year first.');
        return;
      }
      
    if (students.length === 0) {
      Alert.alert('Info', 'No students in this class. Nothing to apply.');
      return;
    }

    // Confirm with user
    Alert.alert(
      'Apply to Whole Class',
      `This will replace existing fee plans for all ${students.length} students in ${selectedClass?.grade} ${selectedClass?.section}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          style: 'destructive',
          onPress: async () => {
            setSavingClassPlan(true);
    try {
              // 1) Ensure plans exist for all students
              const studentsWithPlans = studentsWithFeeData || [];
              const missing = students.filter(s => 
                !studentsWithPlans.find(sp => sp.id === s.id && sp.feeDetails?.plan)
              );

              let newPlans: any[] = [];
              if (missing.length > 0) {
                const toInsert = missing.map(s => ({
                  school_code: schoolCode,
                  student_id: s.id,
                  class_instance_id: selectedClassId,
                  academic_year_id: academicYearId,
                  created_by: profile?.auth_id
                }));

                const { data: inserted, error: insErr } = await supabase
        .from('fee_student_plans')
                  .insert(toInsert)
                  .select('id, student_id');
                if (insErr) throw insErr;
                newPlans = inserted || [];
              }

              // Build final plan_id list
              const existingPlans = studentsWithPlans
                .filter(s => s.feeDetails?.plan)
                .map(s => ({ id: s.feeDetails.plan.id, student_id: s.id }));
              const allPlans = [...existingPlans, ...newPlans];
              const planIds = allPlans.map(p => p.id);
      
              if (planIds.length === 0) {
                Alert.alert('Info', 'No plans to update.');
        return;
      }
      
              // 2) Delete existing items for these plans
              const { error: delErr } = await supabase
                .from('fee_student_plan_items')
                .delete()
                .in('plan_id', planIds);
              if (delErr) throw delErr;

              // 3) Insert new items for each plan
              const baseItems = classPlanItems.map(i => ({
                component_type_id: i.component_type_id,
                amount_paise: Math.round((i.amount_inr || 0) * 100)
              }));

              const allItems = planIds.flatMap(planId =>
                baseItems.map(item => ({
                  plan_id: planId,
                  ...item
                }))
              );

              const { error: insertErr } = await supabase
                .from('fee_student_plan_items')
                .insert(allItems);
              if (insertErr) throw insertErr;

              Alert.alert('Success', `Fee plan applied to all ${students.length} students successfully!`);
              setShowClassPlanModal(false);
              setClassPlanItems([]);
              
              // Refresh data
              await refreshData();
            } catch (e: any) {
              console.error('Apply class plan error:', e);
              Alert.alert('Error', e.message || 'Failed to apply class plan');
    } finally {
              setSavingClassPlan(false);
    }
          }
        }
      ]
    );
  };


  if (!selectedClassId) {
    return (
      <View style={styles.emptyContainer}>
        <Users size={48} color={colors.text.tertiary} />
        <Text style={styles.emptyText}>Select a class to view fee management</Text>
        <Button 
          mode="contained" 
          onPress={() => setShowClassSelector(true)}
          style={styles.selectClassButton}
        >
          Select Class
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Clean Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.classSelectorButton} onPress={() => setShowClassSelector(true)}>
          <Users size={20} color={colors.primary[600]} />
          <Text style={styles.classSelectorText}>
            {selectedClass ? `${selectedClass.grade} ${selectedClass.section}` : 'Select Class'}
            </Text>
          <ChevronDown size={16} color={colors.text.tertiary} />
      </TouchableOpacity>

        {selectedClass && (
          <TouchableOpacity style={styles.classPlanButton} onPress={openClassPlanEditor}>
            <Users size={16} color={colors.surface.primary} />
            <Text style={styles.classPlanText}>Class Plan</Text>
          </TouchableOpacity>
        )}
      </View>

        {/* Search Bar */}
      {selectedClass && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={colors.text.secondary} />
            <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            value={searchQuery}
              onChangeText={setSearchQuery}
          />
        </View>
      <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
      >
            <Filter size={20} color={colors.text.secondary} />
            {filter !== 'all' && <View style={styles.filterBadge} />}
                  </TouchableOpacity>
              </View>
            )}

      {/* Students List */}
      <ScrollView 
        style={styles.studentsList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshData} />
        }
      >
        {(studentsLoading || feesLoading) ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading students...</Text>
            </View>
        ) : filteredStudents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        ) : (
          <View style={styles.studentsList}>
            {/* Bulk Actions Header */}
            {selectedStudentIds.size > 0 && (
              <View style={styles.bulkActionsHeader}>
                <View style={styles.bulkActions}>
                  <TouchableOpacity style={styles.bulkButton} onPress={handleBulkEdit}>
                    <Edit size={14} color={colors.primary[600]} />
                    <Text style={styles.bulkButtonText}>Edit ({selectedStudentIds.size})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.bulkButton} onPress={handleBulkPayment}>
                    <CreditCard size={14} color={colors.success[600]} />
                    <Text style={styles.bulkButtonText}>Record ({selectedStudentIds.size})</Text>
                  </TouchableOpacity>
                </View>
                  </View>
            )}

            {/* Column Headers */}
            <View style={styles.columnHeaders}>
              <View style={styles.studentColumn}>
                <Text style={styles.studentColumnHeader}>Student</Text>
          </View>
              <View style={styles.amountsColumn}>
                <Text style={styles.columnHeaderText}>Total Fee</Text>
                <Text style={styles.columnHeaderText}>Outstanding</Text>
        </View>
          </View>

            {/* Clean Student List */}
            {filteredStudents.map((student) => {
              const totalDue = student.feeDetails?.totalDue || 0;
              const totalPaid = student.feeDetails?.totalPaid || 0;
              const balance = student.feeDetails?.balance || 0;
              const percentage = totalDue > 0 ? Math.min(100, Math.round((totalPaid / totalDue) * 100)) : 0;
              const hasPlan = student.feeDetails?.plan !== null;
              const isSelected = selectedStudentIds.has(student.id);

  return (
          <TouchableOpacity
                  key={student.id} 
                  style={[styles.studentRow, isSelected && styles.studentRowSelected]}
                  onPress={() => toggleStudentSelection(student.id)}
                >
                  <View style={styles.studentMain}>
                    <Text style={styles.studentName}>{student.full_name}</Text>
                    <Text style={styles.studentCode}>{student.student_code}</Text>
          </View>
                  
                  <View style={styles.studentAmounts}>
                    {/* Actual fee (total assigned) */}
                    <Text style={styles.amountText}>{formatAmount(totalDue)}</Text>
                    {/* Outstanding/Due */}
                    <Text style={styles.outstandingAmount}>
                      {formatAmount(balance)}
            </Text>
          </View>
          </TouchableOpacity>
              );
            })}
          </View>
        )}
        </ScrollView>

      {/* Payment Modal */}
      <Portal>
        {showPaymentModal && (
          <PaperModal 
            visible={showPaymentModal} 
            onDismiss={() => setShowPaymentModal(false)}
            contentContainerStyle={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Collect Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <X size={24} color={colors.text.secondary} />
          </TouchableOpacity>
      </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.studentInfoText}>
                Recording payment for {selectedStudentName}
            </Text>

              {/* Components Table */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Components</Text>
                {(() => {
                  const student = filteredStudents.find(s => s.id === selectedStudentId);
                  const existingPlan = student?.feeDetails?.plan;
                  
                  if (!existingPlan?.items || existingPlan.items.length === 0) {
                    return (
                      <View style={styles.noComponentsContainer}>
                        <Text style={styles.noComponentsText}>No fee components available</Text>
          </View>
                    );
                  }
                  
                  return (
                    <View style={styles.componentsTable}>
                      {/* Table Header */}
                      <View style={styles.tableHeader}>
                        <Text style={styles.tableHeaderText}>Select</Text>
                        <Text style={styles.tableHeaderText}>Component</Text>
                        <Text style={styles.tableHeaderText}>Outstanding Amount</Text>
                        <Text style={styles.tableHeaderText}>Mode</Text>
                        <Text style={styles.tableHeaderText}>Amount (₹)</Text>
        </View>
                      
                      {/* Table Rows */}
                      {existingPlan.items.map((item: any, index: number) => {
                        const componentName = feeComponents?.find((c: any) => c.id === item.component_type_id)?.name || 'Unknown Component';
                        const componentAmount = (item.amount_paise || 0) / 100;
                        const isSelected = selectedComponentId === item.component_type_id;
                        
                        return (
                          <View key={item.component_type_id} style={styles.tableRow}>
          <TouchableOpacity
                              style={styles.checkbox}
                              onPress={() => {
                                if (isSelected) {
                                  setSelectedComponentId(null);
                                  setSelectedComponentName('');
                                  setPaymentAmount('');
                                } else {
                                  setSelectedComponentId(item.component_type_id);
                                  setSelectedComponentName(componentName);
                                  setPaymentAmount(String(componentAmount));
                                }
                              }}
                            >
                              {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
                            
                            <Text style={styles.tableComponentName}>{componentName}</Text>
                            
                            <Text style={styles.tableOutstandingAmount}>₹{componentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                            
                            <View style={styles.modeContainer}>
                              <Text style={styles.modeText}>Full</Text>
                            </View>
                            
                            <TextInput
                              style={styles.amountInput}
                              value={isSelected ? paymentAmount : ''}
                              onChangeText={(text) => {
                                if (isSelected) {
                                  setPaymentAmount(text);
                                }
                              }}
                              keyboardType="numeric"
                              placeholder="0.00"
                              editable={isSelected}
          />
        </View>
                        );
                      })}
                    </View>
                  );
                })()}
      </View>

              {/* Component Breakdown */}
              {(() => {
                const student = filteredStudents.find(s => s.id === selectedStudentId);
                const existingPlan = student?.feeDetails?.plan;
                if (!existingPlan?.items || existingPlan.items.length === 0) return null;
                const planTotalPaise = existingPlan.items.reduce((sum: number, it: any) => sum + (it.amount_paise || 0), 0);
                return (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Component breakdown</Text>
                    <View style={styles.breakdownCard}>
                      {existingPlan.items.map((it: any) => {
                        const name = feeComponents?.find((c: any) => c.id === it.component_type_id)?.name || 'Component';
                        const amt = (it.amount_paise || 0);
                        return (
                          <View key={it.component_type_id} style={styles.breakdownRow}>
                            <Text style={styles.breakdownName} numberOfLines={1}>{name}</Text>
                            <Text style={styles.breakdownAmount}>{formatAmount(amt)}</Text>
                          </View>
                        );
                      })}
                      <View style={styles.breakdownDivider} />
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownTotalLabel}>Total</Text>
                        <Text style={styles.breakdownTotalAmount}>{formatAmount(planTotalPaise)}</Text>
                      </View>
                    </View>
                  </View>
                );
              })()}

              {/* Payment Details */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Details</Text>
                
                <View style={styles.paymentDetailsRow}>
                  <Text style={styles.paymentLabel}>Payment Date *</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Calendar size={16} color={colors.text.secondary} />
                    <Text style={styles.datePickerText}>
                      {format(paymentDate, 'MMM dd, yyyy')}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.paymentDetailsRow}>
                  <Text style={styles.paymentLabel}>Payment Method *</Text>
                  <View style={styles.paymentMethodContainer}>
                    {['Cash', 'Cheque', 'Online', 'Card'].map((method) => (
                  <TouchableOpacity
                        key={method}
                        style={[
                          styles.paymentMethodOption,
                          paymentMethod === method.toLowerCase() && styles.paymentMethodOptionSelected
                        ]}
                        onPress={() => setPaymentMethod(method.toLowerCase())}
                      >
                        <Text style={[
                          styles.paymentMethodText,
                          paymentMethod === method.toLowerCase() && styles.paymentMethodTextSelected
                        ]}>
                          {method}
                      </Text>
                  </TouchableOpacity>
                    ))}
          </View>
      </View>

                <View style={styles.paymentDetailsRow}>
                  <Text style={styles.paymentLabel}>Transaction ID</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Optional transaction ID"
                    value={receiptNumber}
                    onChangeText={setReceiptNumber}
                  />
          </View>
                
                <View style={styles.paymentDetailsRow}>
                  <Text style={styles.paymentLabel}>Remarks</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Optional remarks"
                    value={remarks}
                    onChangeText={setRemarks}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            </ScrollView>


            <View style={styles.modalActions}>
              <Button onPress={() => setShowPaymentModal(false)}>Cancel</Button>
              <Button
                mode="contained"
                onPress={handleSubmitPayment}
                disabled={!paymentAmount}
              >
                Record Payment
              </Button>
          </View>
          </PaperModal>
        )}
      </Portal>


      {/* Class Plan Modal */}
      <Portal>
        <PaperModal
          visible={showClassPlanModal}
          onDismiss={() => {
            setShowClassPlanModal(false);
            setClassPlanItems([]);
          }}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Class Plan - Apply to All Students</Text>
            <TouchableOpacity onPress={() => {
              setShowClassPlanModal(false);
              setClassPlanItems([]);
            }}>
              <X size={24} color={colors.text.primary} />
              </TouchableOpacity>
          </View>

          <Text style={styles.classPlanDescription}>
            Apply to all {students.length} students in {selectedClass?.grade} {selectedClass?.section}
            </Text>

          <ScrollView style={styles.modalBody}>
            {classPlanItems.length === 0 ? (
              <Text style={styles.emptyText}>No components added</Text>
            ) : (
              <>
                {/* Total Summary */}
                <View style={styles.totalSummary}>
                  <Text style={styles.totalLabel}>Total: ₹{classPlanItems.reduce((sum, item) => sum + (item.amount_inr || 0), 0).toLocaleString('en-IN')}</Text>
              </View>

                {/* Individual Component Cards */}
                {classPlanItems.map((item, index) => (
                  <View key={index} style={styles.componentCard}>
                    <View style={styles.componentCardContent}>
                      <View style={styles.componentInputRow}>
                        <View style={styles.componentTypeContainer}>
                          {item.component_type_id ? (
                            <Text style={styles.selectedComponentName}>
                              {feeComponents?.find((c: any) => c.id === item.component_type_id)?.name || 'Unknown Component'}
                            </Text>
                          ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                              {feeComponents && feeComponents.length > 0 ? (
                                feeComponents.map((comp: any) => (
                  <TouchableOpacity
                                    key={comp.id}
                                    style={styles.componentChip}
                                    onPress={() => updateClassPlanItem(index, 'component_type_id', comp.id)}
                                  >
                                    <Text style={styles.componentChipText}>
                                      {comp.name}
                      </Text>
                  </TouchableOpacity>
                                ))
                              ) : (
                                <Text style={styles.noComponentsText}>No components available</Text>
                              )}
              </ScrollView>
            )}
            </View>

                        <View style={styles.amountContainer}>
                          <View style={styles.amountInputWrapper}>
                            <Text style={styles.currencySymbol}>₹</Text>
                            <TextInput
                              style={styles.amountInput}
                              value={item.amount_inr ? String(item.amount_inr) : '0'}
                              onChangeText={(text) => {
                                const numValue = parseFloat(text) || 0;
                                updateClassPlanItem(index, 'amount_inr', numValue);
                              }}
                              keyboardType="numeric"
                              placeholder="0"
          />
        </View>
      </View>

              <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => removeClassPlanItem(index)}
                          disabled={classPlanItems.length <= 1}
              >
                          <Trash2 size={18} color={classPlanItems.length <= 1 ? colors.neutral[400] : colors.error[600]} />
              </TouchableOpacity>
            </View>
                    </View>
                  </View>
                ))}
              </>
            )}

            </ScrollView>

          <View style={styles.modalFooter}>
              <TouchableOpacity
              style={styles.addComponentButton}
              onPress={addClassPlanItem}
              >
              <Plus size={20} color={colors.primary[600]} />
              <Text style={styles.addComponentText}>+ Add Component</Text>
              </TouchableOpacity>
              <Button
                mode="contained"
              onPress={applyClassPlanToAll}
              loading={savingClassPlan}
              disabled={savingClassPlan || classPlanItems.length === 0}
              style={styles.modalButton}
            >
              Apply to Class
              </Button>
            </View>
        </PaperModal>
      </Portal>

      {/* Filter Modal */}
      <Portal>
        <PaperModal
          visible={showFilterModal}
          onDismiss={() => setShowFilterModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Students</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterModalContainer}>
            {[
              { key: 'all', label: 'All Students' },
              { key: 'has_plan', label: 'Has Fee Plan' },
              { key: 'no_plan', label: 'No Fee Plan' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterOption,
                  filter === option.key && styles.filterOptionActive
                ]}
                onPress={() => {
                  setFilter(option.key as FilterType);
                  setShowFilterModal(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  filter === option.key && styles.filterOptionTextActive
                ]}>
                  {option.label}
            </Text>
                {filter === option.key && (
                  <Check size={20} color={colors.surface.primary} />
                )}
              </TouchableOpacity>
            ))}
              </View>
        </PaperModal>
      </Portal>

      {/* Class Selector Modal */}
      <Portal>
        <PaperModal
        visible={showClassSelector}
          onDismiss={() => setShowClassSelector(false)}
          contentContainerStyle={styles.modalContent}
      >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Class</Text>
            <TouchableOpacity onPress={() => setShowClassSelector(false)}>
              <X size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
          
          <View style={styles.classListContainer}>
            {classes.length === 0 ? (
              <Text style={styles.emptyText}>No classes found</Text>
            ) : (
              <ScrollView>
                {classes.map((classItem: any) => (
                  <TouchableOpacity
                    key={classItem.id}
                    style={[
                      styles.classOption,
                      selectedClass?.id === classItem.id && styles.classOptionActive
                    ]}
                  onPress={() => {
                      setSelectedClass(classItem);
                    setShowClassSelector(false);
                  }}
                >
                    <Text style={[
                      styles.classOptionText,
                      selectedClass?.id === classItem.id && styles.classOptionTextActive
                    ]}>
                      {classItem.grade} {classItem.section}
                      </Text>
                    {selectedClass?.id === classItem.id && (
                      <Check size={20} color={colors.surface.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            </View>
        </PaperModal>
      </Portal>

      {/* Edit Plan Modal */}
      <Portal>
        <PaperModal
          visible={showEditPlanModal}
          onDismiss={() => {
            setShowEditPlanModal(false);
            setPlanItems([]);
            setEditingStudent(null);
          }}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
             <Text style={styles.modalTitle}>Edit Fee - {editingStudent?.full_name}</Text>
            <TouchableOpacity onPress={() => {
              setShowEditPlanModal(false);
              setPlanItems([]);
              setEditingStudent(null);
            }}>
              <X size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

          <ScrollView style={styles.modalBody}>
            {/* Total Summary */}
            <View style={styles.totalSummary}>
              <Text style={styles.totalLabel}>Total: ₹{planItems.reduce((sum, item) => sum + (item.amount_inr || 0), 0).toLocaleString('en-IN')}</Text>
                    </View>

            {/* Existing Components */}
            {planItems.map((item, index) => (
              <View key={index} style={styles.componentRow}>
                <View style={styles.componentInfo}>
                  <Text style={styles.planComponentName}>
                    {item.component_type_id 
                      ? (feeComponents?.find((c: any) => c.id === item.component_type_id)?.name || 'Unknown Component')
                      : 'Select Component'
                    }
                      </Text>
                  <Text style={styles.componentAmount}>
                    ₹{(item.amount_inr || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                
                <View style={styles.componentActions}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => {
                      if (item.component_type_id) {
                        // Show component selector to change
                        setShowComponentSelector(true);
                        setEditingComponentIndex(index);
                      } else {
                        // Show component selector to select
                        setShowComponentSelector(true);
                        setEditingComponentIndex(index);
                      }
                    }}
                  >
                    <Text style={styles.editButtonText}>
                      {item.component_type_id ? 'Change' : 'Select'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removePlanItem(index)}
                    disabled={planItems.length <= 1}
                  >
                    <Trash2 size={16} color={planItems.length <= 1 ? colors.neutral[400] : colors.error[600]} />
                  </TouchableOpacity>
                    </View>
                  </View>
                ))}

            </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.addComponentButton}
              onPress={addPlanItem}
            >
              <Plus size={20} color={colors.primary[600]} />
              <Text style={styles.addComponentText}>+ Add Component</Text>
            </TouchableOpacity>
              <Button
                mode="contained"
              onPress={savePlan}
              loading={savingPlan}
              disabled={savingPlan || planItems.length === 0}
              style={styles.modalButton}
              >
              Save Plan
              </Button>
            </View>
        </PaperModal>
      </Portal>

      {/* Component Selector Modal */}
      <Portal>
        <PaperModal
          visible={showComponentSelector}
          onDismiss={() => setShowComponentSelector(false)}
          contentContainerStyle={styles.modalContent}
        >
            <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Component</Text>
            <TouchableOpacity onPress={() => setShowComponentSelector(false)}>
              <X size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.componentSelectorDescription}>
              Choose a fee component to add to the plan
            </Text>

            {/* Component search */}
            <View style={{ marginBottom: spacing.sm }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border.DEFAULT,
                paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
              }}>
                <Search size={18} color={colors.text.secondary} />
                <TextInput
                  style={{ flex: 1, marginLeft: spacing.sm, color: colors.text.primary }}
                  placeholder="Search components..."
                  value={componentSearch}
                  onChangeText={setComponentSearch}
                />
              </View>
            </View>

            {feeComponents && feeComponents.length > 0 ? (
              feeComponents
                .filter((comp: any) => !componentSearch || (comp.name || '').toLowerCase().includes(componentSearch.toLowerCase()))
                .map((comp: any) => (
                <TouchableOpacity
                  key={comp.id}
                  style={styles.componentOption}
                  onPress={() => selectComponent(comp.id)}
                >
                  <View style={styles.componentOptionContent}>
                    <Text style={styles.componentOptionName}>{comp.name}</Text>
                    {comp.default_amount_paise && (
                      <Text style={styles.componentOptionAmount}>
                        ₹{(comp.default_amount_paise / 100).toLocaleString('en-IN')}
                  </Text>
                    )}
                  </View>
                  <ChevronRight size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noComponentsContainer}>
                <Text style={styles.noComponentsText}>No components available</Text>
              </View>
            )}
            </ScrollView>
        </PaperModal>
      </Portal>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        onDismiss={() => setShowDatePicker(false)}
        onConfirm={(date) => {
          setPaymentDate(date);
          setShowDatePicker(false);
        }}
        initialDate={paymentDate}
        minimumDate={new Date(2020, 0, 1)}
        maximumDate={new Date(2030, 11, 31)}
        title="Select Payment Date"
      />
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.md,
    textAlign: 'center' as const,
  },
  selectClassButton: {
    marginTop: spacing.lg,
  },
  topBar: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  classSelectorButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    flex: 1,
    marginRight: spacing.md,
  },
  classSelectorText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  classPlanButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  classPlanText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.surface.primary,
    marginLeft: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.primary,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
  },
  filterButton: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    position: 'relative' as const,
  },
  filterBadge: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[600],
  },
  filterModalContainer: {
    padding: spacing.lg,
  },
  filterOption: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
  },
  filterOptionActive: {
    backgroundColor: colors.primary[600],
  },
  filterOptionText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  filterOptionTextActive: {
    color: colors.surface.primary,
    fontWeight: '600' as const,
  },
  classListContainer: {
    padding: spacing.lg,
    maxHeight: 400,
  },
  classOption: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
  },
  classOptionActive: {
    backgroundColor: colors.primary[600],
  },
  classOptionText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  classOptionTextActive: {
    color: colors.surface.primary,
    fontWeight: '600' as const,
  },
  studentActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.surface.primary,
    marginLeft: spacing.xs,
  },
  feeStatusContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  feeStatusItem: {
    alignItems: 'center' as const,
  },
  feeStatusLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  feeStatusValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text.primary,
  },
  paidAmount: {
    color: colors.success[600],
  },
  dueAmount: {
    color: colors.error[600],
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressText: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center' as const,
  },
  classPlanContainer: {
    padding: spacing.lg,
  },
  componentList: {
    marginBottom: spacing.lg,
  },
  componentListTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  componentItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  componentName: {
    fontSize: 14,
    color: colors.text.primary,
  },
  modalButton: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  
  modalContent: {
    backgroundColor: colors.surface.primary,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: 600,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text.primary,
  },
  totalSummary: {
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.primary[700],
    textAlign: 'center' as const,
  },
  classPlanDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    padding: spacing.md,
    backgroundColor: colors.warning[50],
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  modalBody: {
    minHeight: 150,
    maxHeight: 500,
    paddingVertical: spacing.sm,
  },
  modalFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'stretch' as const,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  studentInfoText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  componentInfoText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  inputHint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    fontStyle: 'italic' as const,
  },
  textInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  paymentMethodContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
  },
  paymentMethodOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  paymentMethodOptionSelected: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[600],
  },
  paymentMethodText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  paymentMethodTextSelected: {
    color: colors.primary[700],
    fontWeight: '600' as const,
  },
  modalActions: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  editPlanButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    flex: 1,
    minHeight: 40,
  },
  editPlanButtonText: {
    marginLeft: spacing.xs,
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.primary[600],
  },
  actionButtonsContainer: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  recordPaymentButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.success[50],
    borderRadius: borderRadius.md,
    flex: 1,
    minHeight: 40,
  },
  recordPaymentButtonText: {
    marginLeft: spacing.xs,
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.success[600],
  },
  addItemButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: spacing.md,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  addItemButtonText: {
    marginLeft: spacing.xs,
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.surface.primary,
  },
  addComponentButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    minHeight: 32,
    flex: 1,
  },
  addComponentText: {
    marginLeft: spacing.xs,
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.text.primary,
  },
  componentCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.xs,
  },
  componentCardContent: {
    padding: spacing.sm,
  },
  componentInputRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  componentTypeContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  selectedComponentContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    flex: 1,
  },
  selectedComponentName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text.primary,
    paddingVertical: spacing.xs,
    flex: 1,
  },
  changeComponentButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  changeComponentText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.primary[600],
  },
  componentRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  componentInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  planComponentName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  componentAmount: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text.secondary,
  },
  componentActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  editButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.sm,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.primary[600],
  },
  amountContainer: {
    flex: 1,
  },
  amountInputWrapper: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface.primary,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text.primary,
    marginRight: spacing.xs,
  },
  amountInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
  },
  deleteButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.error[50],
    marginLeft: spacing.sm,
    alignSelf: 'center' as const,
  },
  planItemRow: {
    marginBottom: spacing.sm,
  },
  planItemLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  pickerContainer: {
    marginTop: spacing.xs,
  },
  componentChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  componentChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  componentChipText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  componentChipTextActive: {
    color: colors.surface.primary,
    fontWeight: '600' as const,
  },
  noComponentsText: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontStyle: 'italic' as const,
  },
  planItemInput: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
  },
  removeItemButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
    alignSelf: 'flex-start' as const,
  },
  componentSelectorDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textAlign: 'center' as const,
  },
  componentOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  componentOptionContent: {
    flex: 1,
  },
  componentOptionName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  componentOptionAmount: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  componentOptionSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    borderWidth: 2,
  },
  selectedText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary[600],
  },
  componentsTable: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    overflow: 'hidden' as const,
  },
  tableHeader: {
    flexDirection: 'row' as const,
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text.secondary,
    flex: 1,
    textAlign: 'center' as const,
  },
  tableRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: 4,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing.sm,
  },
  checkmark: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '600' as const,
  },
  tableComponentName: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 2,
    marginRight: spacing.sm,
  },
  tableOutstandingAmount: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1.5,
    textAlign: 'right' as const,
    marginRight: spacing.sm,
  },
  modeContainer: {
    flex: 1,
    alignItems: 'center' as const,
    marginRight: spacing.sm,
  },
  modeText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  paymentDetailsRow: {
    marginBottom: spacing.md,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  datePickerText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  noComponentsContainer: {
    alignItems: 'center' as const,
    paddingVertical: spacing.xl,
  },
  breakdownCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.xs,
  },
  breakdownName: {
    fontSize: 13,
    color: colors.text.secondary,
    flex: 1,
    paddingRight: spacing.sm,
  },
  breakdownAmount: {
    fontSize: 13,
    color: colors.text.primary,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.xs,
  },
  breakdownTotalLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text.primary,
  },
  breakdownTotalAmount: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text.primary,
  },
  // Ultra Clean Styles
  studentsList: {
    padding: spacing.sm,
    backgroundColor: colors.background.primary,
  },
  bulkActionsHeader: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  bulkActions: {
    flexDirection: 'row' as const,
    gap: spacing.xs,
  },
  bulkButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.sm,
  },
  bulkButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.primary[600],
    marginLeft: spacing.xs,
  },
  columnHeaders: {
    flexDirection: 'row' as const,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary[50],
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[200],
    alignItems: 'center' as const,
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  studentColumn: {
    flex: 1,
    marginRight: spacing.sm,
  },
  amountsColumn: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
    marginRight: spacing.sm,
    alignItems: 'center' as const,
  },
  columnHeaderText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.primary[700],
    textAlign: 'right' as const,
    minWidth: 80,
    letterSpacing: 0.5,
  },
  studentColumnHeader: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.primary[700],
    textAlign: 'left' as const,
    letterSpacing: 0.5,
  },
  studentRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    minHeight: 56,
    backgroundColor: colors.surface.primary,
    marginHorizontal: spacing.xs,
    marginVertical: 2,
    borderRadius: borderRadius.sm,
    shadowColor: colors.neutral[200],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  studentRowSelected: {
    backgroundColor: colors.primary[25],
    borderColor: colors.primary[200],
    borderWidth: 1,
    shadowColor: colors.primary[200],
    shadowOpacity: 0.15,
  },
  studentMain: {
    flex: 1,
    marginRight: spacing.sm,
    justifyContent: 'center' as const,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text.primary,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  studentCode: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
  },
  studentAmounts: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text.primary,
    minWidth: 80,
    textAlign: 'right' as const,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  outstandingAmount: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.error[600],
    minWidth: 80,
    textAlign: 'right' as const,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  studentStatus: {
    marginRight: spacing.xs,
    justifyContent: 'center' as const,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  noPlanText: {
    fontSize: 12,
    color: colors.text.tertiary,
    lineHeight: 16,
  },
};