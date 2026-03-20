import { Redirect, Slot } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import BackofficeNavShell from '../../components/BackofficeNavShell';

export default function AppLayout() {
  const { token, initialized } = useAuthStore();

  if (!initialized) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#2563EB" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EEF3F8',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF3F8',
  },
});
