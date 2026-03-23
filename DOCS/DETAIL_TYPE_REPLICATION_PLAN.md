# Plan De Replica De Detalle/Preview Por Tipo

Este documento fija el patron ya validado con `Local o nave` y `Casa o chalet` para reutilizarlo en los tipos pendientes.

## Tipos Validados
- `Local o nave` (`type_id = 4`)
- `Casa o chalet` (`type_id = 1`)
- `Piso` (`type_id = 13`)
- `Casa rustica` (`type_id = 15`)
- `Garaje` (`type_id = 14`)
- `Terreno` (`type_id = 9`)

## Arquitectura Base Ya Disponible
- Mapper por tipo:
  - `components/property/detail/propertyDetailMapper.js`
- Variante visual modular:
  - `components/property/detail/LocalPremisesDetailView.js`
  - `components/property/detail/HouseChaletDetailView.js`
  - `components/property/detail/ApartmentDetailView.js`
  - `components/property/detail/RusticHouseDetailView.js`
  - `components/property/detail/GarageDetailView.js`
  - `components/property/detail/LandDetailView.js`
- Bloques reutilizables:
  - `PropertyImageCarousel`
  - `PropertyHeaderInfo`
  - `PropertyChips`
  - `PropertyDescription`
  - `PropertyDetailsCard`
  - `PropertyEquipment`
  - `PropertyEnergyCertificate`
  - `PropertyContactCard`
- Pantallas consumidoras:
  - `app/(app)/property/[id].js`
  - `app/(app)/property/preview/[id].js`

## Receta De Implementacion Por Tipo
1. Revisar en CRM web:
   - `resources/views/page/details.blade.php`
   - `resources/views/post/forms/form_*_update.blade.php`
2. Listar bloques reales del tipo:
   - galeria
   - informacion principal
   - descripcion
   - caracteristicas
   - equipamientos
   - energia/certificados
   - contacto / CTA
3. Verificar que `GET /agent/properties/{id}` expone todo lo necesario.
4. Si faltan relaciones o labels, ampliar backend CRM primero.
5. Crear mapper del tipo en `propertyDetailMapper.js`.
6. Crear variante visual modular nueva en `components/property/detail/`.
7. Conectar la variante en detalle y preview por `type_id`.
8. Validar con:
   - `npx expo export --platform web --output-dir tmp/web-build`
   - comparativa visual contra CRM web

## Estado Actual
1. Los 6 tipos activos ya resuelven variante especifica en detalle y preview por `type_id`.
2. El mapper central `propertyDetailMapper.js` concentra la adaptacion de payload por tipo.
3. El siguiente uso de esta receta debe orientarse a QA visual final y a futuros tipos nuevos, no a los 6 ya cubiertos.

## Notas De Reutilizacion
- Priorizar reuso de bloques existentes antes de crear componentes nuevos.
- Mantener `Local o nave` como referencia de calidad visual y estructura.
- Reusar `HouseChaletDetailView.js` como shell compositiva cuando un tipo comparta estructura residencial y solo cambien labels/secciones.
- No reutilizar `PropertyCardDetailed` para los tipos que requieran ficha rica; dejarlo solo como fallback generico.
- Resolver primero backend si la vista web depende de relaciones no incluidas en la API movil.
