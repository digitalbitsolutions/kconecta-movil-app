import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getApiErrorDetails, getMeApi } from '../../../api/client';
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

const resolveRole = (rawUser) => {
  const roleName = pickString(rawUser?.user_level_name, rawUser?.role, rawUser?.level_name);
  if (roleName) return roleName;

  const levelId = parseNumber(rawUser?.user_level_id ?? rawUser?.level_id ?? rawUser?.role_id);
  if (levelId === 1) return 'Administrador';
  if (levelId === 2) return 'Usuario libre';
  if (levelId === 3) return 'Usuario premium';
  if (levelId === 4) return 'Proveedor de servicio';
  if (levelId === 5) return 'Agente inmobiliario';
  return 'Usuario';
};

const ProfileField = ({ label, value }) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value || '-'}</Text>
  </View>
);

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState('');

  const profile = useMemo(() => {
    const source = user || {};
    const firstName = pickString(source.first_name);
    const lastName = pickString(source.last_name);
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      id: pickString(source.id),
      name: pickString(fullName, source.user_name, source.name),
      email: pickString(source.email),
      phone: pickString(source.phone, source.phone_number),
      role: resolveRole(source),
      level: pickString(source.user_level_id, source.level_id, source.role_id),
      company: pickString(source.company_name, source.agency_name),
    };
  }, [user]);

  const loadProfile = async () => {
    setErrorText('');
    try {
      const meData = await getMeApi();
      const meUser = extractUser(meData);
      if (meUser) {
        setUser(meUser);
      }
    } catch (error) {
      const details = getApiErrorDetails(error);
      setErrorText(details.message);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await loadProfile();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadProfile();
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
        <Text style={styles.title}>Mi perfil</Text>
        <Text style={styles.subtitle}>Datos del usuario autenticado en CRM.</Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.note}>Cargando perfil...</Text>
          </View>
        ) : (
          <>
            {errorText ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>No se pudo actualizar /me</Text>
                <Text style={styles.errorText}>{errorText}</Text>
              </View>
            ) : null}

            <View style={styles.card}>
              <ProfileField label="ID" value={profile.id} />
              <ProfileField label="Nombre" value={profile.name} />
              <ProfileField label="Email" value={profile.email} />
              <ProfileField label="Telefono" value={profile.phone} />
              <ProfileField label="Rol" value={profile.role} />
              <ProfileField label="Nivel" value={profile.level} />
              <ProfileField label="Empresa" value={profile.company} />
            </View>

            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Cerrar sesion</Text>
            </TouchableOpacity>
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
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  fieldRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
  },
  fieldLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  fieldValue: {
    marginTop: 2,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#E11D48',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  errorCard: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  errorTitle: {
    color: '#9F1239',
    fontSize: 16,
    fontWeight: '800',
  },
  errorText: {
    marginTop: 4,
    color: '#BE123C',
    fontSize: 13,
    lineHeight: 18,
  },
});
