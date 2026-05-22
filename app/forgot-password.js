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
import { forgotPasswordApi, getFriendlyApiMessage } from '../api/client';

const GENERIC_SUCCESS_MESSAGE =
  'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.';

const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value.trim());

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const canSubmit = useMemo(() => isValidEmail(email) && !loading, [email, loading]);

  const handleSubmit = async () => {
    const cleanEmail = email.trim();

    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('Ingresa un correo válido.');
      setStatusMessage('');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      await forgotPasswordApi(cleanEmail);
      setStatusMessage(GENERIC_SUCCESS_MESSAGE);
    } catch (error) {
      const status = error?.response?.status ?? null;
      if (status === 422 || status === 429) {
        setErrorMessage(getFriendlyApiMessage(error, 'No fue posible procesar la solicitud.'));
      } else {
        setStatusMessage(GENERIC_SUCCESS_MESSAGE);
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
          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>Te enviaremos instrucciones para recuperar tu acceso.</Text>
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

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          {statusMessage ? <Text style={styles.successText}>{statusMessage}</Text> : null}

          <UiButton
            label="Enviar instrucciones"
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
