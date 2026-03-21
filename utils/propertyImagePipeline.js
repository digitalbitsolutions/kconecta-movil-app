import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const MAX_DEFAULT_SELECTION = 8;

const cleanBaseName = (input, fallback = 'image') => {
  const value = String(input || '').trim();
  const withoutExt = value.replace(/\.[^/.]+$/, '');
  const cleaned = withoutExt.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return cleaned || fallback;
};

const buildWebpName = (seed, index = 0) => `${cleanBaseName(seed, `img-${index + 1}`)}.webp`;

const toSourceFileOnWeb = async (asset, index = 0) => {
  if (asset?.file instanceof File) {
    return asset.file;
  }

  if (!asset?.uri) {
    throw new Error('No se encontro archivo de origen para convertir a WebP.');
  }

  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const fallbackName = buildWebpName(asset?.fileName || asset?.name || `image-${index + 1}`, index).replace(
    /\.webp$/i,
    '.jpg'
  );
  return new File([blob], fallbackName, { type: blob.type || 'image/jpeg' });
};

const convertFileToWebpOnWeb = async (sourceFile, outputName, quality = 0.86) => {
  if (typeof document === 'undefined') {
    throw new Error('La conversion WebP en web requiere entorno DOM.');
  }

  const sourceUrl = URL.createObjectURL(sourceFile);

  try {
    const imageElement = await new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo cargar la imagen seleccionada.'));
      img.src = sourceUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = imageElement.naturalWidth || imageElement.width || 0;
    canvas.height = imageElement.naturalHeight || imageElement.height || 0;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('No se pudo crear contexto de canvas para convertir imagen.');
    }

    context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    const webpBlob = await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/webp', quality);
    });

    if (!webpBlob) {
      throw new Error('No se pudo generar blob WebP.');
    }

    const webpFile = new File([webpBlob], outputName, { type: 'image/webp' });
    return {
      uri: URL.createObjectURL(webpFile),
      name: webpFile.name,
      type: 'image/webp',
      file: webpFile,
      size: webpFile.size,
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
};

const convertAssetToWebp = async (asset, prefix, index) => {
  const outputName = buildWebpName(asset?.fileName || asset?.name || `${prefix}-${index + 1}`, index);

  if (Platform.OS === 'web') {
    const sourceFile = await toSourceFileOnWeb(asset, index);
    return convertFileToWebpOnWeb(sourceFile, outputName);
  }

  if (!asset?.uri) {
    throw new Error('No se encontro URI de imagen para conversion en dispositivo.');
  }

  const transformed = await manipulateAsync(asset.uri, [], {
    compress: 0.86,
    format: SaveFormat.WEBP,
  });

  return {
    uri: transformed.uri,
    name: outputName,
    type: 'image/webp',
    size: asset?.fileSize ?? null,
    width: transformed.width ?? asset?.width ?? null,
    height: transformed.height ?? asset?.height ?? null,
  };
};

export const pickImageAssets = async ({ multiple = false, maxSelection = MAX_DEFAULT_SELECTION } = {}) => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission?.granted) {
    throw new Error('Permiso de galeria denegado.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: multiple,
    allowsEditing: !multiple,
    quality: 1,
    selectionLimit: multiple ? maxSelection : 1,
  });

  if (result?.canceled || !Array.isArray(result?.assets)) {
    return [];
  }

  return result.assets;
};

export const convertAssetsToWebp = async (assets, prefix = 'property') => {
  const safeAssets = Array.isArray(assets) ? assets : [];
  const converted = [];
  for (let index = 0; index < safeAssets.length; index += 1) {
    const current = safeAssets[index];
    const webpAsset = await convertAssetToWebp(current, prefix, index);
    converted.push(webpAsset);
  }
  return converted;
};

export const appendUploadFile = (formData, fieldName, fileAsset) => {
  if (!formData || !fieldName || !fileAsset) return;

  if (Platform.OS === 'web' && fileAsset.file instanceof File) {
    formData.append(fieldName, fileAsset.file, fileAsset.name || 'image.webp');
    return;
  }

  formData.append(fieldName, {
    uri: fileAsset.uri,
    name: fileAsset.name || 'image.webp',
    type: fileAsset.type || 'image/webp',
  });
};

export const revokeWebPreviewUri = (fileAsset) => {
  if (Platform.OS !== 'web') return;
  const uri = fileAsset?.uri;
  if (typeof uri === 'string' && uri.startsWith('blob:')) {
    URL.revokeObjectURL(uri);
  }
};

