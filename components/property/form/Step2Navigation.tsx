import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { usePropertyForm } from './PropertyFormContext';
import { 
  Button as UiButton, 
  colors as uiColors, 
  spacing as uiSpacing, 
  typography as uiTypography 
} from '../../ui';

export const Step2Navigation: React.FC = () => {
  const { 
    setStep, 
    submitForm, 
    submitting, 
    errorText, 
    isEditMode 
  } = usePropertyForm();

  return (
    <View style={styles.container}>
      {errorText ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      ) : null}

      <UiButton
        label={submitting ? 'Guardando...' : (isEditMode ? 'Actualizar inmueble' : 'Publicar inmueble')}
        onPress={submitForm}
        disabled={submitting}
        variant="primary"
        style={styles.mainButton}
      />

      <UiButton
        label="Volver al paso 1"
        onPress={() => setStep(1)}
        disabled={submitting}
        variant="ghost"
        style={styles.backButton}
      />
      
      {submitting && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={uiColors.accent} />
          <Text style={styles.overlayText}>Procesando solicitud...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: uiSpacing.md,
    paddingBottom: uiSpacing.xl,
  },
  errorBox: {
    backgroundColor: '#FFF5F5',
    padding: uiSpacing.sm,
    borderRadius: uiSpacing.xs,
    marginBottom: uiSpacing.md,
    borderWidth: 1,
    borderColor: '#FEB2B2',
  },
  errorText: {
    ...uiTypography.caption,
    color: '#C53030',
    textAlign: 'center',
  },
  mainButton: {
    marginBottom: uiSpacing.sm,
  },
  backButton: {
    marginTop: uiSpacing.xs,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  overlayText: {
    marginTop: uiSpacing.sm,
    ...uiTypography.body,
    color: uiColors.primary,
    fontWeight: '700' as any,
  },
});
