import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card as UiCard, colors, radius, sizing, spacing, typography } from '../../components/ui';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiErrorDetails, getMeApi, getPropertiesApi } from '../../api/client';
import { canManagePropertiesUser, isAdminUser } from '../../utils/userPermissions';
import {
  parseNumber,
  formatNumber,
  formatPrice,
  pickString,
  extractUser,
  extractProperties,
  userLevelName,
  propertyId,
  propertyTitle,
  propertyType,
  propertyCategory,
  propertyAddress,
  propertyCity,
  propertyOwner,
  propertyTimestamp,
  propertyPrice,
  isPublishedProperty,
  sumByKeys,
} from '../../utils/dataMappers';


const DISTRIBUTION_COLORS = [
  colors.accent,
  colors.primary,
  colors.warning,
  colors.danger,
  colors.accentStrong,
  colors.textMuted,
];

const StatsCard = ({ label, value, accent }) => (
  <UiCard style={styles.metricCard}>
    <View style={[styles.metricAccent, { backgroundColor: accent }]} />
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{formatNumber(value)}</Text>
  </UiCard>
);

const DistributionRow = ({ label, value, max, color }) => {
  const safeMax = Math.max(max, 1);
  const widthPercent = `${Math.max(8, (parseNumber(value) / safeMax) * 100)}%`;

  return (
    <View style={styles.distributionRow}>
      <View style={styles.distributionHeader}>
        <View style={styles.distributionLabelWrap}>
          <View style={[styles.legendDot, { backgroundColor: color }]} />
          <Text style={styles.distributionLabel}>{label}</Text>
        </View>
        <Text style={styles.distributionValue}>{formatNumber(value)}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: widthPercent, backgroundColor: color }]} />
      </View>
    </View>
  );
};

