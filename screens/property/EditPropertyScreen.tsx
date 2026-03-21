import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  createPropertyApi,
  getApiErrorDetails,
  getPropertyByIdApi,
  getPropertyTypesApi,
  updatePropertyApi,
} from '../../api/client';
import {
  appendUploadFile,
  convertAssetsToWebp,
  pickImageAssets,
  revokeWebPreviewUri,
} from '../../utils/propertyImagePipeline';
import {
  resolvePropertyGalleryImageUrls,
  resolvePropertyImageUrl,
  resolvePropertyVideoUrl,
} from '../../utils/propertyImageResolver';
import {
  Button as UiButton,
  Card as UiCard,
  CheckboxField,
  CheckboxGrid,
  colors as uiColors,
  InputField as UiInputField,
  radius as uiRadius,
  SelectField as UiSelectField,
  SectionHeader,
  spacing as uiSpacing,
  StepperField as UiStepperField,
  SwitchField,
  typography as uiTypography,
} from '../../components/ui';
import { ImageGrid } from '../../components/form';

const DEFAULT_TYPES = [
  { id: 1, name: 'Casa o chalet', description: 'Viviendas familiares con espacios amplios.' },
  { id: 15, name: 'Casa rustica', description: 'Entorno natural y estilo rural.' },
  { id: 13, name: 'Piso', description: 'Opciones urbanas listas para habitar.' },
  { id: 4, name: 'Local o nave', description: 'Ideal para actividad comercial o almacen.' },
  { id: 14, name: 'Garaje', description: 'Seguridad para tu vehiculo o plaza.' },
  { id: 9, name: 'Terreno', description: 'Suelo para proyectos o inversion.' },
];

const FORM_VIEW_BY_TYPE = {
  1: 'post.forms.form_1',
  13: 'post.forms.form_2',
  4: 'post.forms.form_3',
  14: 'post.forms.form_4',
  9: 'post.forms.form_5',
  15: 'post.forms.form_casa_rustica',
};

const OPERATION_OPTIONS = [
  { id: 'venta', label: 'Venta', operationType: 'Venta', useSalePrice: true, useRentalPrice: false },
  { id: 'alquiler', label: 'Alquiler', operationType: 'Alquiler', useSalePrice: false, useRentalPrice: true },
  { id: 'ambas', label: 'Venta + Alquiler', operationType: 'Venta y Alquiler', useSalePrice: true, useRentalPrice: true },
];

const LOCALITY_OPTIONS = [
  { label: 'Barcelona', value: '1' },
  { label: 'Madrid', value: '2' },
  { label: 'Valencia', value: '3' },
  { label: 'Sevilla', value: '4' },
];

const PLANT_OPTIONS = [
  { label: 'Bajo', value: '1' },
  { label: 'Primero', value: '2' },
  { label: 'Segundo', value: '3' },
  { label: 'Tercero', value: '4' },
  { label: 'Cuarto+', value: '5' },
];

const FLOOR_TYPE_OPTIONS = [
  { label: 'Piso', value: '1' },
  { label: 'Atico', value: '2' },
  { label: 'Duplex', value: '3' },
  { label: 'Chalet', value: '4' },
];

const RENTAL_TYPE_OPTIONS = [
  { label: 'Residencial', value: '1' },
  { label: 'Temporada', value: '2' },
  { label: 'Vacacional', value: '3' },
];

const FACADE_OPTIONS = [
  { label: 'Exterior', value: '1' },
  { label: 'Interior', value: '2' },
];

const ORIENTATION_OPTIONS = [
  { label: 'Norte', value: '1' },
  { label: 'Sur', value: '2' },
  { label: 'Este', value: '3' },
  { label: 'Oeste', value: '4' },
];

const EXTRA_OPTIONS = [
  { label: 'Aire acondicionado', value: '1' },
  { label: 'Balcon', value: '2' },
  { label: 'Piscina', value: '3' },
  { label: 'Terraza', value: '4' },
  { label: 'Jardin', value: '5' },
  { label: 'Garaje', value: '6' },
  { label: 'Trastero', value: '7' },
  { label: 'Amueblado', value: '8' },
  { label: 'Ascensor', value: '9' },
  { label: 'Plaza garaje', value: '10' },
  { label: 'Adaptado movilidad reducida', value: '11' },
];

const KITCHEN_OPTIONS = [
  { label: 'Equipada', value: '1' },
  { label: 'Vacia', value: '2' },
  { label: 'Electrodomesticos', value: '3' },
];

const HEATING_OPTIONS = [
  { label: 'Gas natural', value: '1' },
  { label: 'Gas butano', value: '2' },
  { label: 'Electrica', value: '3' },
  { label: 'Bomba de calor', value: '4' },
  { label: 'Otros', value: '5' },
];

const ENERGY_CLASS_OPTIONS = [
  { label: 'A', value: '1' },
  { label: 'B', value: '2' },
  { label: 'C', value: '3' },
  { label: 'D', value: '4' },
  { label: 'E', value: '5' },
  { label: 'F', value: '6' },
  { label: 'G', value: '7' },
];

const CONSERVATION_OPTIONS = [
  { label: 'Obra nueva', value: '1' },
  { label: 'Buen estado', value: '2' },
  { label: 'Reformar', value: '3' },
];

const RAW_FIELDS = [
  'locality',
  'plant',
  'esc_block',
  'door',
  'name_urbanization',
  'type_floor[]',
  'rental_type',
  'guarantee',
  'state_conservation',
  'meters_built',
  'useful_meters',
  'bedrooms',
  'bathrooms',
  'facade',
  'orientation[]',
  'feature[]',
  'equipment[]',
  'type_heating',
  'elevator',
  'wheelchair_accessible_elevator',
  'energy_class',
  'energy_consumption',
  'emissions_consumption',
  'rooms',
  'stays',
  'year_of_construction',
];

