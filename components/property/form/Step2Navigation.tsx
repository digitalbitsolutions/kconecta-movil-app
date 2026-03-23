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
    isEditMode,
    hasActiveUploads 
  } = usePropertyForm();

  const isBusy = submitting || hasActiveUploads;

  return (
    <View style={styles.container}>
      {errorText ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      ) : null}

      <UiButton
        label={submitting ? 'Guardando...' : hasActiveUploads ? 'Subiendo archivos...' : (isEditMode ? 'Actualizar inmueble' : 'Publicar inmueble')}
        onPress={submitForm}
        disabled={isBusy}
        variant="primary"
        style={styles.mainButton}
      />

      <UiButton
        label="Volver al paso 1"
        onPress={() => setStep(1)}
        disabled={isBusy}
        variant="ghost"
        style={styles.backButton}
      />
      
      {isBusy && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={uiColors.accent} />
          <Text style={styles.overlayText}>{hasActiveUploads ? 'Sincronizando media...' : 'Procesando solicitud...'}</Text>
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
    ...(uiTypography.caption as any),
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
