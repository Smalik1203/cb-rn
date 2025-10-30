import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Button, Portal, Modal } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, typography, spacing, borderRadius } from '../../../lib/design-system';

interface DatePickerModalProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (date: Date) => void;
  initialDate?: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  title?: string;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onDismiss,
  onConfirm,
  initialDate = new Date(),
  minimumDate = new Date(2020, 0, 1),
  maximumDate = new Date(2030, 11, 31),
  title = '',
}) => {
  const [tempDate, setTempDate] = useState<Date>(initialDate);

  // Update tempDate when modal opens
  useEffect(() => {
    if (visible) {
      setTempDate(initialDate);
    }
  }, [visible, initialDate]);

  const handleConfirm = () => {
    onConfirm(tempDate);
  };

  const handleCancel = () => {
    setTempDate(initialDate); // Reset to original date
    onDismiss();
  };

  // Android date picker
  if (Platform.OS === 'android' && visible) {
    return (
      <DateTimePicker
        value={tempDate}
        mode="date"
        display="default"
        onChange={(event, selectedDate) => {
          onDismiss();
          if (selectedDate) {
            onConfirm(selectedDate);
          }
        }}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
      />
    );
  }

  // iOS date picker modal
  if (Platform.OS === 'ios') {
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={handleCancel}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.container}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setTempDate(selectedDate);
                }
              }}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
            />
            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={handleCancel}
                style={styles.button}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleConfirm}
                style={styles.button}
              >
                Done
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: colors.surface.primary,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  container: {
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
  },
});
