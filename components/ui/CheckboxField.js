import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from './tokens';

export function CheckboxField({ label, checked, onToggle, style }) {
  return (
    <TouchableOpacity style={[styles.item, style]} onPress={onToggle}>
      <View style={[styles.box, checked ? styles.boxChecked : null]}>
        {checked ? <Text style={styles.check}>✓</Text> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

export function CheckboxGrid({ items = [], values = [], onToggle }) {
  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const checked = values.includes(item.value);
        return (
          <CheckboxField
            key={`${item.value}`}
            label={item.label}
            checked={checked}
            onToggle={() => onToggle(item.value)}
            style={styles.gridItem}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  boxChecked: {
    borderColor: colors.accent,
    backgroundColor: '#D7F4F0',
  },
  check: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '800',
  },
  label: {
    ...typography.caption,
    color: '#334155',
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: spacing.sm,
  },
});
