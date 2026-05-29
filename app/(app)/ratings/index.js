import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card as UiCard, colors, spacing, typography } from '../../../components/ui';
import { getApiErrorDetails, getMyServiceRatingsDashboardApi } from '../../../api/client';
import { useAuthStore } from '../../../store/useAuthStore';
import { mapClientDashboardResponse } from '../../../utils/clientRatingsDashboard';

export default function ClientRatingsScreen() {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);

  const loadRatings = async () => {
    try {
      const payload = await getMyServiceRatingsDashboardApi();
      const mapped = mapClientDashboardResponse(payload);
      setItems(mapped.recentRatings || []);
    } catch (error) {
      const details = getApiErrorDetails(error);
      const apiCode = String(details?.data?.errors?.code || '');
      if (details.status === 401 || apiCode === 'UNAUTHENTICATED') {
        await logout();
        Alert.alert('Sesión expirada', 'Tu sesión expiró. Inicia sesión nuevamente.');
        return;
      }
      if (details.status === 403 && apiCode === 'ROLE_NOT_ALLOWED') {
        Alert.alert('Acceso restringido', 'Esta sección es exclusiva para clientes finales.');
        setItems([]);
        return;
      }
      Alert.alert('No se pudo cargar', 'Ocurrió un error al cargar tus valoraciones.');
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await loadRatings();
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadRatings();
    } finally {
      setRefreshing(false);
    }
  };

  const welcomeName = String(user?.first_name || user?.user_name || 'Cliente');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis valoraciones</Text>
        <Text style={styles.subtitle}>Historial de valoraciones de {welcomeName}</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {!items.length ? (
            <UiCard style={styles.card}>
              <Text style={styles.emptyText}>Aún no has realizado valoraciones.</Text>
            </UiCard>
          ) : (
            items.map((item) => (
              <UiCard key={item.id} style={styles.card}>
                <Text style={styles.provider}>{item.provider}</Text>
                <Text style={styles.stars}>{'★'.repeat(item.stars)}{'☆'.repeat(5 - item.stars)}</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Fecha:</Text>
                  <Text style={styles.value}>{item.dateLabel || '-'}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Hora:</Text>
                  <Text style={styles.value}>{item.timeLabel || '-'}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Código:</Text>
                  <Text style={styles.value}>{item.workCode || 'Código no disponible'}</Text>
                </View>
              </UiCard>
            ))
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
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { marginTop: spacing.xxs, color: colors.textMuted, ...typography.body },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxxl },
  card: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#D8E2EF',
    borderRadius: 14,
    backgroundColor: '#F7FAFE',
  },
  provider: {
    ...typography.h3,
    color: '#152E55',
    marginBottom: 2,
  },
  stars: {
    fontSize: 18,
    color: '#F4B400',
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: spacing.xs,
  },
  label: {
    ...typography.captionStrong,
    color: '#436082',
  },
  value: {
    ...typography.body,
    color: '#233E63',
    flex: 1,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
