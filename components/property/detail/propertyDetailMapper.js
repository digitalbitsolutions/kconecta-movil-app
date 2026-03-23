import {
  buildShareUrl,
  formatArea,
  formatPrice,
  parseNumber,
  pickString,
  resolveLocation,
  resolveOwnerName,
  resolvePriceValue,
  resolveTitle,
  resolveType,
} from '../propertyCardHelpers';
import {
  resolvePropertyGalleryImages,
  resolvePropertyImageUrl,
  resolvePropertyVideoUrl,
} from '../../../utils/propertyImageResolver';

const LOCAL_PREMISES_TYPE_ID = 4;
const HOUSE_CHALET_TYPE_ID = 1;
const LAND_TYPE_ID = 9;
const APARTMENT_TYPE_ID = 13;
const GARAGE_TYPE_ID = 14;
const RUSTIC_HOUSE_TYPE_ID = 15;

const unique = (values) => [...new Set((values || []).filter(Boolean))];

const getRelationName = (value) => {
  if (Array.isArray(value)) {
    return pickString(value[0]?.name, value[0]?.label, value[0]?.title);
  }

  if (value && typeof value === 'object') {
    return pickString(value.name, value.label, value.title);
  }

  return pickString(value);
};

const getRelationNames = (value) => {
  if (!Array.isArray(value)) {
    const singleName = getRelationName(value);
    return singleName ? [singleName] : [];
  }

  return value.map((item) => getRelationName(item)).filter(Boolean);
};

const joinRelationNames = (value) => getRelationNames(value).join(', ');

const isTruthyValue = (value) => ['1', 'true', 'si', 'yes'].includes(String(value ?? '').trim().toLowerCase());

