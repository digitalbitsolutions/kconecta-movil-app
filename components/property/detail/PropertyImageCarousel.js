import React, { useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import { colors, layout, radius, sizing, spacing, typography } from '../../ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_WIDTH = SCREEN_WIDTH - (spacing.lg * 2);

export default function PropertyImageCarousel({ images = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef(null);
  
  const safeImages = React.useMemo(() => (Array.isArray(images) ? images.filter(Boolean) : []), [images]);
  const imageCount = safeImages.length;
  const hasMultipleImages = imageCount > 1;

  const handleScroll = (event) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / CAROUSEL_WIDTH);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.viewport}>
        {imageCount > 0 ? (
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.scroll}
          >
            {safeImages.map((uri, index) => (
              <View key={`${uri}-${index}`} style={styles.imageContainer}>
                <Image 
                  source={{ uri }} 
                  style={styles.image} 
                  resizeMode="cover" 
                />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.fallback}>
            <Text style={styles.fallbackText}>Sin imagenes disponibles</Text>
          </View>
        )}

        {/* Contador flotante (opcional, para claridad) */}
        {hasMultipleImages && (
          <View style={styles.floatingCounter}>
            <Text style={styles.counterText}>{activeIndex + 1} / {imageCount}</Text>
          </View>
        )}
      </View>

      {/* Paginación por puntos (dots) */}
      {hasMultipleImages && (
        <View style={styles.dotsRow}>
          {safeImages.map((_, index) => (
            <View
              key={`dot-${index}`}
              style={[
                styles.dot,
                index === activeIndex ? styles.dotActive : null
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  viewport: {
    width: '100%',
    aspectRatio: layout.heroAspectRatio,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceStrong,
    position: 'relative',
  },
  scroll: {
    flex: 1,
  },
  imageContainer: {
    width: CAROUSEL_WIDTH,
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  fallbackText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  floatingCounter: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  counterText: {
    ...typography.captionStrong,
    color: 'white',
    fontSize: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceStrong,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 12,
  },
});
