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

export default function LocalPremisesDetailView({
  detail,
  onOpenMap,
  onOpenPage,
  onOpenVideo,
  onCall,
  onMessage,
  onShare,
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
        overviewItems={detail.details?.overviewItems}
        detailItems={detail.details?.detailItems}
      />
      <PropertyEquipment items={detail.equipment} />
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
