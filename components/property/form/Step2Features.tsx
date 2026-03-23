import React from 'react';
import { usePropertyForm } from './PropertyFormContext';
import { SubFeaturesResidential } from './SubFeaturesResidential';
import { SubFeaturesGarage } from './SubFeaturesGarage';
import { SubFeaturesLand } from './SubFeaturesLand';
import { 
  Card as UiCard, 
  SectionHeader, 
  CheckboxGrid,
  SelectField as UiSelectField,
  InputField as UiInputField,
  SwitchField,
  CheckboxField
} from '../../ui';

export const Step2Features: React.FC = () => {
  const { 
    isResidential, 
    isGarage, 
    isLand, 
    catalogs, 
    loadingCatalogs, 
    getRawFieldValue, 
    setRawFieldValue,
    toggleListValue,
    toggleBooleanRawField,
    incrementRawNumber,
    rentalOnlyVisible
  } = usePropertyForm();

  const getOptions = (key: string) => catalogs?.[key] || [];
  
  const featureValues = String(getRawFieldValue('feature[]') || '').split(',').filter(Boolean);
  const equipmentValues = String(getRawFieldValue('equipment[]') || '').split(',').filter(Boolean);

  return (
    <>
      <UiCard style={{}}>
        <SectionHeader title="Caracteristicas" subtitle="Detalles especificos del inmueble" />
        {isResidential && <SubFeaturesResidential />}
        {isGarage && <SubFeaturesGarage />}
        {isLand && <SubFeaturesLand />}
      </UiCard>

      {(isResidential || isGarage) && (
        <>
          <UiCard style={{}}>
            <SectionHeader title="Caracteristicas extra" subtitle="" />
            <CheckboxGrid 
              items={getOptions('feature')} 
              values={featureValues} 
              onToggle={(v) => toggleListValue('feature[]', v)} 
            />
          </UiCard>
          <UiCard style={{}}>
            <SectionHeader title="Equipamientos" subtitle="" />
            <CheckboxGrid 
              items={getOptions('equipment')} 
              values={equipmentValues} 
              onToggle={(v) => toggleListValue('equipment[]', v)} 
            />
          </UiCard>
        </>
      )}

      {isResidential && (
        <UiCard style={{}}>
          <SectionHeader title="Ascensor" subtitle="" />
          <SwitchField 
            label="Tiene ascensor" 
            value={String(getRawFieldValue('elevator') || '') === '1'} 
            onValueChange={() => toggleBooleanRawField('elevator')} 
          />
          <CheckboxField
            label="Adaptado movilidad reducida"
            checked={String(getRawFieldValue('wheelchair_accessible_elevator') || '') === '1'}
            onToggle={() => toggleBooleanRawField('wheelchair_accessible_elevator')}
          />
        </UiCard>
      )}

      {(isResidential) && (
        <UiCard style={{}}>
          <SectionHeader title="Energia y emisiones" subtitle="" />
          <UiSelectField
            label="Calificacion consumo energia"
            value={String(getRawFieldValue('power_consumption_rating') || '')}
            options={getOptions('power_consumption_rating')}
            onSelect={(v) => setRawFieldValue('power_consumption_rating', v)}
            loading={loadingCatalogs}
            containerStyle={{}}
          />
          <UiInputField 
            label="Consumo energia" 
            value={String(getRawFieldValue('energy_consumption') || '')} 
            onChangeText={(v) => setRawFieldValue('energy_consumption', v)} 
            keyboardType="numeric" 
            placeholder="0" 
            containerStyle={{}}
            inputStyle={{}}
          />
          <UiSelectField
            label="Calificacion emisiones"
            value={String(getRawFieldValue('emissions_rating') || '')}
            options={getOptions('emissions_rating')}
            onSelect={(v) => setRawFieldValue('emissions_rating', v)}
            loading={loadingCatalogs}
            containerStyle={{}}
          />
          <UiInputField 
            label="Consumo emisiones" 
            value={String(getRawFieldValue('emissions_consumption') || '')} 
            onChangeText={(v) => setRawFieldValue('emissions_consumption', v)} 
            keyboardType="numeric" 
            placeholder="0" 
            containerStyle={{}}
            inputStyle={{}}
          />
        </UiCard>
      )}

      {isResidential && rentalOnlyVisible && (
        <UiCard style={{}}>
          <SectionHeader title="Que inquilinos buscas" subtitle="" />
          <CheckboxField
            label="Apropiado para ninos (0-12 anos)"
            checked={String(getRawFieldValue('appropriate_for_children') || '') === '1'}
            onToggle={() => toggleBooleanRawField('appropriate_for_children')}
          />
          <CheckboxField
            label="Admite mascotas"
            checked={String(getRawFieldValue('pet_friendly') || '') === '1'}
            onToggle={() => toggleBooleanRawField('pet_friendly')}
          />
        </UiCard>
      )}
    </>
  );
};
