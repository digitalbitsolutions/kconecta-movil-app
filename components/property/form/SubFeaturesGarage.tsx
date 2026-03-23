import React from 'react';
import { View, StyleSheet } from 'react-native';
import { usePropertyForm } from './PropertyFormContext';
import { 
  SelectField as UiSelectField, 
  InputField as UiInputField,
  CheckboxField,
  spacing as uiSpacing
} from '../../ui';

export const SubFeaturesGarage: React.FC = () => {
  const { 
    getRawFieldValue, 
    setRawFieldValue, 
    catalogs, 
    loadingCatalogs,
    toggleBooleanRawField
  } = usePropertyForm();

  const getOptions = (key: string) => catalogs?.[key] || [];

  return (
    <>
      <UiSelectField
        label="Capacidad de la plaza"
        value={String(getRawFieldValue('plaza_capacity') || '')}
        options={getOptions('plaza_capacity')}
        onSelect={(v) => setRawFieldValue('plaza_capacity', v)}
        loading={loadingCatalogs}
        containerStyle={{}}
      />
      
      <View style={styles.row}>
        <UiInputField
          containerStyle={styles.rowItem}
          inputStyle={{}}
          label="Largo"
          value={String(getRawFieldValue('m_long') || '')}
          onChangeText={(v) => setRawFieldValue('m_long', v)}
          placeholder="0"
          keyboardType="numeric"
        />
        <UiInputField
          containerStyle={styles.rowItem}
          inputStyle={{}}
          label="Ancho"
          value={String(getRawFieldValue('m_wide') || '')}
          onChangeText={(v) => setRawFieldValue('m_wide', v)}
          placeholder="0"
          keyboardType="numeric"
        />
      </View>

      <UiInputField 
        label="Ano construccion" 
        value={String(getRawFieldValue('year_of_construction') || '')} 
        onChangeText={(v) => setRawFieldValue('year_of_construction', v)} 
        keyboardType="numeric" 
        placeholder="2020" 
        containerStyle={{}}
        inputStyle={{}}
      />

      <CheckboxField
        label="Inmueble de banco"
        checked={String(getRawFieldValue('bank_owned_property') || '') === '1'}
        onToggle={() => toggleBooleanRawField('bank_owned_property')}
      />
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
