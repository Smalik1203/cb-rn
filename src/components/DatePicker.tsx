import React, { useState, forwardRef, useImperativeHandle } from 'react';
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
  const [tempDate, setTempDate] = useState(selectedDate);

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selectedDate) {
        onDateChange(selectedDate);
      }
    } else {
      // iOS - just update temp date, don't call onDateChange yet
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    onDateChange(tempDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setTempDate(selectedDate); // Reset to original date
    setShowPicker(false);
  };

  const openPicker = () => {
    setTempDate(selectedDate); // Initialize temp date
    setShowPicker(true);
  };

  return (
    <View style={[styles.container, style]}>
      <Button
        mode="outlined"
        onPress={openPicker}
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
            onDismiss={handleCancel}
            contentContainerStyle={styles.modal}
          >
            <Text variant="titleLarge" style={styles.modalTitle}>Select Date</Text>
            
            <DateTimePicker
              value={tempDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              style={styles.picker}
            />

            {Platform.OS === 'ios' && (
              <View style={styles.modalActions}>
                <Button mode="outlined" onPress={handleCancel} style={styles.modalButton}>
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
    borderColor: colors.border.DEFAULT,
    borderRadius: borderRadius.sm,
    backgroundColor: 'transparent',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  buttonText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.md,
  },
  modal: {
    backgroundColor: colors.surface.primary,
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    maxHeight: '70%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
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
