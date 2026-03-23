import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../components/ui';
import { useAuthStore } from '../store/useAuthStore';
import { useNotifications } from '../hooks/useNotifications';

export default function RootLayout() {
  const { initialized, initAuth } = useAuthStore();
  const { expoPushToken } = useNotifications(); // Agent: DeepSeek - Startup notifications
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (initialized) {
      setIsReady(true);
    }
  }, [initialized]);

  if (!isReady) {
    return (
      <View style={styles.bootWrap}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.bootText}>Iniciando KConecta...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="login" />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  bootWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xxl,
  },
  bootText: {
    marginTop: spacing.md,
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
