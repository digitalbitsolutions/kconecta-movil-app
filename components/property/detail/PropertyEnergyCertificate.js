import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, SectionHeader, colors, layout, radius, spacing, typography } from '../../ui';

const ENERGY_COLOR_MAP = {
  A: colors.energyA,
  B: colors.energyB,
  C: colors.energyC,
  D: colors.energyD,
  E: colors.energyE,
  F: colors.energyF,
  G: colors.energyG,
};

const resolveBadgeColor = (rating) => {
  const normalized = String(rating || '').trim().toUpperCase();
  return ENERGY_COLOR_MAP[normalized] || colors.energyNeutral;
};

export default function PropertyEnergyCertificate({ items = [] }) {
  const safeItems = Array.isArray(items) ? items.filter((item) => item?.rating || item?.value) : [];
  if (!safeItems.length) return null;

  return (
    <Card>
      <SectionHeader title="Certificado energetico" />
      <View>
        {safeItems.map((item, index) => (
          <View
            key={item.key || item.label}
            style={[styles.row, index < safeItems.length - 1 ? styles.rowBorder : null]}
          >
            <View style={styles.copy}>
              <Text style={styles.label}>{item.label}</Text>
              {item.value ? <Text style={styles.value}>{item.value}</Text> : null}
            </View>
            {item.rating ? (
              <View style={[styles.badge, { backgroundColor: resolveBadgeColor(item.rating) }]}>
                <Text style={styles.badgeText}>{item.rating}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: layout.dividerWidth,
    borderBottomColor: colors.border,
  },
  copy: {
    flex: 1,
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
  badge: {
    minWidth: spacing.xxxl,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.captionStrong,
    color: colors.textInverse,
  },
});
