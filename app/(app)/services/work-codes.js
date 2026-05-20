import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, colors, spacing, typography } from '../../../components/ui';
import {
  generateServiceWorkCodeApi,
  getApiErrorDetails,
  getFriendlyApiMessage,
  getServiceWorkCodesApi,
} from '../../../api/client';

const pick = (...values) => {
  for (let index = 0; index < values.length; index += 1) {
    const v = values[index];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return '';
};

const asArray = (value) => (Array.isArray(value) ? value : []);

export default function ServicesWorkCodesScreen() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errorText, setErrorText] = useState('');

  const load = useCallback(async () => {
    setErrorText('');
    try {
      const payload = await getServiceWorkCodesApi();
      const list = asArray(payload?.codes || payload?.data || payload?.items || payload?.result);
      setCodes(list);
    } catch (error) {
      const details = getApiErrorDetails(error);
      setErrorText(details.message || 'No se pudieron cargar los codigos.');
      setCodes([]);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await load();
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const onGenerate = async () => {
    setGenerating(true);
    try {
      const payload = await generateServiceWorkCodeApi();
      const generatedCode = pick(payload?.code, payload?.data?.code, payload?.result?.code);
      await load();
      if (generatedCode) {
        Alert.alert('Codigo generado', generatedCode);
      } else {
        Alert.alert('Codigo generado', 'Se genero correctamente. Ya aparece en tu listado.');
      }
    } catch (error) {
      Alert.alert('No se pudo generar', getFriendlyApiMessage(error, 'Intenta nuevamente.'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Codigos de trabajo</Text>
        <Text style={styles.textMuted}>Genera y comparte codigos de valoracion con clientes.</Text>

        <Button label={generating ? 'Generando...' : 'Generar codigo'} onPress={onGenerate} disabled={generating} />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.text}>Cargando codigos...</Text>
          </View>
        ) : errorText ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>No se pudo cargar</Text>
            <Text style={styles.errorText}>{errorText}</Text>
          </View>
        ) : codes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aun no tienes codigos generados.</Text>
          </View>
        ) : (
          codes.map((item, index) => {
            const code = pick(item?.code, item?.token, item?.value, `#${index + 1}`);
            const status = pick(item?.status, item?.state, item?.label, 'Activo');
            const createdAt = pick(item?.created_at_text, item?.created_at);

            return (
              <View key={pick(item?.id, `${code}-${index}`)} style={styles.codeCard}>
                <Text style={styles.codeValue}>{code}</Text>
                <Text style={styles.codeMeta}>Estado: {status}</Text>
                {createdAt ? <Text style={styles.codeMeta}>Creado: {createdAt}</Text> : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { padding: spacing.lg },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.sm },
  text: { ...typography.body, color: colors.textSoft, marginTop: spacing.sm },
  textMuted: { ...typography.body, color: colors.textMuted, marginBottom: spacing.md },
  center: { paddingVertical: spacing.xxl, alignItems: 'center' },
  errorCard: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
  },
  errorTitle: { ...typography.h3, color: colors.danger, marginBottom: spacing.xxs },
  errorText: { ...typography.body, color: colors.danger },
  emptyCard: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  emptyText: { ...typography.body, color: colors.textMuted },
  codeCard: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  codeValue: { ...typography.h2, color: colors.primary, marginBottom: spacing.xs },
  codeMeta: { ...typography.caption, color: colors.textMuted },
});
