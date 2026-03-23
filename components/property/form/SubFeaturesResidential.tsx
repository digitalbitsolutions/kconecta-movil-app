import React from 'react';
import { View, StyleSheet } from 'react-native';
import { usePropertyForm } from './PropertyFormContext';
import { 
  SelectField as UiSelectField, 
  InputField as UiInputField,
  CheckboxField,
  spacing as uiSpacing
} from '../../ui';

export const SubFeaturesResidential: React.FC = () => {
  const { 
    getRawFieldValue, 
    setRawFieldValue, 
    catalogs, 
    loadingCatalogs,
    isApartment,
    isHouseChalet,
    isRusticHouse,
    showHeatingFuel,
    toggleBooleanRawField
  } = usePropertyForm();

  const getOptions = (key: string) => catalogs?.[key] || [];

  return (
    <>
      <View style={styles.row}>
        <UiInputField
          containerStyle={styles.rowItem}
          inputStyle={{}}
          label="Habitaciones"
          value={String(getRawFieldValue('bedrooms') || '')}
          onChangeText={(v) => setRawFieldValue('bedrooms', v)}
          keyboardType="numeric"
          placeholder="0"
        />
        <UiInputField
          containerStyle={styles.rowItem}
          inputStyle={{}}
          label="Banos"
          value={String(getRawFieldValue('bathrooms') || '')}
          onChangeText={(v) => setRawFieldValue('bathrooms', v)}
          keyboardType="numeric"
          placeholder="0"
        />
      </View>

      <View style={styles.row}>
        <UiInputField
          containerStyle={styles.rowItem}
          inputStyle={{}}
          label="Metros construidos"
          value={String(getRawFieldValue('meters_built') || '')}
          onChangeText={(v) => setRawFieldValue('meters_built', v)}
          keyboardType="numeric"
          placeholder="0"
        />
        <UiInputField
          containerStyle={styles.rowItem}
          inputStyle={{}}
          label="Metros utiles"
          value={String(getRawFieldValue('useful_meters') || '')}
          onChangeText={(v) => setRawFieldValue('useful_meters', v)}
          keyboardType="numeric"
          placeholder="0"
        />
      </View>

      {isApartment && (
        <UiSelectField
          label="Planta"
          value={String(getRawFieldValue('plant') || '')}
          options={getOptions('plant')}
          onSelect={(v) => setRawFieldValue('plant', v)}
          loading={loadingCatalogs}
          containerStyle={{}}
        />
      )}

      {(isHouseChalet || isRusticHouse) && (
        <UiSelectField
          label="Tipologia"
          value={String(getRawFieldValue('typology') || '')}
          options={getOptions('typology')}
          onSelect={(v) => setRawFieldValue('typology', v)}
          loading={loadingCatalogs}
          containerStyle={{}}
        />
      )}

      <UiSelectField
        label="Estado conservacion"
        value={String(getRawFieldValue('state_conservation') || '')}
        options={getOptions('state_conservation')}
        onSelect={(v) => setRawFieldValue('state_conservation', v)}
        loading={loadingCatalogs}
        containerStyle={{}}
      />

      <UiSelectField
        label="Tipo de calefaccion"
        value={String(getRawFieldValue('type_heating') || '')}
        options={getOptions('type_heating')}
        onSelect={(v) => setRawFieldValue('type_heating', v)}
        loading={loadingCatalogs}
        containerStyle={{}}
      />

      {showHeatingFuel && (
        <UiSelectField
          label="Combustible"
          value={String(getRawFieldValue('heating_fuel') || '')}
          options={getOptions('heating_fuel')}
          onSelect={(v) => setRawFieldValue('heating_fuel', v)}
          loading={loadingCatalogs}
          containerStyle={{}}
        />
      )}

      <View style={styles.row}>
        <UiInputField
          containerStyle={styles.rowItem}
          inputStyle={{}}
          label="Gasto comunidad"
          value={String(getRawFieldValue('community_expenses') || '')}
          onChangeText={(v) => setRawFieldValue('community_expenses', v)}
          keyboardType="numeric"
          placeholder="0"
        />
        <UiInputField
          containerStyle={styles.rowItem}
          inputStyle={{}}
          label="IBI anual"
          value={String(getRawFieldValue('ibi') || '')}
          onChangeText={(v) => setRawFieldValue('ibi', v)}
          keyboardType="numeric"
          placeholder="0"
        />
      </View>

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
