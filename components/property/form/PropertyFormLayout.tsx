import React, { useEffect } from 'react';
import { ScrollView, View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { usePropertyForm } from './PropertyFormContext';
import { Step1TypeSelection } from './Step1TypeSelection';
import { Step2BasicInfo } from './Step2BasicInfo';
import { Step2Location } from './Step2Location';
import { Step2Features } from './Step2Features';
import { Step2Media } from './Step2Media';
import { Step2Navigation } from './Step2Navigation';
import { 
  colors as uiColors, 
  spacing as uiSpacing, 
  typography as uiTypography 
} from '../../ui';

interface PropertyFormLayoutProps {
  id?: string;
}

export const PropertyFormLayout: React.FC<PropertyFormLayoutProps> = ({ id }) => {
  const { 
    step, 
    loadProperty, 
    loadingProperty, 
    isEditMode 
  } = usePropertyForm();

  useEffect(() => {
    if (isEditMode && id) {
      loadProperty(id);
    }
  }, [isEditMode, id, loadProperty]);

  if (loadingProperty) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={uiColors.accent} />
        <Text style={styles.loadingText}>Cargando datos del inmueble...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {step === 1 ? (
        <Step1TypeSelection />
      ) : (
        <>
          <Step2BasicInfo />
          <Step2Location />
          <Step2Features />
          <Step2Media />
          {/* Navigation with publish buttons */}
          <Step2Navigation />
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  content: {
    padding: uiSpacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FAFC',
  },
  loadingText: {
    marginTop: uiSpacing.sm,
    ...uiTypography.body,
    color: uiColors.textMuted,
  },
});
