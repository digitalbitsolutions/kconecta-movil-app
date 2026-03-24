export type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'radio' | 'boolean' | 'textarea' | 'stepper' | 'location' | 'media';

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  optionsKey?: string; // Para buscar en el hook de catalogos
  options?: Array<{ value: string | number | boolean; label: string }>; // Soporte para SI/NO (boolean)
  visibleIf?: (form: any) => boolean;
  props?: any; // Props adicionales para el componente UI
}

export interface FormSection {
  id: string; // ID unico para la seccion
  title: string;
  subtitle?: string;
  fields: FormField[];
  visibleIf?: (form: any) => boolean;
}

export interface PropertyFormSchema {
  typeId: number;
  sections: FormSection[];
}
