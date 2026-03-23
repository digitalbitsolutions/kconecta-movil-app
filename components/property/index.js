export { default as PropertyCardCompact } from './PropertyCardCompact';
export { default as PropertyCardDetailed } from './PropertyCardDetailed';
export { default as ApartmentDetailView } from './detail/ApartmentDetailView';
export { default as GarageDetailView } from './detail/GarageDetailView';
export { default as HouseChaletDetailView } from './detail/HouseChaletDetailView';
export { default as LandDetailView } from './detail/LandDetailView';
export { default as LocalPremisesDetailView } from './detail/LocalPremisesDetailView';
export { default as RusticHouseDetailView } from './detail/RusticHouseDetailView';
export {
  getPropertyDetailVariant,
  isApartmentProperty,
  isGarageProperty,
  isHouseChaletProperty,
  isLandProperty,
  isLocalPremisesProperty,
  isRusticHouseProperty,
  mapApartmentDetail,
  mapGarageDetail,
  mapHouseChaletDetail,
  mapLandDetail,
  mapLocalPremisesDetail,
  mapRusticHouseDetail,
} from './detail/propertyDetailMapper';
