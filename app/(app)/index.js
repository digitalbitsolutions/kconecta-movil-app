import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  getMyServiceRatingsDashboardApi,
  getPropertiesApi,
  getServiceProfileApi,
  getServicesApi,
  submitServiceRatingByCodeApi,
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
import { mapClientDashboardResponse, submitRatingAndReloadDashboard } from '../../utils/clientRatingsDashboard';

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
      <Text style={styles.metricDelta}>â†‘ {delta}%</Text>
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

const sumMetricFromServices = (services, keys) => {
  if (!Array.isArray(services) || !services.length) return 0;
  return services.reduce((acc, service) => {
    const value = keys.reduce((found, key) => (found !== null ? found : toNum(service?.[key])), null);
    return acc + (value && value > 0 ? value : 0);
  }, 0);
};

const firstMetricFromObject = (source, keys) => {
  if (!source || typeof source !== 'object') return 0;
  for (let i = 0; i < keys.length; i += 1) {
    const value = toNum(source[keys[i]]);
    if (value && value > 0) return value;
  }
  return 0;
};

const resolveProviderMetrics = ({ apiMetrics, profile, services }) => {
  const apiVisits = toNum(apiMetrics?.visits) || 0;
  const apiClicks = toNum(apiMetrics?.clicks) || 0;
  const apiTickets = toNum(apiMetrics?.tickets) || 0;

  const profileVisits = firstMetricFromObject(profile, [
    'visits',
    'visits_count',
    'profile_visits',
    'profile_views',
    'views',
    'views_count',
  ]);
  const profileClicks = firstMetricFromObject(profile, [
    'clicks',
    'clicks_count',
    'contact_clicks',
    'contacts_count',
    'whatsapp_clicks',
    'phone_clicks',
  ]);
  const profileTickets = firstMetricFromObject(profile, [
    'tickets',
    'tickets_count',
    'service_tickets',
    'work_codes_count',
    'codes_count',
  ]);

  const servicesVisits = sumMetricFromServices(services, [
    'visits',
    'visits_count',
    'profile_views',
    'views',
    'views_count',
  ]);
  const servicesClicks = sumMetricFromServices(services, [
    'clicks',
    'clicks_count',
    'contact_clicks',
    'contacts_count',
    'whatsapp_clicks',
    'phone_clicks',
  ]);
  const servicesTickets = sumMetricFromServices(services, [
    'tickets',
    'tickets_count',
    'service_tickets',
    'work_codes_count',
    'codes_count',
  ]);

  return {
    visits: Math.trunc(apiVisits || profileVisits || servicesVisits || 0),
    clicks: Math.trunc(apiClicks || profileClicks || servicesClicks || 0),
    tickets: Math.trunc(apiTickets || profileTickets || servicesTickets || 0),
  };
};

