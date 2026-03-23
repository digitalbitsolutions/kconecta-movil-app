import React from 'react';
import HouseChaletDetailView from './HouseChaletDetailView';

export default function RusticHouseDetailView(props) {
  return (
    <HouseChaletDetailView
      {...props}
      detailsSubtitle="Resumen y detalles de la casa rustica"
      detailTitle="Distribucion y extras"
      basicFeaturesTitle="Caracteristicas basicas"
      basicFeaturesSubtitle="Prestaciones principales de la casa rustica"
      equipmentTitle="Equipamientos"
      equipmentSubtitle="Extras y servicios disponibles"
    />
  );
}
