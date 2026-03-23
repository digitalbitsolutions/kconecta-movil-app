import React from 'react';
import HouseChaletDetailView from './HouseChaletDetailView';

export default function LandDetailView(props) {
  return (
    <HouseChaletDetailView
      {...props}
      detailsSubtitle="Resumen y detalles del terreno"
      detailTitle=""
      basicFeaturesTitle="Caracteristicas del terreno"
      basicFeaturesSubtitle="Condiciones y observaciones"
      equipmentTitle="Equipamientos"
      equipmentSubtitle="Extras disponibles"
    />
  );
}
