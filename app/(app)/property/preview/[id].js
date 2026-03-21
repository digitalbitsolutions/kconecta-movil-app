import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiErrorDetails, getPropertyByIdApi } from '../../../../api/client';
import { PropertyCardDetailed } from '../../../../components/property';

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

  const detailRows = useMemo(() => buildDetailRows(property), [property]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>Volver</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => (id ? router.push({ pathname: '/properties/new', params: { mode: 'edit', id } }) : null)}
            style={styles.editButton}
          >
            <Text style={styles.editText}>Editar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Vista previa del anuncio</Text>
        <Text style={styles.subtitle}>Visualizacion interna en app movil.</Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Cargando anuncio...</Text>
          </View>
        ) : errorText ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Error</Text>
            <Text style={styles.errorText}>{errorText}</Text>
          </View>
        ) : (
          <>
            <PropertyCardDetailed item={property} onPress={() => {}} showOwner showActions={false} style={styles.previewCard} />

            <View style={styles.detailsCard}>
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
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EEF3F8',
  },
  content: {
    padding: 14,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  editButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 10,
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  centered: {
    paddingTop: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 14,
  },
  noticeCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    padding: 12,
  },
  noticeTitle: {
    color: '#B91C1C',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  errorText: {
    color: '#7F1D1D',
    fontSize: 13,
    lineHeight: 18,
  },
  previewCard: {
    marginBottom: 12,
  },
  detailsCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D5DFEA',
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  detailsTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  detailRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  detailLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
