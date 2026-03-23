import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { 
  getPropertyByIdApi, 
  getApiErrorDetails, 
  createPropertyApi, 
  updatePropertyApi
} from '../../../api/client';
import usePropertyFormCatalogs from '../../../hooks/usePropertyFormCatalogs';
import { 
  normalizeRawFieldKey, 
  normalizeFormValue, 
  pickDefinedValue, 
  resolveOperationModeFromProperty,
  toRawFieldPayloadValue,
  sanitizePayload,
  extractPropertyObject
} from './helpers';
import { 
  RAW_FIELDS, 
  OPERATION_OPTIONS, 
  TYPE_SENSITIVE_RAW_FIELDS,
  RAW_FIELD_SOURCE_ALIASES,
  HOUSE_CHALET_TYPE_ID,
  APARTMENT_TYPE_ID,
  RUSTIC_HOUSE_TYPE_ID,
  LOCAL_PREMISES_TYPE_ID,
  GARAGE_TYPE_ID,
  LAND_TYPE_ID,
  RESIDENTIAL_TYPE_IDS
} from './constants';
import { PropertyFormState, MediaAsset } from './types';
import { parseNumber } from '../../../utils/dataMappers';
import { appendUploadFile } from '../../../utils/propertyImagePipeline';

interface PropertyFormContextType {
  // State
  step: number;
  setStep: (step: number) => void;
  form: PropertyFormState;
  selectedType: number | null;
  operationMode: string;
  loadingProperty: boolean;
  submitting: boolean;
  errorText: string;
  setErrorText: (text: string) => void;
  
  // Media
  coverImage: MediaAsset | null;
  setCoverImage: (image: MediaAsset | null) => void;
  galleryImages: MediaAsset[];
  setGalleryImages: (images: MediaAsset[]) => void;
  videoAsset: MediaAsset | null;
  setVideoAsset: (video: MediaAsset | null) => void;
  
  // Helpers
  updateField: (key: string, value: any) => void;
  setRawFieldValue: (rawField: string, value: any) => void;
  getRawFieldValue: (rawField: string) => any;
  handleSelectType: (typeId: number) => void;
  setOperationMode: (mode: string) => void;
  
  // Catalogs
  catalogs: any;
  loadingCatalogs: boolean;
  catalogErrorText: string | null;
  reloadCatalogs: () => void;
  
  // Actions
  loadProperty: (id: string) => Promise<void>;
  submitForm: () => Promise<void>;
  isEditMode: boolean;
  editSnapshot: any;

  // UI Helpers
  showHeatingFuel: boolean;
  isResidential: boolean;
  isHouseChalet: boolean;
  isApartment: boolean;
  isRusticHouse: boolean;
  isLocalPremises: boolean;
  isGarage: boolean;
  isLand: boolean;
  saleOnlyVisible: boolean;
  rentalOnlyVisible: boolean;

  // Additional helpers
  toggleListValue: (rawField: string, value: string) => void;
  toggleBooleanRawField: (rawField: string) => void;
  incrementRawNumber: (rawField: string, delta: number, min?: number) => void;
}

const PropertyFormContext = createContext<PropertyFormContextType | undefined>(undefined);

