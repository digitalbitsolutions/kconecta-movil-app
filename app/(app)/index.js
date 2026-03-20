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
import { useAuthStore } from '../../store/useAuthStore';
import { getApiErrorDetails, getMeApi, getPropertiesApi } from '../../api/client';

const parseNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const formatNumber = (value) => new Intl.NumberFormat('es-ES').format(parseNumber(value));
const formatPrice = (value) => {
  if (!parseNumber(value)) return 'Sin precio';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(parseNumber(value));
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
  if (payload?.data && typeof payload.data === 'object' && payload.data.id) return payload.data;
  if (payload?.id) return payload;
  return null;
};

const extractProperties = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.properties)) return payload.properties;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const userLevelName = (rawUser) => {
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

const isAdminUser = (rawUser) => {
  if (!rawUser) return false;
  const levelId = parseNumber(rawUser?.user_level_id ?? rawUser?.level_id ?? rawUser?.role_id);
  if (levelId === 1) return true;
  const roleText = pickString(rawUser?.role, rawUser?.user_level_name).toLowerCase();
  return roleText.includes('admin');
};

const canManagePropertiesUser = (rawUser) => {
  if (!rawUser) return false;
  const levelId = parseNumber(rawUser?.user_level_id ?? rawUser?.level_id ?? rawUser?.role_id);
  return levelId === 1 || levelId === 2 || levelId === 3 || levelId === 5;
};

const propertyId = (property) =>
  pickString(property?.id, property?.property_id, property?.propertyId, property?.reference);

const propertyTitle = (property) =>
  pickString(property?.title, property?.name, property?.reference, 'Inmueble sin titulo');

const propertyType = (property) =>
  pickString(property?.type_name, property?.type, property?.property_type, property?.type_label, 'Sin tipo');

const propertyCategory = (property) =>
  pickString(
    property?.category_name,
    property?.category,
    property?.operation_type,
    property?.operation,
    'Sin categoria'
  );

const propertyAddress = (property) =>
  pickString(property?.address, property?.address_line, property?.location, property?.street);

const propertyCity = (property) => pickString(property?.city, property?.province, property?.country);

const propertyOwner = (property) => {
  const firstName = pickString(property?.user_first_name, property?.owner_first_name);
  const lastName = pickString(property?.user_last_name, property?.owner_last_name);
  const fullName = `${firstName} ${lastName}`.trim();
  return pickString(
    fullName,
    property?.user_name,
    property?.owner_name,
    property?.agency_name,
    `Usuario #${parseNumber(property?.user_id) || 0}`
  );
};

const propertyTimestamp = (property) =>
  pickString(property?.updated_at, property?.created_at, property?.date, property?.published_at);

const propertyPrice = (property) =>
  parseNumber(
    property?.price ??
      property?.sale_price ??
      property?.rental_price ??
      property?.amount ??
      property?.cost
  );

const isPublishedProperty = (property) => {
  const statusText = pickString(
    property?.status,
    property?.state,
    property?.publication_status,
    property?.visibility
  ).toLowerCase();

  if (statusText.includes('public')) return true;
  if (statusText === '1' || statusText === 'active' || statusText === 'published') return true;
  if (parseNumber(property?.is_hidden) === 0 && property?.is_hidden !== undefined) return true;
  if (parseNumber(property?.is_active) === 1 || parseNumber(property?.active) === 1) return true;
  return false;
};

const sumByKeys = (items, keys) =>
  items.reduce((total, item) => {
    for (let index = 0; index < keys.length; index += 1) {
      const candidate = parseNumber(item?.[keys[index]]);
      if (candidate > 0) return total + candidate;
    }
    return total;
  }, 0);

const StatsCard = ({ label, value, accent }) => (
  <View style={styles.metricCard}>
    <View style={[styles.metricAccent, { backgroundColor: accent }]} />
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{formatNumber(value)}</Text>
  </View>
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
  const { logout, user, setUser } = useAuthStore();
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
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Cerrar sesion</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Cargando dashboard de inmuebles...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {!propertyAccessEnabled ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Modulo inmuebles</Text>
              <Text style={styles.paragraph}>
                Esta etapa movil esta enfocada en gestion de inmuebles. Tu perfil actual no tiene permisos
                para este modulo.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.metricsGrid}>
                <StatsCard label="Clicks en alguna propiedad" value={viewsCount} accent="#16A34A" />
                <StatsCard label="Usuarios que revisaron propiedades" value={uniqueViewersCount} accent="#3B82F6" />
                <StatsCard label="Clicks en contacto" value={contactClicks} accent="#F97316" />
              </View>

              <View style={styles.insightsGrid}>
                <View style={styles.card}>
                  <Text style={styles.cardEyebrow}>Bienvenido</Text>
                  <Text style={styles.cardTitle}>{welcomeName}</Text>
                  <Text style={styles.paragraph}>{welcomeEmail}</Text>
                </View>

                {adminView ? (
                  <View style={styles.card}>
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
                  </View>
                ) : null}
              </View>

              <View style={styles.card}>
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
                      color={['#14B8A6', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B'][index % 6]}
                    />
                  ))
                ) : (
                  <Text style={styles.emptyText}>Sin datos de tipos de inmueble.</Text>
                )}
              </View>

              <View style={styles.twoColumnGrid}>
                <View style={[styles.card, styles.flexCard]}>
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
                </View>

                <View style={[styles.card, styles.activityCard]}>
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
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#EEF3F8' },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 30, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { marginTop: 4, color: '#64748B', fontSize: 14, fontWeight: '600' },
  logoutBtn: {
    backgroundColor: '#E11D48',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  logoutText: { color: '#FFFFFF', fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, color: '#64748B', fontSize: 14 },
  content: { padding: 14, paddingBottom: 24 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 210,
    flexGrow: 1,
  },
  metricAccent: { width: 12, height: 12, borderRadius: 99, marginBottom: 8 },
  metricLabel: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  metricValue: { color: '#0F172A', fontSize: 31, fontWeight: '800', marginTop: 6 },
  insightsGrid: { marginBottom: 12 },
  twoColumnGrid: { marginBottom: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  flexCard: { flex: 1 },
  activityCard: { flex: 1 },
  cardEyebrow: { color: '#94A3B8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  cardTitle: { color: '#0F172A', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  cardHint: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  paragraph: { color: '#475569', fontSize: 14, lineHeight: 20 },
  cardRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  simpleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 6,
  },
  simpleRowLabel: { color: '#1E293B', fontSize: 13, fontWeight: '600', flex: 1, paddingRight: 8 },
  simpleRowValue: { color: '#0F172A', fontWeight: '800', fontSize: 14 },
  emptyText: { color: '#64748B', fontSize: 13, lineHeight: 18 },
  distributionRow: { marginBottom: 10 },
  distributionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  distributionLabelWrap: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 },
  legendDot: { width: 9, height: 9, borderRadius: 99, marginRight: 8 },
  distributionLabel: { color: '#1E293B', fontWeight: '600', fontSize: 13 },
  distributionValue: { color: '#0F172A', fontWeight: '800', fontSize: 13 },
  progressTrack: { width: '100%', height: 8, borderRadius: 99, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  propertyItem: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  propertyTitle: { color: '#0F172A', fontWeight: '800', fontSize: 14, marginBottom: 2 },
  propertySubtitle: { color: '#475569', fontWeight: '600', fontSize: 12, marginBottom: 2 },
  propertyMeta: { color: '#64748B', fontSize: 12, marginBottom: 2 },
  propertyOwner: { color: '#334155', fontSize: 12, marginBottom: 6 },
  pricePill: {
    marginTop: 4,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#DBEAFE',
  },
  pricePillText: { color: '#1D4ED8', fontSize: 12, fontWeight: '800' },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 9,
  },
  kpiLabel: { color: '#475569', fontSize: 13, fontWeight: '600' },
  kpiValue: { color: '#0F172A', fontWeight: '800', fontSize: 14 },
});
