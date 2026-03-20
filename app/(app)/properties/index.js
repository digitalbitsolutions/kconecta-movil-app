import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getApiErrorDetails, getMeApi, getPropertiesApi } from '../../../api/client';
import { useAuthStore } from '../../../store/useAuthStore';
import PropertyCard from '../../../components/PropertyCard';

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

const isAdminUser = (rawUser) => {
  const levelId = parseNumber(rawUser?.user_level_id ?? rawUser?.level_id ?? rawUser?.role_id);
  if (levelId === 1) return true;
  const roleText = pickString(rawUser?.role, rawUser?.user_level_name).toLowerCase();
  return roleText.includes('admin');
};

const canManagePropertiesUser = (rawUser) => {
  const levelId = parseNumber(rawUser?.user_level_id ?? rawUser?.level_id ?? rawUser?.role_id);
  return levelId === 1 || levelId === 2 || levelId === 3 || levelId === 5;
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

const resolveId = (property) =>
  pickString(property?.id, property?.property_id, property?.propertyId, property?.reference);

const resolveOwner = (property) => {
  const firstName = pickString(property?.user_first_name, property?.owner_first_name);
  const lastName = pickString(property?.user_last_name, property?.owner_last_name);
  const fullName = `${firstName} ${lastName}`.trim();
  return pickString(fullName, property?.user_name, property?.owner_name, 'Sin propietario');
};

const resolveDate = (property) =>
  pickString(property?.updated_at, property?.created_at, property?.date, property?.published_at);

export default function PropertiesScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [canManage, setCanManage] = useState(true);
  const [adminView, setAdminView] = useState(false);

  const sortedProperties = useMemo(() => {
    const cloned = [...properties];
    cloned.sort((left, right) => resolveDate(right).localeCompare(resolveDate(left)));
    return cloned;
  }, [properties]);

  const loadProperties = async () => {
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

    const hasPermissions = canManagePropertiesUser(effectiveUser);
    setCanManage(hasPermissions);
    const isAdmin = isAdminUser(effectiveUser);
    setAdminView(isAdmin);

    if (!hasPermissions) {
      setProperties([]);
      return;
    }

    try {
      const payload = await getPropertiesApi({ adminView: isAdmin, perPage: 250 });
      setProperties(extractProperties(payload));
    } catch (error) {
      const details = getApiErrorDetails(error);
      setErrorText((prev) => (prev ? `${prev} | /agent/properties -> ${details.message}` : details.message));
      setProperties([]);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await loadProperties();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadProperties();
    } finally {
      setRefreshing(false);
    }
  };

  const openProperty = (item) => {
    const id = resolveId(item);
    if (!id) return;
    router.push({ pathname: '/property/[id]', params: { id } });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Mis propiedades</Text>
        <Text style={styles.subtitle}>
          {adminView ? 'Vista administrador: inmuebles de todos los usuarios.' : 'Tus inmuebles registrados.'}
        </Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.note}>Cargando propiedades...</Text>
          </View>
        ) : !canManage ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Sin permiso para inmuebles</Text>
            <Text style={styles.note}>
              Este perfil no tiene acceso al modulo de gestion de inmuebles en la app movil.
            </Text>
          </View>
        ) : (
          <>
            {errorText ? (
              <View style={styles.noticeCard}>
                <Text style={styles.noticeTitle}>Algunas secciones no cargaron</Text>
                <Text style={styles.errorText}>{errorText}</Text>
              </View>
            ) : null}

            {sortedProperties.length ? (
              sortedProperties.map((item, index) => (
                <TouchableOpacity key={`${resolveId(item) || 'property'}-${index}`} onPress={() => openProperty(item)}>
                  <PropertyCard item={item} />
                  {adminView ? <Text style={styles.ownerText}>Usuario: {resolveOwner(item)}</Text> : null}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noticeCard}>
                <Text style={styles.noticeTitle}>Sin resultados</Text>
                <Text style={styles.note}>No hay propiedades para mostrar.</Text>
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
    paddingBottom: 26,
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
  noticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  noticeTitle: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 6,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 18,
  },
  ownerText: {
    marginTop: -4,
    marginBottom: 10,
    marginLeft: 8,
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
});
