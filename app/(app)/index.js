import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { Card as UiCard, colors, spacing, typography } from '../../components/ui';
import { useAuthStore } from '../../store/useAuthStore';
import {
  getApiErrorDetails,
  getMeApi,
  getPropertiesApi,
  getServicesApi,
  getServiceProfileApi,
} from '../../api/client';
import { getProviderMetricsSafe } from '../../services/providerMetricsService';
import {
  canManagePropertiesUser,
  isAdminUser,
  isServiceProviderUser,
} from '../../utils/userPermissions';
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

const MiniStat = ({ value, label }) => (
  <View style={styles.miniStat}>
    {typeof value === 'string' || typeof value === 'number' ? (
      <Text style={styles.miniStatValue}>{value}</Text>
    ) : (
      value
    )}
    <Text style={styles.miniStatLabel}>{label}</Text>
  </View>
);

const MetricCard = ({ title, value, unit, delta, progress, showDivider }) => {
  const clamped = Math.max(0, Math.min(100, progress));
  const size = 92;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <View style={[styles.metricCard, !showDivider && styles.metricCardLast]}>
      <Text style={styles.metricTitle}>{title}</Text>
      <View style={styles.metricRingWrap}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E4EBF3" strokeWidth={strokeWidth} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#14A9B8"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.metricRingCenter}>
          <Text style={styles.metricValue}>{value}</Text>
          <Text style={styles.metricUnit}>{unit}</Text>
        </View>
      </View>
      <Text style={styles.metricDelta}>↑ {delta}%</Text>
      <Text style={styles.metricDeltaHint}>vs. mes anterior</Text>
    </View>
  );
};

