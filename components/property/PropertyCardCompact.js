import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  formatArea,
  formatPrice,
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
  const actions = [
    { key: 'edit', icon: '✏', tint: '#DBEAFE', text: '#1D4ED8', label: 'Editar', handler: onEdit || onPress },
    {
      key: 'toggle',
      icon: inactive ? '👁' : '🙈',
      tint: '#FEF3C7',
      text: '#B45309',
      label: inactive ? 'Habilitar' : 'Deshabilitar',
      handler: onToggleStatus,
    },
    { key: 'delete', icon: '🗑', tint: '#FEE2E2', text: '#B91C1C', label: 'Eliminar', handler: onDelete },
    { key: 'open', icon: '↗', tint: '#E2E8F0', text: '#0F172A', label: 'Ver anuncio', handler: onOpen },
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
              tint={action.tint}
              textColor={action.text}
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
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#0B172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  heroWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#E2E8F0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  heroFallbackText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagsRow: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tagPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  title: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  locationMain: {
    marginTop: 6,
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  locationSub: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  mainInfoRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  areaText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 14,
  },
  priceText: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
  },
  metaLine: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  actionButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  actionIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
  },
});
