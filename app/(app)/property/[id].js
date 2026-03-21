import React, { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient, getApiErrorDetails } from '../../../api/client';
import { PropertyCardDetailed } from '../../../components/property';

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

  const handleEdit = () => {
    if (!id) return;
    router.push({ pathname: '/properties/new', params: { mode: 'edit', id } });
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Eliminar propiedad', 'Esta accion es definitiva. Seguro que quieres eliminar esta propiedad?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/agent/properties/${id}`);
            router.replace('/properties');
          } catch (error) {
            const details = getApiErrorDetails(error);
            Alert.alert('Eliminar', details.message || 'No se pudo eliminar la propiedad.');
          }
        },
      },
    ]);
  };

  const handleToggleStatus = () => {
    if (!id || !property) return;
    const currentState = Number(property?.state_id ?? 4);
    const nextState = currentState === 5 ? 4 : 5;
    const label = nextState === 5 ? 'deshabilitar' : 'habilitar';

    Alert.alert(
      'Cambiar estado',
      `Vas a ${label} esta propiedad. Puede afectar su visibilidad en listados. Quieres continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const response = await apiClient.patch(`/agent/properties/${id}`, { state_id: nextState });
              const updated = response?.data?.data || response?.data || {};
              setProperty((prev) => ({
                ...(prev || {}),
                ...updated,
                state_id: Number(updated?.state_id ?? nextState),
                state: updated?.state ?? (nextState === 5 ? 'inactive' : 'active'),
                status: updated?.status ?? (nextState === 5 ? 'inactivo' : 'publicado'),
              }));
            } catch (error) {
              const details = getApiErrorDetails(error);
              Alert.alert('Estado', details.message || 'No se pudo actualizar el estado.');
            }
          },
        },
      ]
    );
  };

  const handleOpenAnnouncement = () => {
    if (!id) return;
    router.push({ pathname: '/property/preview/[id]', params: { id } });
  };

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
          <PropertyCardDetailed
            item={property}
            onPress={() => {}}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            onOpen={handleOpenAnnouncement}
            showOwner
            showActions
          />
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
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
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
