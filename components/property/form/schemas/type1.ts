import { PropertyFormSchema } from './types';

export const houseChaletSchema: PropertyFormSchema = {
  typeId: 1,
  sections: [
    {
      id: 'location',
      title: 'Localización del inmueble',
      fields: [
        { name: 'city', label: 'Localidad', type: 'text', required: true },
        { name: 'address', label: 'Nombre de la vía', type: 'location', required: true },
        { name: 'esc_block', label: 'Bloque / Escalera', type: 'text' },
        { name: 'door', label: 'Puerta', type: 'text' },
        { name: 'name_urbanization', label: 'Nombre de la urbanización', type: 'text' },
        {
          name: 'visibility_in_portals',
          label: 'Visibilidad en portales',
          type: 'radio',
          optionsKey: 'visibility_in_portals'
        }
      ]
    },
    {
      id: 'operation',
      title: 'Operación y precio',
      fields: [
        {
          name: 'category', 
          label: 'Operación',
          type: 'select',
          options: [
            { value: 'alquiler', label: 'Alquiler' },
            { value: 'venta', label: 'Venta' }
          ],
          required: true
        },
        {
          name: 'rental_type',
          label: 'TIPO DE ALQUILER',
          type: 'radio',
          optionsKey: 'rental_type',
          visibleIf: (form) => form.operation_mode === 'alquiler'
        },
        {
          name: 'rental_price',
          label: 'PRECIO DE ALQUILER',
          type: 'number',
          props: { suffix: '€' },
          visibleIf: (form) => form.operation_mode === 'alquiler'
        },
        {
          name: 'guarantee',
          label: 'FIANZA',
          type: 'number',
          props: { suffix: 'Meses' },
          visibleIf: (form) => form.operation_mode === 'alquiler'
        },
        {
          name: 'sale_price',
          label: 'PRECIO DE VENTA',
          type: 'number',
          props: { suffix: '€' },
          visibleIf: (form) => form.operation_mode === 'venta'
        },
        {
          name: 'community_expenses',
          label: 'GASTOS DE COMUNIDAD',
          type: 'number',
          props: { suffix: '€/mes' },
          visibleIf: (form) => form.operation_mode === 'venta'
        },
        {
          name: 'ibi',
          label: 'IBI',
          type: 'number',
          props: { suffix: '€/año' },
          visibleIf: (form) => form.operation_mode === 'venta'
        },
        {
          name: 'mortgage_state',
          label: 'HIPOTECA PENDIENTE',
          type: 'radio',
          options: [
            { value: '1', label: 'SI' },
            { value: '0', label: 'NO' }
          ],
          visibleIf: (form) => form.operation_mode === 'venta'
        },
        {
          name: 'mortgage_rate',
          label: 'Importe de hipoteca',
          type: 'number',
          props: { suffix: '€' },
          visibleIf: (form) => form.operation_mode === 'venta' && String(form.mortgage_state) === '1'
        }
      ]
    },
    {
      id: 'features',
      title: 'Características de la casa o chalet',
      fields: [
        {
          name: 'state_conservation',
          label: 'Estado de conservación',
          type: 'select',
          optionsKey: 'state_conservation'
        },
        { name: 'bedrooms', label: 'NÚMERO DE DORMITORIOS', type: 'stepper', props: { min: 0, max: 20 } },
        { name: 'bathrooms', label: 'NÚMERO DE BAÑOS', type: 'stepper', props: { min: 0, max: 20 } },
        {
          name: 'facade',
          label: 'FACHADA DEL INMUEBLE',
          type: 'radio',
          optionsKey: 'facade'
        },
        { name: 'number_of_plants', label: 'PLANTAS DEL CHALET', type: 'number' },
        { name: 'meters_built', label: 'm² construidos', type: 'number' },
        { name: 'plot_meters', label: 'M² PARCELA', type: 'number' },
        { name: 'useful_meters', label: 'm² útiles', type: 'number' },
        { name: 'parking', label: 'Plazas de garaje', type: 'number' },
        {
          name: 'orientation[]',
          label: 'ORIENTACIÓN',
          type: 'multiselect',
          options: [
            { value: '1', label: 'Norte' },
            { value: '2', label: 'Sur' },
            { value: '3', label: 'Este' },
            { value: '4', label: 'Oeste' }
          ]
        },
        {
          name: 'feature[]',
          label: 'OTRAS CARACTERÍSTICAS DEL CHALET O CASA',
          type: 'multiselect',
          options: [
            { value: '1', label: 'Aire acondicionado' },
            { value: '2', label: 'Balcón' },
            { value: '3', label: 'Piscina' },
            { value: '4', label: 'Terraza' },
            { value: '5', label: 'Barbacoa' },
            { value: '6', label: 'Conserje' },
            { value: '7', label: 'Panel Solar' },
            { value: '8', label: 'Patio' },
            { value: '9', label: 'Trastero' },
            { value: '10', label: 'Armarios empotrados' },
            { value: '11', label: 'Plaza de garaje' },
            { value: '12', label: 'Jardín' },
            { value: '13', label: 'Adaptado para silla de rueda' }
          ]
        },
        {
          name: 'equipment[]',
          label: 'EQUIPAMIENTO',
          type: 'multiselect',
          options: [
            { value: '1', label: 'Cocina con electrodomésticos y casa amueblada' },
            { value: '2', label: 'Cocina con electrodomésticos y casa sin amueblar' },
            { value: '3', label: 'Cocina vacía y casa sin amueblar' },
            { value: '4', label: 'No lo sé' }
          ]
        },
        {
          name: 'type_heating',
          label: 'Tipo de calefacción',
          type: 'select',
          optionsKey: 'type_heating'
        },
        { name: 'year_of_construction', label: 'Año de construcción', type: 'number' }
      ]
    },
    {
      id: 'category-section',
      title: 'CATEGORÍA',
      fields: [
        {
          name: 'bank_owned_property',
          label: 'Categoría',
          type: 'boolean',
          props: { label: 'Inmueble de banco' }
        }
      ]
    },
    {
      id: 'elevator-section',
      title: 'Ascensor',
      fields: [
        {
          name: 'elevator',
          label: '¿Tiene ascensor?',
          type: 'radio',
          options: [
            { value: '1', label: 'Sí' },
            { value: '2', label: 'No' }
          ]
        }
      ]
    },
    {
      id: 'energy',
      title: 'Energía y emisiones',
      fields: [
        {
          name: 'power_consumption_rating',
          label: 'CALIFICACIÓN DE CONSUMO DE ENERGÍA',
          type: 'select',
          optionsKey: 'power_consumption_rating'
        },
        {
          name: 'emissions_rating',
          label: 'CALIFICACIÓN DE EMISIONES',
          type: 'select',
          optionsKey: 'emissions_rating'
        },
        {
          name: 'energy_consumption',
          label: 'CONSUMO DE ENERGÍA',
          type: 'number',
          placeholder: 'kWh/m2 año'
        },
        {
          name: 'emissions_consumption',
          label: 'CONSUMO DE EMISIONES',
          type: 'number',
          placeholder: 'kg CO/m2 año'
        }
      ]
    },
    {
      id: 'situation',
      title: 'Situación de la vivienda',
      fields: [
        {
          name: 'reason_for_sale',
          label: 'Situación actual',
          type: 'radio',
          optionsKey: 'reason_for_sale'
        }
      ]
    },
    {
      id: 'description',
      title: 'Descripción de la propiedad',
      fields: [
        { name: 'title', label: 'Título', type: 'text', required: true },
        { name: 'page_url', label: 'Sitio web', type: 'text', placeholder: 'https://...' },
        { name: 'description', label: 'Descripción', type: 'textarea', required: true }
      ]
    }
  ]
};
