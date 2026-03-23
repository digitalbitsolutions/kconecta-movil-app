import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { mediaStyles as styles } from './mediaStyles';
import { MediaAsset } from '../types';

interface VideoSectionProps {
  video: MediaAsset | null;
  onPick: () => void;
  onRemove: () => void;
}

export const VideoSection: React.FC<VideoSectionProps> = ({ video, onPick, onRemove }) => {
  return (
    <View>
      <Text style={styles.label}>Video (MP4 recomendado)</Text>
      <TouchableOpacity 
        style={styles.mediaPlaceholder} 
        onPress={onPick}
      >
        {video ? (
          <View style={styles.videoPreview}>
            <Text style={{ fontSize: 40 }}>🎥</Text>
            <Text style={styles.videoText}>{video.name || 'Video seleccionado'}</Text>
            <TouchableOpacity 
              style={[styles.removeBadge, { top: -20, right: -40 }]} 
              onPress={onRemove}
            >
              <Text style={styles.removeBadgeText}>X</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.placeholderText}>+ Subir video promocional</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
