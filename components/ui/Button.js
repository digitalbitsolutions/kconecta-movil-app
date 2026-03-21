import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, spacing, typography } from './tokens';

export default function Button({ label, onPress, variant = 'primary', disabled = false, loading = false, style }) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, isPrimary ? styles.primary : styles.secondary, (disabled || loading) ? styles.disabled : null, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isPrimary ? '#FFFFFF' : colors.primary} />
      ) : (
        <Text style={[styles.text, isPrimary ? styles.textPrimary : styles.textSecondary]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    ...typography.body,
    fontWeight: '800',
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textSecondary: {
    color: colors.primary,
  },
  disabled: {
    opacity: 0.55,
  },
});
