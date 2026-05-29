import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Button, Card, colors, spacing, typography } from '../../../components/ui';
import {
  getApiErrorDetails,
  getFriendlyApiMessage,
  getServiceProfileApi,
  getServicesApi,
  updateAgentServiceApi,
  updateServiceProfileApi,
} from '../../../api/client';
import { guessVideoMimeType, normalizeVideoFileName } from '../../../components/property/form/helpers';

const pick = (...values) => {
  for (let index = 0; index < values.length; index += 1) {
    const v = values[index];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return '';
};

const asArray = (value) => (Array.isArray(value) ? value : []);
const ABSOLUTE_URL_REGEX = /^https?:\/\//i;
const absolutizeUrl = (value) => {
  const raw = pick(value);
  if (!raw) return '';
  if (ABSOLUTE_URL_REGEX.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('/')) return `https://kconecta.com${raw}`;
  return `https://kconecta.com/${raw.replace(/^\/+/, '')}`;
};

const parseMaybeJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  const raw = value.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
};

const toList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  const raw = value.trim();
  if (!raw) return [];
  const fromJson = parseMaybeJsonArray(raw);
  if (fromJson.length) return fromJson;
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const buildVideoThumbCandidates = (videoUrl) => {
  if (!videoUrl) return [];
  const lower = videoUrl.toLowerCase();
  const noQuery = videoUrl.split('?')[0];
  const baseNoExt = noQuery.replace(/\.[a-z0-9]{2,6}$/i, '');
  const candidates = [
    `${baseNoExt}.jpg`,
    `${baseNoExt}.jpeg`,
    `${baseNoExt}.png`,
    `${baseNoExt}_thumb.jpg`,
    `${baseNoExt}_thumbnail.jpg`,
    `${baseNoExt}-thumb.jpg`,
    `${baseNoExt}-thumbnail.jpg`,
  ];

  if (lower.includes('/video/uploads/')) {
    candidates.push(
      noQuery.replace('/video/uploads/', '/video/thumbnails/').replace(/\.[a-z0-9]{2,6}$/i, '.jpg'),
      noQuery.replace('/video/uploads/', '/video/thumbs/').replace(/\.[a-z0-9]{2,6}$/i, '.jpg'),
      noQuery.replace('/video/uploads/', '/video/posters/').replace(/\.[a-z0-9]{2,6}$/i, '.jpg')
    );
  }

  return [...new Set(candidates.map(absolutizeUrl).filter(Boolean))];
};

const extractImageUrls = (entity) => {
  if (!entity || typeof entity !== 'object') return [];

  const fieldCandidates = [
    entity.images,
    entity.gallery,
    entity.media,
    entity.photos,
    entity.gallery_images,
    entity.more_images,
    entity.service_images,
    entity.images_json,
    entity.gallery_json,
    entity.image_urls,
    entity.photo_urls,
  ];

  const fromFields = fieldCandidates
    .flatMap((entry) => toList(entry))
    .map((it) => pick(it?.url, it?.image_url, it?.path, it?.src, it))
    .map(absolutizeUrl)
    .filter(Boolean);

  const fromMediaObjects = asArray(entity.media_files || entity.files || entity.attachments)
    .filter((it) => {
      const type = pick(it?.type, it?.media_type, it?.kind).toLowerCase();
      return !type || type.includes('image') || type.includes('photo');
    })
    .map((it) => absolutizeUrl(pick(it?.url, it?.path, it?.image_url, it?.src)))
    .filter(Boolean);

  return [...fromFields, ...fromMediaObjects];
};

const toUploadFile = (asset, fallbackName, type) => ({
  uri: asset.uri,
  name: asset.fileName || asset.name || fallbackName,
  type: asset.mimeType || asset.type || type,
});

