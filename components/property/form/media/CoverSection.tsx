import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { mediaStyles as styles } from './mediaStyles';
import { MediaAsset } from '../types';

interface CoverSectionProps {
  image: MediaAsset | null;
  onPick: () => void;
}

export const CoverSection: React.FC<CoverSectionProps> = ({ image, onPick }) => {
  return (
    <View>
      <Text style={styles.label}>Imagen principal</Text>
      <TouchableOpacity 
        style={styles.mediaPlaceholder} 
        onPress={onPick}
      >
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.fullImage} />
        ) : (
          <Text style={styles.placeholderText}>+ Definir imagen principal</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
