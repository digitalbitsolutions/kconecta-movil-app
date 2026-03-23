import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../ui';

export default function PropertyChips({ items = [] }) {
  const safeItems = Array.isArray(items) ? items.filter((item) => item?.value) : [];
  if (!safeItems.length) return null;

  return (
    <View style={styles.wrap}>
      {safeItems.map((item) => (
        <View key={item.key || `${item.label}-${item.value}`} style={styles.chip}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
});
