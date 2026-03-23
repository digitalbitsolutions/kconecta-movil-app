import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card as UiCard, colors, spacing, typography } from '../../components/ui';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiErrorDetails, getMeApi, getPropertiesApi } from '../../api/client';
import { canManagePropertiesUser, isAdminUser } from '../../utils/userPermissions';
import {
  pickString,
  extractUser,
  extractProperties,
  userLevelName,
  propertyId,
} from '../../utils/dataMappers';

import { calculateDashboardMetrics } from '../../components/dashboard/dashboardHelpers';
import { StatsCard, DistributionRow, DISTRIBUTION_COLORS } from '../../components/dashboard/DashboardStats';
import { PropertyItem, KPIRow } from '../../components/dashboard/RecentActivity';
import { UserInsights } from '../../components/dashboard/UserInsights';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const adminView = isAdminUser(user);
  const propertyAccessEnabled = canManagePropertiesUser(user);

  const metrics = useMemo(() => calculateDashboardMetrics(properties, user), [properties, user]);

  const {
    publishedCount,
    pendingCount,
    ownerMetrics,
    typeDistribution,
    maxTypeCount,
    viewsCount,
    uniqueViewersCount,
    contactClicks,
    searchViewsCount,
    recentProperties,
  } = metrics || {};

  const roleName = userLevelName(user);
  const welcomeName = pickString(user?.first_name, user?.user_name, 'Usuario');
  const welcomeEmail = pickString(user?.email, '-');

  const loadProperties = async (effectiveUser) => {
    if (!canManagePropertiesUser(effectiveUser)) {
      setProperties([]);
      return;
    }

    const data = await getPropertiesApi({
      adminView: isAdminUser(effectiveUser),
      perPage: 250,
    });
    setProperties(extractProperties(data));
  };

  const fetchDashboardData = async () => {
    const endpointErrors = [];
    let effectiveUser = user;

    try {
      const meData = await getMeApi();
      const extractedUser = extractUser(meData);
      if (extractedUser) {
        setUser(extractedUser);
        effectiveUser = extractedUser;
      }
    } catch (error) {
      const details = getApiErrorDetails(error);
      endpointErrors.push(`/me -> ${details.message}`);
    }

    try {
      await loadProperties(effectiveUser);
    } catch (error) {
      const details = getApiErrorDetails(error);
      endpointErrors.push(`/agent/properties -> ${details.message}`);
    }

    if (endpointErrors.length) {
      const errorText = endpointErrors.join(' | ');
      Alert.alert('Error de conexion', `No se pudo cargar el dashboard completo (${errorText}).`);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await fetchDashboardData();
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDashboardData();
    } finally {
      setRefreshing(false);
    }
  };

  const handlePropertyPress = (property) => {
    const id = propertyId(property);
    if (!id) return;
    router.push({ pathname: '/property/[id]', params: { id } });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Hola, {welcomeName}</Text>
          <Text style={styles.headerSubtitle}>{roleName} · Panel de control</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando dashboard de inmuebles...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {!propertyAccessEnabled ? (
            <UiCard style={styles.card}>
              <Text style={styles.cardTitle}>Modulo inmuebles</Text>
              <Text style={styles.paragraph}>
                Esta etapa movil esta enfocada en gestion de inmuebles. Tu perfil actual no tiene permisos
                para este modulo.
              </Text>
            </UiCard>
          ) : (
            <>
              <View style={styles.metricsGrid}>
                <StatsCard label="Clicks en alguna propiedad" value={viewsCount} accent={colors.success} />
                <StatsCard label="Usuarios que revisaron propiedades" value={uniqueViewersCount} accent={colors.primary} />
                <StatsCard label="Clicks en contacto" value={contactClicks} accent={colors.warning} />
              </View>

              <UserInsights 
                welcomeName={welcomeName}
                welcomeEmail={welcomeEmail}
                adminView={adminView}
                ownerMetrics={ownerMetrics}
              />

              <UiCard style={styles.card}>
                <View style={styles.cardRowBetween}>
                  <Text style={styles.cardTitle}>Tipo de inmueble visitado</Text>
                  <Text style={styles.cardHint}>Distribucion por inmuebles</Text>
                </View>
                {typeDistribution?.length ? (
                  typeDistribution.map((item, index) => (
                    <DistributionRow
                      key={`${item.label}-${index}`}
                      label={item.label}
                      value={item.count}
                      max={maxTypeCount}
                      color={DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length]}
                    />
                  ))
                ) : (
                  <Text style={styles.emptyText}>Sin datos de tipos de inmueble.</Text>
                )}
              </UiCard>

              <View style={styles.twoColumnGrid}>
                <UiCard style={[styles.card, { flex: 1 }]}>
                  <Text style={styles.cardTitle}>Ultimos anuncios de propiedades</Text>
                  {recentProperties?.length ? (
                    recentProperties.map((item) => (
                      <PropertyItem
                        key={propertyId(item)}
                        item={item}
                        adminView={adminView}
                        onPress={handlePropertyPress}
                      />
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No hay anuncios recientes.</Text>
                  )}
                </UiCard>

                <UiCard style={[styles.card, { flex: 1 }]}>
                  <Text style={styles.cardTitle}>Actividad</Text>
                  <KPIRow label="Vistas en detalle" value={viewsCount} />
                  <KPIRow label="Vistas en busqueda" value={searchViewsCount} />
                  <KPIRow label="Publicados" value={publishedCount} />
                  <KPIRow label="Pendientes" value={pendingCount} />
                </UiCard>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundSecondary },
  header: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  headerTitle: { ...typography.h1, color: colors.textPrimary },
  headerSubtitle: { marginTop: spacing.xxs, color: colors.textMuted, ...typography.body },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.textMuted, ...typography.body },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  twoColumnGrid: { marginBottom: spacing.md },
  card: { marginBottom: spacing.md },
  cardTitle: { color: colors.textPrimary, ...typography.h2, marginBottom: spacing.xxs },
  cardRowBetween: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: spacing.sm 
  },
  cardHint: { color: colors.textMuted, ...typography.captionStrong },
  paragraph: { color: colors.textSoft, ...typography.body, lineHeight: 20 },
  emptyText: { color: colors.textMuted, ...typography.label, lineHeight: 18 },
});
