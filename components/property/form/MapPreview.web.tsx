import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity, TextStyle } from 'react-native';
import { colors as uiColors, radius as uiRadius, typography as uiTypography, spacing as uiSpacing } from '../../ui';

interface MapPreviewProps {
  latitude: string | number;
  longitude: string | number;
  title?: string;
}

export const MapPreview: React.FC<MapPreviewProps> = ({ latitude, longitude, title }) => {
  const lat = parseFloat(String(latitude));
  const lng = parseFloat(String(longitude));
  const isValid = !isNaN(lat) && !isNaN(lng);

  if (!isValid) {
    return (
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>Coordenadas no validas para vista previa.</Text>
      </View>
    );
  }

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <View style={styles.container}>
      <View style={[styles.mapWrap, styles.webPlaceholder]}>
         <Text style={styles.mapIdText}>📍 {title || 'Ubicacion'}</Text>
         <Text style={styles.coordText}>{lat}, {lng}</Text>
         <Text style={styles.hintText}>(Mapa interactivo disponible solo en app movil)</Text>
      </View>
      <TouchableOpacity style={styles.mapLinkButton} onPress={() => Linking.openURL(mapUrl)}>
        <Text style={styles.mapLinkButtonText}>Ver en Google Maps</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: uiSpacing.md,
  },
  mapWrap: {
    borderRadius: uiRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: uiColors.border,
    marginBottom: uiSpacing.xs,
    height: 180,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webPlaceholder: {
    padding: uiSpacing.md,
  },
  mapIdText: {
    ...uiTypography.h3,
    color: uiColors.primary,
    marginBottom: 4,
  },
  coordText: {
    ...(uiTypography.captionStrong as any),
    color: uiColors.textSoft,
  },
  hintText: {
    ...(uiTypography.caption as any),
    color: uiColors.textMuted,
    marginTop: 10,
    fontStyle: 'italic',
  },
  mapPlaceholder: {
    height: 180,
    borderRadius: uiRadius.md,
    borderWidth: 1,
    borderColor: uiColors.border,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: uiSpacing.md,
  },
  mapPlaceholderText: {
    ...uiTypography.caption,
    color: uiColors.textMuted,
  },
  mapLinkButton: {
    alignSelf: 'flex-start',
  },
  mapLinkButtonText: {
    ...uiTypography.caption,
    color: uiColors.primary,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
});