const toNum = (v) => {
  const n = Number.parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

const parseRating = (obj) => {
  if (!obj || typeof obj !== 'object') return '';
  const direct = pickString(obj.rating_avg, obj.average_rating, obj.avg_rating, obj.rating_average, obj.rating);
  if (direct) return direct;
  const sum = toNum(obj.rating_sum ?? obj.total_stars ?? obj.rating_total);
  const count = toNum(obj.reviews_count ?? obj.review_count ?? obj.ratings_count ?? obj.votes_count);
  if (sum !== null && count && count > 0) return (sum / count).toFixed(1);
  return '';
};

const parseReviews = (obj) => {
  if (!obj || typeof obj !== 'object') return null;
  const count = toNum(obj.reviews_count ?? obj.review_count ?? obj.ratings_count ?? obj.votes_count);
  return count !== null ? Math.trunc(count) : null;
};

export default function DashboardScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [providerServicesCount, setProviderServicesCount] = useState(null);
  const [providerRating, setProviderRating] = useState(null);
  const [providerReviewsCount, setProviderReviewsCount] = useState(null);
  const [providerMetrics, setProviderMetrics] = useState({ visits: 0, clicks: 0, tickets: 0 });

  const adminView = isAdminUser(user);
  const providerView = isServiceProviderUser(user);
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
    const data = await getPropertiesApi({ adminView: isAdminUser(effectiveUser), perPage: 250 });
    setProperties(extractProperties(data));
  };

  const loadProviderStats = async (effectiveUser) => {
    const [services, profile, metricsResult] = await Promise.all([
      getServicesApi({ perPage: 200 }).catch(() => []),
      getServiceProfileApi().catch(() => ({})),
      getProviderMetricsSafe(),
    ]);

    const list = Array.isArray(services) ? services : [];
    setProviderServicesCount(list.length);

    const rating = parseRating(profile) || parseRating(effectiveUser) || '--';
    const reviews = parseReviews(profile) ?? parseReviews(effectiveUser);
    setProviderRating(rating);
    setProviderReviewsCount(reviews);
    const metrics = metricsResult?.metrics || { visits: 0, clicks: 0, tickets: 0 };
    setProviderMetrics({
      visits: Number.isFinite(metrics?.visits) ? metrics.visits : 0,
      clicks: Number.isFinite(metrics?.clicks) ? metrics.clicks : 0,
      tickets: Number.isFinite(metrics?.tickets) ? metrics.tickets : 0,
    });
  };

  const fetchDashboardData = async () => {
    const endpointErrors = [];
    let effectiveUser = user;

    try {
      const meData = await getMeApi();
      const extractedUser = extractUser(meData);
      if (extractedUser) {
        const merged = { ...(meData?.data || {}), ...extractedUser };
        setUser(merged);
        effectiveUser = merged;
      }
    } catch (error) {
      endpointErrors.push(`/me -> ${getApiErrorDetails(error).message}`);
    }

    try {
      await loadProperties(effectiveUser);
    } catch (error) {
      endpointErrors.push(`/agent/properties -> ${getApiErrorDetails(error).message}`);
    }

    if (providerView || isServiceProviderUser(effectiveUser)) {
      try {
        await loadProviderStats(effectiveUser);
      } catch (error) {
        endpointErrors.push(`/agent/services -> ${getApiErrorDetails(error).message}`);
      }
    }

    if (endpointErrors.length) {
      Alert.alert('Error de conexión', `No se pudo cargar el dashboard completo (${endpointErrors.join(' | ')}).`);
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
        <Text style={styles.headerTitle}>Hola, {welcomeName}</Text>
        <Text style={styles.headerSubtitle}>{roleName} · Panel de control</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando dashboard</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {providerView ? (
            <>
              <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80' }}
                style={styles.providerHero}
                imageStyle={styles.providerHeroImage}
              >
                <View style={styles.providerHeroOverlay}>
                  <View style={styles.providerHeroChip}><Text style={styles.providerHeroChipText}>kconecta</Text></View>
                  <Text style={styles.providerHeroTitle}>Dashboard</Text>
                  <Text style={styles.providerHeroSubtitle}>Gestiona tu actividad profesional.</Text>
                </View>
              </ImageBackground>

              <UiCard style={[styles.card, styles.providerPanel]}>
                <View style={styles.providerPanelHead}>
                  <View style={styles.providerPanelIcon}><Text style={styles.providerPanelIconText}>[+]</Text></View>
                  <View style={styles.providerPanelCopy}>
                    <Text style={styles.providerPanelTitle}>Panel del proveedor</Text>
                    <Text style={styles.providerPanelDescription}>Gestiona tus servicios publicados, tu perfil comercial y el seguimiento operativo.</Text>
                  </View>
                </View>

                <View style={styles.providerStatusRow}>
                  <MiniStat value={user?.id ? 'Activa' : '--'} label="Tu cuenta" />
                  <MiniStat value={providerServicesCount !== null ? String(providerServicesCount) : '--'} label="Servicios" />
                  <MiniStat
                    value={providerRating && providerRating !== '--'
                      ? <Text style={styles.miniStatValue}><Text style={styles.ratingStar}>★</Text> {providerRating}{providerReviewsCount !== null ? ` (${providerReviewsCount})` : ''}</Text>
                      : '--'}
                    label="Valoración"
                  />
                </View>
              </UiCard>

              <Text style={styles.sectionTitle}>Métricas clave</Text>
              <Text style={styles.sectionSubtitle}>Rendimiento de tu perfil</Text>
              <UiCard style={[styles.card, styles.metricsPanel]}>
                <MetricCard
                  title="Visitas al perfil"
                  value={new Intl.NumberFormat('es-ES').format(providerMetrics.visits || 0)}
                  unit="visitas"
                  delta={0}
                  progress={Math.min(100, Math.max(8, (providerMetrics.visits || 0) % 101))}
                  showDivider
                />
                <MetricCard
                  title="Clicks en contacto"
                  value={new Intl.NumberFormat('es-ES').format(providerMetrics.clicks || 0)}
                  unit="clicks"
                  delta={0}
                  progress={Math.min(100, Math.max(8, (providerMetrics.clicks || 0) % 101))}
                  showDivider
                />
                <MetricCard
                  title="Tickets de servicio"
                  value={new Intl.NumberFormat('es-ES').format(providerMetrics.tickets || 0)}
                  unit="tickets"
                  delta={0}
                  progress={Math.min(100, Math.max(8, (providerMetrics.tickets || 0) % 101))}
                  showDivider={false}
                />
              </UiCard>
            </>
          ) : !propertyAccessEnabled ? (
            <UiCard style={styles.card}>
              <Text style={styles.cardTitle}>Módulo inmuebles</Text>
              <Text style={styles.paragraph}>Esta etapa móvil está enfocada en gestión de inmuebles. Tu perfil actual no tiene permisos para este módulo.</Text>
            </UiCard>
          ) : (
            <>
              <View style={styles.metricsGrid}>
                <StatsCard label="Clicks en alguna propiedad" value={viewsCount} accent={colors.success} />
                <StatsCard label="Usuarios que revisaron propiedades" value={uniqueViewersCount} accent={colors.primary} />
                <StatsCard label="Clicks en contacto" value={contactClicks} accent={colors.warning} />
              </View>

              <UserInsights welcomeName={welcomeName} welcomeEmail={welcomeEmail} adminView={adminView} ownerMetrics={ownerMetrics} />

              <UiCard style={styles.card}>
                <View style={styles.cardRowBetween}>
                  <Text style={styles.cardTitle}>Tipo de inmueble visitado</Text>
                  <Text style={styles.cardHint}>Distribución por inmuebles</Text>
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
                  <Text style={styles.cardTitle}>Últimos anuncios de propiedades</Text>
                  {recentProperties?.length ? (
                    recentProperties.map((item) => (
                      <PropertyItem key={propertyId(item)} item={item} adminView={adminView} onPress={handlePropertyPress} />
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No hay anuncios recientes.</Text>
                  )}
                </UiCard>

                <UiCard style={[styles.card, { flex: 1 }]}>
                  <Text style={styles.cardTitle}>Actividad</Text>
                  <KPIRow label="Vistas en detalle" value={viewsCount} />
                  <KPIRow label="Vistas en búsqueda" value={searchViewsCount} />
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
  safeArea: { flex: 1, backgroundColor: '#DDE4EE' },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: { ...typography.h1, color: colors.textPrimary },
  headerSubtitle: { marginTop: spacing.xxs, color: colors.textMuted, ...typography.body },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.textMuted, ...typography.body },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxxl },

  providerHero: { minHeight: 160, borderRadius: 18, overflow: 'hidden', marginBottom: spacing.md },
  providerHeroImage: { borderRadius: 18 },
  providerHeroOverlay: { flex: 1, justifyContent: 'center', padding: spacing.md, backgroundColor: 'rgba(11,34,82,0.58)' },
  providerHeroChip: { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#12C7D6', borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 4, marginBottom: spacing.sm, backgroundColor: 'rgba(0,133,161,0.28)' },
  providerHeroChipText: { ...typography.captionStrong, color: '#7DF1FF' },
  providerHeroTitle: { ...typography.h1, color: '#FFFFFF', marginBottom: spacing.xxs },
  providerHeroSubtitle: { ...typography.body, color: '#D5E4FF' },

  card: { marginBottom: spacing.md },
  providerPanel: { borderWidth: 1, borderColor: '#D7E6F0', backgroundColor: '#F6FBFF', borderRadius: 16 },
  providerPanelHead: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  providerPanelIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E7F8F9' },
  providerPanelIconText: { color: '#16A6B5', fontWeight: '700' },
  providerPanelCopy: { flex: 1 },
  providerPanelTitle: { ...typography.h2, color: '#162747', marginBottom: spacing.xxs },
  providerPanelDescription: { ...typography.body, color: '#546C8F', lineHeight: 20 },
  providerStatusRow: { flexDirection: 'row', gap: spacing.sm },
  miniStat: { flex: 1, borderWidth: 1, borderColor: '#D7E2EE', borderRadius: 10, backgroundColor: '#FFFFFF', paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
  miniStatValue: { ...typography.h3, color: '#182A4B' },
  miniStatLabel: { ...typography.caption, color: '#647999', marginTop: 2 },
  ratingStar: { color: '#F4B400' },

  sectionTitle: { ...typography.h2, color: '#1A2C4F', marginBottom: 2 },
  sectionSubtitle: { ...typography.captionStrong, color: '#6D7F99', marginBottom: spacing.sm },

  metricsPanel: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs, borderRadius: 14 },
  metricCard: { flex: 1, borderRightWidth: 1, borderRightColor: '#E7EDF5', paddingHorizontal: spacing.xs },
  metricCardLast: { borderRightWidth: 0 },
  metricTitle: { ...typography.captionStrong, color: '#1E3154', minHeight: 28 },
  metricRingWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: spacing.xs },
  metricRingCenter: { position: 'absolute', alignItems: 'center' },
  metricValue: { ...typography.h2, color: '#1B2D51' },
  metricUnit: { ...typography.caption, color: '#6F819B' },
  metricDelta: { ...typography.captionStrong, color: '#13A7B6', textAlign: 'center' },
  metricDeltaHint: { ...typography.caption, fontSize: 11, color: '#7E8FA6', textAlign: 'center' },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  twoColumnGrid: { marginBottom: spacing.md },
  cardTitle: { color: colors.textPrimary, ...typography.h2, marginBottom: spacing.xxs },
  cardRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cardHint: { color: colors.textMuted, ...typography.captionStrong },
  paragraph: { color: colors.textSoft, ...typography.body, lineHeight: 20 },
  emptyText: { color: colors.textMuted, ...typography.label, lineHeight: 18 },
});
