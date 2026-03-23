import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getApiErrorDetails, getMeApi, getPropertiesApi } from '../../../api/client';
import { Card as UiCard, colors, radius, spacing, typography } from '../../../components/ui';
import { useAuthStore } from '../../../store/useAuthStore';
import { canAccessUsers } from '../../../utils/userPermissions';
import {
  extractProperties,
  extractUser,
  parseNumber,
  pickString,
} from '../../../utils/dataMappers';


const buildUserRows = (properties) => {
  const map = new Map();

  properties.forEach((property) => {
    const userId = parseNumber(property?.user_id ?? property?.owner_id);
    if (!userId) return;

    const displayName = pickString(
      property?.user_name,
      property?.owner_name,
      `${pickString(property?.user_first_name)} ${pickString(property?.user_last_name)}`.trim(),
      `Usuario #${userId}`
    );

    const existing = map.get(userId) || {
      userId,
      displayName,
      propertiesCount: 0,
    };

    existing.propertiesCount += 1;
    if (!existing.displayName || existing.displayName.startsWith('Usuario #')) {
      existing.displayName = displayName;
    }

    map.set(userId, existing);
  });

  return [...map.values()].sort((left, right) => right.propertiesCount - left.propertiesCount);
};

export default function UsersScreen() {
  const { user, setUser } = useAuthStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [adminView, setAdminView] = useState(false);

  const totalProperties = useMemo(
    () => rows.reduce((total, row) => total + parseNumber(row.propertiesCount), 0),
    [rows]
  );

  const loadUsers = async () => {
    setErrorText('');
    let effectiveUser = user;

    try {
      const meData = await getMeApi();
      const meUser = extractUser(meData);
      if (meUser) {
        setUser(meUser);
        effectiveUser = meUser;
      }
    } catch (error) {
      const details = getApiErrorDetails(error);
      setErrorText(`/me -> ${details.message}`);
    }

    const isAdmin = canAccessUsers(effectiveUser);
    setAdminView(isAdmin);
    if (!isAdmin) {
      setRows([]);
      return;
    }

    try {
      const payload = await getPropertiesApi({ adminView: true, perPage: 250 });
      const properties = extractProperties(payload);
      setRows(buildUserRows(properties));
    } catch (error) {
      const details = getApiErrorDetails(error);
      setErrorText((prev) => (prev ? `${prev} | /agent/properties -> ${details.message}` : details.message));
      setRows([]);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await loadUsers();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUsers();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Usuarios</Text>
        <Text style={styles.subtitle}>Gestion enfocada en usuarios con inmuebles.</Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.note}>Cargando usuarios...</Text>
          </View>
        ) : !adminView ? (
          <UiCard style={styles.card}>
            <Text style={styles.cardTitle}>Solo administradores</Text>
            <Text style={styles.note}>
              Esta vista requiere perfil administrador para listar usuarios del CRM.
            </Text>
          </UiCard>
        ) : (
          <>
            <UiCard style={styles.summaryCard}>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiValue}>{rows.length}</Text>
                <Text style={styles.kpiLabel}>Usuarios con inmuebles</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiValue}>{totalProperties}</Text>
                <Text style={styles.kpiLabel}>Total de inmuebles</Text>
              </View>
            </UiCard>

            {errorText ? (
              <UiCard style={styles.card}>
                <Text style={styles.cardTitle}>Error parcial</Text>
                <Text style={styles.errorText}>{errorText}</Text>
              </UiCard>
            ) : null}

            {rows.length ? (
              rows.map((row) => (
                <UiCard key={`user-${row.userId}`} style={styles.rowCard}>
                  <View>
                    <Text style={styles.rowName}>{row.displayName}</Text>
                    <Text style={styles.rowMeta}>ID: {row.userId}</Text>
                  </View>
                  <Text style={styles.rowCount}>{row.propertiesCount}</Text>
                </UiCard>
              ))
            ) : (
              <UiCard style={styles.card}>
                <Text style={styles.cardTitle}>Sin datos</Text>
                <Text style={styles.note}>No hay usuarios con inmuebles para mostrar.</Text>
              </UiCard>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    color: colors.textPrimary,
    ...typography.h1,
  },
  subtitle: {
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
    color: colors.textSoft,
    ...typography.body,
  },
  centered: {
    paddingTop: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    ...typography.body,
    lineHeight: 19,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.textPrimary,
    ...typography.h2,
    marginBottom: spacing.xxs,
  },
  summaryCard: {
    marginBottom: spacing.md,
    flexDirection: 'row',
  },
  kpiItem: {
    flex: 1,
  },
  kpiValue: {
    color: colors.textPrimary,
    ...typography.h1,
  },
  kpiLabel: {
    marginTop: spacing.xxs / 2,
    color: colors.textMuted,
    ...typography.captionStrong,
  },
  rowCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowName: {
    color: colors.textPrimary,
    ...typography.bodyStrong,
  },
  rowMeta: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: spacing.xxs / 4,
  },
  rowCount: {
    color: colors.primary,
    ...typography.h1,
  },
  errorText: {
    color: colors.danger,
    ...typography.label,
    lineHeight: 18,
  },
});
