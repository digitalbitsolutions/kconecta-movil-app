import React from 'react';
import HouseChaletDetailView from './HouseChaletDetailView';

export default function ApartmentDetailView(props) {
  return (
    <HouseChaletDetailView
      {...props}
      detailsSubtitle="Resumen y detalles del piso"
      detailTitle="Distribucion y extras"
      basicFeaturesTitle="Caracteristicas basicas"
      basicFeaturesSubtitle="Prestaciones principales del piso"
      equipmentTitle="Equipamientos"
      equipmentSubtitle="Extras y servicios del piso"
    />
  );
}
