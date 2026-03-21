import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  formatArea,
  formatPrice,
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
                tint={action.tint}
                textColor={action.text}
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
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0B172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  heroWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#E2E8F0',
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
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.16)',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  body: {
    padding: 14,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tagPill: {
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 6,
  },
  tagText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: '#0F172A',
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 30,
  },
  locationMain: {
    marginTop: 8,
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  locationSub: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
  infoRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  infoBox: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginRight: 8,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoValue: {
    marginTop: 6,
    color: '#334155',
    fontSize: 15,
    fontWeight: '800',
  },
  priceValue: {
    marginTop: 6,
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
  },
  description: {
    marginTop: 12,
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
  },
  metaLine: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: 72,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginRight: 6,
  },
  actionIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
  },
});
