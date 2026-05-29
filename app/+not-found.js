import React from 'react';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../components/ui';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ruta no disponible</Text>
      <Text style={styles.subtitle}>Volver al panel principal.</Text>
      <Link href="/" style={styles.link}>
        Ir al inicio
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  link: {
    marginTop: spacing.lg,
    color: colors.accentStrong,
    fontWeight: '800',
  },
});
