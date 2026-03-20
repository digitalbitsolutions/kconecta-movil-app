import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const formatPrice = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Consultar precio';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const pickString = (...values) => {
  for (let index = 0; index < values.length; index += 1) {
    const current = values[index];
    if (typeof current === 'string' && current.trim()) return current.trim();
  }
  return '';
};

export default function PropertyCard({ item }) {
  const title = pickString(item?.title, item?.name, 'Inmueble sin titulo');
  const address = pickString(item?.address, item?.location);
  const city = pickString(item?.city, item?.province);
  const imageUrl = pickString(item?.photo, item?.image, item?.cover_image);
  const price = item?.price ?? item?.sale_price ?? item?.rental_price;

  return (
    <View style={styles.card}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Text style={styles.imageFallbackText}>SIN FOTO</Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.price}>{formatPrice(price)}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.location} numberOfLines={2}>
          {address ? `${address}${city ? `, ${city}` : ''}` : city || 'Ubicacion no disponible'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  image: {
    width: 86,
    height: 86,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  imageFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageFallbackText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    marginLeft: 10,
  },
  price: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  title: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  location: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
  },
});