const buildInitialForm = (): PropertyFormState => {
  const form: PropertyFormState = {
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

export const PropertyFormProvider: React.FC<{ children: React.ReactNode; initialId?: string; isEdit?: boolean }> = ({ 
  children, 
  initialId,
  isEdit = false
}) => {
  const router = useRouter();
  const [step, setStep] = useState(isEdit ? 2 : 1);
  const [form, setForm] = useState<PropertyFormState>(buildInitialForm);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [operationMode, setOperationMode] = useState('venta');
  const [loadingProperty, setLoadingProperty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [editSnapshot, setEditSnapshot] = useState<any>(null);

  // Media state
  const [coverImage, setCoverImage] = useState<MediaAsset | null>(null);
  const [galleryImages, setGalleryImages] = useState<MediaAsset[]>([]);
  const [videoAsset, setVideoAsset] = useState<MediaAsset | null>(null);

  const { catalogs, loading: loadingCatalogs, error: catalogErrorText, reload: reloadCatalogs } = usePropertyFormCatalogs(step === 2 ? selectedType : null);

  const updateField = useCallback((key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const setRawFieldValue = useCallback((rawField: string, value: any) => {
    updateField(normalizeRawFieldKey(rawField), value);
  }, [updateField]);

  const getRawFieldValue = useCallback((rawField: string) => {
    return form[normalizeRawFieldKey(rawField)] || '';
  }, [form]);

  const handleSelectType = useCallback((nextTypeId: number) => {
    setSelectedType(current => {
      if (current && current !== nextTypeId) {
        setForm(prev => {
          const next = { ...prev };
          TYPE_SENSITIVE_RAW_FIELDS.forEach(field => {
            next[normalizeRawFieldKey(field)] = '';
          });
          return next;
        });
      }
      return nextTypeId;
    });
  }, []);

  const loadProperty = useCallback(async (id: string) => {
    setLoadingProperty(true);
    try {
      const payload = await getPropertyByIdApi(id);
      const property = extractPropertyObject(payload);
      if (!property) throw new Error('No se recibieron datos de la propiedad.');

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
        const aliasValues = (RAW_FIELD_SOURCE_ALIASES[rawField] || []).map((key) => property?.[key]);
        const resolved = pickDefinedValue(
          property?.[rawField],
          property?.[base],
          property?.[`${base}_id`],
          property?.[`${base}_ids`],
          ...aliasValues
        );
        nextForm[normalizeRawFieldKey(rawField)] = normalizeFormValue(rawField, resolved);
      });

      setForm(nextForm);
      setSelectedType(parseNumber(property?.type_id ?? property?.type) || null);
      setOperationMode(resolveOperationModeFromProperty(property));
      setEditSnapshot(property);
      setStep(2);
    } catch (error) {
      const details = getApiErrorDetails(error);
      setErrorText(`No se pudo cargar la propiedad (${details.message}).`);
      Toast.show({ type: 'error', text1: 'Error de carga', text2: details.message });
    } finally {
      setLoadingProperty(false);
    }
  }, []);

  // Derived state
  const selectedTypeId = parseNumber(selectedType);
  const isHouseChalet = selectedTypeId === HOUSE_CHALET_TYPE_ID;
  const isApartment = selectedTypeId === APARTMENT_TYPE_ID;
  const isRusticHouse = selectedTypeId === RUSTIC_HOUSE_TYPE_ID;
  const isLocalPremises = selectedTypeId === LOCAL_PREMISES_TYPE_ID;
  const isGarage = selectedTypeId === GARAGE_TYPE_ID;
  const isLand = selectedTypeId === LAND_TYPE_ID;
  const isResidential = RESIDENTIAL_TYPE_IDS.includes(selectedTypeId);
  
  const saleOnlyVisible = useMemo(() => OPERATION_OPTIONS.find(o => o.id === operationMode)?.useSalePrice ?? true, [operationMode]);
  const rentalOnlyVisible = useMemo(() => OPERATION_OPTIONS.find(o => o.id === operationMode)?.useRentalPrice ?? false, [operationMode]);

  const showHeatingFuel = useMemo(() => {
    const val = String(getRawFieldValue('type_heating') || '');
    return val === '1' || val === '2';
  }, [getRawFieldValue]);

  const validateForm = useCallback(() => {
    if (!form.title.trim()) return 'El titulo es obligatorio.';
    if (!form.address.trim() || !form.city.trim()) return 'La direccion y ciudad son obligatorias.';
    if (saleOnlyVisible && parseNumber(form.sale_price) <= 0) return 'Indica un precio de venta valido.';
    if (rentalOnlyVisible && parseNumber(form.rental_price) <= 0) return 'Indica un precio de alquiler valido.';
    if (isResidential && !getRawFieldValue('meters_built')) return 'Los metros construidos son obligatorios.';
    return '';
  }, [form, saleOnlyVisible, rentalOnlyVisible, isResidential, getRawFieldValue]);

  const toggleListValue = useCallback((rawField: string, value: string) => {
    setForm((prev) => {
      const key = normalizeRawFieldKey(rawField);
      const current = String(prev[key] || '');
      const parts = current.split(',').map(p => p.trim()).filter(Boolean);
      const nextParts = parts.includes(value) 
        ? parts.filter(p => p !== value) 
        : [...parts, value];
      return { ...prev, [key]: nextParts.join(',') };
    });
  }, []);

  const toggleBooleanRawField = useCallback((rawField: string) => {
    setForm((prev) => {
      const key = normalizeRawFieldKey(rawField);
      const current = String(prev[key] || '');
      return { ...prev, [key]: current === '1' ? '0' : '1' };
    });
  }, []);

  const incrementRawNumber = useCallback((rawField: string, delta: number, min = 0) => {
    setForm((prev) => {
      const key = normalizeRawFieldKey(rawField);
      const current = parseNumber(prev[key]);
      const next = Math.max(min, current + delta);
      return { ...prev, [key]: String(next) };
    });
  }, []);

  const submitForm = useCallback(async () => {
    const validation = validateForm();
    if (validation) {
      Toast.show({ type: 'info', text1: 'Formulario incompleto', text2: validation });
      return;
    }

    const salePrice = parseNumber(form.sale_price);
    const rentalPrice = parseNumber(form.rental_price);
    const preferredPrice = rentalOnlyVisible && !saleOnlyVisible ? rentalPrice : salePrice || rentalPrice;

    const payload = sanitizePayload({
      type_id: selectedTypeId,
      type: selectedTypeId,
      title: String(form.title || '').trim(),
      operation_type: OPERATION_OPTIONS.find(o => o.id === operationMode)?.operationType || 'Venta',
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
      page_url: String(form.page_url || '').trim() || null,
    });

    setSubmitting(true);
    setErrorText('');
    try {
      const requestPayload = new FormData();
      Object.entries(payload).forEach(([key, value]) => requestPayload.append(key, String(value)));

      RAW_FIELDS.forEach((rawField) => {
        const rawValue = form[normalizeRawFieldKey(rawField)];
        const parsed = toRawFieldPayloadValue(rawField, rawValue);
        if (Array.isArray(parsed)) {
          if (!parsed.length) requestPayload.append(rawField, '');
          else parsed.forEach((item) => requestPayload.append(rawField, String(item)));
          return;
        }
        if (parsed === null || parsed === undefined || parsed === '') {
          requestPayload.append(rawField, '');
          return;
        }
        requestPayload.append(rawField, String(parsed));
      });

      if (coverImage) appendUploadFile(requestPayload, 'cover_image', coverImage);
      galleryImages.forEach((imageFile) => appendUploadFile(requestPayload, 'more_images[]', imageFile));
      if (videoAsset) appendUploadFile(requestPayload, 'video', videoAsset);

      if (isEdit && initialId) {
        await updatePropertyApi(initialId, requestPayload);
        Toast.show({ type: 'success', text1: '¡Éxito!', text2: 'Inmueble actualizado correctamente.' });
      } else {
        await createPropertyApi(requestPayload);
        Toast.show({ type: 'success', text1: '¡Éxito!', text2: 'Inmueble publicado correctamente.' });
      }
      router.replace('/properties');
    } catch (error) {
      const details = getApiErrorDetails(error);
      const validationErrors = details?.data?.errors && typeof details.data.errors === 'object'
          ? Object.values(details.data.errors).flat().filter(Boolean).join(' | ')
          : '';
      const msg = details.status === 422 && validationErrors
          ? `Validacion: ${validationErrors}`
          : `No se pudo ${isEdit ? 'actualizar' : 'crear'}: ${details.message}`;
      
      setErrorText(msg);
      Toast.show({ type: 'error', text1: 'Error al guardar', text2: msg });
    } finally {
      setSubmitting(false);
    }
  }, [
    validateForm, form, operationMode, selectedTypeId, isEdit, initialId, 
    coverImage, galleryImages, videoAsset, router, saleOnlyVisible, rentalOnlyVisible
  ]);

  const value = useMemo(() => ({
    step, setStep,
    form,
    selectedType,
    operationMode,
    loadingProperty,
    submitting,
    errorText, setErrorText,
    coverImage, setCoverImage,
    galleryImages, setGalleryImages,
    videoAsset, setVideoAsset,
    updateField,
    setRawFieldValue,
    getRawFieldValue,
    handleSelectType,
    setOperationMode,
    catalogs,
    loadingCatalogs,
    catalogErrorText,
    reloadCatalogs,
    loadProperty,
    submitForm,
    isEditMode: isEdit,
    editSnapshot,
    showHeatingFuel,
    isResidential,
    isHouseChalet,
    isApartment,
    isRusticHouse,
    isLocalPremises,
    isGarage,
    isLand,
    saleOnlyVisible,
    rentalOnlyVisible,
    toggleListValue,
    toggleBooleanRawField,
    incrementRawNumber
  }), [
    step, form, selectedType, operationMode, loadingProperty, submitting, 
    errorText, coverImage, galleryImages, videoAsset, catalogs, loadingCatalogs,
    catalogErrorText, reloadCatalogs, isEdit, editSnapshot, updateField, 
    setRawFieldValue, getRawFieldValue, handleSelectType, loadProperty, submitForm,
    showHeatingFuel, isResidential, isHouseChalet, isApartment, isRusticHouse,
    isLocalPremises, isGarage, isLand, saleOnlyVisible, rentalOnlyVisible,
    toggleListValue, toggleBooleanRawField, incrementRawNumber
  ]);

  return <PropertyFormContext.Provider value={value}>{children}</PropertyFormContext.Provider>;
};

export const usePropertyForm = () => {
  const context = useContext(PropertyFormContext);
  if (!context) throw new Error('usePropertyForm must be used within a PropertyFormProvider');
  return context;
};
