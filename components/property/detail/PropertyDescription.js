import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../ui';

export default function PropertyDescription({ summary, paragraphs = [], pageUrl, onOpenPage }) {
  const hasBody = summary || (Array.isArray(paragraphs) && paragraphs.length);
  const hasPageUrl = Boolean(pageUrl && onOpenPage);

  if (!hasBody && !hasPageUrl) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Descripcion</Text>
      {summary ? <Text style={styles.summary}>{summary}</Text> : null}
      {Array.isArray(paragraphs)
        ? paragraphs.map((paragraph, index) => (
            <Text key={`${paragraph}-${index}`} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))
        : null}
      {hasPageUrl ? (
        <TouchableOpacity style={styles.linkButton} onPress={onOpenPage}>
          <Text style={styles.linkButtonText}>Visitar sitio web</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  summary: {
    ...typography.bodyStrong,
    color: colors.textSoft,
    lineHeight: spacing.xxl,
    marginBottom: spacing.md,
  },
  paragraph: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: spacing.xxl,
    marginBottom: spacing.md,
  },
  linkButton: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  linkButtonText: {
    ...typography.captionStrong,
    color: colors.primary,
  },
});
