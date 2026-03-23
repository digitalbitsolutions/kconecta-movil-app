import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity, TextStyle } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
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
      <View style={styles.mapWrap}>
        <MapView
          style={styles.map}
          region={{ 
            latitude: lat, 
            longitude: lng, 
            latitudeDelta: 0.005, 
            longitudeDelta: 0.005 
          }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Marker coordinate={{ latitude: lat, longitude: lng }} title={title} />
        </MapView>
      </View>
      <TouchableOpacity style={styles.mapLinkButton} onPress={() => Linking.openURL(mapUrl)}>
        <Text style={styles.mapLinkButtonText}>Abrir en Google Maps</Text>
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
  },
  map: {
    width: '100%',
    height: 200,
  },
  mapPlaceholder: {
    height: 200,
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
