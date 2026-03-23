import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../ui';
import PropertyContactCard from './PropertyContactCard';
import PropertyDescription from './PropertyDescription';
import PropertyDetailsCard from './PropertyDetailsCard';
import PropertyEnergyCertificate from './PropertyEnergyCertificate';
import PropertyEquipment from './PropertyEquipment';
import PropertyHeaderInfo from './PropertyHeaderInfo';
import PropertyImageCarousel from './PropertyImageCarousel';

export default function HouseChaletDetailView({
  detail,
  onOpenMap,
  onOpenPage,
  onOpenVideo,
  onCall,
  onMessage,
  onShare,
  detailsTitle = 'Caracteristicas',
  detailsSubtitle = 'Resumen y detalles de la casa o chalet',
  overviewTitle = 'Vista general',
  detailTitle = 'Distribucion y extras',
  basicFeaturesTitle = 'Caracteristicas basicas',
  basicFeaturesSubtitle = 'Prestaciones principales de la vivienda',
  equipmentTitle = 'Equipamientos',
  equipmentSubtitle = 'Extras y servicios disponibles',
}) {
  if (!detail) return null;

  return (
    <View style={styles.wrap}>
      <PropertyImageCarousel images={detail.images} />
      <PropertyHeaderInfo
        title={detail.title}
        location={detail.location}
        chips={detail.chips}
        metaItems={detail.addressMetaItems}
        onOpenMap={detail.mapUrl ? onOpenMap : null}
        onOpenVideo={detail.videoUrl ? onOpenVideo : null}
      />
      <PropertyDescription
        summary={detail.description?.summary}
        paragraphs={detail.description?.paragraphs}
        pageUrl={detail.pageUrl}
        onOpenPage={detail.pageUrl ? onOpenPage : null}
      />
      <PropertyDetailsCard
        title={detailsTitle}
        subtitle={detailsSubtitle}
        overviewTitle={overviewTitle}
        detailTitle={detailTitle}
        overviewItems={detail.details?.overviewItems}
        detailItems={detail.details?.detailItems}
      />
      <PropertyEquipment
        title={basicFeaturesTitle}
        subtitle={basicFeaturesSubtitle}
        items={detail.basicFeatures}
      />
      <PropertyEquipment
        title={equipmentTitle}
        subtitle={equipmentSubtitle}
        items={detail.equipment}
      />
      <PropertyEnergyCertificate items={detail.energy} />
      <PropertyContactCard
        contact={detail.contact}
        onCall={detail.contact?.phoneUrl ? onCall : null}
        onMessage={detail.contact?.emailUrl ? onMessage : null}
        onShare={detail.shareUrl ? onShare : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: spacing.lg,
  },
});
