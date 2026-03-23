import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, SectionHeader, colors, layout, spacing, typography } from '../../ui';

function DetailRows({ items = [] }) {
  const safeItems = Array.isArray(items) ? items.filter((item) => item?.value) : [];
  if (!safeItems.length) return null;

  return (
    <View>
      {safeItems.map((item, index) => (
        <View
          key={`${item.label}-${item.value}`}
          style={[styles.row, index < safeItems.length - 1 ? styles.rowBorder : null]}
        >
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

export default function PropertyDetailsCard({
  title = 'Caracteristicas',
  subtitle = 'Resumen y detalles del local o nave',
  overviewTitle = 'Vista general',
  detailTitle = 'Detalles',
  overviewItems = [],
  detailItems = [],
}) {
  const hasOverview = Array.isArray(overviewItems) && overviewItems.some((item) => item?.value);
  const hasDetails = Array.isArray(detailItems) && detailItems.some((item) => item?.value);

  if (!hasOverview && !hasDetails) {
    return null;
  }

  return (
    <Card>
      <SectionHeader title={title} subtitle={subtitle} />

      {hasOverview ? (
        <View style={styles.group}>
          {overviewTitle ? <Text style={styles.groupTitle}>{overviewTitle}</Text> : null}
          <DetailRows items={overviewItems} />
        </View>
      ) : null}

      {hasDetails ? (
        <View style={hasOverview ? styles.groupSpacing : null}>
          {detailTitle ? <Text style={styles.groupTitle}>{detailTitle}</Text> : null}
          <DetailRows items={detailItems} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  group: {
    marginTop: spacing.xs,
  },
  groupSpacing: {
    marginTop: spacing.lg,
  },
  groupTitle: {
    ...typography.captionStrong,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  row: {
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: layout.dividerWidth,
    borderBottomColor: colors.border,
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
