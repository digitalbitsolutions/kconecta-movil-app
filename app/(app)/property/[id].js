import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiErrorDetails, getMeApi, getPropertyByIdApi } from '../../../api/client';
import {
  ApartmentDetailView,
  GarageDetailView,
  getPropertyDetailVariant,
  HouseChaletDetailView,
  LandDetailView,
  LocalPremisesDetailView,
  PropertyCardDetailed,
  RusticHouseDetailView,
} from '../../../components/property';
import { Button as UiButton, Card as UiCard, colors, spacing, typography } from '../../../components/ui';
import { useAuthStore } from '../../../store/useAuthStore';
import { canEditPropertyUser } from '../../../utils/userPermissions';

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

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, setUser } = useAuthStore();
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
        const response = await getPropertyByIdApi(id);
        const propertyObject = extractPropertyObject(response);
        if (!propertyObject) {
          throw new Error('No se recibieron datos del inmueble.');
        }
        setProperty(propertyObject);
      } catch (error) {
        const details = getApiErrorDetails(error);
        setErrorText(details.message || 'No se pudo cargar la propiedad.');
      } finally {
        setLoading(false);
      }
    };

    load();
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
        // Keep detail usable even if /me fails; edit button will stay hidden.
      }
    };

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [setUser, user]);

  const handleEdit = () => {
    if (!id) return;
    router.push({ pathname: '/properties/new', params: { mode: 'edit', id } });
  };

  const canEdit = useMemo(() => canEditPropertyUser(user, property), [property, user]);

  const detailVariant = useMemo(() => getPropertyDetailVariant(property), [property]);
  const activeDetail = detailVariant?.detail;

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
      return <PropertyCardDetailed item={property} onPress={() => {}} showOwner showActions={false} />;
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
        return <PropertyCardDetailed item={property} onPress={() => {}} showOwner showActions={false} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.actionsRow}>
          <UiButton label="Volver" variant="secondary" onPress={() => router.back()} style={styles.actionButton} />
          {canEdit ? <UiButton label="Editar" onPress={handleEdit} style={styles.actionButton} disabled={!id} /> : null}
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Cargando propiedad...</Text>
          </View>
        ) : errorText ? (
          <UiCard style={styles.errorCard}>
            <Text style={styles.errorTitle}>Error</Text>
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
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl,
  },
  loadingText: {
    marginTop: spacing.sm,
    ...typography.body,
    color: colors.textSecondary,
  },
  errorCard: {
    borderColor: colors.dangerSoft,
    backgroundColor: colors.card,
  },
  errorTitle: {
    ...typography.h2,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.textSoft,
  },
});
