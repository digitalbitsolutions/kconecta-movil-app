# Plan De Orquestacion IA (Ahorro De Tokens)

Este plan define el flujo de trabajo con modelos locales para reducir costo de tokens.

## Estado De Sincronizacion (2026-03-23)
- Workspace principal activo: `C:\MeegDev\kconecta-app-movil`.
- CRM web de referencia (solo consulta): `C:\MeegDev\kconecta-crm\web`.
- El flujo de alta movil ya replica la estructura funcional del CRM:
  - Paso 1: seleccion de tipo.
  - Paso 2: formulario dinamico por tipo.
  - Imagenes: seleccion + WebP + upload.
- Pantalla modular activa para crear/editar:
  - `screens/property/EditPropertyScreen.tsx`
  - `app/(app)/properties/new/index.js` apunta a esa pantalla.
- Patron base de detalle/preview movil ya validado para `Local o nave`:
  - `components/property/detail/propertyDetailMapper.js`
  - `components/property/detail/LocalPremisesDetailView.js`
  - `components/property/detail/HouseChaletDetailView.js`
  - `components/property/detail/PropertyImageCarousel.js`
  - `app/(app)/property/[id].js`
  - `app/(app)/property/preview/[id].js`
- Variantes de detalle ya replicadas para todos los tipos de inmueble activos:
  - `Casa o chalet` (`type_id = 1`)
  - `Piso` (`type_id = 13`)
  - `Local o nave` (`type_id = 4`)
  - `Garaje` (`type_id = 14`)
  - `Terreno` (`type_id = 9`)
  - `Casa rustica` (`type_id = 15`)
- Backend CRM enriquecido para detalle movil:
  - `GET /agent/properties/{id}` ahora devuelve media y contexto rico necesario para la ficha modular.
  - Labels relacionales adicionales ya expuestos para `Casa o chalet`, `Piso`, `Garaje` y `Terreno`.
- Paridad de catalogos/selects ya integrada en editar/crear:
  - `GET /agent/property-form-catalogs?type_id={id}` disponible en CRM.
  - `hooks/usePropertyFormCatalogs.js` resuelve carga + cache por `type_id`.
  - `screens/property/EditPropertyScreen.tsx` ya consume catalogos remotos y limpia campos incompatibles por tipo/operacion.
- Persistencia de media en CRM ya parcheada para API movil:
  - `PropertyApiController::store/update` ahora procesan `cover_image`, `more_images[]` y `video`.
  - Rutas/lectura de detalle ya estaban listas; faltaba solo escritura real.
  - Token API valido ya confirmado en produccion contra `GET /me`.
  - Alta de control sin media ya devuelve `201` en produccion; el fix `6f09e5e` esta desplegado.
  - En el contrato real de update que usa la app (`POST` + `_method=PATCH`), portada WebP, galeria WebP y video MP4 ya quedan persistidos en produccion.
  - `PATCH` multipart puro no persiste media y no debe usarse para validar el flujo movil.
  - El flujo movil se valido con una propiedad temporal de QA y despues se limpio del entorno.
  - Commits CRM relacionados:
    - `d87befe` -> escritura real de media en API.
    - `be658e4` -> diagnostico estricto de directorios de subida.
    - `6f09e5e` -> evitar comprobar directorios de media cuando la peticion no trae archivos.
    - `e3c44c7` -> comprobar solo los directorios requeridos por la media presente.
    - `4f537a9` -> mensajes de error de video mas especificos.
    - `ecc02e0` -> limites PHP + permisos/ownership de `uploads` en Dockerfile y entrypoint.
    - `1fbd585` -> refuerzo de limites PHP via Apache `.htaccess`.
  - Estado restante de media: cerrado para el pipeline movil real.
- Validacion tecnica reciente:
  - `npx expo export --platform web --output-dir tmp/web-build` OK.
- Smoke tecnico reciente de detalle:
  - ids verificados por tipo: `71`, `74`, `46`, `44`, `68`, `73`.
  - Todos devuelven `cover_image_url` y galeria poblada en detalle.
- Smoke tecnico reciente de roles/permisos:
  - token admin valido confirmado contra `GET /me`.
  - `GET /agent/properties?scope=all&per_page=250` devuelve inmuebles de mas de un usuario, confirmando vista admin real.
  - UI endurecida en app:
    - `Usuarios` visible solo para admin.
    - `Editar` en detalle/preview visible solo para admin o propietario con rol habilitado.
  - QA real de no-admin ya cerrada con usuario QA dedicado (`user_level_id = 2`):
    - login API `200`;
    - create propio `201`;
    - listado devuelve solo su inmueble;
    - detalle propio `200`;
    - detalle ajeno `403`;
    - update propio `200`;
    - delete propio `200`.
