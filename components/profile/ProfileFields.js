import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../components/ui';

export const ProfileField = ({ label, value }) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value || '-'}</Text>
  </View>
);

const styles = StyleSheet.create({
  fieldRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
  },
  fieldLabel: {
    color: colors.textMuted,
    ...typography.captionStrong,
  },
  fieldValue: {
    marginTop: 4,
    color: colors.textPrimary,
    ...typography.h3,
  },
});
