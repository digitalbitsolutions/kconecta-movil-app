import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, SectionHeader, colors, radius, spacing, typography } from '../../ui';

export default function PropertyEquipment({ title = 'Equipamientos', subtitle, items = [] }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!safeItems.length) return null;

  return (
    <Card>
      <SectionHeader title={title} subtitle={subtitle} />
      <View style={styles.list}>
        {safeItems.map((item) => (
          <View key={item} style={styles.row}>
            <View style={styles.bullet} />
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bullet: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  itemText: {
    flex: 1,
    ...typography.body,
    color: colors.textSoft,
  },
});
