import { resolvePropertyImageUrl } from '../../utils/propertyImageResolver';

const STATUS_PUBLISHED = 'PUBLICADO';
const STATUS_DRAFT = 'BORRADOR';
const STATUS_SOLD = 'VENDIDO';

export const pickString = (...values) => {
  for (let index = 0; index < values.length; index += 1) {
    const current = values[index];
    if (typeof current === 'string' && current.trim()) return current.trim();
    if (typeof current === 'number' && Number.isFinite(current)) return String(current);
  }
  return '';
};

export const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatPrice = (value) => {
  const amount = parseNumber(value);
  if (!amount) return 'Sin precio';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatArea = (property) => {
  const squareMeters = parseNumber(
    property?.meters_built ?? property?.useful_meters ?? property?.plot_meters ?? property?.surface
  );
  if (!squareMeters) return 'Sin m2';
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(squareMeters)} m2`;
};

export const resolveTitle = (property) =>
  pickString(property?.title, property?.name, property?.reference, 'Inmueble sin titulo');

export const resolveType = (property) =>
  pickString(property?.type_name, property?.type, property?.property_type, property?.type_label, 'Sin tipo');

export const resolveOperation = (property) =>
  pickString(property?.category_name, property?.category, property?.operation_type, property?.operation, 'Sin categoria');

export const resolveOwnerName = (property) => {
  const firstName = pickString(property?.user_first_name, property?.owner_first_name);
  const lastName = pickString(property?.user_last_name, property?.owner_last_name);
  const fullName = `${firstName} ${lastName}`.trim();
  return pickString(fullName, property?.user_name, property?.owner_name);
};

const normalizeStatusText = (property) =>
  pickString(property?.status, property?.state, property?.publication_status, property?.visibility).toLowerCase();

export const resolveStatus = (property) => {
  const rawStatus = normalizeStatusText(property);
  const stateId = parseNumber(property?.state_id ?? property?.status_id);

  if (
    rawStatus.includes('vend') ||
    rawStatus.includes('sold') ||
    rawStatus.includes('reserv') ||
    stateId === 6 ||
    stateId === 7
  ) {
    return STATUS_SOLD;
  }

  if (
    rawStatus.includes('public') ||
    rawStatus.includes('activ') ||
    rawStatus === '1' ||
    stateId === 1 ||
    stateId === 4
  ) {
    return STATUS_PUBLISHED;
  }

  return STATUS_DRAFT;
};

export const resolveStateId = (property) => parseNumber(property?.state_id ?? property?.status_id ?? property?.state);
export const isInactiveStatus = (property) => resolveStateId(property) === 5;

export const getStatusColors = (status) => {
  if (status === STATUS_PUBLISHED) {
    return {
      backgroundColor: '#059669',
      textColor: '#ECFDF5',
    };
  }

  if (status === STATUS_SOLD) {
    return {
      backgroundColor: '#DC2626',
      textColor: '#FEE2E2',
    };
  }

  return {
    backgroundColor: '#475569',
    textColor: '#E2E8F0',
  };
};

const formatDate = (rawValue) => {
  if (!rawValue) return '';
  const value = String(rawValue);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);
};

export const resolveMetaLine = (property, { showOwner = false } = {}) => {
  const pieces = [];
  if (showOwner) {
    const owner = resolveOwnerName(property);
    if (owner) pieces.push(owner);
  }

  const updatedAt = formatDate(property?.updated_at ?? property?.created_at ?? property?.date);
  if (updatedAt) pieces.push(`Actualizado ${updatedAt}`);

  const reference = pickString(property?.reference);
  if (reference) pieces.push(`Ref ${reference}`);

  return pieces.join(' · ');
};

export const resolvePriceValue = (property) =>
  property?.price ?? property?.sale_price ?? property?.rental_price ?? property?.amount;

export const resolveLocation = (property) => {
  const city = pickString(property?.city, property?.province);
  const country = pickString(property?.country);
  const address = pickString(property?.address, property?.address_line, property?.location, property?.street);
  const cityCountry = [city, country].filter(Boolean).join(', ');

  return {
    cityCountry: cityCountry || city || country || 'Ubicacion no disponible',
    address,
  };
};

export const resolveDescription = (property) => pickString(property?.description);

export const resolvePropertyId = (property) =>
  pickString(property?.id, property?.property_id, property?.propertyId, property?.reference);

export const resolvePropertyImage = (property) => resolvePropertyImageUrl(property);

export const buildShareUrl = (property) => {
  const rawPageUrl = pickString(property?.page_url, property?.url);
  if (rawPageUrl.startsWith('http://') || rawPageUrl.startsWith('https://')) {
    return rawPageUrl;
  }

  if (rawPageUrl) {
    const cleanPath = rawPageUrl.replace(/^\/+/, '');
    return `https://kconecta.com/${cleanPath}`;
  }

  const fallbackImage = resolvePropertyImage(property);
  return fallbackImage || 'https://kconecta.com/';
};
