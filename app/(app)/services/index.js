import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  generateServiceWorkCodeApi,
  getApiErrorDetails,
  getFriendlyApiMessage,
  getMeApi,
  getServiceProfileApi,
  getServicesApi,
  getServiceWorkCodesApi,
} from '../../../api/client';
import { Button, Card, colors, radius, spacing, typography } from '../../../components/ui';

const pick = (...values) => {
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const resolveHeroImage = (profile, services) => {
  const first = services[0] || {};
  return pick(
    profile?.cover_image_url,
    profile?.cover_image,
    profile?.image_url,
    profile?.photo_url,
    first?.cover_image_url,
    first?.image_url,
    first?.image,
    'https://kconecta.com/img/default/service.webp'
  );
};

export default function ServicesScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState({});
  const [services, setServices] = useState([]);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [partialWarning, setPartialWarning] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const loadAll = useCallback(async () => {
    setErrorText('');
    setPartialWarning('');
    const errors = [];
    let profileFailed = false;
    let servicesFailed = false;
    let servicesResult = [];

    try {
      const profilePayload = await getServiceProfileApi();
      setProfile(profilePayload || {});
    } catch (error) {
      profileFailed = true;
      const details = getApiErrorDetails(error);
      errors.push(`perfil: ${details.message}`);
      setProfile({});
    }

    try {
      const servicesPayload = await getServicesApi({ perPage: 100 });
      servicesResult = asArray(servicesPayload);
      setServices(servicesResult);
    } catch (error) {
      servicesFailed = true;
      const details = getApiErrorDetails(error);
      errors.push(`servicios: ${details.message}`);
      setServices([]);
    }

    try {
      const codesPayload = await getServiceWorkCodesApi();
      const list = asArray(codesPayload?.codes || codesPayload?.data || codesPayload?.items || codesPayload?.result);
      setCodes(list);
    } catch (error) {
      const details = getApiErrorDetails(error);
      errors.push(`codigos: ${details.message}`);
      setCodes([]);
    }

    // Fallback resiliente para perfil: si falla el endpoint de perfil comercial,
    // intentamos poblar datos base desde /me y el primer servicio disponible.
    if (profileFailed) {
      try {
        const mePayload = await getMeApi();
        const meUser = mePayload?.user || mePayload?.data?.user || mePayload?.data || mePayload || {};
        const firstService = servicesResult[0] || {};

        const fallbackProfile = {
          company_name: pick(meUser?.company_name, meUser?.user_name, meUser?.name),
          phone: pick(meUser?.phone, meUser?.mobile_phone, meUser?.landline_phone),
          updated_at_text: pick(meUser?.updated_at_text, meUser?.updated_at),
          address: pick(firstService?.address, firstService?.location, meUser?.address),
          city: pick(firstService?.city, meUser?.city),
          province: pick(firstService?.province, meUser?.province),
          country: pick(firstService?.country, meUser?.country),
          latitude: pick(firstService?.latitude, meUser?.latitude),
          longitude: pick(firstService?.longitude, meUser?.longitude),
          description: pick(firstService?.description, meUser?.description),
          page_url: pick(firstService?.page_url, meUser?.page_url, meUser?.website),
          cover_image_url: pick(firstService?.cover_image_url, firstService?.image_url),
          services: asArray(firstService?.categories || firstService?.services || firstService?.tags),
        };

        setProfile((prev) => ({ ...fallbackProfile, ...prev }));
        setPartialWarning('Perfil comercial parcial: mostrando datos de cuenta y servicios disponibles.');
      } catch (_fallbackError) {
        setPartialWarning('No se pudo cargar el perfil comercial completo. Mostrando datos disponibles.');
      }
    }

    if (servicesFailed) {
      setErrorText(errors.join(' | '));
    } else if (profileFailed) {
      setPartialWarning('No se pudo cargar el perfil comercial completo. Mostrando datos disponibles.');
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await loadAll();
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  };

  const onGenerateCode = async () => {
    setGenerating(true);
    try {
      const payload = await generateServiceWorkCodeApi();
      const createdCode = pick(payload?.code, payload?.data?.code, payload?.result?.code);
      if (createdCode) {
        setGeneratedCode(createdCode);
      }
      await loadAll();
    } catch (error) {
      Alert.alert('No se pudo generar', getFriendlyApiMessage(error, 'Intenta nuevamente.'));
    } finally {
      setGenerating(false);
    }
  };

  const latestCode = useMemo(() => {
    const first = codes[0] || {};
    return pick(first?.code, first?.token, first?.value);
  }, [codes]);

  const heroImage = resolveHeroImage(profile, services);
  const description = pick(profile?.description, profile?.profile_description, 'Sin descripcion comercial.');
  const offeredServices = useMemo(() => {
    const fromProfile = asArray(profile?.offered_services || profile?.services || profile?.categories)
      .map((it) => pick(it?.name, it?.label, it))
      .filter(Boolean);
    const fromList = services
      .flatMap((service) => asArray(service?.categories || service?.services || service?.tags))
      .map((it) => pick(it?.name, it?.label, it))
      .filter(Boolean);
    return [...new Set([...fromProfile, ...fromList])].slice(0, 8);
  }, [profile, services]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando seccion de servicios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Servicios</Text>
        <Text style={styles.subtitle}>Gestiona tu perfil y los servicios que ofreces</Text>

        {errorText ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorText}</Text>
          </View>
        ) : null}
        {partialWarning ? (
          <View style={styles.warnBanner}>
            <Text style={styles.warnText}>{partialWarning}</Text>
          </View>
        ) : null}

        <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover" />

        <View style={styles.twoCol}>
          <Card style={styles.colCard}>
            <View style={styles.sectionHeadInline}>
              <Text style={styles.sectionTitle}>Servicios ofrecidos</Text>
              <TouchableOpacity
                onPress={() => router.push('/services/profile')}
                style={styles.editIconButton}
                accessibilityRole="button"
                accessibilityLabel="Editar servicios"
              >
                <Text style={styles.editIcon}>✎</Text>
              </TouchableOpacity>
            </View>
            {offeredServices.length ? (
              <View style={styles.tagsContainer}>
                {offeredServices.map((item) => (
                  <View key={item} style={styles.serviceButton}>
                    <Text style={styles.serviceButtonText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>Sin categorias reportadas.</Text>
            )}
          </Card>
        </View>

        <View style={styles.twoCol}>
          <Card style={styles.colCard}>
            <Text style={styles.sectionTitle}>Descripcion</Text>
            <Text style={styles.description}>{description}</Text>
          </Card>
        </View>

        <Card style={styles.fullCard}>
          <Text style={styles.sectionTitle}>Códigos de trabajo</Text>
          <Text style={styles.caption}>Genera un código y compártelo con tu cliente.</Text>
          <View style={styles.codesActions}>
            <Button label={generating ? 'Generando...' : 'Generar código'} onPress={onGenerateCode} disabled={generating} style={styles.generateButton} />
            <View style={styles.codePlaceholderContainer}>
              <Ionicons 
                name="ticket-outline" 
                size={16} 
                color={generatedCode ? colors.accentStrong : colors.textMuted} 
                style={[styles.ticketIcon, !generatedCode && { opacity: 0.6 }]} 
              />
              <Text 
                style={generatedCode ? styles.placeholderCodeText : styles.placeholderCodeTextMuted} 
                numberOfLines={1} 
                ellipsizeMode="tail"
              >
                {generatedCode || 'WK-XXXXXXXXXX'}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.copyIconButton, !generatedCode && styles.copyIconButtonDisabled]}
              onPress={async () => {
                if (!generatedCode) {
                  Alert.alert('Sin código', 'Todavía no hay código para copiar.');
                  return;
                }
                await Clipboard.setStringAsync(generatedCode);
                Alert.alert('Código copiado', 'El código ha sido copiado con éxito.');
              }}
              accessibilityRole="button"
              accessibilityLabel="Copiar código"
            >
              <Ionicons 
                name="copy-outline" 
                size={18} 
                color={generatedCode ? colors.primary : colors.textMuted} 
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => router.push('/services/work-codes')}>
            <Text style={styles.moreLink}>Ver todos los códigos</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl + 56 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: spacing.sm, ...typography.body, color: colors.textMuted },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { marginTop: spacing.xxs, marginBottom: spacing.sm, ...typography.caption, color: colors.textMuted },
  errorBanner: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    backgroundColor: colors.dangerSoft,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: { ...typography.caption, color: colors.danger },
  warnBanner: {
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: 10,
    backgroundColor: colors.warningSoft,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  warnText: { ...typography.caption, color: colors.warning },
  heroImage: { width: '100%', height: 130, borderRadius: 12, marginBottom: spacing.sm },
  twoCol: { flexDirection: 'column', gap: spacing.sm, marginBottom: spacing.sm },
  colCard: { marginBottom: 0 },
  sectionHeadInline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs, flex: 1, paddingRight: spacing.xs },
  editIconButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9DDDE1',
    backgroundColor: '#E9FBF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: { ...typography.captionStrong, color: colors.accentStrong },
  activeBadge: { ...typography.captionStrong, color: colors.success, fontSize: 11 },
  metaLine: { ...typography.caption, color: colors.textSoft, marginBottom: spacing.xxs },
  bulletLine: { ...typography.caption, color: colors.textSoft, marginBottom: spacing.xxs },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  serviceButton: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceButtonText: {
    ...typography.captionStrong,
    color: colors.textMuted,
  },
  emptyText: { ...typography.caption, color: colors.textMuted },
  description: { ...typography.body, color: colors.textSoft, lineHeight: 20 },
  fullCard: { marginBottom: spacing.sm },
  caption: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  codesActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'stretch',
    marginBottom: spacing.xs,
  },
  generateButton: {
    flex: 1.3,
    paddingHorizontal: spacing.sm,
  },
  copyIconButton: {
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyIconButtonDisabled: {
    opacity: 0.55,
    backgroundColor: colors.backgroundSecondary,
  },
  codePlaceholderContainer: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.xxs,
    height: 46,
  },
  ticketIcon: {
    marginRight: 2,
  },
  placeholderCodeText: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  placeholderCodeTextMuted: {
    ...typography.captionStrong,
    color: colors.textMuted,
    opacity: 0.6,
  },
  moreLink: { ...typography.captionStrong, color: colors.accentStrong, textAlign: 'right' },
});
