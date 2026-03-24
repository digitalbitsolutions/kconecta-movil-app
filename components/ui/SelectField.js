import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from './tokens';

export default function SelectField({
  label,
  value,
  options = [],
  onSelect,
  multiple = false,
  containerStyle,
  loading = false,
  disabled = false,
  emptyText = 'Sin opciones disponibles.',
}) {
  const selectedValues = multiple ? (Array.isArray(value) ? value : []) : [value];
  const hasOptions = Array.isArray(options) && options.length > 0;

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {loading ? (
        <View style={styles.feedbackBox}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.feedbackText}>Cargando opciones...</Text>
        </View>
      ) : hasOptions ? (
        <View style={styles.rowWrap}>
          {options
            .filter((opt) => {
              // Soporte para id o value (Hardening)
              const val = opt?.value ?? opt?.id;
              const isValid = opt && val !== undefined && val !== null && opt.label;
              if (!isValid && __DEV__) {
                console.error(`[SelectField] Opcion invalida detectada en el campo "${label}":`, opt);
              }
              return isValid;
            })
            .map((option, index) => {
              const val = option.value ?? option.id; // Valor prioritario
              const selected = selectedValues.includes(val);
              // Key robusta: combinamos value real con index
              const uniqueKey = `${val}-${index}`;
              
              return (
                <TouchableOpacity
                  key={uniqueKey}
                  style={[styles.chip, selected ? styles.chipActive : null, disabled ? styles.chipDisabled : null]}
                  onPress={() => {
                    if (!disabled) {
                      onSelect(val);
                    }
                  }}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected ? styles.chipTextActive : null,
                      disabled ? styles.chipTextDisabled : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>
      ) : (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackText}>{emptyText}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textSoft,
    marginBottom: spacing.xs,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xxs,
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xxs,
    marginBottom: spacing.xs,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceAccent,
  },
  chipDisabled: {
    opacity: 0.55,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSoft,
  },
  chipTextActive: {
    color: colors.accentStrong,
  },
  chipTextDisabled: {
    color: colors.textMuted,
  },
  feedbackBox: {
    minHeight: spacing.xxxl,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  feedbackText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