- Pase reciente de QA visual en editar:
  - `EditPropertyScreen.tsx` realineado por tipo contra los formularios CRM.
  - Corregidos desajustes claros:
    - `Sitio web` visible en edicion, no solo en `Local o nave`.
    - `Piso` recupera `type_floor[]` en ubicacion y deja de mostrar `Tipologia`.
    - `Casa o chalet` / `Casa rustica` dejan de mostrar `Planta`.
    - `Garaje` y `Terreno` dejan de mostrar bloques no presentes en CRM (`Estado conservacion`, `Energia`, etc.).
    - Residencial recupera bloque de alquiler con `max_num_tenants`, ninos y mascotas.
- Pase reciente de QA visual en detalle/preview:
  - `propertyDetailMapper.js` y vistas modulares realineados con `details.blade.php` en puntos claros de contenido.
  - Corregidos desajustes seguros:
    - boton `Video` visible cuando el inmueble tiene media de video;
    - enlace `Sitio web` (`page_url`) recuperado en la ficha;
    - metadatos `Bloque / Esc.` y `Puerta` visibles bajo cabecera;
    - texto de contacto corregido a `Ultima actualizacion`;
    - labels energeticos afinados a `Consumo de energia` y `Consumo de emisiones`.
- Limpieza de QA:
  - propiedades temporales `77` y `83` eliminadas con `200`.
  - propiedad temporal `84` eliminada con `200`.
  - la cuenta temporal no-admin usada para la validacion ya no autentica en API (`401`), cerrando el cleanup operativo.
- Cierre reciente de QA:
  - QA visual/funcional de editar, detalle y preview cerrada a nivel de desarrollo.
  - Build web estable tras los ultimos ajustes de permisos y detalle.
- Hardening reciente de pantallas base:
  - `app/login.js` ya no precarga credenciales de prueba.
  - `app/_layout.js` y `app/(app)/_layout.js` usan tokens para loaders y superficies base.
  - `components/ui/InputField.js` expone props nativas y evita literales visibles.
  - `components/ui/Button.js` agrega variante `danger`.
  - `app/(app)/profile/index.js` queda alineado al design system.
  - `app/(app)/index.js` y `app/(app)/users/index.js` ya consumen tokens/Card en lugar de estilos visibles hardcodeados.
  - `components/property/PropertyCardCompact.js`, `PropertyCardDetailed.js` y `propertyCardHelpers.js` quedan alineados a tokens, estados compartidos y texto ASCII limpio.
- Siguiente bloque: seguimiento de pulido menor solo si aparece algun desajuste visual puntual en dispositivo.

## Objetivo
- Usar modelos locales para planificacion, generacion de cambios y review.
- Mantener prompts cortos y contexto minimo.
- Dejar a Codex la integracion final en repositorio y validaciones.

## Reparto De Roles
- Gemma (`gemma3:4b`): plan corto y review rapido.
- DeepSeek (`deepseek-coder-v2:16b`): patch y cambios de codigo.
- Codex: aplicar cambios reales, ejecutar validaciones, commit y push.

## Flujo Estandar
1. Definir una sola tarea por iteracion.
2. Enviar a Gemma un plan en 5-6 pasos maximo.
3. Enviar a DeepSeek patch concreto sobre archivos puntuales.
4. Integrar en repo y validar.
5. Commit pequeno y trazable.

## Patron Reutilizable Por Tipo
1. Revisar en CRM web la vista de detalle y de formulario del tipo objetivo.
2. Confirmar si `GET /agent/properties/{id}` ya expone todos los campos/relaciones necesarios.
3. Si faltan datos, ampliar backend CRM primero y desplegar.
4. Crear/ajustar mapper del tipo en `components/property/detail/propertyDetailMapper.js`.
5. Crear variante visual modular en `components/property/detail/`.
6. Conectar la variante en detalle y preview resolviendo por `type_id`.
7. Validar build web y QA visual contra CRM web.

## Regla De Contexto Minimo
- Incluir solo archivos necesarios por tarea.
- Evitar logs largos.
- Preferir salida en formato patch.

## Wrapper Local
- Script: `tools/deepseek/ds.ps1`
- Alias:
  - `dscode` -> DeepSeek
  - `dsplan` -> Gemma plan
  - `dsreview` -> Gemma review

## Estado Backend
- API objetivo: `https://www.kconecta.com/api`
- Endpoints base usados:
  - `POST /login`
  - `GET /me`
  - `GET /agent/properties`
  - `POST /agent/properties`
  - `PATCH /agent/properties/{id}`
  - `DELETE /agent/properties/{id}`
  - `GET /agent/property-form-catalogs?type_id={id}`
  - `DELETE /agent/property-images/{imageId}`

## Proxima Iteracion
- Objetivo: mantener seguimiento de polish menor solo ante incidencias visuales puntuales y preparar siguiente bloque funcional cuando lo definamos.
- Reparto sugerido:
- Gemma: checklist corto de riesgos residuales o polish.
- DeepSeek: patch puntual solo ante regresiones o ajustes finos detectados despues del cierre de QA.
- Codex: integracion final, pruebas y sincronizacion de contexto.

## Orden Recomendado De Cierre
1. Monitorizar incidencias menores post-QA
2. Abrir nuevo bloque solo ante bug reproducible o cambio funcional nuevo