export default function DashboardScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const adminView = isAdminUser(user);
  const propertyAccessEnabled = canManagePropertiesUser(user);

  const sortedProperties = useMemo(() => {
    const cloned = [...properties];
    cloned.sort((left, right) => {
      const idDiff = parseNumber(right?.id ?? right?.property_id) - parseNumber(left?.id ?? left?.property_id);
      if (idDiff !== 0) return idDiff;
      const leftDate = propertyTimestamp(left);
      const rightDate = propertyTimestamp(right);
      return rightDate.localeCompare(leftDate);
    });
    return cloned;
  }, [properties]);

  const publishedCount = useMemo(
    () => sortedProperties.filter((property) => isPublishedProperty(property)).length,
    [sortedProperties]
  );
  const pendingCount = Math.max(0, sortedProperties.length - publishedCount);

  const ownerMetrics = useMemo(() => {
    const counts = new Map();
    sortedProperties.forEach((property) => {
      const key = propertyOwner(property);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [sortedProperties]);

  const typeDistribution = useMemo(() => {
    const counts = new Map();
    sortedProperties.forEach((property) => {
      const key = propertyType(property);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [sortedProperties]);

  const maxTypeCount = typeDistribution.length ? typeDistribution[0].count : 1;

  const viewsCountRaw = useMemo(
    () =>
      sumByKeys(sortedProperties, [
        'views_count',
        'view_count',
        'views',
        'visits',
        'counter',
        'detail_views',
        'ps_views_detail',
      ]),
    [sortedProperties]
  );

  const uniqueViewersRaw = useMemo(
    () =>
      sumByKeys(sortedProperties, ['unique_viewers', 'unique_view_count', 'reviewers_count', 'visitors_count']),
    [sortedProperties]
  );

  const contactClicksRaw = useMemo(
    () =>
      sumByKeys(sortedProperties, [
        'contact_clicks',
        'contacts_count',
        'phone_clicks',
        'whatsapp_clicks',
        'email_clicks',
        'messages_count',
      ]),
    [sortedProperties]
  );

  const searchViewsRaw = useMemo(
    () => sumByKeys(sortedProperties, ['search_views', 'search_view_count', 'views_search_count']),
    [sortedProperties]
  );

  const ownerUserIds = useMemo(() => {
    const owners = new Set();
    sortedProperties.forEach((property) => {
      const candidate = parseNumber(property?.user_id ?? property?.owner_id);
      if (candidate > 0) owners.add(candidate);
    });
    return owners.size;
  }, [sortedProperties]);

  const viewsCount = viewsCountRaw > 0 ? viewsCountRaw : sortedProperties.length;
  const uniqueViewersCount = uniqueViewersRaw > 0 ? uniqueViewersRaw : ownerUserIds;
  const contactClicks = contactClicksRaw > 0 ? contactClicksRaw : publishedCount;
  const searchViewsCount = searchViewsRaw > 0 ? searchViewsRaw : Math.max(sortedProperties.length, publishedCount);

  const recentProperties = useMemo(() => sortedProperties.slice(0, 6), [sortedProperties]);
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

              <View style={styles.insightsGrid}>
                <UiCard style={styles.card}>
                  <Text style={styles.cardEyebrow}>Bienvenido</Text>
                  <Text style={styles.cardTitle}>{welcomeName}</Text>
                  <Text style={styles.paragraph}>{welcomeEmail}</Text>
                </UiCard>

                {adminView ? (
                  <UiCard style={styles.card}>
                    <View style={styles.cardRowBetween}>
                      <Text style={styles.cardTitle}>Usuarios con inmuebles</Text>
                      <Text style={styles.cardHint}>Top activos</Text>
                    </View>
                    {ownerMetrics.length ? (
                      ownerMetrics.map((row) => (
                        <View key={row.label} style={styles.simpleRow}>
                          <Text style={styles.simpleRowLabel}>{row.label}</Text>
                          <Text style={styles.simpleRowValue}>{formatNumber(row.count)}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>Sin datos de usuarios para inmuebles.</Text>
                    )}
                  </UiCard>
                ) : null}
              </View>

              <UiCard style={styles.card}>
                <View style={styles.cardRowBetween}>
                  <Text style={styles.cardTitle}>Tipo de inmueble visitado</Text>
                  <Text style={styles.cardHint}>Distribucion por inmuebles</Text>
                </View>
                {typeDistribution.length ? (
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
                <UiCard style={[styles.card, styles.flexCard]}>
                  <Text style={styles.cardTitle}>Ultimos anuncios de propiedades</Text>
                  {recentProperties.length ? (
                    recentProperties.map((item) => (
                      <TouchableOpacity
                        key={propertyId(item)}
                        onPress={() => handlePropertyPress(item)}
                        style={styles.propertyItem}
                      >
                        <Text style={styles.propertyTitle}>{propertyTitle(item)}</Text>
                        <Text style={styles.propertySubtitle}>
                          {propertyType(item)} · {propertyCategory(item)}
                        </Text>
                        <Text style={styles.propertyMeta}>
                          {propertyAddress(item)}
                          {propertyCity(item) ? `, ${propertyCity(item)}` : ''}
                        </Text>
                        {adminView ? (
                          <Text style={styles.propertyOwner}>Usuario: {propertyOwner(item)}</Text>
                        ) : null}
                        <View style={styles.pricePill}>
                          <Text style={styles.pricePillText}>{formatPrice(propertyPrice(item))}</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No hay anuncios recientes.</Text>
                  )}
                </UiCard>

                <UiCard style={[styles.card, styles.activityCard]}>
                  <Text style={styles.cardTitle}>Actividad</Text>
                  <View style={styles.kpiRow}>
                    <Text style={styles.kpiLabel}>Vistas en detalle</Text>
                    <Text style={styles.kpiValue}>{formatNumber(viewsCount)}</Text>
                  </View>
                  <View style={styles.kpiRow}>
                    <Text style={styles.kpiLabel}>Vistas en busqueda</Text>
                    <Text style={styles.kpiValue}>{formatNumber(searchViewsCount)}</Text>
                  </View>
                  <View style={styles.kpiRow}>
                    <Text style={styles.kpiLabel}>Publicados</Text>
                    <Text style={styles.kpiValue}>{formatNumber(publishedCount)}</Text>
                  </View>
                  <View style={styles.kpiRow}>
                    <Text style={styles.kpiLabel}>Pendientes</Text>
                    <Text style={styles.kpiValue}>{formatNumber(pendingCount)}</Text>
                  </View>
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
  metricCard: {
    padding: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    minWidth: 210,
    flexGrow: 1,
  },
  metricAccent: { width: spacing.md, height: spacing.md, borderRadius: radius.full, marginBottom: spacing.sm },
  metricLabel: { color: colors.textMuted, ...typography.captionStrong },
  metricValue: { color: colors.textPrimary, marginTop: spacing.xs, ...typography.h1 },
  insightsGrid: { marginBottom: spacing.md },
  twoColumnGrid: { marginBottom: spacing.md },
  card: {
    marginBottom: spacing.md,
  },
  flexCard: { flex: 1 },
  activityCard: { flex: 1 },
  cardEyebrow: { color: colors.textMuted, ...typography.captionStrong, textTransform: 'uppercase' },
  cardTitle: { color: colors.textPrimary, ...typography.h2, marginBottom: spacing.xxs },
  cardHint: { color: colors.textMuted, ...typography.captionStrong },
  paragraph: { color: colors.textSoft, ...typography.body, lineHeight: 20 },
  cardRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  simpleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  simpleRowLabel: { color: colors.primary, ...typography.label, flex: 1, paddingRight: spacing.sm },
  simpleRowValue: { color: colors.textPrimary, ...typography.bodyStrong },
  emptyText: { color: colors.textMuted, ...typography.label, lineHeight: 18 },
  distributionRow: { marginBottom: spacing.md },
  distributionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xxs },
  distributionLabelWrap: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: spacing.sm },
  legendDot: { width: sizing.dot, height: sizing.dot, borderRadius: radius.full, marginRight: spacing.sm },
  distributionLabel: { color: colors.primary, ...typography.label },
  distributionValue: { color: colors.textPrimary, ...typography.label },
  progressTrack: { width: '100%', height: spacing.sm, borderRadius: radius.full, backgroundColor: colors.surfaceStrong, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.full },
  propertyItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  propertyTitle: { color: colors.textPrimary, ...typography.bodyStrong, marginBottom: spacing.xxs / 2 },
  propertySubtitle: { color: colors.textSoft, ...typography.caption, marginBottom: spacing.xxs / 2 },
  propertyMeta: { color: colors.textMuted, ...typography.caption, marginBottom: spacing.xxs / 2 },
  propertyOwner: { color: colors.primary, ...typography.caption, marginBottom: spacing.xs },
  pricePill: {
    marginTop: spacing.xxs,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs - 1,
    backgroundColor: colors.surfaceAccent,
  },
  pricePillText: { color: colors.accentStrong, ...typography.captionStrong },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  kpiLabel: { color: colors.textSoft, ...typography.label },
  kpiValue: { color: colors.textPrimary, ...typography.bodyStrong },
});
