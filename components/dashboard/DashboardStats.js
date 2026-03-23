import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card as UiCard, colors, typography, radius, spacing } from '../../components/ui';
import { formatNumber, parseNumber } from '../../utils/dataMappers';

export const DISTRIBUTION_COLORS = [
  colors.accent,
  colors.primary,
  colors.warning,
  colors.danger,
  colors.accentStrong,
  colors.textMuted,
];

export const StatsCard = ({ label, value, accent }) => (
  <UiCard style={styles.metricCard}>
    <View style={[styles.metricAccent, { backgroundColor: accent }]} />
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{formatNumber(value)}</Text>
  </UiCard>
);

export const DistributionRow = ({ label, value, max, color }) => {
  const safeMax = Math.max(max, 1);
  const widthPercent = `${Math.max(8, (parseNumber(value) / safeMax) * 100)}%`;

  return (
    <View style={styles.distributionRow}>
      <View style={styles.distributionHeader}>
        <View style={styles.distributionLabelWrap}>
          <View style={[styles.legendDot, { backgroundColor: color }]} />
          <Text style={styles.distributionLabel}>{label}</Text>
        </View>
        <Text style={styles.distributionValue}>{formatNumber(value)}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: widthPercent, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  metricCard: {
    padding: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    minWidth: 210,
    flexGrow: 1,
  },
  metricAccent: { 
    width: spacing.md, 
    height: spacing.md, 
    borderRadius: radius.full, 
    marginBottom: spacing.sm 
  },
  metricLabel: { color: colors.textMuted, ...typography.captionStrong },
  metricValue: { color: colors.textPrimary, marginTop: spacing.xs, ...typography.h1 },
  distributionRow: { marginBottom: spacing.md },
  distributionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: spacing.xxs 
  },
  distributionLabelWrap: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1, 
    paddingRight: spacing.sm 
  },
  legendDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    marginRight: spacing.sm 
  },
  distributionLabel: { color: colors.primary, ...typography.label },
  distributionValue: { color: colors.textPrimary, ...typography.label },
  progressTrack: { 
    width: '100%', 
    height: spacing.sm, 
    borderRadius: radius.full, 
    backgroundColor: colors.surfaceStrong, 
    overflow: 'hidden' 
  },
  progressFill: { height: '100%', borderRadius: radius.full },
});
