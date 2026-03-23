import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card as UiCard, colors, typography, spacing } from '../../components/ui';

export const UserCard = ({ user }) => (
  <UiCard style={styles.rowCard}>
    <View style={styles.textContainer}>
      <Text style={styles.rowName}>{user.displayName}</Text>
      <Text style={styles.rowMeta}>ID: {user.userId}</Text>
    </View>
    <View style={styles.countContainer}>
      <Text style={styles.rowCount}>{user.propertiesCount}</Text>
      <Text style={styles.countLabel}>inmuebles</Text>
    </View>
  </UiCard>
);

export const UsersSummary = ({ totalUsers, totalProperties }) => (
  <UiCard style={styles.summaryCard}>
    <View style={styles.kpiItem}>
      <Text style={styles.kpiValue}>{totalUsers}</Text>
      <Text style={styles.kpiLabel}>Usuarios con inmuebles</Text>
    </View>
    <View style={styles.kpiItem}>
      <Text style={styles.kpiValue}>{totalProperties}</Text>
      <Text style={styles.kpiLabel}>Total de inmuebles</Text>
    </View>
  </UiCard>
);

const styles = StyleSheet.create({
  rowCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  rowName: {
    color: colors.textPrimary,
    ...typography.bodyStrong,
  },
  rowMeta: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: 2,
  },
  countContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rowCount: {
    color: colors.primary,
    ...typography.h1,
    lineHeight: 32,
  },
  countLabel: {
    color: colors.textMuted,
    ...typography.label,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  summaryCard: {
    marginBottom: spacing.md,
    flexDirection: 'row',
  },
  kpiItem: {
    flex: 1,
  },
  kpiValue: {
    color: colors.textPrimary,
    ...typography.h1,
  },
  kpiLabel: {
    marginTop: 4,
    color: colors.textMuted,
    ...typography.captionStrong,
  },
});
