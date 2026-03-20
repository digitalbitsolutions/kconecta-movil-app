import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient, getApiErrorDetails } from '../../../api/client';

const pickString = (...values) => {
  for (let index = 0; index < values.length; index += 1) {
    const current = values[index];
    if (typeof current === 'string' && current.trim()) return current.trim();
    if (typeof current === 'number' && Number.isFinite(current)) return String(current);
  }
  return '';
};

const formatPrice = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Sin precio';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setErrorText('No se recibio id de propiedad.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorText('');
      try {
        const response = await apiClient.get(`/agent/properties/${id}`);
        setProperty(response?.data || null);
      } catch (error) {
        const details = getApiErrorDetails(error);
        setErrorText(details.message || 'No se pudo cargar la propiedad.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const title = pickString(property?.title, property?.name, `Propiedad #${id}`);
  const category = pickString(property?.category_name, property?.category, 'Sin categoria');
  const type = pickString(property?.type_name, property?.type, 'Sin tipo');
  const address = pickString(property?.address, property?.address_line, property?.location, 'Sin direccion');
  const city = pickString(property?.city, property?.province);
  const price = property?.price ?? property?.sale_price ?? property?.rental_price;
  const owner = pickString(
    property?.user_name,
    property?.owner_name,
    property?.user_first_name,
    property?.owner_first_name
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Cargando propiedad...</Text>
          </View>
        ) : errorText ? (
          <View style={styles.card}>
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorText}>{errorText}</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              {type} · {category}
            </Text>
            <Text style={styles.address}>
              {address}
              {city ? `, ${city}` : ''}
            </Text>
            <Text style={styles.price}>{formatPrice(price)}</Text>
            {owner ? <Text style={styles.meta}>Usuario: {owner}</Text> : null}
          </View>
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
  backButton: {
    marginBottom: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backText: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#475569',
    fontSize: 14,
    marginTop: 4,
  },
  address: {
    color: '#334155',
    fontSize: 14,
    marginTop: 10,
  },
  price: {
    color: '#1D4ED8',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 14,
  },
  meta: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 8,
  },
  errorTitle: {
    color: '#B91C1C',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  errorText: {
    color: '#7F1D1D',
    fontSize: 14,
  },
});
