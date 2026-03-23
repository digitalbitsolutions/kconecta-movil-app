import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiErrorDetails, getMeApi, getPropertyByIdApi } from '../../../../api/client';
import {
  ApartmentDetailView,
  GarageDetailView,
  getPropertyDetailVariant,
  HouseChaletDetailView,
  LandDetailView,
  LocalPremisesDetailView,
  PropertyCardDetailed,
  RusticHouseDetailView,
} from '../../../../components/property';
import { Button as UiButton, Card as UiCard, colors, spacing, typography } from '../../../../components/ui';
import { useAuthStore } from '../../../../store/useAuthStore';
import { canEditPropertyUser } from '../../../../utils/userPermissions';

const EXCLUDED_KEYS = new Set([
  'image',
  'photo',
  'cover_image',
  'cover_image_url',
  'image_url',
  'images',
  'more_images',
  'gallery',
  'files',
  'updated_at_human',
  'created_at_human',
]);

const PRIORITY_FIELDS = [
  'title',
  'reference',
  'status',
  'operation_type',
  'type_name',
  'category_name',
  'price',
  'sale_price',
  'rental_price',
  'meters_built',
  'useful_meters',
  'plot_meters',
  'bedrooms',
  'bathrooms',
  'city',
  'province',
  'country',
  'address',
  'postal_code',
  'updated_at',
  'created_at',
];

const PRIORITY_MAP = PRIORITY_FIELDS.reduce((acc, key, index) => {
  acc[key] = index;
  return acc;
}, {});

const pickString = (...values) => {
  for (let index = 0; index < values.length; index += 1) {
    const current = values[index];
    if (typeof current === 'string' && current.trim()) return current.trim();
    if (typeof current === 'number' && Number.isFinite(current)) return String(current);
  }
  return '';
};

const humanizeKey = (key) =>
  String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatValue = (value) => {
  if (value === null || value === undefined) return '';

  if (typeof value === 'boolean') return value ? 'Si' : 'No';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === 'null') return '';
    return trimmed;
  }

  if (Array.isArray(value)) {
    const parts = value.map((entry) => formatValue(entry)).filter(Boolean);
    return parts.join(', ');
  }

  if (typeof value === 'object') {
    const direct = pickString(value?.name, value?.label, value?.title, value?.value, value?.id);
    if (direct) return direct;
    const serialized = JSON.stringify(value);
    if (serialized === '{}' || serialized === '[]') return '';
    return serialized.length > 200 ? `${serialized.slice(0, 200)}...` : serialized;
  }

  return '';
};

const extractPropertyObject = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  if (payload.property && typeof payload.property === 'object') return extractPropertyObject(payload.property);
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return extractPropertyObject(payload.data);
  }
  return payload;
};

const extractUserObject = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  if (payload.user && typeof payload.user === 'object') return payload.user;
  if (payload.data?.user && typeof payload.data.user === 'object') return payload.data.user;
  if (payload.data && typeof payload.data === 'object' && payload.data.id) return payload.data;
  if (payload.id) return payload;
  return null;
};

const buildDetailRows = (property) => {
  if (!property || typeof property !== 'object') return [];

  const rows = Object.entries(property).reduce((acc, [key, rawValue]) => {
    if (EXCLUDED_KEYS.has(key)) return acc;
    const value = formatValue(rawValue);
    if (!value) return acc;
    acc.push({ key, label: humanizeKey(key), value });
    return acc;
  }, []);

  rows.sort((left, right) => {
    const leftRank = PRIORITY_MAP[left.key] ?? 9999;
    const rightRank = PRIORITY_MAP[right.key] ?? 9999;
    if (leftRank !== rightRank) return leftRank - rightRank;
    return left.label.localeCompare(right.label, 'es');
  });

  return rows;
};