const normalizeBoolean = (value) => {
  if (value === true || value === false) {
    return value;
  }

  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized || normalized === 'null' || normalized === 'undefined') {
    return null;
  }

  if (['1', 'true', 'si', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return null;
};

const formatBooleanLabel = (value, trueLabel = 'Si', falseLabel = 'No') => {
  const normalized = normalizeBoolean(value);
  if (normalized === null) return '';
  return normalized ? trueLabel : falseLabel;
};

const formatMetricValue = (value, suffix = '') => {
  const amount = parseNumber(value);
  if (!amount) return '';
  const formatted = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(amount);
  return suffix ? `${formatted} ${suffix}` : formatted;
};

const formatMeters = (value) => formatMetricValue(value, 'm');
const formatSquareMeters = (value) => formatMetricValue(value, 'm2');

const formatCurrencyValue = (value) => {
  const amount = parseNumber(value);
  if (!amount) return '';
  return formatPrice(amount);
};

const formatTenantLabel = (value) => {
  const raw = String(value ?? '').trim();
  if (raw === '1') return 'Si tiene';
  if (raw === '2') return 'No tiene';
  return '';
};

const buildDescription = (rawDescription) => {
  const text = pickString(rawDescription).replace(/\r\n/g, '\n').trim();
  if (!text) {
    return {
      summary: '',
      paragraphs: [],
    };
  }

  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length > 1) {
    return {
      summary: paragraphs[0],
      paragraphs: paragraphs.slice(1),
    };
  }

  const sentences = text.split(/(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean);
  if (sentences.length > 1) {
    return {
      summary: sentences[0],
      paragraphs: [sentences.slice(1).join(' ')],
    };
  }

  return {
    summary: text,
    paragraphs: [],
  };
};

const buildMapUrl = (property) => {
  const latitude = parseFloat(String(property?.latitude ?? '').trim());
  const longitude = parseFloat(String(property?.longitude ?? '').trim());

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  }

  const query = [property?.address, property?.city, property?.province, property?.country]
    .map((value) => pickString(value))
    .filter(Boolean)
    .join(', ');

  if (!query) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

const buildMailToUrl = (property, title, shareUrl) => {
  const email = pickString(property?.user?.email, property?.email);
  if (!email) return '';

  const subject = encodeURIComponent(`Consulta por ${title}`);
  const bodyParts = ['Hola, me interesa este inmueble.'];
  if (shareUrl) bodyParts.push(shareUrl);
  const body = encodeURIComponent(bodyParts.join('\n\n'));
  return `mailto:${email}?subject=${subject}&body=${body}`;
};

const buildPublishedByName = (property) => {
  const firstName = pickString(property?.user?.first_name, property?.user_first_name, property?.owner_first_name);
  const lastName = pickString(property?.user?.last_name, property?.user_last_name, property?.owner_last_name);
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  return pickString(fullName, property?.owner_name, resolveOwnerName(property));
};

const buildPublicPageUrl = (property) => {
  const rawPageUrl = pickString(property?.page_url, property?.url);
  if (!rawPageUrl) return '';

  if (rawPageUrl.startsWith('http://') || rawPageUrl.startsWith('https://')) {
    return rawPageUrl;
  }

  const cleanPath = rawPageUrl.replace(/^\/+/, '');
  return `https://kconecta.com/${cleanPath}`;
};

const buildAddressMetaItems = (property) =>
  [
    { key: 'esc_block', label: 'Bloque / Esc.', value: pickString(property?.esc_block) },
    { key: 'door', label: 'Puerta', value: pickString(property?.door) },
  ].filter((item) => item.value);

const buildPhoneUrl = (property) => {
  const phone = pickString(property?.user?.landline_phone, property?.landline_phone);
  if (!phone) return '';
  return `tel:${phone}`;
};

const buildLocationLine = (property) => {
  const line = [property?.address, property?.city, property?.country]
    .map((value) => pickString(value))
    .filter(Boolean)
    .join(', ');

  if (line) return line;

  const fallbackLocation = resolveLocation(property);
  return fallbackLocation.cityCountry;
};

const buildEnergyRows = (property) => {
  const consumptionRating = pickString(
    property?.power_consumption_rating_label,
    getRelationName(property?.power_consumption_rating)
  );
  const emissionsRating = pickString(property?.emissions_rating_label, getRelationName(property?.emissions_rating));

  return [
    {
      key: 'consumption',
      label: 'Consumo de energia',
      rating: consumptionRating,
      value: property?.energy_consumption ? `${property.energy_consumption} kWh/m2 ano` : '',
    },
    {
      key: 'emissions',
      label: 'Consumo de emisiones',
      rating: emissionsRating,
      value: property?.emissions_consumption ? `${property.emissions_consumption} kgCO/m2 ano` : '',
    },
  ].filter((item) => item.rating || item.value);
};

const buildSharedDetail = (property) => {
  const coverImage = resolvePropertyImageUrl(property);
  const galleryImages = resolvePropertyGalleryImages(property).map((item) => item.url);
  const description = buildDescription(property?.description);
  const title = resolveTitle(property);
  const shareUrl = buildShareUrl(property);
  const ownerName = pickString(property?.user?.display_name, resolveOwnerName(property), property?.owner_name);
  const publishedBy = buildPublishedByName(property) || ownerName;
  const companyName = pickString(property?.user?.user_name, property?.user_name, ownerName);
  const updatedAt = pickString(property?.updated_at_text, property?.updated_at);

  return {
    images: unique([coverImage, ...galleryImages]),
    title,
    location: buildLocationLine(property),
    mapUrl: buildMapUrl(property),
    videoUrl: resolvePropertyVideoUrl(property),
    pageUrl: buildPublicPageUrl(property),
    shareUrl,
    description,
    addressMetaItems: buildAddressMetaItems(property),
    energy: buildEnergyRows(property),
    contact: {
      company: companyName,
      name: publishedBy,
      publishedBy,
      updatedAt,
      phoneUrl: buildPhoneUrl(property),
      emailUrl: buildMailToUrl(property, title, shareUrl),
      avatarUrl: pickString(property?.user?.photo_url, property?.user?.photo),
      hasShare: Boolean(shareUrl),
    },
  };
};

const buildOperationLabel = (property) => pickString(property?.category_name, property?.operation_type, property?.operation);
const buildPlantLabel = (property) => pickString(property?.plant_label, getRelationName(property?.plant));
const buildVisibilityLabel = (property) =>
  pickString(property?.visibility_in_portals_label, getRelationName(property?.visibility_in_portals));
const buildTypologyLabel = (property) => pickString(property?.typology_label, getRelationName(property?.typology));
const buildFacadeLabel = (property) => pickString(property?.facade_label, getRelationName(property?.facade));
const buildRentalTypeLabel = (property) => pickString(property?.rental_type_label, getRelationName(property?.rental_type));
const buildReasonForSaleLabel = (property) =>
  pickString(property?.reason_for_sale_label, getRelationName(property?.reason_for_sale));
const buildHeatingTypeLabel = (property) => pickString(property?.type_heating_label, getRelationName(property?.type_heating));
const buildHeatingFuelLabel = (property) =>
  pickString(property?.heating_fuel_label, getRelationName(property?.heating_fuel));
const buildOrientationLabel = (property) =>
  pickString(joinRelationNames(property?.orientations), joinRelationNames(property?.orientation));
const buildStateConservationLabel = (property) =>
  pickString(property?.state_conservation_label, getRelationName(property?.state_conservation));
const buildFloorTypesLabel = (property) => pickString(joinRelationNames(property?.types_floors));
const buildPlazaCapacityLabel = (property) =>
  pickString(property?.plaza_capacity_label, getRelationName(property?.plaza_capacity));
const buildTypeOfTerrainLabel = (property) =>
  pickString(property?.type_of_terrain_label, getRelationName(property?.type_of_terrain));
const buildWheeledAccessLabel = (property) =>
  pickString(property?.wheeled_access_label, getRelationName(property?.wheeled_access));
const buildNearestMunicipalityDistanceLabel = (property) =>
  pickString(property?.nearest_municipality_distance_label, getRelationName(property?.nearest_municipality_distance));

const buildPriceChipValue = (property) => {
  const price = formatPrice(resolvePriceValue(property));
  return price !== 'Sin precio' ? price : '';
};

const buildAreaChipValue = (property) => {
  const area = formatArea(property);
  return area !== 'Sin m2' ? area : '';
};

const buildGarageDimensionsLabel = (property) => {
  const length = formatMeters(property?.m_long);
  const width = formatMeters(property?.m_wide);

  if (length && width) return `${length} x ${width}`;
  return length || width;
};

const buildLandSizeLabel = (property) => {
  const directLandSize = formatSquareMeters(property?.land_size);
  if (directLandSize) return directLandSize;

  const fallbackArea = formatArea(property);
  return fallbackArea !== 'Sin m2' ? fallbackArea : '';
};

const buildEquipmentItems = (property) =>
  Array.isArray(property?.equipments)
    ? property.equipments.map((item) => pickString(item?.name, item?.label)).filter(Boolean)
    : [];

const buildFeatureItems = (property) =>
  Array.isArray(property?.features)
    ? property.features.map((item) => pickString(item?.name, item?.label)).filter(Boolean)
    : [];

const buildOverviewItems = (property) => {
  const area = formatArea(property);
  const shopWindows = parseNumber(property?.number_of_shop_windows);
  const visibility = buildVisibilityLabel(property);
  const investor = formatTenantLabel(property?.has_tenants) === 'Si tiene' ? 'Si' : '';

  return [
    { label: 'Superficie', value: area !== 'Sin m2' ? area : '' },
    { label: 'Estado', value: buildStateConservationLabel(property) },
    { label: 'Escaparate', value: shopWindows ? `${shopWindows} escaparates` : '' },
    { label: 'Visibilidad', value: visibility },
    { label: 'Ideal inversor', value: investor },
  ].filter((item) => item.value);
};

const buildLocalPremisesDetailItems = (property) => {
  const locationPremises = pickString(property?.location_premises_label, getRelationName(property?.location_premises));

  return [
    { label: 'Estado de conservacion', value: buildStateConservationLabel(property) },
    { label: 'Inquilinos', value: formatTenantLabel(property?.has_tenants) },
    { label: 'N. banos', value: formatMetricValue(property?.bathrooms) },
    { label: 'Metros fachada', value: formatMeters(property?.linear_meters_of_facade) },
    { label: 'Estancias', value: formatMetricValue(property?.stays) },
    { label: 'Escaparates', value: formatMetricValue(property?.number_of_shop_windows) },
    { label: 'Ano construccion', value: pickString(property?.year_of_construction) },
    { label: 'Ubicacion del local', value: locationPremises },
    { label: 'Gastos comunidad', value: formatCurrencyValue(property?.community_expenses) },
    { label: 'IBI', value: formatCurrencyValue(property?.ibi) },
    { label: 'Hipoteca pendiente', value: formatCurrencyValue(property?.mortgage_rate) },
    { label: 'Tipo calefaccion', value: buildHeatingTypeLabel(property) },
    { label: 'Combustible', value: buildHeatingFuelLabel(property) },
    { label: 'Plantas', value: formatMetricValue(property?.number_of_plants) },
    { label: 'Inmueble de banco', value: isTruthyValue(property?.bank_owned_property) ? 'Si' : '' },
  ].filter((item) => item.value);
};

const buildResidentialOverviewItems = (property, { includeFloorTypes = false } = {}) => {
  const floorTypes = buildFloorTypesLabel(property);

  return [
    { label: 'Estado de conservacion', value: buildStateConservationLabel(property) },
    { label: 'Fachada', value: buildFacadeLabel(property) },
    { label: 'Tipologia', value: buildTypologyLabel(property) },
    { label: 'Visibilidad', value: buildVisibilityLabel(property) },
    { label: 'Tipo alquiler', value: buildRentalTypeLabel(property) },
    { label: 'Fianza', value: formatCurrencyValue(property?.guarantee) },
    { label: 'Max. inquilinos', value: formatMetricValue(property?.max_num_tenants) },
    { label: 'Apropiado ninos', value: formatBooleanLabel(property?.appropriate_for_children) },
    { label: 'Mascotas', value: formatBooleanLabel(property?.pet_friendly) },
    { label: 'Situacion de venta', value: buildReasonForSaleLabel(property) },
    { label: 'Tipo de planta', value: includeFloorTypes ? floorTypes : '' },
  ].filter((item) => item.value);
};

const buildResidentialDetailItems = (property) => {
  const elevatorValue = formatBooleanLabel(property?.elevator);
  const elevatorAccessibleValue = formatBooleanLabel(property?.wheelchair_accessible_elevator);
  const interiorAccessibleValue = formatBooleanLabel(property?.interior_wheelchair);
  const outdoorAccessibleValue = formatBooleanLabel(property?.outdoor_wheelchair);

  return [
    { label: 'Inquilinos', value: formatTenantLabel(property?.has_tenants) },
    { label: 'M2 utiles', value: formatSquareMeters(property?.useful_meters) },
    { label: 'M2 parcela', value: formatSquareMeters(property?.plot_meters) },
    { label: 'Plantas', value: formatMetricValue(property?.number_of_plants) },
    { label: 'Banos', value: formatMetricValue(property?.bathrooms) },
    { label: 'Dormitorios', value: formatMetricValue(property?.bedrooms) },
    { label: 'Metros fachada', value: formatMeters(property?.linear_meters_of_facade) },
    { label: 'Estancias', value: formatMetricValue(property?.stays) },
    { label: 'Ano construccion', value: pickString(property?.year_of_construction) },
    { label: 'Tipo calefaccion', value: buildHeatingTypeLabel(property) },
    { label: 'Combustible', value: buildHeatingFuelLabel(property) },
    { label: 'Orientacion', value: buildOrientationLabel(property) },
    { label: 'Ascensor', value: elevatorValue },
    { label: 'Ascensor accesible', value: elevatorAccessibleValue },
    { label: 'Acceso exterior adaptado', value: outdoorAccessibleValue },
    { label: 'Acceso interior adaptado', value: interiorAccessibleValue },
    { label: 'Gastos comunidad', value: formatCurrencyValue(property?.community_expenses) },
    { label: 'IBI', value: formatCurrencyValue(property?.ibi) },
    { label: 'Hipoteca', value: formatCurrencyValue(property?.mortgage_rate) },
    { label: 'Inmueble banco', value: formatBooleanLabel(property?.bank_owned_property) },
  ].filter((item) => item.value);
};

const buildGarageOverviewItems = (property) => {
  const area = formatArea(property);

  return [
    { label: 'Capacidad plaza', value: buildPlazaCapacityLabel(property) },
    { label: 'Planta', value: buildPlantLabel(property) },
    { label: 'Tipo de planta', value: buildFloorTypesLabel(property) },
    { label: 'Visibilidad', value: buildVisibilityLabel(property) },
    { label: 'Superficie', value: area !== 'Sin m2' ? area : '' },
    { label: 'Dimensiones', value: buildGarageDimensionsLabel(property) },
  ].filter((item) => item.value);
};

const buildGarageDetailItems = (property) => [
  { label: 'Inquilinos', value: formatTenantLabel(property?.has_tenants) },
  { label: 'Largo', value: formatMeters(property?.m_long) },
  { label: 'Ancho', value: formatMeters(property?.m_wide) },
  { label: 'Metros fachada', value: formatMeters(property?.linear_meters_of_facade) },
  { label: 'Plantas', value: formatMetricValue(property?.number_of_plants) },
  { label: 'Ano construccion', value: pickString(property?.year_of_construction) },
  { label: 'Gastos comunidad', value: formatCurrencyValue(property?.community_expenses) },
  { label: 'IBI', value: formatCurrencyValue(property?.ibi) },
  { label: 'Hipoteca', value: formatCurrencyValue(property?.mortgage_rate) },
  { label: 'Inmueble banco', value: formatBooleanLabel(property?.bank_owned_property) },
].filter((item) => item.value);

const buildLandOverviewItems = (property) => [
  { label: 'Tipo de terreno', value: buildTypeOfTerrainLabel(property) },
  { label: 'Visibilidad', value: buildVisibilityLabel(property) },
  { label: 'Acceso rodado', value: buildWheeledAccessLabel(property) },
  { label: 'Municipio mas cercano', value: buildNearestMunicipalityDistanceLabel(property) },
  { label: 'Tamano del terreno', value: buildLandSizeLabel(property) },
  { label: 'Inmueble banco', value: formatBooleanLabel(property?.bank_owned_property) },
].filter((item) => item.value);

const buildLandDetailItems = (property) => [
  { label: 'M2 parcela', value: formatSquareMeters(property?.plot_meters) },
  { label: 'Tamano del terreno', value: buildLandSizeLabel(property) },
  { label: 'Metros fachada', value: formatMeters(property?.linear_meters_of_facade) },
  { label: 'Plantas', value: formatMetricValue(property?.number_of_plants) },
  { label: 'Gastos comunidad', value: formatCurrencyValue(property?.community_expenses) },
  { label: 'IBI', value: formatCurrencyValue(property?.ibi) },
  { label: 'Hipoteca', value: formatCurrencyValue(property?.mortgage_rate) },
].filter((item) => item.value);

const normalizeTypeName = (property) =>
  pickString(property?.type_name, property?.type, property?.property_type).trim().toLowerCase();

export const isLocalPremisesProperty = (property) => {
  const typeId = parseNumber(property?.type_id);
  const typeName = normalizeTypeName(property);

  return typeId === LOCAL_PREMISES_TYPE_ID || typeName.includes('local') || typeName.includes('nave');
};

export const isHouseChaletProperty = (property) => {
  const typeId = parseNumber(property?.type_id);
  const typeName = normalizeTypeName(property);

  return typeId === HOUSE_CHALET_TYPE_ID || typeName === 'casa o chalet' || typeName.includes('chalet');
};

export const isApartmentProperty = (property) => {
  const typeId = parseNumber(property?.type_id);
  const typeName = normalizeTypeName(property);

  return typeId === APARTMENT_TYPE_ID || typeName === 'piso' || typeName.includes('apartamento');
};

export const isRusticHouseProperty = (property) => {
  const typeId = parseNumber(property?.type_id);
  const typeName = normalizeTypeName(property);

  return typeId === RUSTIC_HOUSE_TYPE_ID || typeName.includes('rustica');
};

export const isGarageProperty = (property) => {
  const typeId = parseNumber(property?.type_id);
  const typeName = normalizeTypeName(property);

  return typeId === GARAGE_TYPE_ID || typeName.includes('garaje') || typeName.includes('parking');
};

export const isLandProperty = (property) => {
  const typeId = parseNumber(property?.type_id);
  const typeName = normalizeTypeName(property);

  return typeId === LAND_TYPE_ID || typeName.includes('terreno') || typeName.includes('solar');
};

export const mapLocalPremisesDetail = (property) => {
  const shared = buildSharedDetail(property);
  const type = resolveType(property);

  return {
    ...shared,
    chips: [
      { key: 'type', label: 'Tipo', value: type },
      { key: 'plant', label: 'Planta', value: buildPlantLabel(property) },
      { key: 'category', label: 'Categoria', value: buildOperationLabel(property) },
      { key: 'price', label: 'Precio', value: buildPriceChipValue(property) },
      { key: 'area', label: 'M2', value: buildAreaChipValue(property) },
    ].filter((item) => item.value),
    details: {
      overviewItems: buildOverviewItems(property),
      detailItems: buildLocalPremisesDetailItems(property),
    },
    equipment: buildEquipmentItems(property),
  };
};

export const mapHouseChaletDetail = (property) => {
  const shared = buildSharedDetail(property);
  const type = resolveType(property);

  return {
    ...shared,
    chips: [
      { key: 'type', label: 'Tipo', value: type },
      { key: 'category', label: 'Operacion', value: buildOperationLabel(property) },
      { key: 'typology', label: 'Tipologia', value: buildTypologyLabel(property) },
      { key: 'price', label: 'Precio', value: buildPriceChipValue(property) },
      { key: 'area', label: 'M2', value: buildAreaChipValue(property) },
      { key: 'bedrooms', label: 'Dormitorios', value: formatMetricValue(property?.bedrooms) },
    ].filter((item) => item.value),
    details: {
      overviewItems: buildResidentialOverviewItems(property),
      detailItems: buildResidentialDetailItems(property),
    },
    basicFeatures: buildFeatureItems(property),
    equipment: buildEquipmentItems(property),
  };
};

export const mapApartmentDetail = (property) => {
  const shared = buildSharedDetail(property);
  const type = resolveType(property);

  return {
    ...shared,
    chips: [
      { key: 'type', label: 'Tipo', value: type },
      { key: 'plant', label: 'Planta', value: buildPlantLabel(property) },
      { key: 'category', label: 'Categoria', value: buildOperationLabel(property) },
      { key: 'price', label: 'Precio', value: buildPriceChipValue(property) },
      { key: 'area', label: 'M2', value: buildAreaChipValue(property) },
      { key: 'floorTypes', label: 'Tipo planta', value: buildFloorTypesLabel(property) },
    ].filter((item) => item.value),
    details: {
      overviewItems: buildResidentialOverviewItems(property, { includeFloorTypes: true }),
      detailItems: buildResidentialDetailItems(property),
    },
    basicFeatures: buildFeatureItems(property),
    equipment: buildEquipmentItems(property),
  };
};

export const mapRusticHouseDetail = (property) => {
  const shared = buildSharedDetail(property);
  const type = resolveType(property);

  return {
    ...shared,
    chips: [
      { key: 'type', label: 'Tipo', value: type },
      { key: 'category', label: 'Operacion', value: buildOperationLabel(property) },
      { key: 'typology', label: 'Tipologia', value: buildTypologyLabel(property) },
      { key: 'price', label: 'Precio', value: buildPriceChipValue(property) },
      { key: 'area', label: 'M2', value: buildAreaChipValue(property) },
      { key: 'plot', label: 'Parcela', value: formatSquareMeters(property?.plot_meters) },
    ].filter((item) => item.value),
    details: {
      overviewItems: buildResidentialOverviewItems(property),
      detailItems: buildResidentialDetailItems(property),
    },
    basicFeatures: buildFeatureItems(property),
    equipment: buildEquipmentItems(property),
  };
};

export const mapGarageDetail = (property) => {
  const shared = buildSharedDetail(property);
  const type = resolveType(property);

  return {
    ...shared,
    chips: [
      { key: 'type', label: 'Tipo', value: type },
      { key: 'plant', label: 'Planta', value: buildPlantLabel(property) },
      { key: 'category', label: 'Categoria', value: buildOperationLabel(property) },
      { key: 'price', label: 'Precio', value: buildPriceChipValue(property) },
      { key: 'capacity', label: 'Plaza', value: buildPlazaCapacityLabel(property) },
      { key: 'size', label: 'Medidas', value: buildGarageDimensionsLabel(property) },
    ].filter((item) => item.value),
    details: {
      overviewItems: buildGarageOverviewItems(property),
      detailItems: buildGarageDetailItems(property),
    },
    basicFeatures: buildFeatureItems(property),
    equipment: buildEquipmentItems(property),
  };
};

export const mapLandDetail = (property) => {
  const shared = buildSharedDetail(property);
  const type = resolveType(property);

  return {
    ...shared,
    chips: [
      { key: 'type', label: 'Tipo', value: type },
      { key: 'category', label: 'Categoria', value: buildOperationLabel(property) },
      { key: 'terrain', label: 'Terreno', value: buildTypeOfTerrainLabel(property) },
      { key: 'price', label: 'Precio', value: buildPriceChipValue(property) },
      { key: 'size', label: 'M2', value: buildLandSizeLabel(property) },
    ].filter((item) => item.value),
    details: {
      overviewItems: buildLandOverviewItems(property),
      detailItems: buildLandDetailItems(property),
    },
    basicFeatures: buildFeatureItems(property),
    equipment: buildEquipmentItems(property),
  };
};

export const getPropertyDetailVariant = (property) => {
  if (!property) {
    return { kind: 'default', detail: null };
  }

  if (isLocalPremisesProperty(property)) {
    return { kind: 'localPremises', detail: mapLocalPremisesDetail(property) };
  }

  if (isHouseChaletProperty(property)) {
    return { kind: 'houseChalet', detail: mapHouseChaletDetail(property) };
  }

  if (isApartmentProperty(property)) {
    return { kind: 'apartment', detail: mapApartmentDetail(property) };
  }

  if (isRusticHouseProperty(property)) {
    return { kind: 'rusticHouse', detail: mapRusticHouseDetail(property) };
  }

  if (isGarageProperty(property)) {
    return { kind: 'garage', detail: mapGarageDetail(property) };
  }

  if (isLandProperty(property)) {
    return { kind: 'land', detail: mapLandDetail(property) };
  }

  return { kind: 'default', detail: null };
};
