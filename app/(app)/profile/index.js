import React, { useEffect, useMemo, useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  Image, 
  RefreshControl, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { 
  getApiErrorDetails, 
  getMeApi, 
  getServiceProfileApi, 
  updateServiceProfileApi 
} from '../../../api/client';
import { Button, Card, colors, spacing, typography } from '../../../components/ui';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
  extractUser, 
  userLevelName,
  getFriendlyApiMessage,
  sanitizeText
} from '../../../utils/dataMappers';

const pick = (...args) => {
  for (let i = 0; i < args.length; i++) {
    const current = args[i];
    if (typeof current === 'string' && current.trim()) return current.trim();
    if (typeof current === 'number' && Number.isFinite(current)) return String(current);
  }
  return '';
};

const ABSOLUTE_URL_REGEX = /^https?:\/\//i;
const absolutizeUrl = (value) => {
  const raw = pick(value);
  if (!raw) return '';
  const normalizedRaw = raw.replace(/\\/g, '/').replace(/^"+|"+$/g, '').trim();
  if (!normalizedRaw) return '';
  if (normalizedRaw.startsWith('data:image/')) return normalizedRaw;
  if (normalizedRaw.startsWith('blob:')) return normalizedRaw;
  if (ABSOLUTE_URL_REGEX.test(normalizedRaw)) return normalizedRaw;
  if (normalizedRaw.startsWith('//')) return `https:${normalizedRaw}`;
  if (normalizedRaw.startsWith('/')) return `https://kconecta.com${normalizedRaw}`;
  return `https://kconecta.com/${normalizedRaw.replace(/^\/+/, '')}`;
};

const PROFILE_IMAGE_HINT = /(logo|avatar|photo|profile.*image|image_profile|user_image|picture|(^|_)img($|_)|(^|_)image($|_))/i;
const SERVICE_IMAGE_EXCLUDE = /(cover|gallery|banner|hero|thumbnail|thumb|video)/i;

