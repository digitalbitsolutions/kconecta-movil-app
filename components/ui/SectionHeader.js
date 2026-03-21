import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from './tokens';

export default function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
  },
  subtitle: {
    marginTop: 4,
    ...typography.caption,
    color: colors.textMuted,
  },
});
