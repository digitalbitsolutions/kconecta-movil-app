import React from 'react';
import { StyleSheet } from 'react-native';
import { usePropertyForm } from './PropertyFormContext';
import { 
  SelectField as UiSelectField, 
  InputField as UiInputField,
  CheckboxField
} from '../../ui';

export const SubFeaturesLand: React.FC = () => {
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
        label="Tipo de terreno"
        value={String(getRawFieldValue('type_of_terrain') || '')}
        options={getOptions('type_of_terrain')}
        onSelect={(v) => setRawFieldValue('type_of_terrain', v)}
        loading={loadingCatalogs}
        containerStyle={{}}
      />
      <UiSelectField
        label="Acceso rodado"
        value={String(getRawFieldValue('wheeled_access') || '')}
        options={getOptions('wheeled_access')}
        onSelect={(v) => setRawFieldValue('wheeled_access', v)}
        loading={loadingCatalogs}
        containerStyle={{}}
      />
      <UiSelectField
        label="Municipio mas cercano"
        value={String(getRawFieldValue('nearest_municipality_distance') || '')}
        options={getOptions('nearest_municipality_distance')}
        onSelect={(v) => setRawFieldValue('nearest_municipality_distance', v)}
        loading={loadingCatalogs}
        containerStyle={{}}
      />
      <UiInputField
        label="Tamano del terreno"
        value={String(getRawFieldValue('land_size') || '')}
        onChangeText={(v) => setRawFieldValue('land_size', v)}
        placeholder="0"
        keyboardType="numeric"
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
