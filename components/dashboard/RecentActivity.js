import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card as UiCard, colors, typography, radius, spacing } from '../../components/ui';
import { 
  formatNumber, 
  formatPrice, 
  propertyId, 
  propertyTitle, 
  propertyType, 
  propertyCategory, 
  propertyAddress, 
  propertyCity, 
  propertyOwner, 
  propertyPrice 
} from '../../utils/dataMappers';

export const PropertyItem = ({ item, adminView, onPress }) => (
  <TouchableOpacity
    key={propertyId(item)}
    onPress={() => onPress(item)}
    style={styles.propertyItem}
  >
    <Text style={styles.propertyTitle}>{propertyTitle(item)}</Text>
    <Text style={styles.propertySubtitle}>
      {propertyType(item)} · {propertyCategory(item)}
    </Text>
    <Text style={styles.propertyMeta}>
      {propertyAddress(item)}
      {propertyCity(item) ? `, ${propertyCity(item)}` : ''}
    </Text>
    {adminView ? (
      <Text style={styles.propertyOwner}>Usuario: {propertyOwner(item)}</Text>
    ) : null}
    <View style={styles.pricePill}>
      <Text style={styles.pricePillText}>{formatPrice(propertyPrice(item))}</Text>
    </View>
  </TouchableOpacity>
);

export const KPIRow = ({ label, value }) => (
  <View style={styles.kpiRow}>
    <Text style={styles.kpiLabel}>{label}</Text>
    <Text style={styles.kpiValue}>{formatNumber(value)}</Text>
  </View>
);

const styles = StyleSheet.create({
  propertyItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  propertyTitle: { color: colors.textPrimary, ...typography.bodyStrong, marginBottom: 4 },
  propertySubtitle: { color: colors.textSoft, ...typography.caption, marginBottom: 4 },
  propertyMeta: { color: colors.textMuted, ...typography.caption, marginBottom: 4 },
  propertyOwner: { color: colors.primary, ...typography.caption, marginBottom: spacing.xs },
  pricePill: {
    marginTop: spacing.xxs,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    backgroundColor: colors.surfaceAccent,
  },
  pricePillText: { color: colors.accentStrong, ...typography.captionStrong },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  kpiLabel: { color: colors.textSoft, ...typography.label },
  kpiValue: { color: colors.textPrimary, ...typography.bodyStrong },
});
