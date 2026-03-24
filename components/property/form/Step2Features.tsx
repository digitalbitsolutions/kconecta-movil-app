import React, { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { usePropertyForm } from './PropertyFormContext';
import { DynamicFormRenderer } from './DynamicFormRenderer';
import { getSchemaByTypeId } from './schemas';
import { 
  Card as UiCard, 
  SectionHeader, 
  colors as uiColors,
  spacing as uiSpacing,
  typography as uiTypography
} from '../../ui';

export const Step2Features: React.FC = () => {
  const { form, selectedType } = usePropertyForm();
  
  // Obtenemos el esquema basado en el type_id actual
  const schema = useMemo(() => getSchemaByTypeId(Number(selectedType || form.type_id)), [selectedType, form.type_id]);

  if (!schema) {
    return (
      <UiCard style={styles.emptyState}>
        <SectionHeader title="Opciones avanzadas" subtitle="Disponibles pronto para este tipo" />
        <Text style={styles.emptyText}>
          Estamos trabajando para igualar el formulario al del CRM para este tipo de propiedad (ID: {selectedType || form.type_id}).
        </Text>
      </UiCard>
    );
  }

  return <DynamicFormRenderer schema={schema} />;
};

const styles = StyleSheet.create({
  emptyState: {
    paddingVertical: uiSpacing.xl,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 12,
    color: uiColors.textSoft,
    textAlign: 'center',
    marginTop: uiSpacing.md,
    paddingHorizontal: uiSpacing.lg
  }
});