const LIST_FIELDS = new Set(['type_floor[]', 'orientation[]', 'feature[]', 'equipment[]']);
const BOOLEAN_FIELDS = new Set(['elevator', 'wheelchair_accessible_elevator']);
const NUMERIC_FIELDS = new Set([
  'type',
  'type_id',
  'price',
  'sale_price',
  'rental_price',
  'locality',
  'plant',
  'rental_type',
  'guarantee',
  'state_conservation',
  'meters_built',
  'useful_meters',
  'bedrooms',
  'bathrooms',
  'facade',
  'type_heating',
  'energy_class',
  'energy_consumption',
  'emissions_consumption',
  'rooms',
  'stays',
  'year_of_construction',
]);

const MAX_GALLERY_IMAGES = 12;
const VIDEO_MAX_MB = 50;
const VIDEO_MAX_BYTES = VIDEO_MAX_MB * 1024 * 1024;

const normalizeRawFieldKey = (rawField) => rawField.replace(/\[\]/g, '__list');

const parseNumber = (value) => {
  if (value === null || value === undefined) return 0;
  const raw = String(value).trim().replace(/\s/g, '');
  if (!raw) return 0;

  let normalized = raw;
  const commas = (raw.match(/,/g) || []).length;
  const dots = (raw.match(/\./g) || []).length;

  if (commas && dots) {
    if (raw.lastIndexOf(',') > raw.lastIndexOf('.')) {
      normalized = raw.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = raw.replace(/,/g, '');
    }
  } else if (commas) {
    normalized = commas === 1 && raw.split(',')[1]?.length <= 2 ? raw.replace(',', '.') : raw.replace(/,/g, '');
  } else if (dots && !(dots === 1 && raw.split('.')[1]?.length <= 2)) {
    normalized = raw.replace(/\./g, '');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const pickString = (...values) => {
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
};

const extractArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.types)) return payload.types;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

const extractPropertyObject = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  if (payload.property && typeof payload.property === 'object') return extractPropertyObject(payload.property);
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return extractPropertyObject(payload.data);
  }
  return payload;
};

const normalizeType = (item) => {
  if (!item) return null;
  const id = parseNumber(item.id ?? item.type_id ?? item.value);
  if (!id) return null;
  return {
    id,
    name: pickString(item.name, item.title, item.label, `Tipo ${id}`),
    description: pickString(item.description, item.summary),
  };
};

const normalizeFormValue = (rawField, value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => {
        if (entry === null || entry === undefined) return '';
        if (typeof entry === 'object') return pickString(entry?.id, entry?.value, entry?.slug, entry?.name, entry?.title);
        return String(entry).trim();
      })
      .filter(Boolean);
    return LIST_FIELDS.has(rawField) ? parts.join(',') : parts[0] || '';
  }
  if (typeof value === 'object') {
    return pickString(value?.id, value?.value, value?.slug, value?.name, value?.title);
  }
  return String(value).trim();
};

const pickDefinedValue = (...values) => {
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' && !value.trim()) continue;
    return value;
  }
  return null;
};

const resolveOperationModeFromProperty = (property) => {
  const raw = pickString(property?.operation_type, property?.operation, property?.category_name, property?.category).toLowerCase();
  if (raw.includes('venta') && raw.includes('alquiler')) return 'ambas';
  if (raw.includes('alquiler')) return 'alquiler';
  return 'venta';
};

const toRawFieldPayloadValue = (rawField, rawValue) => {
  const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
  if (value === null || value === undefined || value === '') return null;

  if (LIST_FIELDS.has(rawField)) {
    const parts = String(value)
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const parsed = parseNumber(part);
        return parsed > 0 ? parsed : part;
      });
    return parts.length ? parts : null;
  }

  if (BOOLEAN_FIELDS.has(rawField)) {
    if (value === '1' || value === 1 || value === true) return 1;
    if (value === '0' || value === 0 || value === false) return 0;
    return null;
  }

  if (NUMERIC_FIELDS.has(rawField)) {
    const parsed = parseNumber(value);
    if (parsed > 0 || String(value) === '0') return parsed;
    return null;
  }

  return value;
};

const sanitizePayload = (payload) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== undefined && value !== ''));

