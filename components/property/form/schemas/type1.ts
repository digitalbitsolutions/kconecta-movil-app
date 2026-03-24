import { PropertyFormSchema } from './types';

/**
 * SOURCE OF TRUTH: PROMPT USUARIO (2026-03-23)
 * SCHEMA IDENTICO 1:1 AL CRM
 * Agent: Gemma-3
 */
export const houseChaletSchema: PropertyFormSchema = {
  typeId: 1,
  sections: [
    {
      id: 'location',
      title: 'Localización del inmueble',
      fields: [
        { name: 'city', label: 'Localidad', type: 'text', required: true },
        { name: 'street', label: 'Nombre de la vía', type: 'location', required: true },
        { name: 'block', label: 'Bloque / Escalera', type: 'text' },
        { name: 'door', label: 'Puerta', type: 'text' },
        { name: 'urbanization', label: 'Nombre de la urbanización', type: 'text' },
        {
          name: 'address_visibility',
          label: 'Visibilidad en portales',
          type: 'radio',
          options: [
            { value: 'exact', label: 'Dirección exacta' },
            { value: 'street_only', label: 'Mostrar solo calle' },
            { value: 'hidden', label: 'Ocultar dirección' }
          ]
        }
      ]
    },
    {
      id: 'operation',
      title: 'Operación y precio',
      fields: [
        {
          name: 'operation_type',
          label: 'Operación',
          type: 'select',
          required: true,
          options: [
            { value: 'sale', label: 'Venta' },
            { value: 'rent', label: 'Alquiler' },
            { value: 'both', label: 'Venta + Alquiler' }
          ]
        },
        { 
          name: 'sale_price', 
          label: 'Precio de venta', 
          type: 'number',
          visibleIf: (f) => f.operation_type === 'sale' || f.operation_type === 'both'
        },
        { 
          name: 'community_cost', 
          label: 'Gastos de comunidad (€/mes)', 
          type: 'number',
          visibleIf: (f) => f.operation_type === 'sale' || f.operation_type === 'both'
        },
        { 
          name: 'ibi', 
          label: 'IBI (€/año)', 
          type: 'number',
          visibleIf: (f) => f.operation_type === 'sale' || f.operation_type === 'both'
        },
        {
          name: 'mortgage',
          label: 'Hipoteca pendiente',
          type: 'radio',
          options: [
            { value: true, label: 'Sí' },
            { value: false, label: 'No' }
          ],
          visibleIf: (f) => f.operation_type === 'sale' || f.operation_type === 'both'
        }
      ]
    },
    {
      id: 'features',
      title: 'Características de la casa o chalet',
      fields: [
        {
          name: 'property_subtype',
          label: 'Tipo de vivienda',
          type: 'select',
          options: [
            { value: 'adosado', label: 'Chalet adosado' },
            { value: 'pareado', label: 'Chalet pareado' },
            { value: 'independiente', label: 'Chalet independiente' },
            { value: 'rustica', label: 'Casa rústica' }
          ]
        },
        {
          name: 'condition',
          label: 'Estado de conservación',
          type: 'select',
          options: [
            { value: 'good', label: 'Buen estado' },
            { value: 'renovation', label: 'A reformar' },
            { value: 'new', label: 'Obra nueva' }
          ]
        },
        { name: 'meters_plot', label: 'M² PARCELA', type: 'number' },
        { name: 'rooms', label: 'NÚMERO DE DORMITORIOS', type: 'stepper', props: { min: 0, max: 20 } },
        {
          name: 'facade',
          label: 'FACHADA DEL INMUEBLE',
          type: 'radio',
          options: [
            { value: 'exterior', label: 'Exterior' },
            { value: 'interior', label: 'Interior' }
          ]
        },
        { name: 'floors', label: 'PLANTAS DEL CHALET', type: 'number' },
        { name: 'bathrooms', label: 'NÚMERO DE BAÑOS', type: 'stepper', props: { min: 0, max: 20 } },
        { name: 'built_area', label: 'm² construidos', type: 'number' },
        { name: 'usable_area', label: 'm² útiles', type: 'number' },
        { name: 'garage_spaces', label: 'Plazas de garaje', type: 'number' },
        {
          name: 'orientation',
          label: 'ORIENTACIÓN',
          type: 'multiselect',
          options: [
            { value: 'north', label: 'Norte' },
            { value: 'south', label: 'Sur' },
            { value: 'east', label: 'Este' },
            { value: 'west', label: 'Oeste' }
          ]
        },
        {
          name: 'extras',
          label: 'OTRAS CARACTERÍSTICAS DEL CHALET O CASA',
          type: 'multiselect',
          options: [
            { value: 'ac', label: 'Aire acondicionado' },
            { value: 'balcony', label: 'Balcón' },
            { value: 'pool', label: 'Piscina' },
            { value: 'terrace', label: 'Terraza' },
            { value: 'bbq', label: 'Barbacoa' },
            { value: 'concierge', label: 'Conserje' },
            { value: 'solar_panel', label: 'Panel solar' },
            { value: 'patio', label: 'Patio' },
            { value: 'storage', label: 'Trastero' },
            { value: 'wardrobes', label: 'Armarios empotrados' },
            { value: 'garage', label: 'Plaza de garaje' },
            { value: 'garden', label: 'Jardín' },
            { value: 'wheelchair', label: 'Adaptado para silla de rueda' }
          ]
        },
        {
          name: 'heating_type',
          label: 'Tipo de calefacción',
          type: 'select',
          optionsKey: 'type_heating'
        },
        { name: 'construction_year', label: 'Año de construcción', type: 'number' }
      ]
    },
    {
      id: 'category-section',
      title: 'CATEGORÍA',
      fields: [
        {
          name: 'category',
          label: 'Categoría',
          type: 'boolean',
          props: { label: 'Inmueble de banco' }
        }
      ]
    },
    {
      id: 'elevator',
      title: 'Ascensor',
      fields: [
        {
          name: 'has_elevator',
          label: '¿Tiene ascensor?',
          type: 'radio',
          options: [
            { value: true, label: 'Sí' },
            { value: false, label: 'No' }
          ]
        }
      ]
    },
    {
      id: 'energy',
      title: 'Energía y emisiones',
      fields: [
        {
          name: 'energy_certificate',
          label: 'CALIFICACIÓN DE CONSUMO DE ENERGÍA',
          type: 'select',
          optionsKey: 'type_energy_certificates'
        },
        {
          name: 'energy_emissions',
          label: 'CALIFICACIÓN DE EMISIONES',
          type: 'select',
          optionsKey: 'type_energy_certificates'
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
          name: 'situation',
          label: 'Situación actual',
          type: 'radio',
          options: [
            { value: 'occupied', label: 'Ocupada ilegalmente' },
            { value: 'rented', label: 'Alquilada con inquilinos' },
            { value: 'bare_ownership', label: 'Nuda propiedad' },
            { value: 'none', label: 'Ninguna de las anteriores' }
          ]
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
