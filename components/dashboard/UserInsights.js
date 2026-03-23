import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card as UiCard, colors, typography, radius, spacing } from '../../components/ui';
import { formatNumber } from '../../utils/dataMappers';

export const UserInsights = ({ welcomeName, welcomeEmail, adminView, ownerMetrics }) => (
  <View style={styles.insightsGrid}>
    <UiCard style={styles.card}>
      <Text style={styles.cardEyebrow}>Bienvenido</Text>
      <Text style={styles.cardTitle}>{welcomeName}</Text>
      <Text style={styles.paragraph}>{welcomeEmail}</Text>
    </UiCard>

    {adminView ? (
      <UiCard style={styles.card}>
        <View style={styles.cardRowBetween}>
          <Text style={styles.cardTitle}>Usuarios con inmuebles</Text>
          <Text style={styles.cardHint}>Top activos</Text>
        </View>
        {ownerMetrics?.length ? (
          ownerMetrics.map((row) => (
            <View key={row.label} style={styles.simpleRow}>
              <Text style={styles.simpleRowLabel}>{row.label}</Text>
              <Text style={styles.simpleRowValue}>{formatNumber(row.count)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Sin datos de usuarios para inmuebles.</Text>
        )}
      </UiCard>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  insightsGrid: { marginBottom: spacing.md },
  card: { marginBottom: spacing.md },
  cardEyebrow: { color: colors.textMuted, ...typography.captionStrong, textTransform: 'uppercase' },
  cardTitle: { color: colors.textPrimary, ...typography.h2, marginBottom: spacing.xxs },
  cardHint: { color: colors.textMuted, ...typography.captionStrong },
  paragraph: { color: colors.textSoft, ...typography.body, lineHeight: 20 },
  cardRowBetween: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: spacing.sm 
  },
  simpleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  simpleRowLabel: { color: colors.primary, ...typography.label, flex: 1, paddingRight: spacing.sm },
  simpleRowValue: { color: colors.textPrimary, ...typography.bodyStrong },
  emptyText: { color: colors.textMuted, ...typography.label, lineHeight: 18 },
});
