import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, layout, radius, spacing, typography } from '../ui';
import {
  formatArea,
  formatPrice,
  getActionTheme,
  getStatusColors,
  isInactiveStatus,
  resolveLocation,
  resolveMetaLine,
  resolveOperation,
  resolvePriceValue,
  resolvePropertyImage,
  resolveStatus,
  resolveTitle,
  resolveType,
} from './propertyCardHelpers';

const execute = (event, handler) => {
  if (event?.stopPropagation) {
    event.stopPropagation();
  }
  if (typeof handler === 'function') {
    handler();
  }
};

const ActionButton = ({ icon, label, tint, textColor, accessibilityLabel, onPress }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    style={({ pressed }) => [
      styles.actionButton,
      {
        backgroundColor: tint,
        opacity: pressed ? 0.78 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      },
    ]}
  >
    <Text style={[styles.actionIcon, { color: textColor }]}>{icon}</Text>
    <Text style={[styles.actionLabel, { color: textColor }]} numberOfLines={1}>
      {label}
    </Text>
  </Pressable>
);

export default function PropertyCardCompact({
  item,
  onPress,
  onEdit,
  onToggleStatus,
  onDelete,
  onOpen,
  showOwner = false,
  style,
}) {
  const imageUrl = resolvePropertyImage(item);
  const status = resolveStatus(item);
  const statusColors = getStatusColors(status);
  const type = resolveType(item);
  const operation = resolveOperation(item);
  const title = resolveTitle(item);
  const { cityCountry, address } = resolveLocation(item);
  const area = formatArea(item);
  const price = formatPrice(resolvePriceValue(item));
  const metaLine = resolveMetaLine(item, { showOwner });
  const inactive = isInactiveStatus(item);
  const editTheme = getActionTheme('edit');
  const toggleTheme = getActionTheme('toggle', { inactive });
  const deleteTheme = getActionTheme('delete');
  const openTheme = getActionTheme('open');
  const actions = [
    { key: 'edit', label: 'Editar', handler: onEdit || onPress, ...editTheme },
    { key: 'toggle', label: inactive ? 'Habilitar' : 'Deshabilitar', handler: onToggleStatus, ...toggleTheme },
    { key: 'delete', label: 'Eliminar', handler: onDelete, ...deleteTheme },
    { key: 'open', label: 'Ver anuncio', handler: onOpen, ...openTheme },
  ];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        style,
        {
          opacity: pressed ? 0.97 : 1,
          transform: [{ scale: pressed ? 0.995 : 1 }],
        },
      ]}
    >
      <View style={styles.heroWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImage, styles.heroFallback]}>
            <Text style={styles.heroFallbackText}>SIN FOTO</Text>
          </View>
        )}

        <View style={styles.heroShade} />

        <View style={[styles.statusBadge, { backgroundColor: statusColors.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusColors.textColor }]}>{status}</Text>
        </View>

        <View style={styles.tagsRow}>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>{type}</Text>
          </View>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>{operation}</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.locationMain} numberOfLines={1}>
          {cityCountry}
        </Text>
        {address ? (
          <Text style={styles.locationSub} numberOfLines={1}>
            {address}
          </Text>
        ) : null}

        <View style={styles.mainInfoRow}>
          <Text style={styles.areaText}>{area}</Text>
          <Text style={styles.priceText}>{price}</Text>
        </View>

        {metaLine ? (
          <Text style={styles.metaLine} numberOfLines={1}>
            {metaLine}
          </Text>
        ) : null}

        <View style={styles.actionsRow}>
          {actions.map((action) => (
            <ActionButton
              key={action.key}
              icon={action.icon}
              label={action.label}
              tint={action.backgroundColor}
              textColor={action.textColor}
              accessibilityLabel={action.label}
              onPress={(event) => execute(event, action.handler)}
            />
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: spacing.sm },
    shadowOpacity: 0.08,
    shadowRadius: spacing.lg,
    elevation: 4,
  },
  heroWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: layout.propertyCardAspectRatio,
    backgroundColor: colors.surfaceStrong,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceStrong,
  },
  heroFallbackText: {
    color: colors.textMuted,
    ...typography.captionStrong,
    letterSpacing: 0.2,
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs - 1,
  },
  statusText: {
    ...typography.captionStrong,
    letterSpacing: 0.5,
  },
  tagsRow: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tagPill: {
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    marginRight: spacing.xs,
    marginBottom: spacing.xxs,
  },
  tagText: {
    color: colors.textPrimary,
    ...typography.captionStrong,
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm + spacing.xxs,
  },
  title: {
    color: colors.textPrimary,
    ...typography.h2,
    lineHeight: 22,
  },
  locationMain: {
    marginTop: spacing.xs,
    color: colors.primary,
    ...typography.captionStrong,
  },
  locationSub: {
    marginTop: spacing.xxs / 2,
    color: colors.textMuted,
    ...typography.caption,
  },
  mainInfoRow: {
    marginTop: spacing.sm + spacing.xxs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  areaText: {
    color: colors.textSoft,
    ...typography.label,
    marginRight: spacing.lg - spacing.xxs,
  },
  priceText: {
    color: colors.textPrimary,
    ...typography.h2,
  },
  metaLine: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    ...typography.caption,
  },
  actionsRow: {
    marginTop: spacing.sm + spacing.xxs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  actionButton: {
    flex: 1,
    minHeight: spacing.xxl * 2 + spacing.xxs,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  actionIcon: {
    ...typography.label,
  },
  actionLabel: {
    marginTop: spacing.xxs / 2,
    ...typography.caption,
  },
});