export default function PropertyPreviewScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setErrorText('No se recibio id de propiedad.');
      return;
    }

    let cancelled = false;
    const loadPreview = async () => {
      setLoading(true);
      setErrorText('');
      try {
        const payload = await getPropertyByIdApi(id);
        const propertyObject = extractPropertyObject(payload);
        if (!propertyObject) {
          throw new Error('No se recibieron datos del inmueble.');
        }
        if (!cancelled) setProperty(propertyObject);
      } catch (error) {
        if (cancelled) return;
        const details = getApiErrorDetails(error);
        setErrorText(details.message || 'No se pudo cargar el anuncio.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    const loadCurrentUser = async () => {
      if (user) return;

      try {
        const response = await getMeApi();
        const currentUser = extractUserObject(response);
        if (!cancelled && currentUser?.id) {
          setUser(currentUser);
        }
      } catch (_error) {
        // Keep preview usable even if /me fails; edit button will stay hidden.
      }
    };

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [setUser, user]);

  const detailRows = useMemo(() => buildDetailRows(property), [property]);
  const detailVariant = useMemo(() => getPropertyDetailVariant(property), [property]);
  const activeDetail = detailVariant?.detail;
  const canEdit = useMemo(() => canEditPropertyUser(user, property), [property, user]);

  const openExternalUrl = async (url, title) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (_error) {
      Alert.alert(title, 'No se pudo abrir el enlace solicitado.');
    }
  };

  const handleShare = async () => {
    if (!activeDetail?.shareUrl) return;
    try {
      await Share.share({
        title: activeDetail.title,
        message: activeDetail.shareUrl,
        url: activeDetail.shareUrl,
      });
    } catch (_error) {
      Alert.alert('Compartir', 'No se pudo compartir el inmueble.');
    }
  };

  const detailViewProps = activeDetail
    ? {
        detail: activeDetail,
        onOpenMap: () => openExternalUrl(activeDetail.mapUrl, 'Mapa'),
        onOpenPage: () => openExternalUrl(activeDetail.pageUrl, 'Sitio web'),
        onOpenVideo: () => openExternalUrl(activeDetail.videoUrl, 'Video'),
        onCall: () => openExternalUrl(activeDetail.contact?.phoneUrl, 'Llamar'),
        onMessage: () => openExternalUrl(activeDetail.contact?.emailUrl, 'Enviar mensaje'),
        onShare: handleShare,
      }
    : null;

  const renderDetailView = () => {
    if (!detailViewProps) {
      return (
        <>
          <PropertyCardDetailed item={property} onPress={() => {}} showOwner showActions={false} style={styles.previewCard} />

          <UiCard style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Ficha completa</Text>
            {detailRows.length ? (
              detailRows.map((row) => (
                <View key={row.key} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={styles.detailValue}>{row.value}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No hay datos adicionales para mostrar.</Text>
            )}
          </UiCard>
        </>
      );
    }

    switch (detailVariant.kind) {
      case 'houseChalet':
        return <HouseChaletDetailView {...detailViewProps} />;
      case 'localPremises':
        return <LocalPremisesDetailView {...detailViewProps} />;
      case 'apartment':
        return <ApartmentDetailView {...detailViewProps} />;
      case 'rusticHouse':
        return <RusticHouseDetailView {...detailViewProps} />;
      case 'garage':
        return <GarageDetailView {...detailViewProps} />;
      case 'land':
        return <LandDetailView {...detailViewProps} />;
      default:
        return (
          <>
            <PropertyCardDetailed item={property} onPress={() => {}} showOwner showActions={false} style={styles.previewCard} />

            <UiCard style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Ficha completa</Text>
              {detailRows.length ? (
                detailRows.map((row) => (
                  <View key={row.key} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <Text style={styles.detailValue}>{row.value}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No hay datos adicionales para mostrar.</Text>
              )}
            </UiCard>
          </>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <UiButton label="Volver" variant="secondary" onPress={() => router.back()} style={styles.headerAction} />
          {canEdit ? (
            <UiButton
              label="Editar"
              onPress={() => (id ? router.push({ pathname: '/properties/new', params: { mode: 'edit', id } }) : null)}
              style={styles.headerAction}
              disabled={!id}
            />
          ) : null}
        </View>

        <Text style={styles.title}>Vista previa del anuncio</Text>
        <Text style={styles.subtitle}>Visualizacion interna en app movil.</Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Cargando anuncio...</Text>
          </View>
        ) : errorText ? (
          <UiCard style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Error</Text>
            <Text style={styles.errorText}>{errorText}</Text>
          </UiCard>
        ) : (
          renderDetailView()
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  headerAction: {
    flex: 1,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.xxs,
    marginBottom: spacing.lg,
    ...typography.body,
    color: colors.textSecondary,
  },
  centered: {
    paddingTop: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    ...typography.body,
    color: colors.textSecondary,
  },
  noticeCard: {
    borderColor: colors.dangerSoft,
  },
  noticeTitle: {
    ...typography.h2,
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  errorText: {
    ...typography.body,
    color: colors.textSoft,
  },
  previewCard: {
    marginBottom: spacing.md,
  },
  detailsCard: {
    marginBottom: spacing.lg,
  },
  detailsTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  detailRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    ...typography.captionStrong,
    color: colors.textSoft,
    marginBottom: spacing.xxs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
