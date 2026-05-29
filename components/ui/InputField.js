import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from './tokens';

export default function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  containerStyle,
  inputStyle,
  suffix,
  ...rest
}) {
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputContainer}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[styles.input, multiline ? styles.inputMultiline : null, inputStyle, suffix ? { flex: 1, borderRightWidth: 0 } : null]}
          {...rest}
        />
        {suffix ? (
          <View style={styles.suffixContainer}>
            <Text style={styles.suffixText}>{suffix}</Text>
          </View>
        ) : null}
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
    color: colors.textSoft,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  suffixContainer: {
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.borderSoft || '#f5f5f5',
    height: '100%',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  suffixText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSoft,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    color: colors.text,
    ...typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xxs,
  },
  inputMultiline: {
    minHeight: 108,
  },
});
