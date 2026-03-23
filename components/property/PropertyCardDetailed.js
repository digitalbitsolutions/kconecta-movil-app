import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, layout, radius, spacing, typography } from '../ui';
import {
  formatArea,
  formatPrice,
  getActionTheme,
  getStatusColors,
  isInactiveStatus,
  resolveDescription,
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

const ActionButton = ({ icon, label, tint, textColor, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.actionButton,
      {
        backgroundColor: tint,
        opacity: pressed ? 0.8 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      },
    ]}
  >
    <Text style={[styles.actionIcon, { color: textColor }]}>{icon}</Text>
    <Text style={[styles.actionLabel, { color: textColor }]}>{label}</Text>
  </Pressable>
);

export default function PropertyCardDetailed({
  item,
  onPress,
  onEdit,
  onToggleStatus,
  onDelete,
  onOpen,
  showOwner = true,
  showActions = true,
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
  const description = resolveDescription(item);
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
          opacity: pressed ? 0.98 : 1,
          transform: [{ scale: pressed ? 0.996 : 1 }],
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
      </View>

      <View style={styles.body}>
        <View style={styles.tagsRow}>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>{type}</Text>
          </View>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>{operation}</Text>
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.locationMain}>{cityCountry}</Text>
        {address ? (
          <Text style={styles.locationSub} numberOfLines={2}>
            {address}
          </Text>
        ) : null}

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Superficie</Text>
            <Text style={styles.infoValue}>{area}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Precio</Text>
            <Text style={styles.priceValue}>{price}</Text>
          </View>
        </View>

        {description ? (
          <Text style={styles.description} numberOfLines={6}>
            {description}
          </Text>
        ) : null}

        {metaLine ? <Text style={styles.metaLine}>{metaLine}</Text> : null}

        {showActions ? (
          <View style={styles.actionsRow}>
            {actions.map((action) => (
              <ActionButton
                key={action.key}
                icon={action.icon}
                label={action.label}
                tint={action.backgroundColor}
                textColor={action.textColor}
                onPress={(event) => execute(event, action.handler)}
              />
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.card,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: spacing.sm },
    shadowOpacity: 0.1,
    shadowRadius: spacing.lg,
    elevation: 6,
  },
  heroWrap: {
    width: '100%',
    aspectRatio: layout.propertyCardAspectRatio,
    backgroundColor: colors.surfaceStrong,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFallbackText: {
    color: colors.textMuted,
    ...typography.captionStrong,
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusText: {
    ...typography.captionStrong,
    letterSpacing: 0.4,
  },
  body: {
    padding: spacing.lg - spacing.xxs,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.sm + spacing.xxs,
  },
  tagPill: {
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs - 1,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  tagText: {
    color: colors.primary,
    ...typography.captionStrong,
  },
  title: {
    color: colors.textPrimary,
    ...typography.h1,
    lineHeight: 30,
  },
  locationMain: {
    marginTop: spacing.sm,
    color: colors.primary,
    ...typography.bodyStrong,
  },
  locationSub: {
    marginTop: spacing.xxs,
    color: colors.textMuted,
    ...typography.body,
    lineHeight: 18,
  },
  infoRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  infoBox: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginRight: spacing.sm,
  },
  infoLabel: {
    color: colors.textMuted,
    ...typography.captionStrong,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoValue: {
    marginTop: spacing.xs,
    color: colors.primary,
    ...typography.bodyStrong,
  },
  priceValue: {
    marginTop: spacing.xs,
    color: colors.textPrimary,
    ...typography.h2,
  },
  description: {
    marginTop: spacing.md,
    color: colors.textSoft,
    ...typography.body,
    lineHeight: 21,
  },
  metaLine: {
    marginTop: spacing.sm + spacing.xxs,
    color: colors.textMuted,
    ...typography.caption,
  },
  actionsRow: {
    marginTop: spacing.lg - spacing.xxs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: spacing.xxxl * 2 + spacing.sm,
    minHeight: spacing.xxl * 2,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xxs,
    marginRight: spacing.xs,
  },
  actionIcon: {
    ...typography.label,
  },
  actionLabel: {
    marginTop: spacing.xxs / 2,
    ...typography.captionStrong,
  },
});
