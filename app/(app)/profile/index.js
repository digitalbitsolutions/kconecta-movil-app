import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getApiErrorDetails, getMeApi } from '../../../api/client';
import { Button as UiButton, Card as UiCard, colors, radius, spacing, typography } from '../../../components/ui';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
  pickString, 
  extractUser, 
  userLevelName 
} from '../../../utils/dataMappers';
import { ProfileField } from '../../../components/profile/ProfileFields';

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
      role: userLevelName(source),
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
        <Text style={styles.subtitle}>Datos del usuario autenticado en el CRM.</Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.accent} />
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

            <UiCard style={styles.card}>
              <ProfileField label="ID" value={profile.id} />
              <ProfileField label="Nombre" value={profile.name} />
              <ProfileField label="Email" value={profile.email} />
              <ProfileField label="Telefono" value={profile.phone} />
              <ProfileField label="Rol" value={profile.role} />
              <ProfileField label="Nivel" value={profile.level} />
              <ProfileField label="Empresa" value={profile.company} />
            </UiCard>

            <UiButton label="Cerrar sesion" onPress={logout} variant="danger" />
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
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
    ...typography.h1,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    color: colors.textSoft,
    ...typography.body,
  },
  centered: {
    paddingTop: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    ...typography.body,
  },
  card: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  errorCard: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorTitle: {
    color: colors.danger,
    ...typography.h3,
  },
  errorText: {
    marginTop: spacing.xs,
    color: colors.danger,
    ...typography.caption,
    lineHeight: 18,
  },
});
