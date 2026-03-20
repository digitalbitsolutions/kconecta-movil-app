import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createPropertyApi, getApiErrorDetails, getPropertyTypesApi } from '../../../../api/client';

const DEFAULT_TYPES = [
  { id: 'house', name: 'Casa o chalet', description: 'Viviendas familiares con espacios amplios.' },
  { id: 'rustic', name: 'Casa rustica', description: 'Entorno natural y estilo rural.' },
  { id: 'apartment', name: 'Piso', description: 'Opciones urbanas listas para habitar.' },
  { id: 'local', name: 'Local o nave', description: 'Ideal para actividad comercial o almacen.' },
  { id: 'garage', name: 'Garaje', description: 'Seguridad para tu vehiculo o plaza.' },
  { id: 'land', name: 'Terreno', description: 'Suelo para proyectos o inversion.' },
];

const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const pickString = (...values) => {
  for (let index = 0; index < values.length; index += 1) {
    const current = values[index];
    if (typeof current === 'string' && current.trim()) return current.trim();
    if (typeof current === 'number' && Number.isFinite(current)) return String(current);
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

const normalizeType = (item) => {
  const id = pickString(item?.id, item?.type_id, item?.value, item?.slug, item?.name);
  const name = pickString(item?.name, item?.title, item?.label, item?.type_name, 'Tipo');
  const description = pickString(item?.description, item?.text, item?.subtitle);
  if (!id || !name) return null;
  return { id, name, description };
};

const TypeCard = ({ item, selected, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.typeCard, selected ? styles.typeCardSelected : null]}>
    <Text style={styles.typeName}>{item.name}</Text>
    <Text style={styles.typeDescription}>{item.description || 'Sin descripcion disponible.'}</Text>
    <Text style={styles.typeAction}>Seleccionar</Text>
  </TouchableOpacity>
);

const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      multiline={multiline}
      style={[styles.input, multiline ? styles.inputMultiline : null]}
      textAlignVertical={multiline ? 'top' : 'center'}
      placeholderTextColor="#94A3B8"
    />
  </View>
);

