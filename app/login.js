import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button as UiButton, Card as UiCard, InputField as UiInputField, colors, spacing, typography } from '../components/ui';
import { useAuthStore } from '../store/useAuthStore';
import { getApiErrorDetails, loginApi } from '../api/client';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa email y contrasena');
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim();
      const resp = await loginApi(cleanEmail, password);

      if (resp.token || resp.access_token) {
        await setToken(resp.token || resp.access_token);
        if (resp.user) {
          setUser(resp.user);
        }
        router.replace('/(app)');
      } else {
        Alert.alert('Error', 'Respuesta valida pero sin token de acceso.');
      }
    } catch (e) {
      const details = getApiErrorDetails(e);
      console.warn('Login failed:', details);

      const backendHint =
        details.status >= 500
          ? 'El backend CRM devolvio un error interno en /api/login. Revisa logs de Laravel para este intento.'
          : details.message;
      const requestIdText = details.requestId ? `\nRequest ID: ${details.requestId}` : '';

      Alert.alert('Error de Login', `${backendHint}${requestIdText}`);
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
          <Text style={styles.headerTitle}>KConecta</Text>
          <Text style={styles.headerSubtitle}>Accede a tu area de gestion inmobiliaria</Text>
        </View>

        <UiCard style={styles.formCard}>
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
            textContentType="password"
          />

          <UiButton label="Ingresar" onPress={handleLogin} loading={loading} style={styles.loginButton} />
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
    marginBottom: spacing.xxxl,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.primary,
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
  loginButton: {
    marginTop: spacing.sm,
  },
});
