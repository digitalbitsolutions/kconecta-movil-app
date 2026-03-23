// Agent: DeepSeek
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { usePropertyForm } from './PropertyFormContext';
import { 
  Card as UiCard, 
  SectionHeader, 
  colors as uiColors, 
  spacing as uiSpacing, 
  radius as uiRadius,
  typography as uiTypography
} from '../../ui';

export const Step2Media: React.FC = () => {
  const { 
    coverImage, setCoverImage, 
    galleryImages, setGalleryImages, 
    videoAsset, setVideoAsset 
  } = usePropertyForm();

  const pickImage = async (type: 'cover' | 'gallery' | 'video') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Permiso denegado', text2: 'Se requiere acceso a la galeria.' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: type === 'gallery',
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === 'cover') {
        const asset = result.assets[0];
        setCoverImage({ uri: asset.uri, name: asset.fileName || 'cover.jpg', type: 'image/jpeg' });
      } else if (type === 'gallery') {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: 'image/jpeg'
        }));
        setGalleryImages([...galleryImages, ...newImages]);
      } else if (type === 'video') {
        const asset = result.assets[0];
        setVideoAsset({ uri: asset.uri, name: asset.fileName || 'video.mp4', type: 'video/mp4' });
      }
    }
  };

  const removeGalleryImage = (uri: string) => {
    setGalleryImages(galleryImages.filter(img => img.uri !== uri));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newImages = [...galleryImages];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setGalleryImages(newImages);
  };

  return (
    <UiCard style={{}}>
      <SectionHeader title="Media" subtitle="Imagenes y videos del inmueble" />

      {/* Cover Image */}
      <Text style={styles.label}>Imagen de portada (Lider)</Text>
      <TouchableOpacity 
        style={styles.mediaPlaceholder} 
        onPress={() => pickImage('cover')}
      >
        {coverImage ? (
          <Image source={{ uri: coverImage.uri }} style={styles.fullImage} />
        ) : (
          <Text style={styles.placeholderText}>+ Definir imagen principal</Text>
        )}
      </TouchableOpacity>

      {/* Gallery */}
      <View style={styles.galleryHeader}>
        <Text style={styles.label}>Galeria de imagenes</Text>
        <Text style={styles.countBadge}>{galleryImages.length} fotos</Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
        <TouchableOpacity 
          style={styles.galleryAdd} 
          onPress={() => pickImage('gallery')}
        >
          <Text style={styles.addIcon}>+</Text>
          <Text style={styles.addText}>Añadir</Text>
        </TouchableOpacity>

        {galleryImages.map((img, idx) => (
          <View key={`${img.uri}-${idx}`} style={styles.galleryItem}>
            <Image source={{ uri: img.uri }} style={styles.galleryImage} />
            
            <View style={styles.itemActions}>
              {idx > 0 && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => moveImage(idx, 'left')}>
                  <Text style={styles.actionIcon}>←</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionBtn} onPress={() => removeGalleryImage(img.uri)}>
                <Text style={styles.actionIcon}>❌</Text>
              </TouchableOpacity>
              {idx < galleryImages.length - 1 && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => moveImage(idx, 'right')}>
                  <Text style={styles.actionIcon}>→</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Video */}
      <Text style={[styles.label, { marginTop: uiSpacing.md }]}>Video</Text>
      <TouchableOpacity 
        style={styles.mediaPlaceholder} 
        onPress={() => pickImage('video')}
      >
        {videoAsset ? (
          <View style={styles.videoPreview}>
            <Text style={styles.videoText}>Video seleccionado: {videoAsset.name}</Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>+ Seleccionar video</Text>
        )}
      </TouchableOpacity>
    </UiCard>
  );
};

const styles = StyleSheet.create({
  label: {
    ...(uiTypography.body as any),
    fontWeight: '700' as any,
    color: uiColors.primary,
    marginBottom: uiSpacing.xs,
  },
  mediaPlaceholder: {
    height: 150,
    borderRadius: uiRadius.md,
    borderWidth: 1,
    borderColor: uiColors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FAFC',
    overflow: 'hidden',
  },
  placeholderText: {
    ...(uiTypography.caption as any),
    color: uiColors.textMuted,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  galleryScroll: {
    flexDirection: 'row',
  },
  galleryItem: {
    width: 80,
    height: 80,
    borderRadius: uiRadius.sm,
    marginRight: uiSpacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryAdd: {
    width: 80,
    height: 80,
    borderRadius: uiRadius.sm,
    borderWidth: 1,
    borderColor: uiColors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FAFC',
  },
  removeBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  videoPreview: {
    padding: uiSpacing.sm,
    alignItems: 'center',
  },
  videoText: {
    ...(uiTypography.caption as any),
    textAlign: 'center',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: uiSpacing.md,
    marginBottom: uiSpacing.xs,
  },
  countBadge: {
    ...(uiTypography.captionStrong as any),
    color: uiColors.accentStrong,
    backgroundColor: uiColors.surfaceAccent,
    paddingHorizontal: uiSpacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  addIcon: {
    fontSize: 24,
    color: uiColors.textMuted,
  },
  addText: {
    ...(uiTypography.caption as any),
    color: uiColors.textMuted,
    fontSize: 10,
  },
  itemActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  actionBtn: {
    paddingHorizontal: 6,
  },
  actionIcon: {
    color: 'white',
    fontSize: 12,
  },
});
