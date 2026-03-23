import { Platform } from 'react-native';
import { parseNumber, pickString } from '../../../utils/dataMappers';
import { LIST_FIELDS, BOOLEAN_FIELDS, NUMERIC_FIELDS } from './constants';
import { PropertyType } from './types';

export const normalizeRawFieldKey = (rawField: string) => rawField.replace(/\[\]/g, '__list');

export const normalizeMediaFingerprint = (rawValue: any) => {
  const value = pickString(rawValue).replace(/\\/g, '/').trim();
  if (!value) return '';

  try {
    const url = new URL(value);
    return url.pathname.toLowerCase();
  } catch (_error) {
    return value.replace(/^https?:\/\/[^/]+/i, '').split('?')[0].toLowerCase();
  }
};

export const extractArray = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.types)) return payload.types;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

export const extractPropertyObject = (payload: any): any => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  if (payload.property && typeof payload.property === 'object') return extractPropertyObject(payload.property);
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return extractPropertyObject(payload.data);
  }
  return payload;
};

export const normalizeType = (item: any): PropertyType | null => {
  if (!item) return null;
  const id = parseNumber(item.id ?? item.type_id ?? item.value);
  if (!id) return null;
  return {
    id,
    name: pickString(item.name, item.title, item.label, `Tipo ${id}`),
    description: pickString(item.description, item.summary),
  };
};

export const normalizeFormValue = (rawField: string, value: any) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => {
        if (entry === null || entry === undefined) return '';
        if (typeof entry === 'object') return pickString(entry?.id, entry?.value, entry?.slug, entry?.name, entry?.title);
        return String(entry).trim();
      })
      .filter(Boolean);
    return LIST_FIELDS.has(rawField) ? parts.join(',') : parts[0] || '';
  }
  if (typeof value === 'object') {
    return pickString(value?.id, value?.value, value?.slug, value?.name, value?.title);
  }
  return String(value).trim();
};

export const pickDefinedValue = (...values: any[]) => {
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' && !value.trim()) continue;
    return value;
  }
  return null;
};

export const resolveOperationModeFromProperty = (property: any) => {
  const raw = pickString(property?.operation_type, property?.operation, property?.category_name, property?.category).toLowerCase();
  if (raw.includes('venta') && raw.includes('alquiler')) return 'ambas';
  if (raw.includes('alquiler')) return 'alquiler';
  return 'venta';
};

export const toRawFieldPayloadValue = (rawField: string, rawValue: any) => {
  const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;

  if (LIST_FIELDS.has(rawField)) {
    const parts = String(value)
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const parsed = parseNumber(part);
        return parsed > 0 ? parsed : part;
      });
    return parts;
  }

  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (BOOLEAN_FIELDS.has(rawField)) {
    if (value === '1' || value === 1 || value === true) return 1;
    if (value === '0' || value === 0 || value === false) return 0;
    return null;
  }

  if (NUMERIC_FIELDS.has(rawField)) {
    const parsed = parseNumber(value);
    if (parsed > 0 || String(value) === '0') return parsed;
    return null;
  }

  return value;
};

export const sanitizePayload = (payload: any) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== undefined && value !== ''));

export const formatFileSize = (bytes: number) => {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '';
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(value / 1024))} KB`;
};

export const guessVideoMimeType = (name = '') => {
  const lowerName = String(name).toLowerCase();
  if (lowerName.endsWith('.webm')) return 'video/webm';
  if (lowerName.endsWith('.mov')) return 'video/quicktime';
  if (lowerName.endsWith('.avi')) return 'video/x-msvideo';
  if (lowerName.endsWith('.mkv')) return 'video/x-matroska';
  return 'video/mp4';
};

export const normalizeVideoFileName = (asset: any) => {
  const directName = pickString(asset?.fileName, asset?.name, `video-${Date.now()}`);
  if (/\.[a-z0-9]{2,6}$/i.test(directName)) return directName;
  const extension = pickString(asset?.mimeType).split('/')[1] || 'mp4';
  return `${directName}.${extension}`;
};
