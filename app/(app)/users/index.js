import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getApiErrorDetails, getMeApi, getPropertiesApi } from '../../../api/client';
import { useAuthStore } from '../../../store/useAuthStore';

const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const pickString = (...values) => {
  for (let index = 0; index < values.length; index += 1) {
    const current = values[index];
    if (typeof current === 'string' && current.trim()) return current.trim();
    if (typeof current === 'number' && Number.isFinite(current)) return String(current);
  }
  return '';
};

const extractUser = (payload) => {
  if (payload?.user) return payload.user;
  if (payload?.data?.user) return payload.data.user;
  if (payload?.data?.id) return payload.data;
  if (payload?.id) return payload;
  return null;
};

const extractProperties = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.properties)) return payload.properties;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

const isAdminUser = (rawUser) => {
  const levelId = parseNumber(rawUser?.user_level_id ?? rawUser?.level_id ?? rawUser?.role_id);
  if (levelId === 1) return true;
  const roleText = pickString(rawUser?.role, rawUser?.user_level_name).toLowerCase();
  return roleText.includes('admin');
};

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

    const isAdmin = isAdminUser(effectiveUser);
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
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.note}>Cargando usuarios...</Text>
          </View>
        ) : !adminView ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Solo administradores</Text>
            <Text style={styles.note}>
              Esta vista requiere perfil administrador para listar usuarios del CRM.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiValue}>{rows.length}</Text>
                <Text style={styles.kpiLabel}>Usuarios con inmuebles</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiValue}>{totalProperties}</Text>
                <Text style={styles.kpiLabel}>Total de inmuebles</Text>
              </View>
            </View>

            {errorText ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Error parcial</Text>
                <Text style={styles.errorText}>{errorText}</Text>
              </View>
            ) : null}

            {rows.length ? (
              rows.map((row) => (
                <View key={`user-${row.userId}`} style={styles.rowCard}>
                  <View>
                    <Text style={styles.rowName}>{row.displayName}</Text>
                    <Text style={styles.rowMeta}>ID: {row.userId}</Text>
                  </View>
                  <Text style={styles.rowCount}>{row.propertiesCount}</Text>
                </View>
              ))
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Sin datos</Text>
                <Text style={styles.note}>No hay usuarios con inmuebles para mostrar.</Text>
              </View>
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
    backgroundColor: '#EEF3F8',
  },
  content: {
    padding: 14,
    paddingBottom: 24,
  },
  title: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    paddingTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 14,
    lineHeight: 19,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 4,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
  },
  kpiItem: {
    flex: 1,
  },
  kpiValue: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 31,
  },
  kpiLabel: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  rowCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  rowMeta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 1,
  },
  rowCount: {
    color: '#1D4ED8',
    fontSize: 24,
    fontWeight: '800',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 18,
  },
});
