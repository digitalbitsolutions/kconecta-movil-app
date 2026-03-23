import React from 'react';
import { View, StyleSheet } from 'react-native';
import { usePropertyForm } from './PropertyFormContext';
import { OPERATION_OPTIONS } from './constants';
import { 
  Card as UiCard, 
  SectionHeader, 
  InputField as UiInputField, 
  SelectField as UiSelectField,
  spacing as uiSpacing
} from '../../ui';

export const Step2BasicInfo: React.FC = () => {
  const { 
    form, 
    updateField, 
    operationMode, 
    setOperationMode,
    isLocalPremises, 
    saleOnlyVisible, 
    rentalOnlyVisible 
  } = usePropertyForm();

  return (
    <>
      <UiCard style={{}}>
        <SectionHeader title="Operacion" subtitle="Como se comercializa el inmueble" />
        <UiSelectField
          label="Modo de operacion"
          value={operationMode}
          options={OPERATION_OPTIONS}
          onSelect={(value) => setOperationMode(String(value))}
          containerStyle={{}}
        />
        <View style={styles.row}>
          {saleOnlyVisible && (
            <UiInputField
              containerStyle={styles.rowItem}
              inputStyle={{}}
              label="Precio Venta"
              value={form.sale_price}
              onChangeText={(v) => updateField('sale_price', v)}
              placeholder="0"
              keyboardType="numeric"
            />
          )}
          {rentalOnlyVisible && (
            <UiInputField
              containerStyle={styles.rowItem}
              inputStyle={{}}
              label="Precio Alquiler"
              value={form.rental_price}
              onChangeText={(v) => updateField('rental_price', v)}
              placeholder="0"
              keyboardType="numeric"
            />
          )}
        </View>
      </UiCard>

      <UiCard style={{}}>
        <SectionHeader title={isLocalPremises ? 'Descripcion de la propiedad' : 'Descripcion'} subtitle="" />
        <UiInputField 
          label="Titulo" 
          value={form.title} 
          onChangeText={(v) => updateField('title', v)} 
          placeholder={isLocalPremises ? 'Ej: Local comercial en el centro' : 'Ej: Piso en venta en la ciudad'} 
          containerStyle={{}}
          inputStyle={{}}
        />
        <UiInputField 
          label="Descripcion" 
          value={form.description} 
          onChangeText={(v) => updateField('description', v)} 
          placeholder="Describe el inmueble" 
          multiline 
          containerStyle={{}}
          inputStyle={{}}
        />
      </UiCard>
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: uiSpacing.sm,
  },
  rowItem: {
    flex: 1,
  },
});
