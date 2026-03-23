import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { uiAlert } from '../../../utils/uiAlert';
import { apiClient, getApiErrorDetails, getMeApi, getPropertiesApi } from '../../../api/client';
import { useAuthStore } from '../../../store/useAuthStore';
import { PropertyCardCompact } from '../../../components/property';
import { canManagePropertiesUser, isAdminUser } from '../../../utils/userPermissions';
import { colors, spacing, typography, radius } from '../../../components/ui';
import {
  extractProperties,
  extractUser,
  parseNumber,
  propertyId,
} from '../../../utils/dataMappers';

import { 
  filterProperties, 
  getFilterOptions, 
  resolveStatusLabel 
} from '../../../components/property/list/propertyListHelpers';
import { PropertyFilters } from '../../../components/property/list/PropertyFilters';

export default function PropertiesScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [canManage, setCanManage] = useState(true);
  const [adminView, setAdminView] = useState(false);
  
  // Estados de Filtro
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todas');

  const { statusOptions, typeOptions, categoryOptions } = useMemo(
    () => getFilterOptions(properties), 
    [properties]
  );

  const filteredProperties = useMemo(() => {
    return filterProperties(properties, { 
      searchText, 
      statusFilter, 
      typeFilter, 
      categoryFilter 
    });
  }, [properties, searchText, statusFilter, typeFilter, categoryFilter]);

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
    const id = propertyId(item);
    if (!id) return;
    router.push({ pathname: '/property/[id]', params: { id } });
  };

  const handleEdit = (item) => {
    const id = propertyId(item);
    if (!id) return;
    router.push({ pathname: '/properties/new', params: { mode: 'edit', id } });
  };

  const handleOpenAnnouncement = (item) => {
    const id = propertyId(item);
    if (!id) return;
    router.push({ pathname: '/property/preview/[id]', params: { id } });
  };

  const handleDelete = (item) => {
    console.log('[Properties] Requesting delete for item:', item.id);
    const id = propertyId(item);
    if (!id) return;

    uiAlert(
      'Eliminar propiedad', 
      'Esta accion es definitiva. Seguro que quieres eliminar esta propiedad?', 
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/agent/properties/${id}`);
              setProperties((prev) => prev.filter((candidate) => propertyId(candidate) !== id));
            } catch (error) {
              const details = getApiErrorDetails(error);
              uiAlert('Eliminar', details.message || 'No se pudo eliminar la propiedad.', [{ text: 'OK' }]);
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = (item) => {
    const id = propertyId(item);
    if (!id) return;

    const currentStateId = parseNumber(item?.state_id ?? item?.status_id);
    const nextStateId = currentStateId === 5 ? 4 : 5;
    const actionLabel = nextStateId === 5 ? 'deshabilitar' : 'habilitar';

    Alert.alert(
      'Cambiar estado',
      `Vas a ${actionLabel} esta propiedad. Puede afectar su visibilidad en listados. Quieres continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const response = await apiClient.patch(`/agent/properties/${id}`, { state_id: nextStateId });
              const updated = response?.data?.data || response?.data || {};
              setProperties((prev) =>
                prev.map((candidate) => {
                  if (propertyId(candidate) !== id) return candidate;
                  return {
                    ...candidate,
                    ...updated,
                    state_id: parseNumber(updated?.state_id ?? nextStateId),
                    state: updated?.state ?? (nextStateId === 5 ? 'inactive' : 'active'),
                    status: updated?.status ?? (nextStateId === 5 ? 'inactivo' : 'publicado'),
                  };
                })
              );
            } catch (error) {
              const details = getApiErrorDetails(error);
              Alert.alert('Estado', details.message || 'No se pudo actualizar el estado.');
            }
          },
        },
      ]
    );
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

        <PropertyFilters 
          searchText={searchText}
          setSearchText={setSearchText}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          statusOptions={statusOptions}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          typeOptions={typeOptions}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          categoryOptions={categoryOptions}
          resultsCount={filteredProperties.length}
          onReset={resetFilters}
        />

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.accent} />
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
                <PropertyCardCompact
                  key={`${propertyId(item) || 'property'}-${index}`}
                  item={item}
                  onPress={() => openProperty(item)}
                  onEdit={() => handleEdit(item)}
                  onToggleStatus={() => handleToggleStatus(item)}
                  onDelete={() => handleDelete(item)}
                  onOpen={() => handleOpenAnnouncement(item)}
                  showOwner={adminView}
                />
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
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  titleWrap: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    ...typography.h1,
  },
  subtitle: {
    marginTop: 4,
    color: colors.textSoft,
    ...typography.body,
    fontWeight: '600',
  },
  addButton: {
    alignSelf: 'center',
    backgroundColor: colors.success,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    ...typography.label,
    fontWeight: '800',
  },
  centered: {
    paddingTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    marginTop: 8,
    color: colors.textMuted,
    ...typography.body,
    lineHeight: 19,
  },
  noticeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 10,
  },
  noticeTitle: {
    color: colors.textPrimary,
    ...typography.h2,
    marginBottom: 6,
  },
  errorText: {
    color: colors.danger,
    ...typography.label,
    lineHeight: 18,
  },
});
