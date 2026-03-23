import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../../components/ui';

const FilterChip = ({ label, selected, onPress }) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={[styles.filterChip, selected ? styles.filterChipActive : null]}
  >
    <Text style={[styles.filterChipText, selected ? styles.filterChipTextActive : null]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export const PropertyFilters = ({
  searchText, setSearchText,
  statusFilter, setStatusFilter, statusOptions,
  typeFilter, setTypeFilter, typeOptions,
  categoryFilter, setCategoryFilter, categoryOptions,
  resultsCount, onReset
}) => (
  <View style={styles.filtersCard}>
    <Text style={styles.filtersTitle}>Listado</Text>
    
    <TextInput
      value={searchText}
      onChangeText={setSearchText}
      placeholder="Buscar por titulo, referencia o usuario"
      placeholderTextColor={colors.textMuted}
      style={styles.searchInput}
    />

    <Text style={styles.filterGroupLabel}>Estado</Text>
    <View style={styles.chipsWrap}>
      {statusOptions.map((option) => (
        <FilterChip
          key={`status-${option}`}
          label={option}
          selected={statusFilter === option}
          onPress={() => setStatusFilter(option)}
        />
      ))}
    </View>

    <Text style={styles.filterGroupLabel}>Tipo</Text>
    <View style={styles.chipsWrap}>
      {typeOptions.map((option) => (
        <FilterChip
          key={`type-${option}`}
          label={option}
          selected={typeFilter === option}
          onPress={() => setTypeFilter(option)}
        />
      ))}
    </View>

    <Text style={styles.filterGroupLabel}>Categoria</Text>
    <View style={styles.chipsWrap}>
      {categoryOptions.map((option) => (
        <FilterChip
          key={`category-${option}`}
          label={option}
          selected={categoryFilter === option}
          onPress={() => setCategoryFilter(option)}
        />
      ))}
    </View>

    <View style={styles.filtersFooter}>
      <Text style={styles.resultsCount}>{resultsCount} inmuebles</Text>
      <TouchableOpacity onPress={onReset} style={styles.clearBtn}>
        <Text style={styles.clearBtnText}>Limpiar</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  filtersCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  filtersTitle: {
    color: colors.textPrimary,
    ...typography.h2,
  },
  searchInput: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSecondary,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    ...typography.body,
  },
  filterGroupLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    color: colors.textSoft,
    ...typography.captionStrong,
    textTransform: 'uppercase',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  filterChip: {
    marginHorizontal: 4,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSecondary,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  filterChipText: {
    color: colors.textSoft,
    ...typography.label,
  },
  filterChipTextActive: {
    color: colors.accentStrong,
  },
  filtersFooter: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsCount: {
    color: colors.textPrimary,
    ...typography.bodyStrong,
  },
  clearBtn: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    backgroundColor: colors.card,
  },
  clearBtnText: {
    color: colors.textSoft,
    ...typography.label,
  },
});
