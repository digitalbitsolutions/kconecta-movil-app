// Agent: DeepSeek
import React from 'react';
import { Pressable, StyleSheet, Text, View, Linking } from 'react-native';
import { colors, radius, spacing, typography, Card } from '../ui';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function LeadCard({ item, onPress }) {
  const visitorName = item?.visitor?.name || 'Visitante anonimo';
  const visitorEmail = item?.visitor?.email || 'Sin email';
  const message = item?.message || '(Sin mensaje)';
  const propertyTitle = item?.property?.title || 'Inmueble no disponible';
  const date = formatDate(item?.created_at);

  const handleWhatsApp = () => {
    const mailUrl = `mailto:${visitorEmail}?subject=Interés en: ${propertyTitle}`;
    Linking.openURL(mailUrl).catch(() => {});
  };

  return (
    <Card style={styles.card}>
      <Pressable onPress={onPress}>
        <View style={styles.header}>
          <View style={styles.visitorInfo}>
            <Text style={styles.name}>{visitorName}</Text>
            <Text style={styles.email}>{visitorEmail}</Text>
          </View>
          <Text style={styles.date}>{date}</Text>
        </View>

        <View style={styles.propertySection}>
          <Text style={styles.propertyLabel}>Interes en:</Text>
          <Text style={styles.propertyTitle} numberOfLines={1}>{propertyTitle}</Text>
        </View>

        <View style={styles.messageSection}>
          <Text style={styles.message} numberOfLines={3}>{message}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable 
            onPress={handleWhatsApp}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: colors.surfaceAccent, opacity: pressed ? 0.7 : 1 }
            ]}
          >
            <Text style={[styles.actionText, { color: colors.accentStrong }]}>Responder por Email</Text>
          </Pressable>
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, padding: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  visitorInfo: { flex: 1 },
  name: { ...typography.h3, color: colors.textPrimary },
  email: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  date: { ...typography.caption, color: colors.textMuted },
  propertySection: { backgroundColor: colors.backgroundSecondary, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.sm },
  propertyLabel: { ...typography.captionStrong, color: colors.textMuted, fontSize: 10, textTransform: 'uppercase' },
  propertyTitle: { ...typography.bodyStrong, color: colors.primary, marginTop: 2 },
  messageSection: { marginBottom: spacing.md },
  message: { ...typography.body, color: colors.textSoft, lineHeight: 20, fontStyle: 'italic' },
  actions: { borderTopWidth: 1, borderTopColor: colors.borderMuted, paddingTop: spacing.sm },
  actionButton: { paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  actionText: { ...typography.button },
});
