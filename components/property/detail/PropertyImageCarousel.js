import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, layout, radius, sizing, spacing, typography } from '../../ui';

export default function PropertyImageCarousel({ images = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeImages = useMemo(() => (Array.isArray(images) ? images.filter(Boolean) : []), [images]);
  const imageCount = safeImages.length;
  const hasMultipleImages = imageCount > 1;
  const currentImage = safeImages[activeIndex] || safeImages[0] || '';

  useEffect(() => {
    if (!imageCount) {
      setActiveIndex(0);
      return;
    }

    if (activeIndex > imageCount - 1) {
      setActiveIndex(imageCount - 1);
    }
  }, [activeIndex, imageCount]);

  const goToIndex = (nextIndex) => {
    if (!imageCount) return;
    const boundedIndex = Math.max(0, Math.min(nextIndex, imageCount - 1));
    setActiveIndex(boundedIndex);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.viewport}>
        {currentImage ? (
          <Image key={currentImage} source={{ uri: currentImage }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.fallback}>
            <Text style={styles.fallbackText}>Sin imagenes disponibles</Text>
          </View>
        )}
      </View>

      {imageCount ? (
        <View style={styles.navigationWrap}>
          <View style={styles.navigationRow}>
            <TouchableOpacity
              style={[styles.navigationButton, activeIndex === 0 ? styles.navigationButtonDisabled : null]}
              onPress={() => goToIndex(activeIndex - 1)}
              disabled={!hasMultipleImages || activeIndex === 0}
            >
              <Text style={styles.navigationButtonText}>Anterior</Text>
            </TouchableOpacity>

            <Text style={styles.counterText}>
              {Math.min(activeIndex + 1, imageCount)} / {imageCount}
            </Text>

            <TouchableOpacity
              style={[
                styles.navigationButton,
                activeIndex === imageCount - 1 ? styles.navigationButtonDisabled : null,
              ]}
              onPress={() => goToIndex(activeIndex + 1)}
              disabled={!hasMultipleImages || activeIndex === imageCount - 1}
            >
              <Text style={styles.navigationButtonText}>Siguiente</Text>
            </TouchableOpacity>
          </View>

          {hasMultipleImages ? (
            <View style={styles.dotsRow}>
              {safeImages.map((image, index) => (
                <TouchableOpacity
                  key={`${image}-dot-${index}`}
                  onPress={() => goToIndex(index)}
                  style={[styles.dot, index === activeIndex ? styles.dotActive : null]}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
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
  navigationWrap: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  navigationButton: {
    minWidth: sizing.badgeMinWidth * 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationButtonDisabled: {
    opacity: 0.45,
  },
  navigationButtonText: {
    ...typography.captionStrong,
    color: colors.textInverse,
  },
  counterText: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: sizing.dot,
    height: sizing.dot,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceStrong,
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
});
