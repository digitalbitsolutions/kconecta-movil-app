import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
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
} from '../components/ui';
import { getFriendlyApiMessage, resetPasswordApi } from '../api/client';

const MIN_PASSWORD_LENGTH = 8;

const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value.trim());

const validateForm = ({ email, token, password, passwordConfirmation }) => {
  if (!isValidEmail(email)) {
    return 'Ingresa un correo válido.';
  }

  if (!token.trim()) {
    return 'Ingresa el token de recuperación.';
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  if (password !== passwordConfirmation) {
    return 'La confirmación no coincide con la contraseña.';
  }

  return '';
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const formError = useMemo(
    () =>
      validateForm({
        email,
        token,
        password,
        passwordConfirmation,
      }),
    [email, token, password, passwordConfirmation]
  );

  const canSubmit = !formError && !loading;

  const handleSubmit = async () => {
    if (formError) {
      setErrorMessage(formError);
      setStatusMessage('');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      await resetPasswordApi({
        email: email.trim(),
        token: token.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });

      setStatusMessage('Contraseña actualizada correctamente. Serás redirigido al login.');
      setTimeout(() => {
        router.replace('/login');
      }, 1200);
    } catch (error) {
      const status = error?.response?.status ?? null;
      if (status === 400 || status === 401 || status === 422 || status === 429) {
        setErrorMessage(getFriendlyApiMessage(error, 'No fue posible restablecer la contraseña.'));
      } else {
        setErrorMessage('No fue posible restablecer la contraseña. Inténtalo nuevamente.');
      }
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
        <View style={styles.header}>
          <Text style={styles.title}>Restablecer contraseña</Text>
          <Text style={styles.subtitle}>Ingresa el token y tu nueva contraseña.</Text>
        </View>

        <UiCard>
          <UiInputField
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
          />

          <UiInputField
            label="Token"
            value={token}
            onChangeText={setToken}
            placeholder="Pega aquí tu token"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <UiInputField
            label="Nueva contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="********"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
          />

          <UiInputField
            label="Confirmar contraseña"
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            placeholder="********"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          {statusMessage ? <Text style={styles.successText}>{statusMessage}</Text> : null}

          <UiButton
            label="Guardar nueva contraseña"
            onPress={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
            style={styles.primaryButton}
          />

          <UiButton
            label="Volver a iniciar sesión"
            variant="secondary"
            onPress={() => router.replace('/login')}
            disabled={loading}
          />
        </UiCard>
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
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  successText: {
    ...typography.caption,
    color: colors.success,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
});
