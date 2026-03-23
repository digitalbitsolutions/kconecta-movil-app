import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, TextStyle } from 'react-native';
import Toast from 'react-native-toast-message';
import { usePropertyForm } from './PropertyFormContext';
import { DEFAULT_TYPES } from './constants';
import { 
  Card as UiCard, 
  SectionHeader, 
  Button as UiButton, 
  colors as uiColors, 
  spacing as uiSpacing, 
  typography as uiTypography,
  radius as uiRadius
} from '../../ui';

export const Step1TypeSelection: React.FC = () => {
  const { 
    selectedType, 
    handleSelectType, 
    setStep,
    loadingCatalogs,
  } = usePropertyForm();

  return (
    <UiCard style={{}}>
      <SectionHeader title="Paso 1" subtitle="Selecciona el tipo de inmueble." />
      {loadingCatalogs ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={uiColors.accent} />
          <Text style={{ 
            color: uiColors.textMuted, 
            marginTop: uiSpacing.sm, 
            fontSize: 14, 
            fontWeight: '400' as any
          }}>Cargando tipos...</Text>
        </View>
      ) : (
        DEFAULT_TYPES.map((typeItem) => {
          const isSelected = String(selectedType) === String(typeItem.id);
          return (
            <TouchableOpacity
              key={`${typeItem.id}`}
              onPress={() => handleSelectType(typeItem.id)}
              style={[styles.typeCard, isSelected ? styles.typeCardSelected : null]}
            >
              <Text style={styles.typeCardTitle}>{typeItem.name}</Text>
              <Text style={styles.typeCardDescription}>{typeItem.description || 'Sin descripcion disponible.'}</Text>
            </TouchableOpacity>
          );
        })
      )}
      <UiButton
        label="Continuar"
        onPress={() => (selectedType ? setStep(2) : Toast.show({ type: 'info', text1: 'Tipo requerido', text2: 'Selecciona un tipo para continuar.' }))}
        style={styles.actionSingle}
      />
    </UiCard>
  );
};

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  typeCard: {
    borderWidth: 1,
    borderColor: '#D8E1EA',
    borderRadius: uiRadius.md,
    padding: uiSpacing.md,
    marginBottom: uiSpacing.sm,
  },
  typeCardSelected: {
    borderColor: '#8FD7CF',
    backgroundColor: '#E8FBF8',
  },
  typeCardTitle: {
    ...uiTypography.body,
    color: uiColors.primary,
    fontWeight: '700' as any,
  },
  typeCardDescription: {
    ...uiTypography.caption,
    color: uiColors.textMuted,
    marginTop: 4,
  },
  actionSingle: {
    marginTop: uiSpacing.sm,
  },
});
