import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getApiErrorDetails, getMeApi, getPropertiesApi } from '../../../api/client';
import { Card as UiCard, colors, radius, spacing, typography } from '../../../components/ui';
import { useAuthStore } from '../../../store/useAuthStore';
import { canAccessUsers } from '../../../utils/userPermissions';
import {
  extractProperties,
  extractUser,
} from '../../../utils/dataMappers';

import { aggregateUsersByProperties, calculateTotalPropertiesFromUsers } from '../../../components/users/userHelpers';
import { UserCard, UsersSummary } from '../../../components/users/UserCard';



export default function UsersScreen() {
  const { user, setUser } = useAuthStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [adminView, setAdminView] = useState(false);

  const totalProperties = useMemo(() => calculateTotalPropertiesFromUsers(rows), [rows]);

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
      setRows(aggregateUsersByProperties(properties));
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
            <UsersSummary totalUsers={rows.length} totalProperties={totalProperties} />

            {errorText ? (
              <UiCard style={styles.card}>
                <Text style={styles.cardTitle}>Error parcial</Text>
                <Text style={styles.errorText}>{errorText}</Text>
              </UiCard>
            ) : null}

            {rows.length ? (
              rows.map((row) => (
                <UserCard key={`user-${row.userId}`} user={row} />
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
  errorText: {
    color: colors.danger,
    ...typography.label,
    lineHeight: 18,
  },
});
