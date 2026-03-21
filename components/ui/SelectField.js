import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from './tokens';

export default function SelectField({
  label,
  value,
  options = [],
  onSelect,
  multiple = false,
  containerStyle,
}) {
  const selectedValues = multiple ? (Array.isArray(value) ? value : []) : [value];

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.rowWrap}>
        {options.map((option) => {
          const selected = selectedValues.includes(option.value);
          return (
            <TouchableOpacity
              key={`${option.value}`}
              style={[styles.chip, selected ? styles.chipActive : null]}
              onPress={() => onSelect(option.value)}
            >
              <Text style={[styles.chipText, selected ? styles.chipTextActive : null]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: '#334155',
    marginBottom: spacing.xs,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginHorizontal: 3,
    marginBottom: 6,
  },
  chipActive: {
    borderColor: '#8FD7CF',
    backgroundColor: '#E8FBF8',
  },
  chipText: {
    ...typography.caption,
    color: '#334155',
  },
  chipTextActive: {
    color: '#0F766E',
  },
});
