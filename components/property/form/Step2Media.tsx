// Agent: DeepSeek
import React from 'react';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { usePropertyForm } from './PropertyFormContext';
import { uploadMediaApi, deleteMediaApi } from '../../../api/client';
import { 
  Card as UiCard, 
  SectionHeader, 
} from '../../ui';
import { MediaAsset } from './types';

// Modulos extraídos
import { CoverSection } from './media/CoverSection';
import { GallerySection } from './media/GallerySection';
import { VideoSection } from './media/VideoSection';

export const Step2Media: React.FC = () => {
  const { 
    coverImage, setCoverImage, 
    galleryImages, setGalleryImages, 
    videoAsset, setVideoAsset,
    removedImageIds, setRemovedImageIds,
    form 
  } = usePropertyForm();

  // Agent: DeepSeek - Lógica de subida inmediata para galería
  const handleGalleryUpload = async (assets: any[]) => {
    const propertyId = String(form.id || '');
    if (!propertyId) {
      // Si es alta nueva, solo guardamos local
      const newImages = assets.map(asset => ({
        uri: asset.uri,
        name: asset.fileName || `img_${Date.now()}.jpg`,
        type: 'image/jpeg',
        status: 'local' as const
      }));
      setGalleryImages([...galleryImages, ...newImages]);
      return;
    }

    // Si es edición, subimos asíncronamente
    const newImages = assets.map(asset => ({
      uri: asset.uri,
      name: asset.fileName || `img_${Date.now()}.jpg`,
      type: 'image/jpeg',
      status: 'uploading' as const,
      progress: 0
    }));

    setGalleryImages((prev: MediaAsset[]) => [...prev, ...newImages]);

    for (const img of newImages) {
      try {
        const file = { uri: img.uri, name: img.name, type: img.type };
        const response = await uploadMediaApi(propertyId, file, (progress: number) => {
          setGalleryImages((prev: MediaAsset[]) => prev.map(i => i.uri === img.uri ? { ...i, progress } : i));
        });
        
        setGalleryImages((prev: MediaAsset[]) => prev.map(i => 
          i.uri === img.uri ? { ...i, serverId: response.id, status: 'synced' as const } : i
        ));
      } catch (err) {
        setGalleryImages((prev: MediaAsset[]) => prev.map(i => i.uri === img.uri ? { ...i, status: 'error' as const } : i));
      }
    }
  };

  const pickMedia = async (type: 'cover' | 'gallery' | 'video') => {
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
        setCoverImage({ uri: asset.uri, name: asset.fileName || 'cover.jpg', type: 'image/jpeg', status: 'local' });
      } else if (type === 'gallery') {
        await handleGalleryUpload(result.assets);
      } else if (type === 'video') {
        const asset = result.assets[0];
        setVideoAsset({ uri: asset.uri, name: asset.fileName || 'video.mp4', type: 'video/mp4', status: 'local' });
      }
    }
  };

  const removeGalleryImage = async (img: any) => {
    if (img.serverId) {
      setGalleryImages((prev: MediaAsset[]) => prev.map(i => i.uri === img.uri ? { ...i, status: 'deleting' } : i));
      try {
        await deleteMediaApi(String(form.id), img.serverId);
        setRemovedImageIds((prev: (string|number)[]) => [...prev, img.serverId]);
      } catch (err) {
        Toast.show({ type: 'error', text1: 'No se pudo borrar del servidor' });
      }
    }
    setGalleryImages((prev: MediaAsset[]) => prev.filter(i => i.uri !== img.uri));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newImages = [...galleryImages];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setGalleryImages(newImages);
  };

  return (
    <UiCard style={{ paddingBottom: 20 }}>
      <SectionHeader title="Media" subtitle="Imagenes y videos del inmueble" />

      {/* 1. Portada */}
      <CoverSection 
        image={coverImage} 
        onPick={() => pickMedia('cover')} 
      />

      {/* 2. Galería */}
      <GallerySection 
        images={galleryImages}
        onAdd={() => pickMedia('gallery')}
        onRemove={removeGalleryImage}
        onMove={moveImage}
      />

      {/* 3. Video */}
      <VideoSection 
        video={videoAsset}
        onPick={() => pickMedia('video')}
        onRemove={() => setVideoAsset(null)}
      />
    </UiCard>
  );
};
