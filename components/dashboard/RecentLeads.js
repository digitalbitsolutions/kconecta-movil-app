// Agent: DeepSeek
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, FlatList, Pressable } from 'react-native';
import { getLeadsApi } from '../../api/client';
import LeadCard from '../leads/LeadCard';
import { colors, spacing, typography, Button } from '../ui';

export default function RecentLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await getLeadsApi({ perPage: 5 });
      setLeads(data.data || []);
      setError(null);
    } catch (err) {
      console.warn('Error fetching leads:', err);
      setError('No se pudieron cargar los leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leads Recientes</Text>
        {leads.length > 0 && <Text style={styles.count}>{leads.count} nuevos</Text>}
      </View>
      {leads.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>No hay mensajes nuevos hoy.</Text></View>
      ) : (
        leads.map((item) => <LeadCard key={item.id} item={item} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md, paddingHorizontal: spacing.sm },
  title: { ...typography.h2, color: colors.primary },
  count: { ...typography.captionStrong, color: colors.accentStrong, backgroundColor: colors.surfaceAccent, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 8 },
  center: { padding: spacing.xxl, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: spacing.xl, alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.border },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
