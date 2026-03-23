import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, spacing, typography } from './tokens';

export default function Button({ label, onPress, variant = 'primary', disabled = false, loading = false, style }) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const containerStyle = isPrimary ? styles.primary : isDanger ? styles.danger : styles.secondary;
  const textStyle = isPrimary || isDanger ? styles.textPrimary : styles.textSecondary;
  const loaderColor = isPrimary || isDanger ? colors.textInverse : colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, containerStyle, (disabled || loading) ? styles.disabled : null, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={loaderColor} />
      ) : (
        <Text style={[styles.text, textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primary: {
    backgroundColor: colors.accent,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  secondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    ...typography.button,
  },
  textPrimary: {
    color: colors.textInverse,
  },
  textSecondary: {
    color: colors.primary,
  },
  disabled: {
    opacity: 0.55,
  },
});
