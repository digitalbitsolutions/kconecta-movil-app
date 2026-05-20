import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
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

        <ImageBackground source={{ uri: heroImage }} style={styles.heroCard} imageStyle={styles.heroImage} resizeMode="cover">
          <View style={styles.heroOverlay}>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipText}>kconecta</Text>
            </View>
            <Text style={styles.heroTitle}>Servicios</Text>
            <Text style={styles.heroSubtitle}>Gestiona los servicios que ofreces.</Text>
          </View>
        </ImageBackground>

        <View style={styles.twoCol}>
          <Card style={styles.colCard}>
            <View style={styles.sectionHeadInline}>
              <View style={styles.sectionTitleWrap}>
                <View style={styles.sectionIconBubble}>
                  <Ionicons name="reorder-three-outline" size={14} color="#16979D" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>{'Descripci\u00F3n'}</Text>
                  <Text style={styles.sectionSubtitle}>{'Presentaci\u00F3n comercial'}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/services/profile')}
                style={styles.editIconButton}
                accessibilityRole="button"
                accessibilityLabel={'Editar descripci\u00F3n'}
              >
                <Ionicons name="pencil-outline" size={14} color="#16979D" />
              </TouchableOpacity>
            </View>
            <Text style={styles.description}>{description}</Text>
          </Card>
        </View>


        


        <View style={styles.twoCol}>
          <Card style={styles.colCard}>
            <View style={styles.sectionHeadInline}>
              <View style={styles.sectionTitleWrap}>
                <View style={styles.sectionIconBubble}>
                  <Ionicons name="business-outline" size={14} color="#16979D" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Servicios ofrecidos</Text>
                  <Text style={styles.sectionSubtitle}>Especialidades</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/services/profile')}
                style={styles.editIconButton}
                accessibilityRole="button"
                accessibilityLabel="Editar servicios"
              >
                <Ionicons name="pencil-outline" size={14} color="#16979D" />
              </TouchableOpacity>
            </View>
            {offeredServices.length ? (
              <View style={styles.tagsContainer}>
                {offeredServices.map((item) => (
                  <View key={item} style={styles.serviceButton}>
                    <Ionicons name="construct-outline" size={12} color="#16979D" style={styles.serviceChipIcon} />
                    <Text style={styles.serviceButtonText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>Sin categorias reportadas.</Text>
            )}
          </Card>
        </View>

        <Card style={styles.fullCard}>
          <View style={styles.sectionTitleWrap}>
            <View style={styles.sectionIconBubble}>
              <Ionicons name="cube-outline" size={14} color="#16979D" />
            </View>
            <Text style={styles.sectionTitle}>{'C\u00F3digos de trabajo'}</Text>
          </View>
          <Text style={styles.caption}>{'Genera un c\u00F3digo y comp\u00E1rtelo con tu cliente.'}</Text>
          <View style={styles.codesActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.actionIconButton, generating && styles.actionIconButtonDisabled]}
              onPress={onGenerateCode}
              disabled={generating}
              accessibilityRole="button"
              accessibilityLabel={'Generar c\u00F3digo'}
            >
              <Ionicons 
                name="color-wand-outline" 
                size={20} 
                color={generating ? colors.textMuted : colors.primary} 
              />
              <Text style={styles.actionIconLabel}>
                {generating ? 'Generando' : 'Generar'}
              </Text>
            </TouchableOpacity>
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
              style={[styles.actionIconButton, !generatedCode && styles.actionIconButtonDisabled]}
              onPress={async () => {
                if (!generatedCode) {
                  Alert.alert('Sin c\u00F3digo', 'Todav\u00EDa no hay c\u00F3digo para copiar.');
                  return;
                }
                await Clipboard.setStringAsync(generatedCode);
                Alert.alert('C\u00F3digo copiado', 'El c\u00F3digo ha sido copiado con \u00E9xito.');
              }}
              accessibilityRole="button"
              accessibilityLabel={'Copiar c\u00F3digo'}
            >
              <Ionicons 
                name="copy-outline" 
                size={20} 
                color={generatedCode ? colors.primary : colors.textMuted} 
              />
              <Text style={styles.actionIconLabel}>
                Copiar
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => router.push('/services/work-codes')}>
            <Text style={styles.moreLink}>{'Ver todos los c\u00F3digos'}</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#D8E0EA' },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl + 56 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: spacing.sm, ...typography.body, color: colors.textMuted },
  title: { ...typography.h1, color: '#0C1F3E' },
  subtitle: { marginTop: spacing.xxs, marginBottom: spacing.sm, ...typography.caption, color: '#4D607A' },
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
  heroCard: {
    width: '100%',
    minHeight: 180,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  heroImage: {
    borderRadius: 24,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(8, 31, 81, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(35, 185, 199, 0.26)',
  },
  heroChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(207, 227, 255, 0.45)',
    backgroundColor: 'rgba(225, 241, 255, 0.22)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xxs + 1,
    marginBottom: spacing.sm,
  },
  heroChipText: {
    ...typography.captionStrong,
    color: '#FFFFFF',
    textTransform: 'lowercase',
    letterSpacing: 0.4,
  },
  heroTitle: {
    ...typography.h1,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    ...typography.body,
    color: '#DCE9FF',
    lineHeight: 22,
    maxWidth: '92%',
  },
  twoCol: { flexDirection: 'column', gap: spacing.sm, marginBottom: spacing.sm },
  colCard: {
    marginBottom: 0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#C8D4E3',
    backgroundColor: '#F4F7FB',
    shadowColor: '#0C1F3E',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionHeadInline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  sectionTitle: { ...typography.h3, color: '#12284A', marginBottom: spacing.xs, flex: 1, paddingRight: spacing.xs },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  sectionIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBE8EA',
    backgroundColor: '#EAF8F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: '#7B8EA8',
    marginTop: -2,
  },
  editIconButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B8DCE0',
    backgroundColor: '#E8F8F7',
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
    gap: 6,
    marginTop: spacing.xs,
    alignItems: 'flex-start',
  },
  serviceButton: {
    backgroundColor: '#EAF0F5',
    borderWidth: 1,
    borderColor: '#D2DDE9',
    borderRadius: 12,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs + 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 5,
  },
  serviceChipIcon: {
    marginTop: 1,
  },
  serviceButtonText: {
    ...typography.captionStrong,
    color: '#1A2C4A',
  },
  emptyText: { ...typography.caption, color: colors.textMuted },
  description: { ...typography.body, color: '#1F3354', lineHeight: 20, fontWeight: '700' },
  fullCard: {
    marginBottom: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#C8D4E3',
    backgroundColor: '#F4F7FB',
  },
  caption: { ...typography.caption, color: '#5A6F8E', marginBottom: spacing.sm },
  codesActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionIconButton: {
    width: 82,
    height: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CDD8E6',
    backgroundColor: '#EAF1F7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxs,
  },
  actionIconButtonDisabled: {
    opacity: 0.55,
    backgroundColor: colors.backgroundSecondary,
  },
  actionIconLabel: {
    ...typography.caption,
    fontSize: 11,
    color: '#0F2A52',
    marginTop: 2,
    fontWeight: '700',
  },
  codePlaceholderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF1F7',
    borderWidth: 1,
    borderColor: '#CDD8E6',
    borderRadius: 14,
    paddingHorizontal: spacing.xs,
    gap: spacing.xxs,
    height: 64,
  },
  ticketIcon: {
    marginRight: 2,
  },
  placeholderCodeText: {
    ...typography.captionStrong,
    color: '#2E4B74',
  },
  placeholderCodeTextMuted: {
    ...typography.captionStrong,
    color: colors.textMuted,
    opacity: 0.6,
  },
  moreLink: { ...typography.captionStrong, color: '#16979D', textAlign: 'right' },
});








