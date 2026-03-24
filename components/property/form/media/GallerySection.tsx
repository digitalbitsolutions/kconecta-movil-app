import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { mediaStyles as styles } from './mediaStyles';
import { MediaAsset } from '../types';

interface GallerySectionProps {
  images: MediaAsset[];
  onAdd: () => void;
  onRemove: (img: MediaAsset) => void;
  onMove: (index: number, direction: 'left' | 'right') => void;
}

export const GallerySection: React.FC<GallerySectionProps> = ({ 
  images, 
  onAdd, 
  onRemove, 
  onMove 
}) => {
  return (
    <View>
      <View style={styles.galleryHeader}>
        <Text style={[styles.label, { marginTop: 0 }]}>Galería</Text>
        <Text style={styles.countBadge}>{images.length} / 25</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.galleryContainer}
      >
        {images.map((img, index) => (
          <View key={`${img.uri}-${index}`} style={styles.galleryItem}>
            <Image source={{ uri: img.uri }} style={styles.fullImage} />
            
            {/* Overlay según estado */}
            {img.status === 'uploading' && (
              <View style={[styles.itemActions, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                <ActivityIndicator size="small" color="white" />
              </View>
            )}

            {img.status === 'deleting' && (
              <View style={[styles.itemActions, { backgroundColor: 'rgba(255,0,0,0.4)' }]}>
                <ActivityIndicator size="small" color="white" />
              </View>
            )}

            {img.status === 'error' && (
              <View style={[styles.itemActions, { backgroundColor: 'rgba(255,0,0,0.6)' }]}>
                <Text style={{ color: 'white', fontSize: 10 }}>ERR</Text>
              </View>
            )}

            {(img.status === 'synced' || img.status === 'local') ? (
              <>
                <TouchableOpacity 
                  style={styles.removeBadge} 
                  onPress={() => onRemove(img)}
                >
                  <Text style={styles.removeBadgeText}>X</Text>
                </TouchableOpacity>

                <View style={styles.itemActions}>
                  {index > 0 && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => onMove(index, 'left')}>
                      <Text style={styles.actionIcon}>◀</Text>
                    </TouchableOpacity>
                  )}
                  {index < images.length - 1 && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => onMove(index, 'right')}>
                      <Text style={styles.actionIcon}>▶</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : null}
          </View>
        ))}

        {images.length < 25 && (
          <TouchableOpacity 
            style={[styles.galleryItem, styles.mediaPlaceholder, { width: 110, marginRight: 0 }]} 
            onPress={onAdd}
          >
            <Text style={styles.addIcon}>+</Text>
            <Text style={styles.addText}>Añadir</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};
