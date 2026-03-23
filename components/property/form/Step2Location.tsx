import React from 'react';
import { View, StyleSheet } from 'react-native';
import { usePropertyForm } from './PropertyFormContext';
import { MapPreview } from './MapPreview';
import { 
  Card as UiCard, 
  SectionHeader, 
  InputField as UiInputField, 
  spacing as uiSpacing,
  typography as uiTypography,
  colors as uiColors
} from '../../ui';

export const Step2Location: React.FC = () => {
  const { form, updateField, setRawFieldValue, getRawFieldValue } = usePropertyForm();

  return (
    <UiCard style={{}}>
      <SectionHeader title="Ubicacion" subtitle="Localizacion del inmueble" />
      
      <MapPreview 
        latitude={form.latitude} 
        longitude={form.longitude} 
        title={form.title} 
      />

      <UiInputField 
        label="Localidad" 
        value={String(getRawFieldValue('locality') || '')} 
        onChangeText={(v) => setRawFieldValue('locality', v)} 
        placeholder="Barcelona" 
        containerStyle={{}}
        inputStyle={{}}
      />
      <UiInputField 
        label="Calle" 
        value={form.address} 
        onChangeText={(v) => updateField('address', v)} 
        placeholder="Calle y numero" 
        containerStyle={{}}
        inputStyle={{}}
      />
      
      <View style={styles.row}>
        <UiInputField 
          containerStyle={styles.rowItem} 
          inputStyle={{}}
          label="Ciudad" 
          value={form.city} 
          onChangeText={(v) => updateField('city', v)} 
          placeholder="Ciudad" 
        />
        <UiInputField 
          containerStyle={styles.rowItem} 
          inputStyle={{}}
          label="Provincia" 
          value={form.province} 
          onChangeText={(v) => updateField('province', v)} 
          placeholder="Provincia" 
        />
      </View>

      <UiInputField 
        label="Pais" 
        value={form.country} 
        onChangeText={(v) => updateField('country', v)} 
        placeholder="Pais" 
        containerStyle={{}}
        inputStyle={{}}
      />

      <View style={styles.row}>
        <UiInputField 
          containerStyle={styles.rowItem} 
          inputStyle={{}}
          label="Latitud" 
          value={form.latitude} 
          onChangeText={(v) => updateField('latitude', v)} 
          placeholder="41.3874" 
          keyboardType="decimal-pad" 
        />
        <UiInputField 
          containerStyle={styles.rowItem} 
          inputStyle={{}}
          label="Longitud" 
          value={form.longitude} 
          onChangeText={(v) => updateField('longitude', v)} 
          placeholder="2.1686" 
          keyboardType="decimal-pad" 
        />
      </View>
    </UiCard>
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
  mapLinkButtonText: {
    ...uiTypography.caption,
    color: uiColors.primary,
    fontWeight: '700' as const,
  },
});
