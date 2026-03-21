import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../ui/tokens';

function GridItem({ uri, onRemove }) {
  return (
    <View style={styles.item}>
      <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      {typeof onRemove === 'function' ? (
        <Pressable style={styles.remove} onPress={onRemove}>
          <Text style={styles.removeText}>Eliminar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function ImageGrid({ images = [], onRemove }) {
  return (
    <FlatList
      data={images}
      keyExtractor={(item, index) => `${item}-${index}`}
      numColumns={2}
      scrollEnabled={false}
      contentContainerStyle={styles.list}
      columnWrapperStyle={styles.row}
      renderItem={({ item, index }) => (
        <GridItem uri={item} onRemove={typeof onRemove === 'function' ? () => onRemove(index) : null} />
      )}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Sin imagenes</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingTop: spacing.xs,
  },
  row: {
    justifyContent: 'space-between',
  },
  item: {
    width: '48.5%',
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#D6DEE8',
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  remove: {
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
    backgroundColor: '#FFF1F2',
    paddingVertical: 6,
    alignItems: 'center',
  },
  removeText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '700',
  },
  emptyWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
