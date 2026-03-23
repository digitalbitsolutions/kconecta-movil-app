import { Redirect, Slot } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { colors } from '../../components/ui';
import { useAuthStore } from '../../store/useAuthStore';
import BackofficeNavShell from '../../components/BackofficeNavShell';

export default function AppLayout() {
  const { token, initialized } = useAuthStore();

  if (!initialized) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/login" />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <BackofficeNavShell>
        <Slot />
      </BackofficeNavShell>
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
});
