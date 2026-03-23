import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../ui';
import PropertyChips from './PropertyChips';

export default function PropertyHeaderInfo({ title, location, chips = [], metaItems = [], onOpenMap, onOpenVideo }) {
  const hasActions = Boolean(onOpenMap || onOpenVideo);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>

      <Text style={styles.location}>{location}</Text>

      {hasActions ? (
        <View style={styles.actionsRow}>
          {onOpenMap ? (
            <TouchableOpacity style={styles.actionButton} onPress={onOpenMap}>
              <Text style={styles.actionButtonText}>Ver mapa</Text>
            </TouchableOpacity>
          ) : null}
          {onOpenVideo ? (
            <TouchableOpacity style={styles.actionButton} onPress={onOpenVideo}>
              <Text style={styles.actionButtonText}>Video</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <PropertyChips items={metaItems} />

      <PropertyChips items={chips} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  location: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    ...typography.body,
    color: colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionButton: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionButtonText: {
    ...typography.captionStrong,
    color: colors.primary,
  },
});
