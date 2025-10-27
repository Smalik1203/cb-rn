import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Button, Portal, Modal } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../lib/design-system';

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  style?: any;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateChange,
  minimumDate,
  maximumDate,
  disabled = false,
  style,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      onDateChange(selectedDate);
    }
  };

  const handleConfirm = () => {
    setShowPicker(false);
  };

  return (
    <View style={[styles.container, style]}>
      <Button
        mode="outlined"
        onPress={() => setShowPicker(true)}
        disabled={disabled}
        style={styles.button}
        contentStyle={styles.buttonContent}
        icon={() => <Calendar size={20} color={colors.primary[500]} />}
      >
        <Text style={styles.buttonText}>{formatDisplayDate(selectedDate)}</Text>
      </Button>

      {showPicker && (
        <Portal>
          <Modal
            visible={showPicker}
            onDismiss={() => setShowPicker(false)}
            contentContainerStyle={styles.modal}
          >
            <Text variant="titleLarge" style={styles.modalTitle}>Select Date</Text>
            
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              style={styles.picker}
            />

            {Platform.OS === 'ios' && (
              <View style={styles.modalActions}>
                <Button mode="outlined" onPress={() => setShowPicker(false)} style={styles.modalButton}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={handleConfirm} style={styles.modalButton} buttonColor={colors.primary[500]}>
                  Confirm
                </Button>
              </View>
            )}
          </Modal>
        </Portal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    borderColor: colors.neutral[300],
    borderRadius: borderRadius.lg,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing['2'],
    paddingHorizontal: spacing['3'],
  },
  buttonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing['2'],
  },
  modal: {
    backgroundColor: colors.surface.primary,
    padding: spacing['6'],
    margin: spacing['4'],
    borderRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: spacing['4'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  picker: {
    alignSelf: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing['3'],
    marginTop: spacing['4'],
  },
  modalButton: {
    flex: 1,
  },
});
