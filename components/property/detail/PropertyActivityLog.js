// Agent: DeepSeek
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { apiClient } from '../../api/client';
import { colors, spacing, typography, Card, SectionHeader } from '../ui';

export default function PropertyActivityLog({ propertyId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!propertyId) return;
      try {
        setLoading(true);
        const response = await apiClient.get(`/agent/properties/${propertyId}/history`);
        setLogs(response.data.data || []);
      } catch (err) {
        console.warn('Error fetching activity log:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [propertyId]);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.accent} size="small" /></View>;

  return (
    <Card style={styles.card}>
      <SectionHeader title="Historial de interesados" subtitle="Actividad reciente registrada" />
      {logs.length === 0 ? (
        <Text style={styles.empty}>Sin actividad reciente registrada.</Text>
      ) : (
        <View style={styles.list}>
          {logs.map((log, index) => (
            <View key={log.id} style={[styles.logItem, index === logs.length - 1 && styles.lastItem]}>
              <View style={[styles.connector, index === 0 && styles.firstConnector, index === logs.length - 1 && styles.lastConnector]} />
              <View style={[styles.dot, { backgroundColor: log.type === 'message' ? colors.success : colors.brandAccent || colors.accent }]} />
              <View style={styles.content}>
                <View style={styles.logHeader}>
                  <Text style={styles.logTitle}>{log.title}</Text>
                  <Text style={styles.logDate}>{new Date(log.date).toLocaleDateString()}</Text>
                </View>
                {log.subtitle ? <Text style={styles.logSubtitle}>{log.subtitle}</Text> : null}
                <Text style={styles.logContent}>{log.content}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg, padding: spacing.md },
  center: { padding: spacing.xl, alignItems: 'center' },
  list: { marginTop: spacing.md, paddingLeft: spacing.xs },
  logItem: { flexDirection: 'row', paddingBottom: spacing.lg, position: 'relative' },
  lastItem: { paddingBottom: 0 },
  connector: { position: 'absolute', left: 4, top: 0, bottom: 0, width: 2, backgroundColor: colors.borderMuted },
  firstConnector: { top: 10 },
  lastConnector: { bottom: 'auto', height: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6, marginRight: spacing.md, zIndex: 1 },
  content: { flex: 1 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  logTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  logDate: { ...typography.caption, color: colors.textMuted },
  logSubtitle: { ...typography.captionStrong, color: colors.primary, marginBottom: 4 },
  logContent: { ...typography.body, color: colors.textSoft, lineHeight: 18, fontStyle: 'italic' },
  empty: { ...typography.caption, color: colors.textMuted, textAlign: 'center', padding: spacing.xl },
});
