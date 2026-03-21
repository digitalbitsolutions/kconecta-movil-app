import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { colors, spacing, typography } from './tokens';

export default function SwitchField({ label, value, onValueChange }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={Boolean(value)}
        onValueChange={onValueChange}
        trackColor={{ false: '#CBD5E1', true: '#9EE7DE' }}
        thumbColor={Boolean(value) ? colors.accent : '#FFFFFF'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.label,
    color: '#334155',
    flex: 1,
    marginRight: spacing.md,
  },
});
