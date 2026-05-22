import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  deleteMyAccountApi,
  getApiErrorDetails,
  getFriendlyApiMessage,
  getMeApi,
  LEGAL_URLS,
  getServiceProfileApi,
  updateServiceProfileApi,
} from '../../../api/client';
import { Button, Card, colors, spacing, typography } from '../../../components/ui';
import { useAuthStore } from '../../../store/useAuthStore';
import { extractUser, sanitizeText, userLevelName } from '../../../utils/dataMappers';
import { appendUploadFile, convertAssetsToWebp } from '../../../utils/propertyImagePipeline';

const pick = (...args) => {
  for (let i = 0; i < args.length; i += 1) {
    const current = args[i];
    if (typeof current === 'string' && current.trim()) return current.trim();
    if (typeof current === 'number' && Number.isFinite(current)) return String(current);
  }
  return '';
};

const DOCUMENT_TYPE_OPTIONS = [
  { label: 'DNI', value: 'dni' },
  { label: 'NIE', value: 'nie' },
  { label: 'NIF', value: 'nif' },
  { label: 'CIF', value: 'cif' },
  { label: 'Pasaporte', value: 'passport' },
];
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;

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

const resolveAssetSizeBytes = async (asset) => {
  if (!asset) return 0;
  if (typeof asset.size === 'number' && Number.isFinite(asset.size)) return asset.size;
  if (asset.file && typeof asset.file.size === 'number') return asset.file.size;
  if (!asset.uri) return 0;
  try {
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    return blob?.size || 0;
  } catch (_error) {
    return 0;
  }
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
  const [docType, setDocType] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [address, setAddress] = useState('');
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [logoAsset, setLogoAsset] = useState(null);
  const [docTypeModalVisible, setDocTypeModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteStep, setDeleteStep] = useState('warning');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

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
        // Keep /me data as source of truth when service profile fails.
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

    try {
      const [convertedLogo] = await convertAssetsToWebp([result.assets[0]], 'provider-logo');
      if (!convertedLogo) {
        Alert.alert('No se pudo procesar el logo', 'Intenta nuevamente con otra imagen.');
        return;
      }

      const convertedSize = await resolveAssetSizeBytes(convertedLogo);
      if (convertedSize > MAX_LOGO_SIZE_BYTES) {
        Alert.alert('Logo demasiado pesado', 'El logo debe pesar como máximo 2MB después de convertir a WebP.');
        return;
      }

      setLogoAsset(convertedLogo);
    } catch (_error) {
      Alert.alert('No se pudo convertir el logo', 'Selecciona otra imagen e intenta nuevamente.');
    }
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
        const logoSize = await resolveAssetSizeBytes(logoAsset);
        if (logoSize > MAX_LOGO_SIZE_BYTES) {
          Alert.alert('Logo demasiado pesado', 'El logo debe pesar como máximo 2MB.');
          return;
        }

        payload = new FormData();
        payload.append('first_name', firstName.trim());
        payload.append('last_name', lastName.trim());
        payload.append('email', email.trim());
        payload.append('phone', phone.trim());
        payload.append('landline_phone', '');
        payload.append('document_type', docType.trim());
        payload.append('document_number', docNumber.trim());
        payload.append('address', address.trim());
        if (newPassword.trim()) payload.append('password', newPassword.trim());

        appendUploadFile(payload, 'provider_logo', logoAsset);
        appendUploadFile(payload, 'logo', logoAsset);
        appendUploadFile(payload, 'photo', logoAsset);
        appendUploadFile(payload, 'image', logoAsset);
        appendUploadFile(payload, 'avatar', logoAsset);
        appendUploadFile(payload, 'company_logo', logoAsset);
      } else {
        payload = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          landline_phone: '',
          document_type: docType.trim(),
          document_number: docNumber.trim(),
          address: address.trim(),
        };
        if (newPassword.trim()) payload.password = newPassword.trim();
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

  const openLegalLink = async (url) => {
    const safeUrl = pick(url);
    if (!safeUrl) return;
    try {
      const supported = await Linking.canOpenURL(safeUrl);
      if (!supported) {
        Alert.alert('Enlace no disponible', 'No se pudo abrir este enlace en tu dispositivo.');
        return;
      }
      await Linking.openURL(safeUrl);
    } catch (_error) {
      Alert.alert('Error', 'No se pudo abrir el enlace legal.');
    }
  };

  const openDeleteAccountModal = () => {
    setDeleteStep('warning');
    setDeletePassword('');
    setDeleteReason('');
    setDeleteModalVisible(true);
  };

  const closeDeleteAccountModal = () => {
    if (deletingAccount) return;
    setDeleteModalVisible(false);
    setDeleteStep('warning');
    setDeletePassword('');
    setDeleteReason('');
  };

  const onConfirmDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      Alert.alert('Contraseña requerida', 'Ingresa tu contraseña actual para continuar.');
      return;
    }

    setDeletingAccount(true);
    try {
      await deleteMyAccountApi({ password: deletePassword, reason: deleteReason });
      await logout();
      closeDeleteAccountModal();
      Alert.alert('Cuenta eliminada', 'Tu cuenta se eliminó correctamente.');
    } catch (error) {
      const details = getApiErrorDetails(error);
      if (details.status === 401) {
        Alert.alert('Credenciales inválidas', 'La contraseña actual no es correcta.');
      } else if (details.status === 429) {
        Alert.alert('Demasiados intentos', 'Espera unos minutos e inténtalo nuevamente.');
      } else if (details.status && details.status >= 500) {
        Alert.alert('Servidor no disponible', 'No pudimos eliminar tu cuenta ahora. Intenta más tarde.');
      } else {
        Alert.alert('No se pudo eliminar la cuenta', getFriendlyApiMessage(error, 'Intenta nuevamente.'));
      }
    } finally {
      setDeletingAccount(false);
    }
  };

  const profileImage = useMemo(() => {
    const explicit = pick(
      logoAsset?.uri,
      profileSource?.provider_logo_url,
      profileSource?.provider_logo_path,
      user?.provider_logo_url,
      user?.provider_logo_path,
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
  }, [logoAsset, profileSource, user]);

  const displayName = pick(`${firstName} ${lastName}`.trim(), username, profileSource?.name, 'Usuario');
  const displayEmail = pick(email, profileSource?.email, '-');
  const roleName = userLevelName(user || profileSource || {});
  const hasValidAddress = Boolean(address.trim() && address.trim().length >= 8);
  const selectedDocLabel = DOCUMENT_TYPE_OPTIONS.find((item) => item.value === docType)?.label || '...';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Mi perfil</Text>
            <Text style={styles.subtitle}>Actualiza tus datos personales</Text>
          </View>
          <View style={styles.gearBadge}>
            <Ionicons name="settings" size={19} color="#0A978E" />
          </View>
        </View>

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

            <Card style={styles.commercialCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconBubble}>
                  <Ionicons name="business-outline" size={14} color="#159DA4" />
                </View>
                <Text style={styles.sectionTitle}>Perfil comercial</Text>
              </View>

              <View style={styles.commercialBody}>
                <View style={styles.logoPreviewWrap}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.logoPreview} resizeMode="contain" />
                  ) : (
                    <View style={styles.logoFallback}>
                      <Text style={styles.logoFallbackText}>Sin logo</Text>
                    </View>
                  )}
                </View>

                <View style={styles.commercialInfo}>
                  <Text style={styles.commercialName}>{displayName}</Text>
                  <Text style={styles.commercialEmail}>{displayEmail}</Text>
                  <Text style={styles.commercialRole}>{sanitizeText(roleName, { maxLength: 60, fallback: 'Usuario' })}</Text>
                  {hasValidAddress ? <Text style={styles.validInfoText}>Dirección validada</Text> : null}
                </View>
              </View>
            </Card>

            <Card style={styles.formCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconBubble}>
                  <Ionicons name="person-outline" size={14} color="#159DA4" />
                </View>
                <Text style={styles.sectionTitle}>Datos personales</Text>
              </View>

              <View style={styles.row2}>
                <View style={[styles.col, styles.colEmail]}>
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
                <View style={[styles.col, styles.colWhatsapp]}>
                  <Text style={styles.label}>Whatsapp</Text>
                  <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Whatsapp" />
                </View>
              </View>

              <View style={styles.row2}>
                <View style={styles.col}>
                  <Text style={styles.label}>Documento</Text>
                  <View style={styles.row2Compact}>
                    <View style={[styles.input, styles.pickerWrap, styles.docTypeInput]}>
                      <Pressable style={styles.docTypeTrigger} onPress={() => setDocTypeModalVisible(true)}>
                        <Text style={styles.docTypeTriggerText}>{selectedDocLabel}</Text>
                        <Ionicons name="chevron-down" size={16} color="#6B7F9B" />
                      </Pressable>
                    </View>
                    <TextInput style={[styles.input, styles.docNumberInput]} value={docNumber} onChangeText={setDocNumber} placeholder="Número" />
                  </View>
                </View>
                <View style={styles.col} />
              </View>

              <Text style={styles.label}>Dirección</Text>
              <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Dirección completa" />
              <Text style={styles.helperText}>Opcional. Si no seleccionas una dirección validada, no aparecerás en el mapa.</Text>

              <View style={styles.row2}>
                <View style={styles.col}>
                  <Text style={[styles.label, styles.alignedLabel]}>Razón social / Nombre de usuario</Text>
                  <TextInput style={[styles.input, styles.readOnlyInput]} value={username} editable={false} />
                  <Text style={styles.helperText}>Este valor es único y no se puede modificar.</Text>
                </View>
                <View style={styles.col}>
                  <Text style={[styles.label, styles.alignedLabel]}>Nueva contraseña</Text>
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
                <View style={styles.uploadRow}>
                  <Ionicons name="cloud-upload-outline" size={16} color="#0D9BA5" />
                  <Text style={styles.fileInputText}>{logoAsset?.name || logoAsset?.fileName || 'Seleccionar archivo'}</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.helperText}>Se recomienda formato cuadrado, máximo 2MB.</Text>

              <View style={styles.saveWrap}>
                <Button label={saving ? 'Guardando...' : 'Guardar cambios'} onPress={onSave} disabled={saving} />
              </View>
            </Card>

            <Card style={styles.legalCard}>
              <Text style={styles.sectionTitle}>Legal</Text>
              <Pressable style={styles.legalLinkRow} onPress={() => openLegalLink(LEGAL_URLS.privacy)}>
                <Text style={styles.legalLinkText}>Política de privacidad</Text>
                <Ionicons name="open-outline" size={16} color="#0D9BA5" />
              </Pressable>
              <Pressable style={styles.legalLinkRow} onPress={() => openLegalLink(LEGAL_URLS.terms)}>
                <Text style={styles.legalLinkText}>Términos y condiciones</Text>
                <Ionicons name="open-outline" size={16} color="#0D9BA5" />
              </Pressable>
              <Pressable style={styles.legalLinkRow} onPress={() => openLegalLink(LEGAL_URLS.accountDeletion)}>
                <Text style={styles.legalLinkText}>Información de eliminación de cuenta</Text>
                <Ionicons name="open-outline" size={16} color="#0D9BA5" />
              </Pressable>
            </Card>

            <Card style={styles.deleteCard}>
              <Text style={styles.deleteTitle}>Eliminar cuenta</Text>
              <Text style={styles.deleteDescription}>
                Esta acción es permanente y cerrará tu sesión en todos los dispositivos.
              </Text>
              <Button label="Eliminar cuenta" variant="danger" onPress={openDeleteAccountModal} />
            </Card>

            <Button label="Cerrar sesión" onPress={logout} variant="danger" />

            <Modal
              visible={docTypeModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setDocTypeModalVisible(false)}
            >
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Tipo de documento</Text>
                    <Pressable style={styles.modalCloseBtn} onPress={() => setDocTypeModalVisible(false)}>
                      <Ionicons name="close" size={18} color="#7387A4" />
                    </Pressable>
                  </View>

                  <Pressable
                    style={[styles.modalOption, docType === '' && styles.modalOptionActive]}
                    onPress={() => {
                      setDocType('');
                      setDocTypeModalVisible(false);
                    }}
                  >
                    <View style={styles.modalOptionLeft}>
                      <View style={styles.modalOptionIconWrap}>
                        <Ionicons name="ellipsis-horizontal" size={14} color="#149DAA" />
                      </View>
                      <Text style={styles.modalOptionText}>...</Text>
                    </View>
                    <Ionicons name={docType === '' ? 'checkmark' : 'chevron-forward'} size={18} color={docType === '' ? '#149DAA' : '#6E819C'} />
                  </Pressable>

                  {DOCUMENT_TYPE_OPTIONS.map((item) => (
                    <Pressable
                      key={item.value}
                      style={[styles.modalOption, docType === item.value && styles.modalOptionActive]}
                      onPress={() => {
                        setDocType(item.value);
                        setDocTypeModalVisible(false);
                      }}
                    >
                      <View style={styles.modalOptionLeft}>
                        <View style={styles.modalOptionIconWrap}>
                          <Ionicons name="id-card-outline" size={14} color="#149DAA" />
                        </View>
                        <Text style={styles.modalOptionText}>{item.label}</Text>
                      </View>
                      <Ionicons name={docType === item.value ? 'checkmark' : 'chevron-forward'} size={18} color={docType === item.value ? '#149DAA' : '#6E819C'} />
                    </Pressable>
                  ))}
                </View>
              </View>
            </Modal>

            <Modal
              visible={deleteModalVisible}
              transparent
              animationType="fade"
              onRequestClose={closeDeleteAccountModal}
            >
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Eliminar cuenta</Text>
                    <Pressable style={styles.modalCloseBtn} onPress={closeDeleteAccountModal}>
                      <Ionicons name="close" size={18} color="#7387A4" />
                    </Pressable>
                  </View>

                  {deleteStep === 'warning' ? (
                    <View style={styles.deleteStepWrap}>
                      <Text style={styles.deleteWarningText}>
                        ¿Seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer.
                      </Text>
                      <View style={styles.deleteStepActions}>
                        <Button label="Cancelar" variant="secondary" onPress={closeDeleteAccountModal} />
                        <Button
                          label="Continuar"
                          variant="danger"
                          onPress={() => setDeleteStep('confirm')}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.deleteStepWrap}>
                      <Text style={styles.label}>Contraseña actual *</Text>
                      <TextInput
                        style={styles.input}
                        value={deletePassword}
                        onChangeText={setDeletePassword}
                        secureTextEntry
                        placeholder="Ingresa tu contraseña"
                        editable={!deletingAccount}
                      />

                      <Text style={styles.label}>Motivo (opcional)</Text>
                      <TextInput
                        style={[styles.input, styles.reasonInput]}
                        value={deleteReason}
                        onChangeText={setDeleteReason}
                        placeholder="Cuéntanos por qué te vas"
                        editable={!deletingAccount}
                        multiline
                      />

                      <View style={styles.deleteStepActions}>
                        <Button
                          label="Volver"
                          variant="secondary"
                          onPress={() => setDeleteStep('warning')}
                          disabled={deletingAccount}
                        />
                        <Button
                          label={deletingAccount ? 'Eliminando...' : 'Confirmar eliminación'}
                          variant="danger"
                          onPress={onConfirmDeleteAccount}
                          disabled={deletingAccount}
                        />
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </Modal>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: '#071B3E',
  },
  subtitle: {
    marginTop: spacing.xxs,
    color: '#4D607A',
    ...typography.body,
  },
  gearBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F7FBFF',
    borderWidth: 1,
    borderColor: '#D7E1ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    paddingTop: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    marginTop: spacing.sm,
    ...typography.body,
    color: colors.textMuted,
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
    ...typography.h3,
    color: colors.danger,
  },
  errorText: {
    marginTop: spacing.xs,
    ...typography.caption,
    color: colors.danger,
    lineHeight: 18,
  },
  commercialCard: {
    marginBottom: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#C8D4E3',
    backgroundColor: '#F4F7FB',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E6F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: '#1B355A',
  },
  commercialBody: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  logoPreviewWrap: {
    width: 84,
    height: 84,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1DDEA',
    overflow: 'hidden',
    backgroundColor: '#EEF3F8',
  },
  logoPreview: {
    width: '100%',
    height: '100%',
  },
  logoFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallbackText: {
    ...typography.caption,
    color: '#7890AF',
  },
  commercialInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  commercialName: {
    ...typography.h3,
    color: '#0D2346',
  },
  commercialEmail: {
    ...typography.body,
    color: '#4D6383',
  },
  commercialRole: {
    ...typography.captionStrong,
    color: '#2B476E',
  },
  validInfoText: {
    ...typography.captionStrong,
    color: '#0A978E',
    marginTop: spacing.xxs,
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
    alignItems: 'stretch',
    gap: spacing.xs,
  },
  col: {
    flex: 1,
  },
  colEmail: {
    flex: 1.55,
  },
  colWhatsapp: {
    flex: 0.95,
  },
  label: {
    ...typography.captionStrong,
    color: '#11284B',
    marginBottom: spacing.xxs,
    marginTop: spacing.sm,
  },
  alignedLabel: {
    minHeight: 34,
  },
  input: {
    borderWidth: 1,
    borderColor: '#C9D6E7',
    borderRadius: 12,
    backgroundColor: '#EFF3F8',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 52,
    color: '#0D2245',
    ...typography.body,
  },
  pickerWrap: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 52,
    overflow: 'hidden',
  },
  docTypeInput: {
    width: 132,
    flexShrink: 0,
  },
  docNumberInput: {
    width: 170,
    flexShrink: 0,
  },
  docTypeTrigger: {
    minHeight: 52,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docTypeTriggerText: {
    ...typography.body,
    color: '#0D2245',
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
  fileInput: {
    marginTop: spacing.xxs,
    borderWidth: 1,
    borderColor: '#C9D6E7',
    borderRadius: 12,
    backgroundColor: '#EFF3F8',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 50,
    justifyContent: 'center',
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fileInputText: {
    ...typography.body,
    color: '#2F4769',
  },
  saveWrap: {
    marginTop: spacing.md,
    alignItems: 'stretch',
  },
  legalCard: {
    marginBottom: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#C8D4E3',
    backgroundColor: '#F4F7FB',
    gap: spacing.xs,
  },
  legalLinkRow: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#D4E0EE',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legalLinkText: {
    ...typography.body,
    color: '#1B355A',
  },
  deleteCard: {
    marginBottom: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1C8CF',
    backgroundColor: '#FFF4F6',
    gap: spacing.xs,
  },
  deleteTitle: {
    ...typography.h3,
    color: '#8A1D30',
  },
  deleteDescription: {
    ...typography.body,
    color: '#763849',
    marginBottom: spacing.xs,
  },
  deleteStepWrap: {
    gap: spacing.sm,
  },
  deleteWarningText: {
    ...typography.body,
    color: '#1F3559',
    lineHeight: 22,
  },
  reasonInput: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  deleteStepActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 25, 45, 0.35)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: '#F5F8FC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D6E1EE',
    padding: spacing.md,
    gap: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    ...typography.h2,
    color: '#152F56',
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF3F9',
    borderWidth: 1,
    borderColor: '#D4DFEC',
  },
  modalOption: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7E2EE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalOptionActive: {
    backgroundColor: '#EAF7F9',
    borderColor: '#BFE3E8',
  },
  modalOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalOptionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F6F8',
  },
  modalOptionText: {
    ...typography.bodyStrong,
    color: '#1C355B',
  },
});
