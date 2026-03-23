import { StyleSheet } from 'react-native';
import { colors as uiColors, spacing as uiSpacing, radius as uiRadius, typography as uiTypography } from '../../../ui';

export const mediaStyles = StyleSheet.create({
  label: {
    color: uiColors.textPrimary,
    ...(uiTypography.h3 as any),
    marginBottom: uiSpacing.sm,
    marginTop: uiSpacing.lg,
  },
  mediaPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: uiColors.surfaceStrong,
    borderRadius: uiRadius.lg,
    borderWidth: 2,
    borderColor: uiColors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholderText: {
    color: uiColors.textMuted,
    ...(uiTypography.body as any),
  },
  fullImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  galleryContainer: {
    flexDirection: 'row',
    marginTop: uiSpacing.sm,
    paddingRight: uiSpacing.md,
  },
  galleryItem: {
    width: 110,
    aspectRatio: 1,
    borderRadius: uiRadius.md,
    backgroundColor: uiColors.surfaceStrong,
    position: 'relative',
    overflow: 'hidden',
    marginRight: uiSpacing.sm,
  },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 22,
    height: 22,
    borderRadius: 11,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  videoPreview: {
    padding: uiSpacing.sm,
    alignItems: 'center',
  },
  videoText: {
    ...(uiTypography.caption as any),
    textAlign: 'center',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: uiSpacing.md,
    marginBottom: uiSpacing.xs,
  },
  countBadge: {
    ...(uiTypography.captionStrong as any),
    color: uiColors.accentStrong,
    backgroundColor: uiColors.surfaceAccent,
    paddingHorizontal: uiSpacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  addIcon: {
    fontSize: 24,
    color: uiColors.textMuted,
  },
  addText: {
    ...(uiTypography.caption as any),
    color: uiColors.textMuted,
    fontSize: 10,
  },
  itemActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  actionBtn: {
    paddingHorizontal: 6,
  },
  actionIcon: {
    color: 'white',
    fontSize: 12,
  },
});