export default function DashboardScreen() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [providerServicesCount, setProviderServicesCount] = useState(null);
  const [providerRating, setProviderRating] = useState(null);
  const [providerReviewsCount, setProviderReviewsCount] = useState(null);
  const [providerMetrics, setProviderMetrics] = useState({ visits: 0, clicks: 0, tickets: 0 });
  const [clientRatingStats, setClientRatingStats] = useState({
    ratingsCount: 0,
    providersRatedCount: 0,
    averageStars: 0,
  });
  const [clientRecentRatings, setClientRecentRatings] = useState([]);
  const [workCode, setWorkCode] = useState('');
  const [selectedStars, setSelectedStars] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [clientDashboardLoading, setClientDashboardLoading] = useState(false);
  const [clientDashboardForbidden, setClientDashboardForbidden] = useState(false);

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
  const debugLevelId = Number.parseInt(String(user?.user_level_id ?? user?.level_id ?? user?.role_id ?? ''), 10);
  const clientView = debugLevelId === 6;
  const averageStarsValue = Math.max(0, Math.min(5, Number(clientRatingStats.averageStars || 0)));
  const averageStarsRounded = Math.round(averageStarsValue);
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
    const metrics = resolveProviderMetrics({
      apiMetrics: metricsResult?.metrics || { visits: 0, clicks: 0, tickets: 0 },
      profile,
      services: list,
    });
    setProviderMetrics({
      visits: Number.isFinite(metrics?.visits) ? metrics.visits : 0,
      clicks: Number.isFinite(metrics?.clicks) ? metrics.clicks : 0,
      tickets: Number.isFinite(metrics?.tickets) ? metrics.tickets : 0,
    });
  };

  const loadClientDashboard = async ({ showLoader = false } = {}) => {
    if (showLoader) setClientDashboardLoading(true);
    setClientDashboardForbidden(false);
    try {
      const payload = await getMyServiceRatingsDashboardApi();
      const mapped = mapClientDashboardResponse(payload);
      setClientRatingStats(mapped.stats);
      setClientRecentRatings(mapped.recentRatings);
    } catch (error) {
      const details = getApiErrorDetails(error);
      const apiCode = String(details?.data?.errors?.code || '');
      const status = details?.status;

      if (status === 401 || apiCode === 'UNAUTHENTICATED') {
        await logout();
        Alert.alert('Sesión expirada', 'Tu sesión expiró. Inicia sesión nuevamente.');
        return;
      }
      if (status === 403 && apiCode === 'ROLE_NOT_ALLOWED') {
        setClientDashboardForbidden(true);
        return;
      }

      Alert.alert('No se pudo cargar', 'Ocurrió un error al cargar tus valoraciones. Intenta nuevamente.');
    } finally {
      if (showLoader) setClientDashboardLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    const endpointErrors = [];
    let effectiveUser = user;
    const isProviderSession = providerView || isServiceProviderUser(effectiveUser);
    const hasSessionUser = Boolean(effectiveUser?.id);

    // Avoid /me call for provider dashboard and while auth store is still hydrating.
    // In both cases, /me is not required to render provider metrics UI.
    if (!isProviderSession && hasSessionUser) {
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

    const effectiveLevel = Number.parseInt(
      String(effectiveUser?.user_level_id ?? effectiveUser?.level_id ?? effectiveUser?.role_id ?? ''),
      10
    );
    if (effectiveLevel === 6) {
      await loadClientDashboard({ showLoader: false });
    }

    if (endpointErrors.length) {
      Alert.alert('Error de conexiÃ³n', `No se pudo cargar el dashboard completo (${endpointErrors.join(' | ')}).`);
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
      if (clientView) {
        await loadClientDashboard({ showLoader: false });
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handlePropertyPress = (property) => {
    const id = propertyId(property);
    if (!id) return;
    router.push({ pathname: '/property/[id]', params: { id } });
  };

  const submitClientRating = async () => {
    setSubmittingRating(true);
    try {
      const result = await submitRatingAndReloadDashboard({
        workCode,
        stars: selectedStars,
        submitByCode: submitServiceRatingByCodeApi,
        fetchDashboard: getMyServiceRatingsDashboardApi,
      });
      setClientRatingStats(result.mappedDashboard.stats);
      setClientRecentRatings(result.mappedDashboard.recentRatings);

      setWorkCode('');
      setSelectedStars(0);
      Alert.alert('Valoración registrada', String(result.submitPayload?.message || 'Valoracion registrada correctamente.'));
    } catch (error) {
      if (String(error?.message || '') === 'WORK_CODE_REQUIRED') {
        Alert.alert('Código requerido', 'Ingresa un código de trabajo para valorar.');
        return;
      }
      if (String(error?.message || '') === 'STARS_REQUIRED') {
        Alert.alert('Valoración requerida', 'Selecciona una cantidad de estrellas.');
        return;
      }
      const details = getApiErrorDetails(error);
      const apiCode = String(details?.data?.errors?.code || '');
      const status = details?.status;

      console.warn('client rating submit failed:', { status, apiCode, message: details.message });

      if (status === 401 || apiCode === 'UNAUTHENTICATED') {
        await logout();
        Alert.alert('Sesión expirada', 'Tu sesión expiró. Inicia sesión nuevamente.');
      } else if (status === 403 && apiCode === 'ROLE_NOT_ALLOWED') {
        Alert.alert('Perfil no permitido', 'Solo clientes finales pueden valorar proveedores.');
      } else if (status === 403 && apiCode === 'EMAIL_NOT_VERIFIED') {
        Alert.alert('Verificación pendiente', 'Debes verificar tu e-mail para poder valorar.');
      } else if (status === 422 && apiCode === 'WORK_CODE_INVALID') {
        Alert.alert('Código inválido', 'El código de trabajo no es válido.');
      } else if (status === 422 && apiCode === 'WORK_CODE_USED') {
        Alert.alert('Código ya utilizado', 'Este código de trabajo ya fue utilizado.');
      } else if (status === 422 && apiCode === 'SELF_RATING_NOT_ALLOWED') {
        Alert.alert('Acción no permitida', 'No puedes valorarte a ti mismo.');
      } else {
        Alert.alert('No se pudo registrar', 'Ocurrió un error. Si persiste, contacta a soporte.');
      }
    } finally {
      setSubmittingRating(false);
    }
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
          contentContainerStyle={[styles.content, clientView ? styles.clientContentCompact : null]}
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
                      ? <Text style={styles.miniStatValue}><Text style={styles.ratingStar}>â˜…</Text> {providerRating}{providerReviewsCount !== null ? ` (${providerReviewsCount})` : ''}</Text>
                      : '--'}
                    label="ValoraciÃ³n"
                  />
                </View>
              </UiCard>

              <Text style={styles.sectionTitle}>MÃ©tricas clave</Text>
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
          ) : clientView ? (
            <>
              {clientDashboardLoading ? (
                <UiCard style={styles.card}>
                  <Text style={styles.paragraph}>Cargando valoraciones...</Text>
                </UiCard>
              ) : null}

              {clientDashboardForbidden ? (
                <UiCard style={styles.card}>
                  <Text style={styles.cardTitle}>Acceso restringido</Text>
                  <Text style={styles.paragraph}>Este dashboard es exclusivo para clientes finales.</Text>
                </UiCard>
              ) : null}

              <UiCard style={[styles.card, styles.clientSummaryCard]}>
                <Text style={styles.clientSummaryTitle}>Resumen general</Text>
                <View style={styles.clientSummaryStatsRow}>
                  <View style={styles.clientSummaryStat}>
                    <Text style={styles.clientSummaryStatValue}>{clientRatingStats.ratingsCount}</Text>
                    <Text style={styles.clientSummaryStatLabel}>Valoraciones realizadas</Text>
                  </View>
                  <View style={styles.clientSummaryDivider} />
                  <View style={styles.clientSummaryStat}>
                    <Text style={styles.clientSummaryStatValue}>{clientRatingStats.providersRatedCount}</Text>
                    <Text style={styles.clientSummaryStatLabel}>Proveedores valorados</Text>
                  </View>
                  <View style={styles.clientSummaryDivider} />
                  <View style={styles.clientSummaryStat}>
                    <View style={styles.clientSummaryStarsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Text key={`summary-star-${star}`} style={[styles.clientSummaryStar, star <= averageStarsRounded ? null : styles.clientSummaryStarInactive]}>
                          ★
                        </Text>
                      ))}
                    </View>
                    <Text style={styles.clientSummaryStatLabel}>Promedio</Text>
                  </View>
                </View>
              </UiCard>

              <UiCard style={styles.card}>
                <View style={styles.cardRowBetween}>
                  <Text style={styles.cardTitle}>Tu actividad de valoraciones</Text>
                </View>
                {clientRecentRatings.length ? (
                  clientRecentRatings.map((item) => (
                    <View key={item.id} style={styles.clientActivityItem}>
                      <Text style={styles.clientActivityProvider}>{item.provider}</Text>
                      <Text style={styles.clientActivityStars}>{'★'.repeat(item.stars)}{'☆'.repeat(5 - item.stars)}</Text>
                      <Text style={styles.clientActivityDate}>Actualizado: {item.updatedAt}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Aún no has realizado valoraciones.</Text>
                )}
              </UiCard>

              <UiCard style={styles.card}>
                <Text style={styles.cardTitle}>Realizar valoración</Text>
                <Text style={styles.paragraph}>Envía tu feedback sobre un servicio recibido.</Text>

                <Text style={styles.clientFieldLabel}>Código de trabajo</Text>
                <TextInput
                  style={styles.clientInput}
                  value={workCode}
                  onChangeText={setWorkCode}
                  placeholder="Ej: WK-XXXXXXX"
                  autoCapitalize="characters"
                />

                <Text style={styles.clientFieldLabel}>Calidad del servicio</Text>
                <View style={styles.clientStarsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable key={`star-${star}`} onPress={() => setSelectedStars(star)} style={styles.starButton}>
                      <Text style={[styles.starText, star <= selectedStars ? styles.starTextActive : null]}>★</Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  style={[styles.clientSaveButton, submittingRating && styles.clientSaveButtonDisabled]}
                  onPress={submitClientRating}
                  disabled={submittingRating}
                >
                  <Text style={styles.clientSaveButtonText}>{submittingRating ? 'Guardando...' : 'Guardar'}</Text>
                </Pressable>
              </UiCard>

              <UiCard style={[styles.card, styles.clientHelpCard]}>
                <Text style={styles.clientHelpTitle}>Tu opinión nos ayuda a mejorar</Text>
                <Text style={styles.clientHelpText}>Cada valoración cuenta para seguir ofreciendo el mejor servicio.</Text>
              </UiCard>
            </>
          ) : !propertyAccessEnabled ? (
            <UiCard style={styles.card}>
              <Text style={styles.cardTitle}>MÃ³dulo inmuebles</Text>
              <Text style={styles.paragraph}>Esta etapa mÃ³vil estÃ¡ enfocada en gestiÃ³n de inmuebles. Tu perfil actual no tiene permisos para este mÃ³dulo.</Text>
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
                  <Text style={styles.cardHint}>DistribuciÃ³n por inmuebles</Text>
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
                  <Text style={styles.cardTitle}>Ãšltimos anuncios de propiedades</Text>
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
                  <KPIRow label="Vistas en bÃºsqueda" value={searchViewsCount} />
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
  clientContentCompact: { paddingBottom: spacing.md },

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
  clientActivityItem: {
    borderWidth: 1,
    borderColor: '#DCE5F0',
    borderRadius: 12,
    backgroundColor: '#F5F9FF',
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  clientActivityProvider: { ...typography.bodyStrong, color: '#1A2F52' },
  clientActivityStars: { marginTop: 2, color: '#F4B400', fontSize: 16 },
  clientActivityDate: { marginTop: 2, ...typography.caption, color: '#667B98' },
  clientFieldLabel: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxs,
    ...typography.captionStrong,
    color: '#1F365A',
  },
  clientInput: {
    borderWidth: 1,
    borderColor: '#CFDAE8',
    borderRadius: 10,
    minHeight: 46,
    backgroundColor: '#F4F8FC',
    paddingHorizontal: spacing.sm,
    color: '#12345D',
    ...typography.body,
  },
  clientStarsRow: { flexDirection: 'row', marginTop: spacing.xs, marginBottom: spacing.md },
  starButton: { marginRight: spacing.xs, paddingVertical: 4, paddingHorizontal: 2 },
  starText: { fontSize: 30, color: '#CFD8E4' },
  starTextActive: { color: '#F4B400' },
  clientSaveButton: {
    marginTop: spacing.sm,
    backgroundColor: '#1BB5AF',
    borderRadius: 10,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientSaveButtonDisabled: { opacity: 0.7 },
  clientSaveButtonText: { ...typography.h3, color: '#FFFFFF' },
  clientSummaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0EA8B1',
    backgroundColor: '#0D9EA8',
  },
  clientSummaryTitle: {
    ...typography.captionStrong,
    color: '#D5FCFF',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  clientSummaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  clientSummaryStat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientSummaryDivider: {
    width: 1,
    backgroundColor: 'rgba(217, 252, 255, 0.35)',
    marginHorizontal: spacing.xs,
  },
  clientSummaryStatValue: {
    ...typography.h1,
    color: '#FFFFFF',
  },
  clientSummaryStatLabel: {
    ...typography.caption,
    color: '#D2F8FB',
    textAlign: 'center',
    marginTop: 2,
  },
  clientSummaryStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientSummaryStar: {
    fontSize: 18,
    color: '#F4C430',
    marginHorizontal: 1,
  },
  clientSummaryStarInactive: {
    color: 'rgba(255,255,255,0.45)',
  },
  clientHeaderAction: {
    ...typography.captionStrong,
    color: '#0E9EA9',
  },
  clientHelpCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#133A6A',
    backgroundColor: '#0D2F5A',
  },
  clientHelpTitle: {
    ...typography.h3,
    color: '#FFFFFF',
    marginBottom: spacing.xxs,
  },
  clientHelpText: {
    ...typography.body,
    color: '#CCE0FF',
    lineHeight: 20,
  },
});


