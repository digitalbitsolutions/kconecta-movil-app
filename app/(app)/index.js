import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { getPropertiesApi, getMeApi } from '../../api/client';

export default function PropertiesScreen() {
  const { logout, user, setUser } = useAuthStore();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Validar usuario y cargar propiedades en paralelo
      const [meData, propsData] = await Promise.all([
        getMeApi(),
        getPropertiesApi()
      ]);
      
      if (meData.user) setUser(meData.user);
      // Laravel paginate devuelve data en .data.data o similar
      console.log('CRM Response Properties:', propsData);
      setProperties(propsData.data || propsData);
    } catch (err) {
      const errorMsg = err.response 
        ? `Status ${err.response.status} en ${err.config.url}` 
        : err.message;
      console.error('Error cargando CRM:', errorMsg);
      Alert.alert('Error de Conexión', `No se pudo conectar con el CRM (${errorMsg}). Revisa que el servidor esté activo.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getPropertiesApi();
      setProperties(data.data || data);
    } finally {
      setRefreshing(false);
    }
  };

  const renderProperty = ({ item }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.title}>{item.title || 'Propiedad sin título'}</Text>
        <Text style={styles.price}>{item.price ? `${item.price} €` : 'Consultar precio'}</Text>
        <Text style={styles.location}>{item.address ? `${item.address}, ${item.city || ''}` : 'Sin dirección'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mis Propiedades</Text>
          <Text style={styles.headerSubtitle}>CRM KConecta</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando CRM...</Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProperty}
          contentContainerStyle={styles.list}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No hay propiedades registradas.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    padding: 20,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 13, color: '#007AFF', fontWeight: 'bold' },
  logoutBtn: { backgroundColor: '#FF3B30', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  list: { padding: 16 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden'
  },
  cardInfo: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  price: { fontSize: 16, color: '#007AFF', fontWeight: '700', marginTop: 4 },
  location: { fontSize: 14, color: '#666', marginTop: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  loadingText: { marginTop: 12, color: '#666' },
  emptyText: { color: '#999', fontSize: 16 }
});
