import { View, Text } from 'react-native';
import { PropertyFormSchema, FormField, FormSection } from './schemas/types';
import { usePropertyForm } from './PropertyFormContext';
import { MapPreview } from './MapPreview';
import { 
  Card as UiCard, 
  SectionHeader, 
  InputField as UiInputField, 
  SelectField as UiSelectField,
  StepperField,
  CheckboxField
} from '../../ui';

interface Props {
  schema: PropertyFormSchema;
}

export const DynamicFormRenderer: React.FC<Props> = ({ schema }) => {
  const { 
    form, 
    updateField, 
    getRawFieldValue, 
    setRawFieldValue, 
    catalogs, 
    loadingCatalogs,
    toggleBooleanRawField
  } = usePropertyForm();

  const renderField = (field: FormField) => {
    // 1. Evaluar visibilidad del campo
    if (field.visibleIf && !field.visibleIf(form)) return null;

    // 2. Obtener opciones (si aplica)
    const options = field.options || (field.optionsKey ? catalogs[field.optionsKey] : []);

    // 3. Renderizar segun tipo
    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <UiInputField
            key={field.name}
            label={field.label}
            value={String(getRawFieldValue(field.name) || '')}
            onChangeText={(v) => setRawFieldValue(field.name, v)}
            placeholder={field.placeholder || '0'}
            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
            required={field.required}
            {...field.props}
          />
        );

      case 'textarea':
        return (
          <UiInputField
            key={field.name}
            label={field.label}
            value={String(getRawFieldValue(field.name) || '')}
            onChangeText={(v) => setRawFieldValue(field.name, v)}
            placeholder={field.placeholder}
            multiline
            required={field.required}
            {...field.props}
          />
        );

      case 'radio':
      case 'select':
        return (
          <UiSelectField
            key={field.name}
            label={field.label}
            value={getRawFieldValue(field.name)}
            options={options}
            onSelect={(v) => setRawFieldValue(field.name, v)}
            loading={loadingCatalogs}
            {...field.props}
          />
        );

      case 'stepper':
        return (
          <StepperField
            key={field.name}
            label={field.label}
            value={Number(getRawFieldValue(field.name) || 0)}
            onChange={(v) => setRawFieldValue(field.name, v)}
            {...field.props}
          />
        );

      case 'boolean':
        return (
          <CheckboxField
            key={field.name}
            label={field.props?.label || field.label}
            checked={String(getRawFieldValue(field.name) || '') === '1'}
            onToggle={() => toggleBooleanRawField(field.name)}
            style={{}}
          />
        );

      case 'multiselect':
        const currentValues = Array.isArray(getRawFieldValue(field.name)) ? getRawFieldValue(field.name) : [];
        const fieldOptions = field.options || (field.optionsKey ? catalogs[field.optionsKey] : []) || [];
        
        return (
          <View key={field.name} style={{ marginBottom: 15 }}>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: '700', 
              color: '#0F2A44', 
              marginBottom: 10,
              textTransform: 'uppercase'
            }}>{field.label}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {fieldOptions.map(opt => {
                const isChecked = currentValues.includes(String(opt.value));
                return (
                  <CheckboxField
                    key={String(opt.value)}
                    label={opt.label}
                    checked={isChecked}
                    onToggle={() => {
                      const next = isChecked 
                        ? currentValues.filter(v => v !== String(opt.value))
                        : [...currentValues, String(opt.value)];
                      setRawFieldValue(field.name, next);
                    }}
                    style={{ width: '45%' }}
                  />
                );
              })}
            </View>
          </View>
        );

      case 'location':
        return (
          <View key={field.name}>
            <MapPreview 
              latitude={getRawFieldValue('latitude')} 
              longitude={getRawFieldValue('longitude')} 
              title={form.title} 
            />
            <UiInputField
              label={field.label}
              value={String(getRawFieldValue(field.name) || '')}
              onChangeText={(v) => setRawFieldValue(field.name, v)}
              placeholder={field.placeholder || 'Calle y numero'}
              required={field.required}
              {...field.props}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {schema.sections.map((section, sIndex) => {
        // Evaluar visibilidad de la seccion
        if (section.visibleIf && !section.visibleIf(form)) return null;

        return (
          <UiCard key={`${section.title}-${sIndex}`} style={{}}>
            <SectionHeader title={section.title} subtitle={section.subtitle} />
            <View>
              {section.fields.map(field => renderField(field))}
            </View>
          </UiCard>
        );
      })}
    </>
  );
};