export default function ServicesProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');

  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [availability, setAvailability] = useState('24/7');
  const [categoriesText, setCategoriesText] = useState('');

  const [coverAsset, setCoverAsset] = useState(null);
  const [galleryAssets, setGalleryAssets] = useState([]);
  const [videoAsset, setVideoAsset] = useState(null);
  const [resolvedVideoThumb, setResolvedVideoThumb] = useState('');
  const [videoModalVisible, setVideoModalVisible] = useState(false);

  const load = useCallback(async () => {
    setErrorText('');
    try {
      const [profilePayload, servicesPayload] = await Promise.all([
        getServiceProfileApi(),
        getServicesApi({ perPage: 100 }),
      ]);

      const nextProfile = profilePayload || {};
      const firstService = asArray(servicesPayload)[0] || null;

      setProfile(nextProfile);
      setService(firstService);

      setDescription(
        pick(firstService?.description, nextProfile?.description, nextProfile?.profile_description, '')
      );
      setPhone(pick(nextProfile?.phone, nextProfile?.mobile_phone, nextProfile?.landline_phone, ''));
      setWebsite(pick(nextProfile?.page_url, nextProfile?.website, ''));
      setAvailability(pick(firstService?.availability, firstService?.schedule, '24/7'));

      const rawCategories = asArray(firstService?.categories || firstService?.services || firstService?.tags)
        .map((it) => pick(it?.name, it?.label, it))
        .filter(Boolean);
      setCategoriesText(rawCategories.join(', '));
    } catch (error) {
      const details = getApiErrorDetails(error);
      setErrorText(details.message || 'No se pudo cargar el editor de servicios.');
      setProfile(null);
      setService(null);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await load();
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const onPickImage = async (target) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos permiso para acceder a tus archivos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: target === 'gallery',
      quality: 0.85,
      selectionLimit: target === 'gallery' ? 6 : 1,
    });
    if (result.canceled || !result.assets?.length) return;
    if (target === 'cover') {
      setCoverAsset(result.assets[0]);
      return;
    }
    setGalleryAssets((prev) => [...prev, ...result.assets].slice(0, 8));
  };

  const onPickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos permiso para acceder a tus archivos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (result.canceled || !result.assets?.length) return;
    setVideoAsset(result.assets[0]);
  };

  const existingCover = useMemo(
    () =>
      pick(
        service?.cover_image_url,
        service?.cover_image,
        service?.image_url,
        profile?.cover_image_url,
        profile?.cover_image
      ),
    [profile, service]
  );

  const existingGallery = useMemo(() => {
    const fromCurrentService = extractImageUrls(service);
    const fromProfile = extractImageUrls(profile);
    const merged = [...fromCurrentService, ...fromProfile]
      .filter(Boolean)
      .filter((uri, idx, arr) => arr.indexOf(uri) === idx);
    return merged.slice(0, 8);
  }, [profile, service]);

  const existingVideo = useMemo(
    () =>
      absolutizeUrl(
        pick(
        service?.video_url,
        service?.video,
        service?.video_path,
        service?.video_link,
        service?.media_video,
        profile?.video_url,
        profile?.video,
        profile?.video_path,
        profile?.video_link,
        profile?.media_video
        )
      ),
    [profile, service]
  );
  const currentVideoUri = pick(videoAsset?.uri, existingVideo);

  const openVideoInApp = useCallback(() => {
    if (!currentVideoUri) return;
    setVideoModalVisible(true);
  }, [currentVideoUri]);
  const existingVideoThumb = useMemo(
    () =>
      absolutizeUrl(
        pick(
          service?.video_thumbnail_url,
          service?.video_thumbnail,
          service?.thumbnail_url,
          service?.thumb_url,
          service?.poster_url,
          service?.video_poster,
          profile?.video_thumbnail_url,
          profile?.video_thumbnail,
          profile?.thumbnail_url,
          profile?.thumb_url,
          profile?.poster_url,
          profile?.video_poster
        )
      ),
    [profile, service]
  );

  useEffect(() => {
    let cancelled = false;
    const resolveThumb = async () => {
      if (existingVideoThumb) {
        setResolvedVideoThumb(existingVideoThumb);
        return;
      }
      if (!existingVideo) {
        setResolvedVideoThumb('');
        return;
      }

      const candidates = buildVideoThumbCandidates(existingVideo);
      for (let index = 0; index < candidates.length; index += 1) {
        const candidate = candidates[index];
        try {
          const response = await fetch(candidate, { method: 'HEAD' });
          if (response.ok) {
            if (!cancelled) setResolvedVideoThumb(candidate);
            return;
          }
        } catch (_error) {
          // continue
        }
      }

      // Fallback nativo: generar miniatura local desde el mp4.
      try {
        const thumbnail = await VideoThumbnails.getThumbnailAsync(existingVideo, { time: 1000 });
        if (!cancelled && thumbnail?.uri) {
          setResolvedVideoThumb(thumbnail.uri);
          return;
        }
      } catch (_thumbnailError) {
        // ignore fallback error
      }

      if (!cancelled) setResolvedVideoThumb('');
    };
    resolveThumb();
    return () => {
      cancelled = true;
    };
  }, [existingVideo, existingVideoThumb]);

  const onSave = async () => {
    setSaving(true);
    try {
      const serviceId = service?.id || service?.service_id;
      const serviceTitle = pick(service?.title, service?.name, profile?.company_name, 'Servicio');

      if (serviceId) {
        const payload = new FormData();
        payload.append('title', serviceTitle);
        payload.append('name', serviceTitle);
        payload.append('description', description.trim());
        payload.append('availability', availability.trim());

        const categoryItems = categoriesText
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
        categoryItems.forEach((item) => {
          payload.append('categories[]', item);
          payload.append('services[]', item);
        });

        if (coverAsset?.uri) {
          payload.append('cover_image', toUploadFile(coverAsset, 'cover.jpg', 'image/jpeg'));
        }

        galleryAssets.forEach((item, index) => {
          if (!item?.uri) return;
          payload.append(
            'images[]',
            toUploadFile(item, item.fileName || `gallery-${index + 1}.jpg`, item.mimeType || 'image/jpeg')
          );
        });

        if (videoAsset?.uri) {
          payload.append(
            'video',
            toUploadFile(
              videoAsset,
              normalizeVideoFileName(videoAsset),
              videoAsset.mimeType || guessVideoMimeType(videoAsset.fileName || videoAsset.name)
            )
          );
        }

        await updateAgentServiceApi(serviceId, payload);
      }

      await updateServiceProfileApi({
        description: description.trim(),
        phone: phone.trim(),
        page_url: website.trim(),
      });

      await load();
      setCoverAsset(null);
      setGalleryAssets([]);
      setVideoAsset(null);
      Alert.alert('Guardado', 'Se actualizaron los datos del servicio.');
    } catch (error) {
      Alert.alert('No se pudo guardar', getFriendlyApiMessage(error, 'Intenta nuevamente.'));
    } finally {
      setSaving(false);
    }
  };

  const company = pick(profile?.company_name, profile?.user_name, profile?.name, '-');
  const updatedAt = pick(profile?.updated_at_text, profile?.updated_at, '-');

  return (
    <SafeAreaView style={styles.safeArea}>
      <Modal
        visible={videoModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setVideoModalVisible(false)}
      >
        <View style={styles.videoModalBackdrop}>
          <View style={styles.videoModalCard}>
            <View style={styles.videoModalHeader}>
              <Text style={styles.videoModalTitle}>Video de presentacion</Text>
              <TouchableOpacity onPress={() => setVideoModalVisible(false)} style={styles.videoModalClose}>
                <Text style={styles.videoModalCloseText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.videoFrame}>
              {currentVideoUri ? (
                <WebView source={{ uri: currentVideoUri }} allowsFullscreenVideo mediaPlaybackRequiresUserAction={false} />
              ) : (
                <View style={styles.center}>
                  <Text style={styles.textMuted}>No hay video para reproducir.</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Editar servicio</Text>
        <Text style={styles.textMuted}>Gestiona categorias, multimedia y datos comerciales del proveedor.</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.text}>Cargando editor...</Text>
          </View>
        ) : errorText ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>No se pudo cargar</Text>
            <Text style={styles.errorText}>{errorText}</Text>
          </View>
        ) : (
          <>
            <Card style={styles.card}>
              <Text style={styles.label}>Proveedor</Text>
              <Text style={styles.value}>{company}</Text>

              <Text style={styles.label}>Descripcion</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe tus servicios"
                multiline
                style={[styles.input, styles.inputMultiline]}
              />

              <Text style={styles.label}>Categorias (separadas por coma)</Text>
              <TextInput
                value={categoriesText}
                onChangeText={setCategoriesText}
                placeholder="Albanileria, Carpinteria, Cerrajeria"
                style={styles.input}
              />

              <Text style={styles.label}>Disponibilidad</Text>
              <TextInput value={availability} onChangeText={setAvailability} placeholder="24/7" style={styles.input} />

              <Text style={styles.label}>Contacto</Text>
              <TextInput value={phone} onChangeText={setPhone} placeholder="Telefono de contacto" style={styles.input} />

              <Text style={styles.label}>Sitio web</Text>
              <TextInput
                value={website}
                onChangeText={setWebsite}
                placeholder="https://..."
                autoCapitalize="none"
                style={styles.input}
              />
            </Card>

            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Portada y galeria</Text>
              <Text style={styles.label}>Portada actual</Text>
              {coverAsset?.uri ? (
                <Image source={{ uri: coverAsset.uri }} style={styles.previewCover} resizeMode="cover" />
              ) : existingCover ? (
                <Image source={{ uri: existingCover }} style={styles.previewCover} resizeMode="cover" />
              ) : (
                <Text style={styles.value}>Sin portada.</Text>
              )}
              <Button label="Cambiar portada" variant="secondary" onPress={() => onPickImage('cover')} />

              <Text style={styles.label}>Galeria</Text>
              <View style={styles.galleryWrap}>
                {existingGallery.map((uri) => (
                  <Image key={uri} source={{ uri }} style={styles.galleryImage} resizeMode="cover" />
                ))}
                {galleryAssets.map((asset) => (
                  <Image key={`${asset.uri}-${asset.fileSize || ''}`} source={{ uri: asset.uri }} style={styles.galleryImage} resizeMode="cover" />
                ))}
              </View>
              <Button label="Agregar imagenes" variant="secondary" onPress={() => onPickImage('gallery')} />
            </Card>

            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Video de presentacion</Text>
              {resolvedVideoThumb ? (
                <TouchableOpacity onPress={openVideoInApp} activeOpacity={0.9}>
                  <Image source={{ uri: resolvedVideoThumb }} style={styles.videoThumb} resizeMode="cover" />
                  <View style={styles.videoPlayOverlay}>
                    <Text style={styles.videoPlayIcon}>▶</Text>
                  </View>
                </TouchableOpacity>
              ) : null}
              <Button label="Seleccionar video" variant="secondary" onPress={onPickVideo} />
            </Card>

            <View style={styles.saveWrap}>
              <Button label={saving ? 'Guardando...' : 'Guardar cambios'} onPress={onSave} disabled={saving} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl + 56 },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xs },
  text: { ...typography.body, color: colors.textSoft, marginTop: spacing.sm },
  textMuted: { ...typography.body, color: colors.textMuted, marginBottom: spacing.md },
  center: { paddingVertical: spacing.xxl, alignItems: 'center' },
  errorCard: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
  },
  errorTitle: { ...typography.h3, color: colors.danger, marginBottom: spacing.xxs },
  errorText: { ...typography.body, color: colors.danger },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  label: { ...typography.captionStrong, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xxs },
  value: { ...typography.body, color: colors.textPrimary, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    ...typography.body,
    color: colors.textPrimary,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
  previewCover: { width: '100%', height: 140, borderRadius: 10, marginBottom: spacing.sm },
  galleryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  galleryImage: { width: 82, height: 62, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  videoThumb: { width: '100%', height: 160, borderRadius: 10, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 46,
  },
  saveWrap: { marginTop: spacing.md },
  videoModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 18, 36, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  videoModalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  videoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  videoFrame: {
    width: '100%',
    height: 250,
    backgroundColor: '#000000',
  },
  videoModalTitle: { ...typography.h3, color: colors.textPrimary },
  videoModalClose: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  videoModalCloseText: { ...typography.captionStrong, color: colors.textPrimary },
});
