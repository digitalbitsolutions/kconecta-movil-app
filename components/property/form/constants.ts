export const DEFAULT_TYPES = [
  { id: 1, name: 'Casa o chalet', description: 'Viviendas familiares con espacios amplios.' },
  { id: 15, name: 'Casa rustica', description: 'Entorno natural y estilo rural.' },
  { id: 13, name: 'Piso', description: 'Opciones urbanas listas para habitar.' },
  { id: 4, name: 'Local o nave', description: 'Ideal para actividad comercial o almacen.' },
  { id: 14, name: 'Garaje', description: 'Seguridad para tu vehiculo o plaza.' },
  { id: 9, name: 'Terreno', description: 'Suelo para proyectos o inversion.' },
];

export const HOUSE_CHALET_TYPE_ID = 1;
export const LOCAL_PREMISES_TYPE_ID = 4;
export const LAND_TYPE_ID = 9;
export const APARTMENT_TYPE_ID = 13;
export const GARAGE_TYPE_ID = 14;
export const RUSTIC_HOUSE_TYPE_ID = 15;
export const RESIDENTIAL_TYPE_IDS = [HOUSE_CHALET_TYPE_ID, APARTMENT_TYPE_ID, RUSTIC_HOUSE_TYPE_ID];

export const OPERATION_OPTIONS = [
  { id: 'venta', label: 'Venta', operationType: 'Venta', useSalePrice: true, useRentalPrice: false },
  { id: 'alquiler', label: 'Alquiler', operationType: 'Alquiler', useSalePrice: false, useRentalPrice: true },
  { id: 'ambas', label: 'Venta + Alquiler', operationType: 'Venta y Alquiler', useSalePrice: true, useRentalPrice: true },
];

export const HAS_TENANTS_OPTIONS = [
  { label: 'Si', value: '1' },
  { label: 'No', value: '2' },
];

export const RAW_FIELDS = [
  'locality',
  'plant',
  'esc_block',
  'door',
  'name_urbanization',
  'visibility_in_portals',
  'location_premises',
  'type_floor[]',
  'rental_type',
  'reason_for_sale',
  'typology',
  'guarantee',
  'community_expenses',
  'ibi',
  'mortgage_rate',
  'has_tenants',
  'state_conservation',
  'meters_built',
  'useful_meters',
  'plot_meters',
  'land_size',
  'm_long',
  'm_wide',
  'linear_meters_of_facade',
  'bedrooms',
  'bathrooms',
  'number_of_shop_windows',
  'number_of_plants',
  'plaza_capacity',
  'type_of_terrain',
  'wheeled_access',
  'nearest_municipality_distance',
  'facade',
  'orientation[]',
  'feature[]',
  'equipment[]',
  'bank_owned_property',
  'type_heating',
  'heating_fuel',
  'elevator',
  'wheelchair_accessible_elevator',
  'power_consumption_rating',
  'energy_consumption',
  'emissions_rating',
  'emissions_consumption',
  'max_num_tenants',
  'appropriate_for_children',
  'pet_friendly',
  'rooms',
  'stays',
  'year_of_construction',
];

export const LIST_FIELDS = new Set(['type_floor[]', 'orientation[]', 'feature[]', 'equipment[]']);
export const BOOLEAN_FIELDS = new Set([
  'bank_owned_property',
  'elevator',
  'wheelchair_accessible_elevator',
  'appropriate_for_children',
  'pet_friendly',
]);
export const NUMERIC_FIELDS = new Set([
  'type',
  'type_id',
  'price',
  'sale_price',
  'rental_price',
  'plant',
  'visibility_in_portals',
  'location_premises',
  'rental_type',
  'reason_for_sale',
  'typology',
  'guarantee',
  'community_expenses',
  'ibi',
  'mortgage_rate',
  'has_tenants',
  'state_conservation',
  'meters_built',
  'useful_meters',
  'plot_meters',
  'land_size',
  'm_long',
  'm_wide',
  'linear_meters_of_facade',
  'bedrooms',
  'bathrooms',
  'number_of_shop_windows',
  'number_of_plants',
  'plaza_capacity',
  'type_of_terrain',
  'wheeled_access',
  'nearest_municipality_distance',
  'facade',
  'type_heating',
  'heating_fuel',
  'power_consumption_rating',
  'energy_consumption',
  'emissions_rating',
  'emissions_consumption',
  'max_num_tenants',
  'rooms',
  'stays',
  'year_of_construction',
]);

export const TYPE_SENSITIVE_RAW_FIELDS = [
  'type_floor[]',
  'visibility_in_portals',
  'location_premises',
  'rental_type',
  'reason_for_sale',
  'typology',
  'facade',
  'orientation[]',
  'type_heating',
  'heating_fuel',
  'power_consumption_rating',
  'emissions_rating',
  'max_num_tenants',
  'appropriate_for_children',
  'pet_friendly',
  'feature[]',
  'equipment[]',
  'plaza_capacity',
  'type_of_terrain',
  'wheeled_access',
  'nearest_municipality_distance',
];

export const RAW_FIELD_SOURCE_ALIASES = {
  'type_floor[]': ['types_floors'],
  'orientation[]': ['orientations'],
  'feature[]': ['features'],
  'equipment[]': ['equipments'],
};

export const MAX_GALLERY_IMAGES = 12;
export const VIDEO_MAX_MB = 50;
export const VIDEO_MAX_BYTES = VIDEO_MAX_MB * 1024 * 1024;
