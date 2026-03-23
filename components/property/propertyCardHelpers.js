import { resolvePropertyImageUrl } from '../../utils/propertyImageResolver';
import { colors } from '../ui';
import {
  formatPrice,
  parseNumber,
  pickString,
  propertyCategory,
  propertyId,
  propertyTitle,
  propertyType,
} from '../../utils/dataMappers';

const STATUS_PUBLISHED = 'PUBLICADO';
const STATUS_DRAFT = 'BORRADOR';
const STATUS_SOLD = 'VENDIDO';


export const formatArea = (property) => {
  const squareMeters = parseNumber(
    property?.meters_built ?? property?.useful_meters ?? property?.plot_meters ?? property?.surface
  );
  if (!squareMeters) return 'Sin m2';
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(squareMeters)} m2`;
};

export const resolveTitle = (property) => propertyTitle(property);

export const resolveType = (property) => propertyType(property);

export const resolveOperation = (property) => propertyCategory(property);

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
      backgroundColor: colors.success,
      textColor: colors.successSoft,
    };
  }

  if (status === STATUS_SOLD) {
    return {
      backgroundColor: colors.danger,
      textColor: colors.dangerSoft,
    };
  }

  return {
    backgroundColor: colors.textSoft,
    textColor: colors.surfaceStrong,
  };
};

export const getActionTheme = (actionKey, { inactive = false } = {}) => {
  if (actionKey === 'edit') {
    return {
      icon: 'ED',
      backgroundColor: colors.surfaceAccent,
      textColor: colors.accentStrong,
    };
  }

  if (actionKey === 'toggle') {
    return {
      icon: inactive ? 'ON' : 'OFF',
      backgroundColor: colors.warningSoft,
      textColor: colors.warning,
    };
  }

  if (actionKey === 'delete') {
    return {
      icon: 'X',
      backgroundColor: colors.dangerSoft,
      textColor: colors.danger,
    };
  }

  return {
    icon: 'GO',
    backgroundColor: colors.surfaceStrong,
    textColor: colors.textPrimary,
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

  return pieces.join(' - ');
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

export const resolvePropertyId = (property) => propertyId(property);

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
