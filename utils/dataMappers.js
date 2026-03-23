/**
 * Centralize common data parsing and formatting utilities
 * to reduce redundancy across the application.
 */

export const parseNumber = (value) => {
  if (value === null || value === undefined) return 0;
  const raw = String(value).trim().replace(/\s/g, '');
  if (!raw) return 0;

  let normalized = raw;
  const commas = (raw.match(/,/g) || []).length;
  const dots = (raw.match(/\./g) || []).length;

  if (commas && dots) {
    if (raw.lastIndexOf(',') > raw.lastIndexOf('.')) {
      normalized = raw.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = raw.replace(/,/g, '');
    }
  } else if (commas) {
    normalized = commas === 1 && raw.split(',')[1]?.length <= 2 ? raw.replace(',', '.') : raw.replace(/,/g, '');
  } else if (dots && !(dots === 1 && raw.split('.')[1]?.length <= 2)) {
    normalized = raw.replace(/\./g, '');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const pickString = (...values) => {
  for (let index = 0; index < values.length; index += 1) {
    const current = values[index];
    if (typeof current === 'string' && current.trim()) return current.trim();
    if (typeof current === 'number' && Number.isFinite(current)) return String(current);
  }
  return '';
};

export const extractUser = (payload) => {
  if (!payload) return null;
  if (payload.user) return payload.user;
  if (payload.data?.user) return payload.data.user;
  if (payload.data?.id) return payload.data;
  if (payload.id) return payload;
  return null;
};

export const extractProperties = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.data)) return payload.data.data;
  if (Array.isArray(payload.properties)) return payload.properties;
  if (Array.isArray(payload.result)) return payload.result;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

export const formatNumber = (value) => new Intl.NumberFormat('es-ES').format(parseNumber(value));

export const formatPrice = (value) => {
  if (!parseNumber(value)) return 'Sin precio';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(parseNumber(value));
};

export const userLevelName = (rawUser) => {
  const roleName = pickString(rawUser?.user_level_name, rawUser?.role, rawUser?.level_name);
  if (roleName) return roleName;

  const levelId = parseNumber(rawUser?.user_level_id ?? rawUser?.level_id ?? rawUser?.role_id);
  if (levelId === 1) return 'Administrador';
  if (levelId === 2) return 'Usuario libre';
  if (levelId === 3) return 'Usuario premium';
  if (levelId === 4) return 'Proveedor de servicio';
  if (levelId === 5) return 'Agente inmobiliario';
  return 'Usuario';
};

export const propertyId = (property) =>
  pickString(property?.id, property?.property_id, property?.propertyId, property?.reference);

export const propertyTitle = (property) =>
  pickString(property?.title, property?.name, property?.reference, 'Inmueble sin titulo');

export const propertyType = (property) =>
  pickString(property?.type_name, property?.type, property?.property_type, property?.type_label, 'Sin tipo');

export const propertyCategory = (property) =>
  pickString(
    property?.category_name,
    property?.category,
    property?.operation_type,
    property?.operation,
    'Sin categoria'
  );

export const propertyAddress = (property) =>
  pickString(property?.address, property?.address_line, property?.location, property?.street);

export const propertyCity = (property) => pickString(property?.city, property?.province, property?.country);

export const propertyOwner = (property) => {
  const firstName = pickString(property?.user_first_name, property?.owner_first_name);
  const lastName = pickString(property?.user_last_name, property?.owner_last_name);
  const fullName = `${firstName} ${lastName}`.trim();
  return pickString(
    fullName,
    property?.user_name,
    property?.owner_name,
    property?.agency_name,
    `Usuario #${parseNumber(property?.user_id) || 0}`
  );
};

export const propertyTimestamp = (property) =>
  pickString(property?.updated_at, property?.created_at, property?.date, property?.published_at);

export const propertyPrice = (property) =>
  parseNumber(
    property?.price ??
      property?.sale_price ??
      property?.rental_price ??
      property?.amount ??
      property?.cost
  );

export const isPublishedProperty = (property) => {
  const statusText = pickString(
    property?.status,
    property?.state,
    property?.publication_status,
    property?.visibility
  ).toLowerCase();

  if (statusText.includes('public')) return true;
  if (statusText === '1' || statusText === 'active' || statusText === 'published') return true;
  if (parseNumber(property?.is_hidden) === 0 && property?.is_hidden !== undefined) return true;
  if (parseNumber(property?.is_active) === 1 || parseNumber(property?.active) === 1) return true;
  return false;
};

export const sumByKeys = (items, keys) =>
  items.reduce((total, item) => {
    for (let index = 0; index < keys.length; index += 1) {
      const candidate = parseNumber(item?.[keys[index]]);
      if (candidate > 0) return total + candidate;
    }
    return total;
  }, 0);
