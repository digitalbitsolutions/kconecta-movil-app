import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { loginApi } from '../api/client';

export default function LoginScreen() {
  const [email, setEmail] = useState('admin@kconecta.test');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }
    setLoading(true);
    try {
      const resp = await loginApi(email, password);
      // La API de Sanctum devuelve { token: '1|xxx', user: {...} } por ejemplo. Si es de otra forma, ajustamos el acceso a las keys.
      if (resp.token || resp.access_token) {
        await setToken(resp.token || resp.access_token);
        if (resp.user) setUser(resp.user);
        router.replace('/(app)');
      } else {
        Alert.alert('Error', 'Respuesta válida pero sin token de acceso.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error de Login', e.response?.data?.message || 'Credenciales inválidas o error de conexión al backend local');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>KConecta</Text>
          <Text style={styles.headerSubtitle}>Bienvenido de nuevo</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="test@kconecta.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>Ingresar</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#007AFF' },
  headerSubtitle: { fontSize: 16, color: '#6C757D', marginTop: 8 },
  formContainer: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
  label: { fontSize: 14, color: '#343A40', marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#F1F3F5', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, fontSize: 16, color: '#333' },
  loginButton: { backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  loginButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
