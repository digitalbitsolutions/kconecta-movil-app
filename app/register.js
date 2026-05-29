import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Button as UiButton,
  Card as UiCard,
  InputField as UiInputField,
  colors,
  spacing,
  typography,
  radius,
} from '../components/ui';
import { useAuthStore } from '../store/useAuthStore';
import { getFriendlyApiMessage, registerProviderApi } from '../api/client';

export default function RegisterScreen() {
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();

  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [landlinePhone, setLandlinePhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !passwordConfirmation) {
      Alert.alert('Campos incompletos', 'Email y contrasena son obligatorios.');
      return;
    }

    if (password !== passwordConfirmation) {
      Alert.alert('Contrasenas no coinciden', 'Revisa la confirmacion de contrasena.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        company_name: companyName.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        landline_phone: landlinePhone.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
      };

      const resp = await registerProviderApi(payload);

      if (resp.token || resp.access_token) {
        await setToken(resp.token || resp.access_token);
        if (resp.user) {
          setUser(resp.user);
        }
        router.replace('/(app)');
        return;
      }

      Alert.alert('Registro completado', 'Tu cuenta fue creada, pero no se recibio token de acceso. Inicia sesion.');
      router.replace('/login');
    } catch (error) {
      const friendlyMessage = getFriendlyApiMessage(
        error,
        'No pudimos completar tu registro. Intenta nuevamente.'
      );
      Alert.alert('No fue posible registrarte', friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Registro de Proveedor</Text>
            <Text style={styles.headerSubtitle}>Crea tu cuenta para publicar y gestionar servicios</Text>
          </View>

          <UiCard style={styles.formCard}>
            <View style={styles.fixedTypeWrap}>
              <Text style={styles.fixedTypeLabel}>Tipo de cuenta</Text>
              <View style={styles.fixedTypeBadge}>
                <Text style={styles.fixedTypeText}>Proveedor de servicios</Text>
              </View>
            </View>

            <UiInputField
              label="Nombre de empresa"
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="Tu empresa"
              autoCapitalize="words"
              autoCorrect={false}
            />

            <UiInputField
              label="Nombre"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Tu nombre"
              autoCapitalize="words"
              autoCorrect={false}
            />

            <UiInputField
              label="Apellido"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Tu apellido"
              autoCapitalize="words"
              autoCorrect={false}
            />

            <UiInputField
              label="Telefono"
              value={phone}
              onChangeText={setPhone}
              placeholder="Ej. +34 600 000 000"
              keyboardType="phone-pad"
              autoCorrect={false}
            />

            <UiInputField
              label="Telefono fijo"
              value={landlinePhone}
              onChangeText={setLandlinePhone}
              placeholder="Ej. +34 900 000 000"
              keyboardType="phone-pad"
              autoCorrect={false}
            />

            <UiInputField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              textContentType="emailAddress"
            />

            <UiInputField
              label="Contrasena"
              value={password}
              onChangeText={setPassword}
              placeholder="********"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
            />

            <UiInputField
              label="Confirmar contrasena"
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              placeholder="********"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
            />

            <UiButton
              label="Crear cuenta de proveedor"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
            />

            <UiButton
              label="Ya tienes cuenta? Inicia sesion"
              variant="secondary"
              onPress={() => router.replace('/login')}
              disabled={loading}
            />
          </UiCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.primary,
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: spacing.sm,
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: 0,
  },
  fixedTypeWrap: {
    marginBottom: spacing.md,
  },
  fixedTypeLabel: {
    ...typography.label,
    color: colors.textSoft,
    marginBottom: spacing.xs,
  },
  fixedTypeBadge: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  fixedTypeText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  registerButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
});
