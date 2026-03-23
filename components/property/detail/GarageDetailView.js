import React from 'react';
import HouseChaletDetailView from './HouseChaletDetailView';

export default function GarageDetailView(props) {
  return (
    <HouseChaletDetailView
      {...props}
      detailsSubtitle="Resumen y detalles del garaje"
      detailTitle="Medidas y ocupacion"
      basicFeaturesTitle="Caracteristicas"
      basicFeaturesSubtitle="Prestaciones del garaje"
      equipmentTitle="Equipamientos"
      equipmentSubtitle="Extras disponibles"
    />
  );
}