const findProfileImageInObject = (source, depth = 0) => {
  if (!source || typeof source !== 'object' || depth > 3) return '';
  const entries = Array.isArray(source)
    ? source.map((value, index) => [String(index), value])
    : Object.entries(source);

  for (let index = 0; index < entries.length; index += 1) {
    const [key, value] = entries[index];
    if (typeof value !== 'string') continue;
    if (!PROFILE_IMAGE_HINT.test(key)) continue;
    if (SERVICE_IMAGE_EXCLUDE.test(key)) continue;
    const absolute = absolutizeUrl(value);
    if (absolute) return absolute;
  }

  for (let index = 0; index < entries.length; index += 1) {
    const [, value] = entries[index];
    if (value && typeof value === 'object') {
      const nested = findProfileImageInObject(value, depth + 1);
      if (nested) return nested;
    }
  }

  return '';
};

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [profileSource, setProfileSource] = useState({});

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [landlinePhone, setLandlinePhone] = useState('');
  const [docType, setDocType] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [address, setAddress] = useState('');
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [logoAsset, setLogoAsset] = useState(null);

  const hydrateForm = (rawMeUser, rawProfile) => {
    const merged = { ...(rawProfile || {}) };
    Object.entries(rawMeUser || {}).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      if (typeof value === 'string' && !value.trim()) return;
      merged[key] = value;
    });
    setProfileSource(merged);

    setFirstName(pick(rawMeUser?.first_name, merged?.first_name, merged?.name));
    setLastName(pick(rawMeUser?.last_name, merged?.last_name));
    setEmail(pick(rawMeUser?.email, merged?.email));
    setPhone(pick(rawMeUser?.phone, rawMeUser?.mobile_phone, merged?.phone, merged?.mobile_phone));
    setLandlinePhone(pick(rawMeUser?.landline_phone, merged?.landline_phone));
    setDocType(pick(rawMeUser?.document_type, merged?.document_type, merged?.doc_type));
    setDocNumber(pick(rawMeUser?.document_number, merged?.document_number, merged?.document));
    setAddress(pick(rawMeUser?.address, merged?.address, merged?.location));
    setUsername(pick(rawMeUser?.user_name, merged?.user_name, rawMeUser?.name));
    setNewPassword('');
    setLogoAsset(null);
  };

  const loadProfile = async () => {
    setErrorText('');
    try {
      const mePayload = await getMeApi();
      const meUser = extractUser(mePayload) || {};
      setUser(meUser);

      let serviceProfile = {};
      try {
        serviceProfile = await getServiceProfileApi();
      } catch (_serviceError) {
        // keep /me data as source of truth
      }

      hydrateForm(meUser, serviceProfile);
    } catch (error) {
      const details = getApiErrorDetails(error);
      setErrorText(sanitizeText(details.message, { maxLength: 220, fallback: 'No se pudo cargar el perfil.' }));
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await loadProfile();
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadProfile();
    } finally {
      setRefreshing(false);
    }
  };

  const onPickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos permiso para acceder a tus archivos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.9,
      selectionLimit: 1,
    });

    if (result.canceled || !result.assets?.length) return;
    setLogoAsset(result.assets[0]);
  };

  const onSave = async () => {
    if (!firstName.trim() || !email.trim()) {
      Alert.alert('Campos requeridos', 'Nombre y email son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      let payload;
      if (logoAsset) {
        payload = new FormData();
        payload.append('first_name', firstName.trim());
        payload.append('last_name', lastName.trim());
        payload.append('email', email.trim());
        payload.append('phone', phone.trim());
        payload.append('landline_phone', landlinePhone.trim());
        payload.append('document_type', docType.trim());
        payload.append('document_number', docNumber.trim());
        payload.append('address', address.trim());
        if (newPassword.trim()) {
          payload.append('password', newPassword.trim());
        }

        const logoFile = {
          uri: logoAsset.uri,
          name: logoAsset.fileName || logoAsset.name || 'logo.jpg',
          type: logoAsset.mimeType || logoAsset.type || 'image/jpeg',
        };

        payload.append('logo', logoFile);
        payload.append('photo', logoFile);
        payload.append('image', logoFile);
        payload.append('avatar', logoFile);
        payload.append('company_logo', logoFile);
      } else {
        payload = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          landline_phone: landlinePhone.trim(),
          document_type: docType.trim(),
          document_number: docNumber.trim(),
          address: address.trim(),
        };

        if (newPassword.trim()) {
          payload.password = newPassword.trim();
        }
      }

      await updateServiceProfileApi(payload);

      await loadProfile();
      Alert.alert('Guardado', 'Se actualizaron los datos del perfil.');
    } catch (error) {
      Alert.alert('No se pudo guardar', getFriendlyApiMessage(error, 'Intenta nuevamente.'));
    } finally {
      setSaving(false);
    }
  };

  const profileImage = useMemo(
    () => {
      const explicit = pick(
        logoAsset?.uri,
        profileSource?.logo_url,
        profileSource?.logo,
        profileSource?.company_logo_url,
        profileSource?.company_logo,
        profileSource?.photo_url,
        profileSource?.photo,
        profileSource?.image_url,
        profileSource?.avatar_url,
        user?.photo_url,
        user?.photo,
        user?.image_url,
        user?.avatar_url
      );
      if (explicit) return absolutizeUrl(explicit);
      return findProfileImageInObject(profileSource) || findProfileImageInObject(user);
    },
    [logoAsset, profileSource, user]
  );

  const displayName = pick(`${firstName} ${lastName}`.trim(), username, profileSource?.name, 'Usuario');
  const displayEmail = pick(email, profileSource?.email, '-');
  const roleName = userLevelName(user || profileSource || {});
  const hasValidAddress = Boolean(address.trim() && address.trim().length >= 8);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Mi perfil</Text>
        <Text style={styles.subtitle}>Actualiza tus datos personales</Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.note}>Cargando perfil...</Text>
          </View>
        ) : (
          <>
            {errorText ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>No se pudo cargar el perfil</Text>
                <Text style={styles.errorText}>{errorText}</Text>
              </View>
            ) : null}

            <Card style={styles.formCard}>
              <View style={styles.row2}>
                <View style={styles.col}>
                  <Text style={styles.label}>Nombre *</Text>
                  <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Nombre" />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Apellidos</Text>
                  <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Apellidos" />
                </View>
              </View>

              <View style={styles.row2}>
                <View style={styles.col}>
                  <Text style={styles.label}>E-mail *</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="correo@dominio.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Teléfono</Text>
                  <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Teléfono" />
                </View>
              </View>

              <View style={styles.row2}>
                <View style={styles.col}>
                  <Text style={styles.label}>Teléfono fijo</Text>
                  <TextInput style={styles.input} value={landlinePhone} onChangeText={setLandlinePhone} placeholder="Opcional" />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Documento</Text>
                  <View style={styles.row2Compact}>
                    <TextInput style={[styles.input, styles.compactInput]} value={docType} onChangeText={setDocType} placeholder="Tipo" />
                    <TextInput style={[styles.input, styles.compactInput]} value={docNumber} onChangeText={setDocNumber} placeholder="Número" />
                  </View>
                </View>
              </View>

              <Text style={styles.label}>Dirección</Text>
              <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Dirección completa" />
              <Text style={styles.helperText}>Opcional. Si no seleccionas una dirección validada, no aparecerás en el mapa.</Text>
              {hasValidAddress ? (
                <View style={styles.validBadge}>
                  <Text style={styles.validBadgeText}>Dirección validada</Text>
                </View>
              ) : null}

              <View style={styles.row2}>
                <View style={styles.col}>
                  <Text style={styles.label}>Razón social / Nombre de usuario</Text>
                  <TextInput style={[styles.input, styles.readOnlyInput]} value={username} editable={false} />
                  <Text style={styles.helperText}>Este valor es único y no se puede modificar.</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Nueva contraseña</Text>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Dejar vacío para mantener"
                    secureTextEntry
                  />
                </View>
              </View>

              <Text style={styles.label}>Logo o foto (opcional)</Text>
              <TouchableOpacity style={styles.fileInput} onPress={onPickLogo}>
                <Text style={styles.fileInputText}>{logoAsset?.fileName || 'Seleccionar archivo'}</Text>
              </TouchableOpacity>
              <Text style={styles.helperText}>Se recomienda formato cuadrado, máximo 2MB.</Text>

              <View style={styles.saveWrap}>
                <Button label={saving ? 'Guardando...' : 'Guardar cambios'} onPress={onSave} disabled={saving} />
              </View>
            </Card>

            <Card style={styles.previewCard}>
              <View style={styles.previewImageWrap}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.previewImage} resizeMode="cover" />
                ) : (
                  <View style={styles.previewImageFallback}>
                    <Text style={styles.previewImageFallbackText}>Sin imagen</Text>
                  </View>
                )}
              </View>
              <Text style={styles.previewName}>{displayName}</Text>
              <Text style={styles.previewEmail}>{displayEmail}</Text>
              <Text style={styles.previewRole}>{sanitizeText(roleName, { maxLength: 60, fallback: 'Usuario' })}</Text>

              {hasValidAddress ? (
                <View style={styles.validCard}>
                  <Text style={styles.validCardTitle}>Dirección validada</Text>
                  <Text style={styles.validCardText}>Usa el autocompletado para mejorar la visibilidad en el mapa.</Text>
                </View>
              ) : null}
            </Card>

            <Button label="Cerrar sesión" onPress={logout} variant="danger" />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  title: {
    color: '#071B3E',
    ...typography.h1,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    color: '#4D607A',
    ...typography.body,
  },
  centered: {
    paddingTop: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    ...typography.body,
  },
  errorCard: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorTitle: {
    color: colors.danger,
    ...typography.h3,
  },
  errorText: {
    marginTop: spacing.xs,
    color: colors.danger,
    ...typography.caption,
    lineHeight: 18,
  },
  formCard: {
    marginBottom: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#C8D4E3',
    backgroundColor: '#F4F7FB',
  },
  row2: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  row2Compact: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  col: {
    flex: 1,
  },
  label: {
    ...typography.captionStrong,
    color: '#11284B',
    marginBottom: spacing.xxs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: '#C9D6E7',
    borderRadius: 12,
    backgroundColor: '#EFF3F8',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: '#0D2245',
    ...typography.body,
  },
  compactInput: {
    flex: 1,
  },
  readOnlyInput: {
    color: '#4F617C',
    backgroundColor: '#E5EBF2',
  },
  helperText: {
    ...typography.caption,
    color: '#617694',
    marginTop: spacing.xxs,
  },
  validBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#63D5B2',
    backgroundColor: '#D9F6EA',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  validBadgeText: {
    ...typography.captionStrong,
    color: '#087D58',
  },
  fileInput: {
    marginTop: spacing.xxs,
    borderWidth: 1,
    borderColor: '#C9D6E7',
    borderRadius: 12,
    backgroundColor: '#EFF3F8',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  fileInputText: {
    ...typography.body,
    color: '#2F4769',
  },
  saveWrap: {
    marginTop: spacing.md,
    alignItems: 'flex-end',
  },
  previewCard: {
    marginBottom: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#C8D4E3',
    backgroundColor: '#F4F7FB',
  },
  previewImageWrap: {
    borderWidth: 1,
    borderColor: '#D1DDEA',
    borderStyle: 'dashed',
    borderRadius: 12,
    minHeight: 170,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
    backgroundColor: '#EEF3F8',
  },
  previewImage: {
    width: '100%',
    height: 190,
  },
  previewImageFallback: {
    width: '100%',
    minHeight: 170,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImageFallbackText: {
    ...typography.captionStrong,
    color: '#7890AF',
  },
  previewName: {
    ...typography.h3,
    color: '#0D2346',
    marginBottom: spacing.xxs,
  },
  previewEmail: {
    ...typography.body,
    color: '#4D6383',
    marginBottom: spacing.sm,
  },
  previewRole: {
    ...typography.captionStrong,
    color: '#2B476E',
    marginBottom: spacing.sm,
  },
  validCard: {
    borderWidth: 1,
    borderColor: '#9ED9D1',
    borderRadius: 12,
    backgroundColor: '#DDF2F2',
    padding: spacing.md,
  },
  validCardTitle: {
    ...typography.h3,
    color: '#0C6E73',
    marginBottom: spacing.xxs,
  },
  validCardText: {
    ...typography.body,
    color: '#1A5F67',
    lineHeight: 20,
  },
});