export default function PropertyCreateScreen() {
  const router = useRouter();
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [errorText, setErrorText] = useState('');
  const [typeOptions, setTypeOptions] = useState(DEFAULT_TYPES);
  const [selectedType, setSelectedType] = useState(null);
  const [form, setForm] = useState({
    title: '',
    operation_type: 'Venta',
    price: '',
    address: '',
    city: '',
    province: '',
    description: '',
  });

  const selectedTypeName = useMemo(() => {
    if (!selectedType) return '';
    const found = typeOptions.find((item) => String(item.id) === String(selectedType));
    return found?.name || '';
  }, [selectedType, typeOptions]);

  useEffect(() => {
    const loadTypeOptions = async () => {
      setLoadingTypes(true);
      try {
        const payload = await getPropertyTypesApi();
        const normalized = extractArray(payload).map(normalizeType).filter(Boolean);
        if (normalized.length) {
          setTypeOptions(normalized);
        }
      } catch (error) {
        const details = getApiErrorDetails(error);
        setErrorText(`No se pudieron cargar tipos desde API (${details.message}). Se usan opciones base.`);
      } finally {
        setLoadingTypes(false);
      }
    };

    loadTypeOptions();
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const goNextStep = () => {
    if (!selectedType) {
      Alert.alert('Tipo requerido', 'Selecciona un tipo de inmueble para continuar.');
      return;
    }
    setStep(2);
  };

  const submitProperty = async () => {
    if (!form.title.trim()) {
      Alert.alert('Titulo requerido', 'Completa el titulo de la propiedad.');
      return;
    }

    const payload = {
      type_id: selectedType,
      type_name: selectedTypeName,
      title: form.title.trim(),
      operation_type: form.operation_type.trim() || 'Venta',
      price: parseNumber(form.price),
      address: form.address.trim(),
      city: form.city.trim(),
      province: form.province.trim(),
      description: form.description.trim(),
    };

    setSubmitting(true);
    setErrorText('');
    try {
      await createPropertyApi(payload);
      Alert.alert('Propiedad creada', 'La propiedad se registro correctamente.');
      router.replace('/properties');
    } catch (error) {
      const details = getApiErrorDetails(error);
      setErrorText(`No se pudo crear la propiedad: ${details.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Agregar propiedad</Text>
            <Text style={styles.subtitle}>Publica tu propiedad en minutos.</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/properties')} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Ver propiedades</Text>
          </TouchableOpacity>
        </View>

        {errorText ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorText}</Text>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.card}>
            <View style={styles.stepPill}>
              <Text style={styles.stepPillText}>PASO 1</Text>
            </View>
            <Text style={styles.stepTitle}>Selecciona el tipo de inmueble</Text>
            <Text style={styles.stepSubtitle}>
              Completa los detalles para que tu propiedad destaque y llegue a los interesados.
            </Text>

            {loadingTypes ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#14B8A6" />
                <Text style={styles.loadingText}>Cargando tipos...</Text>
              </View>
            ) : (
              <View style={styles.typesGrid}>
                {typeOptions.map((item) => (
                  <TypeCard
                    key={`${item.id}`}
                    item={item}
                    selected={String(selectedType) === String(item.id)}
                    onPress={() => setSelectedType(item.id)}
                  />
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={goNextStep}>
              <Text style={styles.primaryBtnText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.stepPill}>
              <Text style={styles.stepPillText}>PASO 2</Text>
            </View>
            <Text style={styles.stepTitle}>Datos principales</Text>
            <Text style={styles.stepSubtitle}>Tipo seleccionado: {selectedTypeName || 'Sin tipo'}</Text>

            <InputField
              label="Titulo"
              value={form.title}
              onChangeText={(value) => updateField('title', value)}
              placeholder="Ej: Piso en venta en Avenida del Bosc"
            />
            <InputField
              label="Operacion"
              value={form.operation_type}
              onChangeText={(value) => updateField('operation_type', value)}
              placeholder="Venta o Alquiler"
            />
            <InputField
              label="Precio"
              value={form.price}
              onChangeText={(value) => updateField('price', value)}
              placeholder="390000"
              keyboardType="numeric"
            />
            <InputField
              label="Direccion"
              value={form.address}
              onChangeText={(value) => updateField('address', value)}
              placeholder="Calle y numero"
            />
            <InputField
              label="Ciudad"
              value={form.city}
              onChangeText={(value) => updateField('city', value)}
              placeholder="Barcelona"
            />
            <InputField
              label="Provincia"
              value={form.province}
              onChangeText={(value) => updateField('province', value)}
              placeholder="Barcelona"
            />
            <InputField
              label="Descripcion"
              value={form.description}
              onChangeText={(value) => updateField('description', value)}
              placeholder="Describe el inmueble"
              multiline
            />

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                <Text style={styles.backBtnText}>Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={submitProperty} disabled={submitting}>
                <Text style={styles.primaryBtnText}>{submitting ? 'Guardando...' : 'Guardar propiedad'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EEF3F8',
  },
  content: {
    padding: 14,
    paddingBottom: 24,
  },
  headerRow: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#0F172A',
    fontSize: 31,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    color: '#475569',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  secondaryBtnText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  errorCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FBCFE8',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  errorText: {
    color: '#9F1239',
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1DDE8',
    backgroundColor: '#F8FAFC',
    padding: 14,
  },
  stepPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stepPillText: {
    color: '#0E7490',
    fontWeight: '800',
    fontSize: 12,
  },
  stepTitle: {
    marginTop: 10,
    color: '#0F172A',
    fontSize: 36,
    fontWeight: '800',
  },
  stepSubtitle: {
    marginTop: 4,
    marginBottom: 10,
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 14,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  typeCard: {
    width: '33.333%',
    minWidth: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DFEA',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  typeCardSelected: {
    borderColor: '#14B8A6',
    backgroundColor: '#ECFEFF',
  },
  typeName: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '800',
  },
  typeDescription: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
  typeAction: {
    marginTop: 10,
    color: '#0E7490',
    fontSize: 14,
    fontWeight: '800',
  },
  fieldWrap: {
    marginBottom: 10,
  },
  fieldLabel: {
    marginBottom: 4,
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
  },
  inputMultiline: {
    minHeight: 90,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  backBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  backBtnText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryBtn: {
    borderRadius: 10,
    backgroundColor: '#14B8A6',
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