const formatFileSize = (bytes) => {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '';
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(value / 1024))} KB`;
};

const guessVideoMimeType = (name = '') => {
  const lowerName = String(name).toLowerCase();
  if (lowerName.endsWith('.webm')) return 'video/webm';
  if (lowerName.endsWith('.mov')) return 'video/quicktime';
  if (lowerName.endsWith('.avi')) return 'video/x-msvideo';
  if (lowerName.endsWith('.mkv')) return 'video/x-matroska';
  return 'video/mp4';
};

const normalizeVideoFileName = (asset) => {
  const directName = pickString(asset?.fileName, asset?.name, `video-${Date.now()}`);
  if (/\.[a-z0-9]{2,6}$/i.test(directName)) return directName;
  const extension = pickString(asset?.mimeType).split('/')[1] || 'mp4';
  return `${directName}.${extension}`;
};

const convertVideoAssetForUpload = async (asset) => {
  if (!asset) return null;
  const name = normalizeVideoFileName(asset);
  const fallbackType = guessVideoMimeType(name);
  const assetType = pickString(asset?.mimeType, asset?.type, fallbackType);

  if (Platform.OS === 'web') {
    if (asset.file instanceof File) {
      return {
        uri: URL.createObjectURL(asset.file),
        name: asset.file.name || name,
        type: asset.file.type || assetType,
        size: asset.file.size || asset?.fileSize || null,
        file: asset.file,
      };
    }
    if (!asset?.uri) throw new Error('No se encontro el archivo de video seleccionado.');
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    const file = new File([blob], name, { type: assetType || blob.type || fallbackType });
    return {
      uri: URL.createObjectURL(file),
      name: file.name,
      type: file.type || fallbackType,
      size: file.size || null,
      file,
    };
  }

  if (!asset?.uri) throw new Error('No se encontro URI de video para subir.');
  return {
    uri: asset.uri,
    name,
    type: assetType || fallbackType,
    size: asset?.fileSize || null,
  };
};

const buildInitialForm = () => {
  const form = {
    title: '',
    sale_price: '',
    rental_price: '',
    address: '',
    city: '',
    province: '',
    country: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    description: '',
    page_url: '',
  };
  RAW_FIELDS.forEach((field) => {
    form[normalizeRawFieldKey(field)] = '';
  });
  return form;
};

export default function EditPropertyScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const modeParam = pickString(params?.mode).toLowerCase();
  const propertyIdParam = pickString(params?.id);
  const isEditMode = modeParam === 'edit' && Boolean(propertyIdParam);

  const [step, setStep] = useState(1);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingProperty, setLoadingProperty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imagesBusy, setImagesBusy] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [typeOptions, setTypeOptions] = useState(DEFAULT_TYPES);
  const [selectedType, setSelectedType] = useState(null);
  const [operationMode, setOperationMode] = useState('venta');
  const [form, setForm] = useState(buildInitialForm);
  const [coverImage, setCoverImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [videoAsset, setVideoAsset] = useState(null);
  const [editSnapshot, setEditSnapshot] = useState(null);

  const coverImageRef = useRef(null);
  const galleryImagesRef = useRef([]);
  const videoAssetRef = useRef(null);

  const operation = useMemo(() => OPERATION_OPTIONS.find((item) => item.id === operationMode) || OPERATION_OPTIONS[0], [operationMode]);
  const selectedTypeId = parseNumber(selectedType);
  const selectedTypeName = useMemo(
    () => typeOptions.find((item) => String(item.id) === String(selectedType))?.name || '',
    [selectedType, typeOptions]
  );
  const selectedFormView = useMemo(() => FORM_VIEW_BY_TYPE[selectedTypeId] || 'post.forms.form_1', [selectedTypeId]);

  const existingCoverUrl = useMemo(
    () => (isEditMode && editSnapshot ? resolvePropertyImageUrl(editSnapshot) : ''),
    [isEditMode, editSnapshot]
  );
  const existingGalleryUrls = useMemo(() => {
    if (!isEditMode || !editSnapshot) return [];
    const gallery = resolvePropertyGalleryImageUrls(editSnapshot);
    return gallery.filter((url) => url && url !== existingCoverUrl);
  }, [isEditMode, editSnapshot, existingCoverUrl]);
  const existingVideoUrl = useMemo(
    () => (isEditMode && editSnapshot ? resolvePropertyVideoUrl(editSnapshot) : ''),
    [isEditMode, editSnapshot]
  );

  useEffect(() => {
    const loadTypeOptions = async () => {
      setLoadingTypes(true);
      try {
        const payload = await getPropertyTypesApi();
        const normalized = extractArray(payload).map(normalizeType).filter(Boolean);
        if (normalized.length) setTypeOptions(normalized);
      } catch (error) {
        const details = getApiErrorDetails(error);
        setErrorText(`No se pudieron cargar tipos desde API (${details.message}). Se usan opciones base.`);
      } finally {
        setLoadingTypes(false);
      }
    };
    loadTypeOptions();
  }, []);

  useEffect(() => {
    if (!isEditMode || !propertyIdParam) return;
    let cancelled = false;

    const loadProperty = async () => {
      setLoadingProperty(true);
      try {
        const payload = await getPropertyByIdApi(propertyIdParam);
        const property = extractPropertyObject(payload);
        if (!property) throw new Error('No se recibieron datos de la propiedad.');
        if (cancelled) return;

        const nextForm = buildInitialForm();
        nextForm.title = normalizeFormValue('title', property?.title);
        nextForm.address = normalizeFormValue('address', property?.address);
        nextForm.city = normalizeFormValue('city', pickDefinedValue(property?.city, property?.city_name));
        nextForm.province = normalizeFormValue('province', pickDefinedValue(property?.province, property?.province_name));
        nextForm.country = normalizeFormValue('country', pickDefinedValue(property?.country, property?.country_name));
        nextForm.postal_code = normalizeFormValue('postal_code', property?.postal_code);
        nextForm.latitude = normalizeFormValue('latitude', property?.latitude);
        nextForm.longitude = normalizeFormValue('longitude', property?.longitude);
        nextForm.description = normalizeFormValue('description', property?.description);
        nextForm.page_url = normalizeFormValue('page_url', property?.page_url);
        nextForm.sale_price = normalizeFormValue('sale_price', pickDefinedValue(property?.sale_price, property?.price));
        nextForm.rental_price = normalizeFormValue('rental_price', property?.rental_price);

        RAW_FIELDS.forEach((rawField) => {
          const base = rawField.replace(/\[\]/g, '');
          const resolved = pickDefinedValue(
            property?.[rawField],
            property?.[base],
            property?.[`${base}_id`],
            property?.[`${base}_ids`]
          );
          nextForm[normalizeRawFieldKey(rawField)] = normalizeFormValue(rawField, resolved);
        });

        setCoverImage((prev) => {
          if (prev) revokeWebPreviewUri(prev);
          return null;
        });
        setGalleryImages((prev) => {
          prev.forEach((item) => revokeWebPreviewUri(item));
          return [];
        });
        setVideoAsset((prev) => {
          if (prev) revokeWebPreviewUri(prev);
          return null;
        });

        setSelectedType(parseNumber(property?.type_id ?? property?.type) || null);
        setOperationMode(resolveOperationModeFromProperty(property));
        setForm(nextForm);
        setEditSnapshot(property);
        setStep(2);
      } catch (error) {
        if (cancelled) return;
        const details = getApiErrorDetails(error);
        setErrorText(`No se pudo cargar la propiedad para editar (${details.message}).`);
      } finally {
        if (!cancelled) setLoadingProperty(false);
      }
    };

    loadProperty();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, propertyIdParam]);

  useEffect(() => {
    coverImageRef.current = coverImage;
  }, [coverImage]);

  useEffect(() => {
    galleryImagesRef.current = galleryImages;
  }, [galleryImages]);

  useEffect(() => {
    videoAssetRef.current = videoAsset;
  }, [videoAsset]);

  useEffect(
    () => () => {
      if (coverImageRef.current) revokeWebPreviewUri(coverImageRef.current);
      galleryImagesRef.current.forEach((item) => revokeWebPreviewUri(item));
      if (videoAssetRef.current) revokeWebPreviewUri(videoAssetRef.current);
    },
    []
  );

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const getRawFieldValue = (rawField) => form[normalizeRawFieldKey(rawField)] || '';
  const setRawFieldValue = (rawField, value) => updateField(normalizeRawFieldKey(rawField), value);
  const parseListValues = (rawField) =>
    String(getRawFieldValue(rawField))
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  const toggleListValue = (rawField, value) => {
    const current = parseListValues(rawField);
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    setRawFieldValue(rawField, next.join(','));
  };
  const incrementRawNumber = (rawField, delta = 1, minimum = 0) => {
    const current = parseNumber(getRawFieldValue(rawField));
    const next = Math.max(minimum, current + delta);
    setRawFieldValue(rawField, String(next));
  };
  const toggleBooleanRawField = (rawField) => {
    const current = String(getRawFieldValue(rawField));
    setRawFieldValue(rawField, current === '1' ? '0' : '1');
  };

  const regionLatitude = parseFloat(form.latitude || '41.3874');
  const regionLongitude = parseFloat(form.longitude || '2.1686');
  const region = {
    latitude: Number.isFinite(regionLatitude) ? regionLatitude : 41.3874,
    longitude: Number.isFinite(regionLongitude) ? regionLongitude : 2.1686,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const renderMapPreview = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>Mapa disponible en app nativa.</Text>
        </View>
      );
    }

    try {
      // eslint-disable-next-line global-require
      const ReactNativeMaps = require('react-native-maps');
      const MapView = ReactNativeMaps.default;
      const Marker = ReactNativeMaps.Marker;
      return (
        <View style={styles.mapWrap}>
          <MapView style={styles.map} initialRegion={region} region={region}>
            <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} />
          </MapView>
        </View>
      );
    } catch (_error) {
      return (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>No se pudo cargar el mapa.</Text>
        </View>
      );
    }
  };

  const pickCover = async () => {
    try {
      setImagesBusy(true);
      const picked = await pickImageAssets({ multiple: false });
      if (!picked.length) return;
      const [converted] = await convertAssetsToWebp(picked, 'cover');
      setCoverImage((prev) => {
        if (prev) revokeWebPreviewUri(prev);
        return converted || null;
      });
    } catch (error) {
      Alert.alert('Imagen de portada', error?.message || 'No se pudo procesar la imagen seleccionada.');
    } finally {
      setImagesBusy(false);
    }
  };

  const pickGallery = async () => {
    try {
      const available = Math.max(0, MAX_GALLERY_IMAGES - galleryImages.length);
      if (!available) {
        Alert.alert('Galeria completa', `Solo se permiten ${MAX_GALLERY_IMAGES} imagenes.`);
        return;
      }
      setImagesBusy(true);
      const picked = await pickImageAssets({ multiple: true, maxSelection: available });
      if (!picked.length) return;
      const converted = await convertAssetsToWebp(picked, 'gallery');
      setGalleryImages((prev) => [...prev, ...converted].slice(0, MAX_GALLERY_IMAGES));
    } catch (error) {
      Alert.alert('Galeria', error?.message || 'No se pudieron procesar las imagenes.');
    } finally {
      setImagesBusy(false);
    }
  };

  const pickVideo = async () => {
    try {
      setImagesBusy(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission?.granted) throw new Error('Permiso de galeria denegado para video.');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsMultipleSelection: false,
        allowsEditing: false,
        quality: 1,
        selectionLimit: 1,
      });

      if (result?.canceled || !Array.isArray(result?.assets) || !result.assets.length) return;

      const selected = result.assets[0];
      const transformed = await convertVideoAssetForUpload(selected);

      if (transformed?.size && transformed.size > VIDEO_MAX_BYTES) {
        if (transformed) revokeWebPreviewUri(transformed);
        throw new Error(`El video excede ${VIDEO_MAX_MB}MB.`);
      }

      setVideoAsset((prev) => {
        if (prev) revokeWebPreviewUri(prev);
        return transformed;
      });
    } catch (error) {
      Alert.alert('Video', error?.message || 'No se pudo seleccionar el video.');
    } finally {
      setImagesBusy(false);
    }
  };

  const validateForm = () => {
    if (!selectedTypeId) return 'Selecciona el tipo de inmueble.';
    if (!String(form.title || '').trim()) return 'Completa el titulo de la propiedad.';
    const salePrice = parseNumber(form.sale_price);
    const rentalPrice = parseNumber(form.rental_price);
    if (operation.useSalePrice && salePrice <= 0) return 'El precio de venta es obligatorio.';
    if (operation.useRentalPrice && rentalPrice <= 0) return 'El precio de alquiler es obligatorio.';
    return '';
  };

  const submitProperty = async () => {
    const validation = validateForm();
    if (validation) {
      Alert.alert('Formulario incompleto', validation);
      return;
    }

    const salePrice = parseNumber(form.sale_price);
    const rentalPrice = parseNumber(form.rental_price);
    const preferredPrice = operation.useRentalPrice && !operation.useSalePrice ? rentalPrice : salePrice || rentalPrice;

    const payload = sanitizePayload({
      type_id: selectedTypeId,
      type: selectedTypeId,
      title: String(form.title || '').trim(),
      operation_type: operation.operationType,
      price: preferredPrice > 0 ? preferredPrice : null,
      sale_price: salePrice > 0 ? salePrice : null,
      rental_price: rentalPrice > 0 ? rentalPrice : null,
      address: String(form.address || '').trim(),
      city: String(form.city || '').trim(),
      province: String(form.province || '').trim(),
      country: String(form.country || '').trim(),
      postal_code: String(form.postal_code || '').trim(),
      latitude: String(form.latitude || '').trim(),
      longitude: String(form.longitude || '').trim(),
      description: String(form.description || '').trim(),
      page_url: isEditMode ? null : String(form.page_url || '').trim(),
    });

    setSubmitting(true);
    setErrorText('');
    try {
      const requestPayload = new FormData();
      Object.entries(payload).forEach(([key, value]) => requestPayload.append(key, String(value)));

      RAW_FIELDS.forEach((rawField) => {
        const rawValue = form[normalizeRawFieldKey(rawField)];
        const parsed = toRawFieldPayloadValue(rawField, rawValue);
        if (parsed === null || parsed === undefined || parsed === '') return;

        if (Array.isArray(parsed)) {
          parsed.forEach((item) => requestPayload.append(rawField, String(item)));
          return;
        }
        requestPayload.append(rawField, String(parsed));
      });

      if (coverImage) appendUploadFile(requestPayload, 'cover_image', coverImage);
      galleryImages.forEach((imageFile) => appendUploadFile(requestPayload, 'more_images[]', imageFile));
      if (videoAsset) appendUploadFile(requestPayload, 'video', videoAsset);

      if (isEditMode && propertyIdParam) {
        await updatePropertyApi(propertyIdParam, requestPayload);
        Alert.alert('Propiedad actualizada', 'Los cambios se guardaron correctamente.');
      } else {
        await createPropertyApi(requestPayload);
        Alert.alert('Propiedad creada', 'La propiedad se registro correctamente.');
      }
      router.replace('/properties');
    } catch (error) {
      const details = getApiErrorDetails(error);
      const validationErrors =
        details?.data?.errors && typeof details.data.errors === 'object'
          ? Object.values(details.data.errors).flat().filter(Boolean).join(' | ')
          : '';
      setErrorText(
        details.status === 422 && validationErrors
          ? `Validacion: ${validationErrors}`
          : `No se pudo ${isEditMode ? 'actualizar' : 'crear'} la propiedad: ${details.message}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const floorTypeValues = parseListValues('type_floor[]');
  const orientationValues = parseListValues('orientation[]');
  const featureValues = parseListValues('feature[]');
  const kitchenValues = parseListValues('equipment[]');
  const heatingValue = String(getRawFieldValue('type_heating') || '');

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backIconBtn} onPress={() => router.back()}>
            <Text style={styles.backIconText}>{'<'}</Text>
          </TouchableOpacity>
          <UiButton label="Ver propiedades" variant="secondary" onPress={() => router.push('/properties')} style={styles.headerActionBtn} />
        </View>
        <Text style={styles.title}>Editar propiedad</Text>
        <Text style={styles.subtitle}>Actualiza los datos del inmueble</Text>

        {errorText ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorText}</Text>
          </View>
        ) : null}

        {loadingProperty ? (
          <UiCard>
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={uiColors.accent} />
              <Text style={styles.loadingText}>Cargando datos de la propiedad...</Text>
            </View>
          </UiCard>
        ) : !isEditMode && step === 1 ? (
          <UiCard>
            <SectionHeader title="Paso 1" subtitle="Selecciona el tipo de inmueble." />
            {loadingTypes ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={uiColors.accent} />
                <Text style={styles.loadingText}>Cargando tipos...</Text>
              </View>
            ) : (
              typeOptions.map((typeItem) => {
                const selected = String(selectedType) === String(typeItem.id);
                return (
                  <TouchableOpacity
                    key={`${typeItem.id}`}
                    onPress={() => setSelectedType(typeItem.id)}
                    style={[styles.typeCard, selected ? styles.typeCardSelected : null]}
                  >
                    <Text style={styles.typeCardTitle}>{typeItem.name}</Text>
                    <Text style={styles.typeCardDescription}>{typeItem.description || 'Sin descripcion disponible.'}</Text>
                  </TouchableOpacity>
                );
              })
            )}
            <UiButton
              label="Continuar"
              onPress={() => (selectedType ? setStep(2) : Alert.alert('Tipo requerido', 'Selecciona un tipo para continuar.'))}
              style={styles.actionSingle}
            />
          </UiCard>
        ) : (
          <>
            <UiCard>
              <SectionHeader title="Resumen" subtitle={`Tipo: ${selectedTypeName || 'Sin tipo'} - ${selectedFormView}`} />
              {isEditMode && editSnapshot?.id ? <Text style={styles.metaText}>Propiedad ID: {editSnapshot.id}</Text> : null}
            </UiCard>

            <UiCard>
              <SectionHeader title="Ubicacion" subtitle="Localizacion del inmueble" />
              <UiSelectField
                label="Localidad"
                value={String(getRawFieldValue('locality') || '')}
                options={LOCALITY_OPTIONS}
                onSelect={(value) => setRawFieldValue('locality', value)}
              />
              <UiInputField label="Nombre de la via" value={form.address || ''} onChangeText={(value) => updateField('address', value)} placeholder="Calle y numero" />
              <UiSelectField label="Planta" value={String(getRawFieldValue('plant') || '')} options={PLANT_OPTIONS} onSelect={(value) => setRawFieldValue('plant', value)} />
              <View style={styles.row}>
                <UiInputField containerStyle={styles.rowItem} label="Bloque" value={String(getRawFieldValue('esc_block') || '')} onChangeText={(value) => setRawFieldValue('esc_block', value)} placeholder="Bloque" />
                <UiInputField containerStyle={styles.rowItem} label="Puerta" value={String(getRawFieldValue('door') || '')} onChangeText={(value) => setRawFieldValue('door', value)} placeholder="Puerta" />
              </View>
              <UiInputField label="Urbanizacion" value={String(getRawFieldValue('name_urbanization') || '')} onChangeText={(value) => setRawFieldValue('name_urbanization', value)} placeholder="Nombre de la urbanizacion" />
              <UiSelectField label="Tipo propiedad" value={floorTypeValues} options={FLOOR_TYPE_OPTIONS} multiple onSelect={(value) => toggleListValue('type_floor[]', value)} />
            </UiCard>

            <UiCard>
              <SectionHeader title="Operacion y precio" />
              <UiSelectField
                label="Operacion"
                value={operationMode}
                options={OPERATION_OPTIONS.map((item) => ({ label: item.label, value: item.id }))}
                onSelect={setOperationMode}
              />
              <UiSelectField label="Tipo alquiler" value={String(getRawFieldValue('rental_type') || '')} options={RENTAL_TYPE_OPTIONS} onSelect={(value) => setRawFieldValue('rental_type', value)} />
              {operation.useSalePrice ? <UiInputField label="Precio venta" value={form.sale_price || ''} onChangeText={(value) => updateField('sale_price', value)} placeholder="390000" keyboardType="numeric" /> : null}
              {operation.useRentalPrice ? <UiInputField label="Precio alquiler" value={form.rental_price || ''} onChangeText={(value) => updateField('rental_price', value)} placeholder="1500" keyboardType="numeric" /> : null}
              <UiInputField label="Fianza" value={String(getRawFieldValue('guarantee') || '')} onChangeText={(value) => setRawFieldValue('guarantee', value)} placeholder="0" keyboardType="numeric" />
            </UiCard>

            <UiCard>
              <SectionHeader title="Caracteristicas" subtitle="Estado, superficie y orientacion" />
              <UiSelectField label="Estado conservacion" value={String(getRawFieldValue('state_conservation') || '')} options={CONSERVATION_OPTIONS} onSelect={(value) => setRawFieldValue('state_conservation', value)} />
              <View style={styles.row}>
                <UiInputField containerStyle={styles.rowItem} label="m2 construidos" value={String(getRawFieldValue('meters_built') || '')} onChangeText={(value) => setRawFieldValue('meters_built', value)} placeholder="0" keyboardType="numeric" />
                <UiInputField containerStyle={styles.rowItem} label="m2 utiles" value={String(getRawFieldValue('useful_meters') || '')} onChangeText={(value) => setRawFieldValue('useful_meters', value)} placeholder="0" keyboardType="numeric" />
              </View>
              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <UiStepperField label="Habitaciones" value={parseNumber(getRawFieldValue('bedrooms'))} onIncrement={() => incrementRawNumber('bedrooms', 1, 0)} onDecrement={() => incrementRawNumber('bedrooms', -1, 0)} />
                </View>
                <View style={styles.rowItem}>
                  <UiStepperField label="Banos" value={parseNumber(getRawFieldValue('bathrooms'))} onIncrement={() => incrementRawNumber('bathrooms', 1, 0)} onDecrement={() => incrementRawNumber('bathrooms', -1, 0)} />
                </View>
              </View>
              <UiSelectField label="Fachada" value={String(getRawFieldValue('facade') || '')} options={FACADE_OPTIONS} onSelect={(value) => setRawFieldValue('facade', value)} />
              <UiSelectField label="Orientacion" value={orientationValues} options={ORIENTATION_OPTIONS} multiple onSelect={(value) => toggleListValue('orientation[]', value)} />
            </UiCard>

            <UiCard>
              <SectionHeader title="Extras" />
              <CheckboxGrid items={EXTRA_OPTIONS} values={featureValues} onToggle={(value) => toggleListValue('feature[]', value)} />
            </UiCard>

            <UiCard>
              <SectionHeader title="Cocina" />
              <CheckboxGrid items={KITCHEN_OPTIONS} values={kitchenValues} onToggle={(value) => toggleListValue('equipment[]', value)} />
            </UiCard>

            <UiCard>
              <SectionHeader title="Calefaccion" />
              <View style={styles.gridWrap}>
                {HEATING_OPTIONS.map((item) => (
                  <CheckboxField
                    key={item.value}
                    style={styles.gridItem}
                    label={item.label}
                    checked={heatingValue === item.value}
                    onToggle={() => setRawFieldValue('type_heating', heatingValue === item.value ? '' : item.value)}
                  />
                ))}
              </View>
            </UiCard>

            <UiCard>
              <SectionHeader title="Ascensor" />
              <SwitchField label="Tiene ascensor" value={String(getRawFieldValue('elevator') || '') === '1'} onValueChange={() => toggleBooleanRawField('elevator')} />
              <CheckboxField
                label="Adaptado movilidad reducida"
                checked={String(getRawFieldValue('wheelchair_accessible_elevator') || '') === '1'}
                onToggle={() => toggleBooleanRawField('wheelchair_accessible_elevator')}
              />
            </UiCard>

            <UiCard>
              <SectionHeader title="Energia" />
              <UiSelectField label="Certificacion energetica" value={String(getRawFieldValue('energy_class') || '')} options={ENERGY_CLASS_OPTIONS} onSelect={(value) => setRawFieldValue('energy_class', value)} />
              <UiInputField label="Consumo (kWh/m2 ano)" value={String(getRawFieldValue('energy_consumption') || '')} onChangeText={(value) => setRawFieldValue('energy_consumption', value)} keyboardType="numeric" placeholder="0" />
              <UiInputField label="Emisiones CO2" value={String(getRawFieldValue('emissions_consumption') || '')} onChangeText={(value) => setRawFieldValue('emissions_consumption', value)} keyboardType="numeric" placeholder="0" />
            </UiCard>

            <UiCard>
              <SectionHeader title="Detalles" />
              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <UiStepperField label="Habitaciones dobles" value={parseNumber(getRawFieldValue('stays'))} onIncrement={() => incrementRawNumber('stays', 1, 0)} onDecrement={() => incrementRawNumber('stays', -1, 0)} />
                </View>
                <View style={styles.rowItem}>
                  <UiStepperField label="Habitaciones simples" value={parseNumber(getRawFieldValue('rooms'))} onIncrement={() => incrementRawNumber('rooms', 1, 0)} onDecrement={() => incrementRawNumber('rooms', -1, 0)} />
                </View>
              </View>
              <UiInputField label="Ano construccion" value={String(getRawFieldValue('year_of_construction') || '')} onChangeText={(value) => setRawFieldValue('year_of_construction', value)} keyboardType="numeric" placeholder="2020" />
            </UiCard>

            <UiCard>
              <SectionHeader title="Descripcion" />
              <UiInputField label="Titulo" value={form.title || ''} onChangeText={(value) => updateField('title', value)} placeholder="Ej: Piso en venta en Avenida del Bosc" />
              <UiInputField label="Descripcion" value={form.description || ''} onChangeText={(value) => updateField('description', value)} placeholder="Describe el inmueble" multiline />
            </UiCard>

            <UiCard>
              <SectionHeader title="Fotos" subtitle="Portada + galeria" />
              {existingCoverUrl ? (
                <View style={styles.previewBlock}>
                  <Text style={styles.previewLabel}>Portada actual</Text>
                  <Image source={{ uri: existingCoverUrl }} style={styles.coverPreview} />
                </View>
              ) : null}
              {coverImage ? (
                <View style={styles.previewBlock}>
                  <Text style={styles.previewLabel}>Portada nueva</Text>
                  <Image source={{ uri: coverImage.uri }} style={styles.coverPreview} />
                  <UiButton
                    variant="secondary"
                    label="Quitar portada"
                    onPress={() =>
                      setCoverImage((prev) => {
                        if (prev) revokeWebPreviewUri(prev);
                        return null;
                      })
                    }
                  />
                </View>
              ) : (
                <View style={styles.previewBlock}>
                  <Text style={styles.previewLabel}>Portada</Text>
                  <View style={styles.coverPlaceholder}>
                    <Text style={styles.placeholderText}>Sin portada seleccionada</Text>
                  </View>
                </View>
              )}
              <View style={styles.actionsInline}>
                <UiButton label={coverImage ? 'Cambiar portada' : 'Subir portada'} onPress={pickCover} disabled={imagesBusy} />
                <UiButton variant="secondary" label="Agregar imagen" onPress={pickGallery} disabled={imagesBusy} />
              </View>
              <Text style={styles.previewLabel}>Galeria nueva ({galleryImages.length}/{MAX_GALLERY_IMAGES})</Text>
              <ImageGrid
                images={galleryImages.map((item) => item.uri)}
                onRemove={(index) =>
                  setGalleryImages((prev) =>
                    prev.filter((item, position) => {
                      if (position === index) {
                        revokeWebPreviewUri(item);
                        return false;
                      }
                      return true;
                    })
                  )
                }
              />
              {existingGalleryUrls.length ? (
                <>
                  <Text style={[styles.previewLabel, styles.previewLabelSpacing]}>Galeria actual</Text>
                  <ImageGrid images={existingGalleryUrls} />
                </>
              ) : null}
            </UiCard>

            <UiCard>
              <SectionHeader title="Video" />
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoPlaceholderIcon}>{'>'}</Text>
                <Text style={styles.videoPlaceholderText}>
                  {videoAsset ? videoAsset.name || 'video.mp4' : existingVideoUrl ? 'Video actual disponible' : 'Sin video'}
                </Text>
                {videoAsset?.size ? <Text style={styles.videoMetaText}>{formatFileSize(videoAsset.size)}</Text> : null}
              </View>
              <View style={styles.actionsInline}>
                <UiButton label={videoAsset ? 'Cambiar video' : 'Subir video'} onPress={pickVideo} disabled={imagesBusy} />
                {videoAsset ? (
                  <UiButton
                    variant="secondary"
                    label="Quitar video"
                    onPress={() =>
                      setVideoAsset((prev) => {
                        if (prev) revokeWebPreviewUri(prev);
                        return null;
                      })
                    }
                  />
                ) : null}
                {!videoAsset && existingVideoUrl ? (
                  <UiButton
                    variant="secondary"
                    label="Ver video actual"
                    onPress={async () => {
                      try {
                        await Linking.openURL(existingVideoUrl);
                      } catch (_error) {
                        Alert.alert('Video', 'No se pudo abrir el video actual.');
                      }
                    }}
                  />
                ) : null}
              </View>
            </UiCard>

            <UiCard>
              <SectionHeader title="Mapa" subtitle="Seleccion de ubicacion" />
              {renderMapPreview()}
              <UiInputField label="Calle" value={form.address || ''} onChangeText={(value) => updateField('address', value)} placeholder="Calle" />
              <View style={styles.row}>
                <UiInputField containerStyle={styles.rowItem} label="Ciudad" value={form.city || ''} onChangeText={(value) => updateField('city', value)} placeholder="Ciudad" />
                <UiInputField containerStyle={styles.rowItem} label="Provincia" value={form.province || ''} onChangeText={(value) => updateField('province', value)} placeholder="Provincia" />
              </View>
              <UiInputField label="Pais" value={form.country || ''} onChangeText={(value) => updateField('country', value)} placeholder="Pais" />
              <View style={styles.row}>
                <UiInputField containerStyle={styles.rowItem} label="Latitud" value={form.latitude || ''} onChangeText={(value) => updateField('latitude', value)} placeholder="41.3874" keyboardType="decimal-pad" />
                <UiInputField containerStyle={styles.rowItem} label="Longitud" value={form.longitude || ''} onChangeText={(value) => updateField('longitude', value)} placeholder="2.1686" keyboardType="decimal-pad" />
              </View>
            </UiCard>

            {!isEditMode ? (
              <UiCard>
                <SectionHeader title="SEO" />
                <UiInputField label="Slug URL (opcional)" value={form.page_url || ''} onChangeText={(value) => updateField('page_url', value)} placeholder="casa-en-barcelona" />
              </UiCard>
            ) : null}

            <View style={styles.actionsRow}>
              <UiButton
                variant="secondary"
                label={isEditMode ? 'Cancelar' : 'Volver'}
                onPress={() => {
                  if (isEditMode) {
                    router.replace('/properties');
                    return;
                  }
                  setStep(1);
                }}
                style={styles.actionHalf}
              />
              <UiButton
                label={
                  submitting
                    ? isEditMode
                      ? 'Guardando cambios...'
                      : 'Guardando...'
                    : imagesBusy
                      ? 'Procesando imagenes...'
                      : isEditMode
                        ? 'Guardar cambios'
                        : 'Guardar propiedad'
                }
                onPress={submitProperty}
                disabled={submitting || imagesBusy}
                loading={submitting}
                style={styles.actionHalf}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: uiColors.background,
  },
  content: {
    paddingHorizontal: uiSpacing.lg,
    paddingBottom: uiSpacing.xl,
    paddingTop: uiSpacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backIconBtn: {
    width: 40,
    height: 40,
    borderRadius: uiRadius.pill,
    borderWidth: 1,
    borderColor: uiColors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIconText: {
    fontSize: 22,
    fontWeight: '700',
    color: uiColors.primary,
    marginTop: -2,
  },
  headerActionBtn: {
    paddingHorizontal: 12,
  },
  title: {
    ...uiTypography.h1,
    color: uiColors.primary,
    marginTop: uiSpacing.md,
  },
  subtitle: {
    ...uiTypography.body,
    color: uiColors.textMuted,
    marginTop: 2,
    marginBottom: uiSpacing.lg,
  },
  metaText: {
    ...uiTypography.caption,
    color: uiColors.textMuted,
  },
  errorCard: {
    borderRadius: uiRadius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: uiSpacing.md,
    paddingVertical: uiSpacing.sm,
    marginBottom: uiSpacing.md,
  },
  errorText: {
    ...uiTypography.caption,
    color: uiColors.danger,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: uiSpacing.sm,
    ...uiTypography.body,
    color: uiColors.textMuted,
  },
  typeCard: {
    borderWidth: 1,
    borderColor: '#D8E1EA',
    borderRadius: uiRadius.md,
    padding: uiSpacing.md,
    marginBottom: uiSpacing.sm,
  },
  typeCardSelected: {
    borderColor: '#8FD7CF',
    backgroundColor: '#E8FBF8',
  },
  typeCardTitle: {
    ...uiTypography.body,
    color: uiColors.primary,
    fontWeight: '800',
  },
  typeCardDescription: {
    ...uiTypography.caption,
    color: uiColors.textMuted,
    marginTop: 4,
  },
  actionSingle: {
    marginTop: uiSpacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: uiSpacing.sm,
  },
  rowItem: {
    flex: 1,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 6,
  },
  previewBlock: {
    marginBottom: uiSpacing.md,
  },
  previewLabel: {
    ...uiTypography.label,
    color: '#334155',
    marginBottom: uiSpacing.xs,
  },
  previewLabelSpacing: {
    marginTop: uiSpacing.sm,
  },
  coverPreview: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: uiRadius.md,
    backgroundColor: '#E2E8F0',
    marginBottom: uiSpacing.sm,
  },
  coverPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: uiRadius.md,
    borderWidth: 1,
    borderColor: uiColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2F7',
  },
  placeholderText: {
    ...uiTypography.caption,
    color: uiColors.textMuted,
  },
  actionsInline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: uiSpacing.sm,
    marginBottom: uiSpacing.md,
  },
  videoPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: uiRadius.md,
    borderWidth: 1,
    borderColor: uiColors.border,
    backgroundColor: '#DCE3EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: uiSpacing.md,
    paddingHorizontal: uiSpacing.md,
  },
  videoPlaceholderIcon: {
    fontSize: 36,
    color: '#475569',
    marginBottom: 4,
  },
  videoPlaceholderText: {
    ...uiTypography.body,
    color: uiColors.primary,
    textAlign: 'center',
  },
  videoMetaText: {
    ...uiTypography.caption,
    color: uiColors.textMuted,
    marginTop: 4,
  },
  mapWrap: {
    borderRadius: uiRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: uiColors.border,
    marginBottom: uiSpacing.md,
  },
  map: {
    width: '100%',
    height: 220,
  },
  mapPlaceholder: {
    height: 220,
    borderRadius: uiRadius.md,
    borderWidth: 1,
    borderColor: uiColors.border,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: uiSpacing.md,
    paddingHorizontal: uiSpacing.lg,
  },
  mapPlaceholderText: {
    ...uiTypography.caption,
    color: uiColors.textMuted,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: uiSpacing.sm,
    marginTop: uiSpacing.xs,
    marginBottom: uiSpacing.md,
  },
  actionHalf: {
    flex: 1,
  },
});
