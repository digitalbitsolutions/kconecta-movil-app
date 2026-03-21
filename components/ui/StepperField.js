import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from './tokens';

export default function StepperField({ label, value = 0, onIncrement, onDecrement, min = 0 }) {
  const canDecrement = Number(value) > min;

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.btn, !canDecrement ? styles.btnDisabled : null]}
          onPress={onDecrement}
          disabled={!canDecrement}
        >
          <Text style={styles.btnText}>-</Text>
        </TouchableOpacity>
        <View style={styles.valueWrap}>
          <Text style={styles.value}>{value}</Text>
        </View>
        <TouchableOpacity style={styles.btn} onPress={onIncrement}>
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: -1,
  },
  valueWrap: {
    minWidth: 58,
    marginHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  value: {
    ...typography.body,
    color: colors.text,
  },
});
