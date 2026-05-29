import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card as UiCard, InputField as UiInputField, colors, spacing, typography } from '../components/ui';
import { useAuthStore } from '../store/useAuthStore';
import { getApiErrorDetails, loginApi } from '../api/client';

const FORGOT_PASSWORD_ROUTE = '/forgot-password';
const RESET_PASSWORD_ROUTE = '/reset-password';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();

  const openLegalLink = (type) => {
    router.push({ pathname: '/legal-viewer', params: { type } });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
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
        Alert.alert('Error', 'Respuesta válida pero sin token de acceso.');
      }
    } catch (e) {
      const details = getApiErrorDetails(e);
      if (__DEV__) {
        console.log('Login failed:', details);
      }

      const backendHint =
        details.status >= 500
          ? 'El backend CRM devolvió un error interno en /api/login. Revisa logs de Laravel para este intento.'
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
          <Image source={require('../assets/kconecta-logo.png')} style={styles.logo} resizeMode="contain" />
          <View style={styles.badge}>
            <Ionicons name="person-outline" size={13} color="#D8FFFA" />
            <Text style={styles.badgeText}>PROVEEDORES</Text>
          </View>
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
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="********"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
          />

          <Pressable onPress={handleLogin} disabled={loading} style={styles.loginButton}>
            <LinearGradient colors={['#1EBAB2', '#0EA7AA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.loginGradient}>
              <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
              <Text style={styles.loginButtonText}>{loading ? 'Ingresando...' : 'Ingresar'}</Text>
              <View style={styles.loginIconSpacer} />
            </LinearGradient>
          </Pressable>

          <View style={styles.optionsDividerWrap}>
            <View style={styles.dividerLine} />
            <Text style={styles.optionsDividerText}>Otras opciones</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable onPress={() => router.push(FORGOT_PASSWORD_ROUTE)} disabled={loading} style={styles.optionRow}>
            <Ionicons name="lock-closed-outline" size={20} color="#12B4AF" />
            <Text style={styles.optionRowText}>Olvidé mi contraseña</Text>
            <Ionicons name="chevron-forward" size={19} color="#153760" />
          </Pressable>

          <Pressable onPress={() => router.push(RESET_PASSWORD_ROUTE)} disabled={loading} style={styles.optionRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#12B4AF" />
            <Text style={styles.optionRowText}>Ya tengo token para restablecer</Text>
            <Ionicons name="chevron-forward" size={19} color="#153760" />
          </Pressable>

          <Pressable onPress={() => router.push('/register')} disabled={loading} style={[styles.optionRow, styles.optionRowOutline]}>
            <Ionicons name="person-add-outline" size={20} color="#0DAAA8" />
            <Text style={[styles.optionRowText, styles.optionRowPrimaryText]}>Crear cuenta de proveedor</Text>
            <Ionicons name="chevron-forward" size={19} color="#0DAAA8" />
          </Pressable>

          <View style={styles.legalWrap}>
            <Pressable onPress={() => openLegalLink('privacy')}>
              <Text style={styles.legalLink}>Política de privacidad</Text>
            </Pressable>
            <Text style={styles.legalDot}>•</Text>
            <Pressable onPress={() => openLegalLink('terms')}>
              <Text style={styles.legalLink}>Términos y condiciones</Text>
            </Pressable>
            <Text style={styles.legalDot}>•</Text>
            <Pressable onPress={() => openLegalLink('accountDeletion')}>
              <Text style={styles.legalLink}>Eliminación de cuenta</Text>
            </Pressable>
          </View>
        </UiCard>

        <View style={styles.securityCard}>
          <View style={styles.securityIconWrap}>
            <Ionicons name="shield-checkmark" size={20} color="#64D6CF" />
          </View>
          <View style={styles.securityCopy}>
            <Text style={styles.securityTitle}>Acceso seguro</Text>
            <Text style={styles.securityText}>Tu información está protegida con los más altos estándares de seguridad.</Text>
          </View>
          <Ionicons name="lock-closed" size={28} color="#C2F0EC" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EEF2F5',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logo: {
    width: 110,
    height: 120,
    marginBottom: 2,
  },
  badge: {
    minHeight: 24,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#1FB8B0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.xs,
  },
  badgeText: {
    ...typography.captionStrong,
    color: '#D8FFFA',
    letterSpacing: 0.6,
  },
  formCard: {
    marginBottom: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE4EE',
  },
  loginButton: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  loginGradient: {
    minHeight: 50,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  loginButtonText: {
    ...typography.h3,
    color: '#FFFFFF',
  },
  loginIconSpacer: {
    width: 20,
  },
  optionsDividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D9E0EA',
  },
  optionsDividerText: {
    ...typography.captionStrong,
    color: '#7A8CA3',
  },
  optionRow: {
    minHeight: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D5DFEA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
    flexDirection: 'row',
  },
  optionRowText: {
    ...typography.bodyStrong,
    color: '#153760',
    flex: 1,
    marginLeft: spacing.sm,
  },
  optionRowOutline: {
    borderColor: '#1AB8B0',
    backgroundColor: '#F0FBFA',
  },
  optionRowPrimaryText: {
    color: '#0DAAA8',
  },
  legalWrap: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E3EAF2',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  legalLink: {
    ...typography.caption,
    color: '#18AAA8',
    textDecorationLine: 'underline',
  },
  legalDot: {
    marginHorizontal: spacing.xs,
    color: '#7B8EA7',
  },
  securityCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8E7EE',
    backgroundColor: '#E9F5F8',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  securityIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#D9F5F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityCopy: {
    flex: 1,
  },
  securityTitle: {
    ...typography.captionStrong,
    color: '#244B6F',
  },
  securityText: {
    ...typography.caption,
    color: '#5D7896',
    marginTop: 1,
  },
});
