import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

const normalizeText = (value) => pickString(value).toLowerCase();

const resolveType = (property) =>
  pickString(property?.type_name, property?.type, property?.property_type, property?.type_label, 'Sin tipo');

const resolveCategory = (property) =>
  pickString(
    property?.category_name,
    property?.category,
    property?.operation_type,
    property?.operation,
    'Sin categoria'
  );

const resolveStatus = (property) =>
  pickString(property?.status, property?.state, property?.publication_status, property?.visibility, 'pendiente');

const statusLabel = (rawStatus) => {
  const lowered = normalizeText(rawStatus);
  if (!lowered) return 'Pendiente';
  if (lowered.includes('public') || lowered === '1' || lowered === 'active') return 'Publicado';
  if (lowered.includes('pend') || lowered === '0' || lowered === 'inactive') return 'Pendiente';
  return rawStatus;
};

const FilterChip = ({ label, selected, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.filterChip, selected ? styles.filterChipActive : null]}>
    <Text style={[styles.filterChipText, selected ? styles.filterChipTextActive : null]}>{label}</Text>
  </TouchableOpacity>
);

export default function PropertiesScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [canManage, setCanManage] = useState(true);
  const [adminView, setAdminView] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todas');

  const sortedProperties = useMemo(() => {
    const cloned = [...properties];
    cloned.sort((left, right) => resolveDate(right).localeCompare(resolveDate(left)));
    return cloned;
  }, [properties]);

  const statusOptions = useMemo(() => {
    const options = new Set(['Todos']);
    sortedProperties.forEach((property) => options.add(statusLabel(resolveStatus(property))));
    return [...options];
  }, [sortedProperties]);

  const typeOptions = useMemo(() => {
    const options = new Set(['Todos']);
    sortedProperties.forEach((property) => options.add(resolveType(property)));
    return [...options];
  }, [sortedProperties]);

  const categoryOptions = useMemo(() => {
    const options = new Set(['Todas']);
    sortedProperties.forEach((property) => options.add(resolveCategory(property)));
    return [...options];
  }, [sortedProperties]);

  const filteredProperties = useMemo(() => {
    const search = normalizeText(searchText);

    return sortedProperties.filter((property) => {
      const title = normalizeText(property?.title ?? property?.name ?? property?.reference);
      const reference = normalizeText(property?.reference);
      const owner = normalizeText(resolveOwner(property));
      const status = statusLabel(resolveStatus(property));
      const type = resolveType(property);
      const category = resolveCategory(property);

      if (search && !title.includes(search) && !reference.includes(search) && !owner.includes(search)) {
        return false;
      }

      if (statusFilter !== 'Todos' && status !== statusFilter) {
        return false;
      }

      if (typeFilter !== 'Todos' && type !== typeFilter) {
        return false;
      }

      if (categoryFilter !== 'Todas' && category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [sortedProperties, searchText, statusFilter, typeFilter, categoryFilter]);

  const resetFilters = () => {
    setSearchText('');
    setStatusFilter('Todos');
    setTypeFilter('Todos');
    setCategoryFilter('Todas');
  };

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
        <View style={styles.titleRow}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{adminView ? 'Propiedades' : 'Mis propiedades'}</Text>
            <Text style={styles.subtitle}>
              {adminView ? 'Vista administrador: inmuebles de todos los usuarios.' : 'Tus inmuebles registrados.'}
            </Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/properties/new')}>
            <Text style={styles.addButtonText}>Agregar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filtersCard}>
          <Text style={styles.filtersTitle}>Listado</Text>
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar por titulo, referencia o usuario"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />

          <Text style={styles.filterGroupLabel}>Estado</Text>
          <View style={styles.chipsWrap}>
            {statusOptions.map((option) => (
              <FilterChip
                key={`status-${option}`}
                label={option}
                selected={statusFilter === option}
                onPress={() => setStatusFilter(option)}
              />
            ))}
          </View>

          <Text style={styles.filterGroupLabel}>Tipo</Text>
          <View style={styles.chipsWrap}>
            {typeOptions.map((option) => (
              <FilterChip
                key={`type-${option}`}
                label={option}
                selected={typeFilter === option}
                onPress={() => setTypeFilter(option)}
              />
            ))}
          </View>

          <Text style={styles.filterGroupLabel}>Categoria</Text>
          <View style={styles.chipsWrap}>
            {categoryOptions.map((option) => (
              <FilterChip
                key={`category-${option}`}
                label={option}
                selected={categoryFilter === option}
                onPress={() => setCategoryFilter(option)}
              />
            ))}
          </View>

          <View style={styles.filtersFooter}>
            <Text style={styles.resultsCount}>{filteredProperties.length} inmuebles</Text>
            <TouchableOpacity onPress={resetFilters} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Limpiar</Text>
            </TouchableOpacity>
          </View>
        </View>

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

            {filteredProperties.length ? (
              filteredProperties.map((item, index) => (
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWrap: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    alignSelf: 'center',
    backgroundColor: '#14B8A6',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  filtersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
  },
  filtersTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  searchInput: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  filterGroupLabel: {
    marginTop: 10,
    marginBottom: 6,
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  filterChip: {
    marginHorizontal: 4,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#60A5FA',
  },
  filterChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#1D4ED8',
  },
  filtersFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsCount: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  clearBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
  },
  clearBtnText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
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
