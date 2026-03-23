import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button, Card, SectionHeader, colors, radius, sizing, spacing, typography } from '../../ui';

const buildInitials = (value) => {
  const parts = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return 'KC';
  return parts.map((part) => part[0]?.toUpperCase() || '').join('');
};

export default function PropertyContactCard({ contact, onCall, onMessage, onShare }) {
  if (!contact) return null;

  return (
    <Card>
      <SectionHeader title="Contacto" subtitle="Pregunta al anunciante" />

      <View style={styles.profileRow}>
        {contact.avatarUrl ? (
          <Image source={{ uri: contact.avatarUrl }} style={styles.avatar} resizeMode="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarFallbackText}>{buildInitials(contact.company || contact.name)}</Text>
          </View>
        )}

        <View style={styles.profileCopy}>
          {contact.company ? <Text style={styles.company}>{contact.company}</Text> : null}
          {contact.name ? <Text style={styles.name}>{contact.name}</Text> : null}
        </View>
      </View>

      {contact.publishedBy ? (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Publicado por</Text>
          <Text style={styles.metaValue}>{contact.publishedBy}</Text>
        </View>
      ) : null}

      {contact.updatedAt ? (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Ultima actualizacion</Text>
          <Text style={styles.metaValue}>{contact.updatedAt}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button label="Llamar" onPress={onCall} disabled={!onCall} />
        <Button label="Enviar mensaje" variant="secondary" onPress={onMessage} disabled={!onMessage} />
        {contact.hasShare ? <Button label="Compartir" variant="secondary" onPress={onShare} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: sizing.avatar,
    height: sizing.avatar,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceStrong,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  profileCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  company: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  name: {
    ...typography.body,
    color: colors.textSecondary,
  },
  metaRow: {
    marginBottom: spacing.md,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  metaValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
