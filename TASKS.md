# Tasks

## Prioridad Alta
- [x] Login estable en web contra backend productivo.
- [x] Dashboard admin de inmuebles.
- [x] Fallback de base URL API en web para SSL/domain issues.
- [x] Navegacion principal (Dashboard, Propiedades/Mis propiedades, Usuarios, Mi perfil).
- [x] Wizard base para alta de propiedad.
- [x] Backend CRM con CRUD API de propiedades activo.
- [x] Paridad base de alta (operacion + precios separados + ubicacion extendida) en app movil.

## Pendientes Inmediatos
- [x] Igualar estructura del formulario de alta con CRM web por tipo (Paso 1 + Paso 2 dinamico).
- [x] Completar formularios de AGREGAR propiedad para los 6 tipos (campos por tipo, incluyendo campos avanzados del CRM).
- [x] Implementar edicion base de propiedad desde app.
- [x] Refactor de UI a pantalla modular mobile-first para crear/editar (`screens/property/EditPropertyScreen.tsx`).
- [x] Completar variante especifica de edicion para `Local o nave` alineada con CRM web.
- [x] Implementar accion publicar/inactivar desde app.
- [x] Implementar eliminacion de propiedad desde app.
- [x] Implementar pipeline frontend de imagenes (seleccion + conversion WebP + upload multipart).
- [x] Completar ficha movil de detalle/preview para `Local o nave` con galeria, header, descripcion, caracteristicas, equipamientos, certificado energetico y contacto.
- [x] Ajustar API CRM de detalle para soportar galeria, media y contexto rico de `Local o nave`.
- [x] Replicar patron de detalle/preview movil a `Casa o chalet` (type 1).
- [x] Replicar patron de detalle/preview movil a `Piso` (type 13).
- [x] Replicar patron de detalle/preview movil a `Casa rustica` (type 15).
- [x] Replicar patron de detalle/preview movil a `Garaje` (type 14).
- [x] Replicar patron de detalle/preview movil a `Terreno` (type 9).
- [x] Ajustar API CRM de detalle para exponer labels relacionales faltantes de `Piso`, `Garaje` y `Terreno`.
- [x] Ajustar API CRM para persistir `cover_image` y `more_images[]` en `store/update`.
- [x] Ajustar API CRM para persistir `video` en `store/update`.
- [x] Verificar E2E real de persistencia de `cover_image`, `more_images[]` y `video` con token/credenciales API validas.
  - Token API valido confirmado contra `GET /me` en produccion.
  - Alta de control sin media verificada con `201` en produccion; `6f09e5e` ya esta desplegado.
  - El contrato real de update que usa la app (`POST` + `_method=PATCH` con `FormData`) ya queda verificado en produccion.
  - Pipeline real verificado para movil:
    - portada WebP persistida;
    - galeria WebP persistida;
    - video MP4 persistido.
  - `PATCH` multipart puro no es representativo del flujo movil: responde `200` pero no persiste media.
  - Ajustes CRM adicionales ya subidos:
    - `e3c44c7` para comprobar solo los directorios de media realmente necesarios.
    - `4f537a9` para distinguir mejor el error real de subida de video.
    - `ecc02e0` para fijar limites de upload y permisos de `uploads` en la imagen/entrypoint del CRM.
    - `1fbd585` para reforzar limites PHP en `public/.htaccess` bajo Apache.
  - Con `1fbd585` ya desplegado, el bloqueo de video por limite de servidor quedo resuelto.
  - Limpieza QA completada: propiedad temporal `84` eliminada con `200`.
- [x] Completar campos avanzados por tipo con catalogos reales (selects) en lugar de IDs manuales.
- [x] Validacion manual E2E admin y no-admin para CRUD de inmuebles.
  - Smoke admin ya verificado en produccion con token API valido:
    - `GET /me` devuelve `user_level_id = 1`.
    - `GET /agent/properties?scope=all&per_page=250` devuelve inmuebles de mas de un usuario, confirmando vista admin real.
  - Endurecimiento UI por rol aplicado y QA no-admin cerrado:
    - `Usuarios` queda visible solo para admin.
    - `Editar` en detalle/preview queda visible solo para admin o propietario con rol habilitado.
    - Usuario QA no-admin (`user_level_id = 2`) validado en produccion:
      - login API `200`;
      - alta propia `201`;
      - listado devuelve solo su inmueble;
      - detalle propio `200`;
      - detalle ajeno `403`;
      - update propio `200`;
      - delete propio `200`.
    - La cuenta temporal usada para la validacion ya no autentica en API (`401`), cerrando el cleanup operativo.
- [x] QA de layout mobile de la edicion (comparativa visual final contra CRM web).
  - Pase correctivo aplicado en `EditPropertyScreen.tsx` para alinear contenido por tipo con el CRM:
    - `Casa o chalet` / `Casa rustica`: sin `Planta`, sin `type_floor[]`, con `Tipologia`, financieros de venta y `Sitio web` en edicion.
    - `Piso`: `Planta` + `type_floor[]` en ubicacion, sin `Tipologia`, con bloque de alquiler (`max_num_tenants`, ninos, mascotas).
    - `Garaje`: sin `Estado conservacion` ni `Energia`, con `Estado de ocupacion`, financieros de venta y sin campo `Puerta`.
    - `Terreno`: sin `Planta`, sin `Estado conservacion`, sin `Energia`, sin `plot_meters`; solo campos especificos de terreno.
  - Comparativa funcional/visual cerrada en desarrollo con contraste directo de formularios CRM + build web OK.
- [x] QA visual mobile de detalle/preview por tipo (comparativa visual final contra CRM web).
  - Smoke tecnico completado sobre detalle por los 6 tipos con datos reales (`type_id`: 1, 4, 9, 13, 14, 15).
  - Los payloads de detalle consultados devuelven `cover_image_url` y galerias pobladas en propiedades reales de muestra.
  - Pase correctivo reciente aplicado sobre detalle/preview:
    - recuperado acceso a `Video` cuando la propiedad lo tiene;
    - recuperado enlace `Sitio web` (`page_url`) dentro de la ficha;
    - recuperados metadatos superiores `Bloque / Esc.` y `Puerta` bajo cabecera;
    - corregido texto de contacto a `Ultima actualizacion`.
  - Cierre de QA funcional/visual apoyado en contraste CRM + build + validacion real por rol.

## Restricciones Activas
- [x] Solo inmuebles en esta etapa.
- [x] Excluir Servicios.
- [x] Excluir Blog.

## Notas Operativas
- [x] Deploy del CRM en Dokploy es automatico tras `push` a `main`.
- [ ] Usar redeploy manual solo si health-check o endpoints fallan post-push.
- [x] Workspace activo para desarrollo movil: `C:\MeegDev\kconecta-app-movil`.
- [x] CRM web (`C:\MeegDev\kconecta-crm\web`) queda como referencia funcional de logica/vistas.
- [x] Endpoint CRM de catalogos por tipo activo: `GET /agent/property-form-catalogs?type_id={id}`.
- [x] Carga/cache de catalogos remotos en app via `hooks/usePropertyFormCatalogs.js`.
- [x] Smoke test del endpoint desplegado: `/agent/property-form-catalogs?type_id=1` devuelve `401` sin auth en produccion, confirmando ruta activa.
- [x] Verificacion E2E real de media (`cover_image`, `more_images[]`, `video`) cerrada para el pipeline movil real (WebP + MP4).
- [x] Build tecnico reciente tras endurecer permisos UI: `npx expo export --platform web --output-dir tmp/web-build` OK.
- [x] Hardening reciente de pantallas base y design system:
  - `app/login.js` ya no incluye credenciales por defecto.
  - `app/_layout.js` y `app/(app)/_layout.js` usan tokens en loaders y superficies base.
  - `app/(app)/profile/index.js` y `components/ui/Button.js` quedan alineados con tokens y variante `danger`.
  - `app/(app)/index.js` y `app/(app)/users/index.js` reducen hardcodes visibles apoyandose en tokens y `Card`.
  - `components/property/PropertyCardCompact.js`, `PropertyCardDetailed.js` y `propertyCardHelpers.js` ya consumen tokens compartidos y dejan atras iconos/textos corruptos por encoding.
- [x] Infraestructura de produccion ajustada para media en el CRM desplegado:
  - permisos/ownership de `public/img/uploads` y `public/video/uploads`;
  - limites `upload_max_filesize` / `post_max_size` elevados para video.
- [x] Limpieza post-QA realizada: propiedades temporales `77` y `83` eliminadas con `200`.
- [x] Patrón validado a reutilizar para detalle/preview por tipo:
  - `components/property/detail/propertyDetailMapper.js` como adaptador de payload por tipo.
  - `components/property/detail/LocalPremisesDetailView.js`, `HouseChaletDetailView.js`, `ApartmentDetailView.js`, `RusticHouseDetailView.js`, `GarageDetailView.js` y `LandDetailView.js` como referencias de composicion modular.
  - `app/(app)/property/[id].js` y `app/(app)/property/preview/[id].js` deben resolver por `type_id` y renderizar variante especifica.

## Fase 8 - Gestion de Leads (Cerrado)
// Agent: Gemma
- [x] Implementar listado de Prospectos/Leads vinculados a inmuebles (Endpoint API CRM).
- [x] Integrar acciones rapidas de contacto (WhatsApp/Llamada) desde la ficha de detalle.
- [x] Visualizar historial de actividad de contactos por propiedad.
- [x] Incorporar widget de "Nuevos Contactos" en Dashboard movil.

## Fase 9 - Gestión de Media Avanzada (Cerrado)
// Agent: Gemma (Architect)
- [x] Refactor del selector de imágenes para permitir selección múltiple.
- [x] Implementación de **Async Preview & Upload Queue** (carga asíncrona).
- [x] Soporte nativo para **Reordenación de Galería** con persistencia en CRM.
# Tasks

## Prioridad Alta
- [x] Login estable en web contra backend productivo.
- [x] Dashboard admin de inmuebles.
- [x] Fallback de base URL API en web para SSL/domain issues.
- [x] Navegacion principal (Dashboard, Propiedades/Mis propiedades, Usuarios, Mi perfil).
- [x] Wizard base para alta de propiedad.
- [x] Backend CRM con CRUD API de propiedades activo.
- [x] Paridad base de alta (operacion + precios separados + ubicacion extendida) en app movil.

## Pendientes Inmediatos
- [x] Igualar estructura del formulario de alta con CRM web por tipo (Paso 1 + Paso 2 dinamico).
- [x] Completar formularios de AGREGAR propiedad para los 6 tipos (campos por tipo, incluyendo campos avanzados del CRM).
- [x] Implementar edicion base de propiedad desde app.
- [x] Refactor de UI a pantalla modular mobile-first para crear/editar (`screens/property/EditPropertyScreen.tsx`).
- [x] Completar variante especifica de edicion para `Local o nave` alineada con CRM web.
- [x] Implementar accion publicar/inactivar desde app.
- [x] Implementar eliminacion de propiedad desde app.
- [x] Implementar pipeline frontend de imagenes (seleccion + conversion WebP + upload multipart).
- [x] Completar ficha movil de detalle/preview para `Local o nave` con galeria, header, descripcion, caracteristicas, equipamientos, certificado energetico y contacto.
- [x] Ajustar API CRM de detalle para soportar galeria, media y contexto rico de `Local o nave`.
- [x] Replicar patron de detalle/preview movil a `Casa o chalet` (type 1).
- [x] Replicar patron de detalle/preview movil a `Piso` (type 13).
- [x] Replicar patron de detalle/preview movil a `Casa rustica` (type 15).
- [x] Replicar patron de detalle/preview movil a `Garaje` (type 14).
- [x] Replicar patron de detalle/preview movil a `Terreno` (type 9).
- [x] Ajustar API CRM de detalle para exponer labels relacionales faltantes de `Piso`, `Garaje` y `Terreno`.
- [x] Ajustar API CRM para persistir `cover_image` y `more_images[]` en `store/update`.
- [x] Ajustar API CRM para persistir `video` en `store/update`.
- [x] Verificar E2E real de persistencia de `cover_image`, `more_images[]` y `video` con token/credenciales API validas.
  - Token API valido confirmado contra `GET /me` en produccion.
  - Alta de control sin media verificada con `201` en produccion; `6f09e5e` ya esta desplegado.
  - El contrato real de update que usa la app (`POST` + `_method=PATCH` con `FormData`) ya queda verificado en produccion.
  - Pipeline real verificado para movil:
    - portada WebP persistida;
    - galeria WebP persistida;
    - video MP4 persistido.
  - `PATCH` multipart puro no es representativo del flujo movil: responde `200` pero no persiste media.
  - Ajustes CRM adicionales ya subidos:
    - `e3c44c7` para comprobar solo los directorios de media realmente necesarios.
    - `4f537a9` para distinguir mejor el error real de subida de video.
    - `ecc02e0` para fijar limites de upload y permisos de `uploads` en la imagen/entrypoint del CRM.
    - `1fbd585` para reforzar limites PHP en `public/.htaccess` bajo Apache.
  - Con `1fbd585` ya desplegado, el bloqueo de video por limite de servidor quedo resuelto.
  - Limpieza QA completada: propiedad temporal `84` eliminada con `200`.
- [x] Completar campos avanzados por tipo con catalogos reales (selects) en lugar de IDs manuales.
- [x] Validacion manual E2E admin y no-admin para CRUD de inmuebles.
  - Smoke admin ya verificado en produccion con token API valido:
    - `GET /me` devuelve `user_level_id = 1`.
    - `GET /agent/properties?scope=all&per_page=250` devuelve inmuebles de mas de un usuario, confirmando vista admin real.
  - Endurecimiento UI por rol aplicado y QA no-admin cerrado:
    - `Usuarios` queda visible solo para admin.
    - `Editar` en detalle/preview queda visible solo para admin o propietario con rol habilitado.
    - Usuario QA no-admin (`user_level_id = 2`) validado en produccion:
      - login API `200`;
      - alta propia `201`;
      - listado devuelve solo su inmueble;
      - detalle propio `200`;
      - detalle ajeno `403`;
      - update propio `200`;
      - delete propio `200`.
    - La cuenta temporal usada para la validacion ya no autentica en API (`401`), cerrando el cleanup operativo.
- [x] QA de layout mobile de la edicion (comparativa visual final contra CRM web).
  - Pase correctivo aplicado en `EditPropertyScreen.tsx` para alinear contenido por tipo con el CRM:
    - `Casa o chalet` / `Casa rustica`: sin `Planta`, sin `type_floor[]`, con `Tipologia`, financieros de venta y `Sitio web` en edicion.
    - `Piso`: `Planta` + `type_floor[]` en ubicacion, sin `Tipologia`, con bloque de alquiler (`max_num_tenants`, ninos, mascotas).
    - `Garaje`: sin `Estado conservacion` ni `Energia`, con `Estado de ocupacion`, financieros de venta y sin campo `Puerta`.
    - `Terreno`: sin `Planta`, sin `Estado conservacion`, sin `Energia`, sin `plot_meters`; solo campos especificos de terreno.
  - Comparativa funcional/visual cerrada en desarrollo con contraste directo de formularios CRM + build web OK.
- [x] QA visual mobile de detalle/preview por tipo (comparativa visual final contra CRM web).
  - Smoke tecnico completado sobre detalle por los 6 tipos con datos reales (`type_id`: 1, 4, 9, 13, 14, 15).
  - Los payloads de detalle consultados devuelven `cover_image_url` y galerias pobladas en propiedades reales de muestra.
  - Pase correctivo reciente aplicado sobre detalle/preview:
    - recuperado acceso a `Video` cuando la propiedad lo tiene;
    - recuperado enlace `Sitio web` (`page_url`) dentro de la ficha;
    - recuperados metadatos superiores `Bloque / Esc.` y `Puerta` bajo cabecera;
    - corregido texto de contacto a `Ultima actualizacion`.
  - Cierre de QA funcional/visual apoyado en contraste CRM + build + validacion real por rol.

## Restricciones Activas
- [x] Solo inmuebles en esta etapa.
- [x] Excluir Servicios.
- [x] Excluir Blog.

## Notas Operativas
- [x] Deploy del CRM en Dokploy es automatico tras `push` a `main`.
- [ ] Usar redeploy manual solo si health-check o endpoints fallan post-push.
- [x] Workspace activo para desarrollo movil: `C:\MeegDev\kconecta-app-movil`.
- [x] CRM web (`C:\MeegDev\kconecta-crm\web`) queda como referencia funcional de logica/vistas.
- [x] Endpoint CRM de catalogos por tipo activo: `GET /agent/property-form-catalogs?type_id={id}`.
- [x] Carga/cache de catalogos remotos en app via `hooks/usePropertyFormCatalogs.js`.
- [x] Smoke test del endpoint desplegado: `/agent/property-form-catalogs?type_id=1` devuelve `401` sin auth en produccion, confirmando ruta activa.
- [x] Verificacion E2E real de media (`cover_image`, `more_images[]`, `video`) cerrada para el pipeline movil real (WebP + MP4).
- [x] Build tecnico reciente tras endurecer permisos UI: `npx expo export --platform web --output-dir tmp/web-build` OK.
- [x] Hardening reciente de pantallas base y design system:
  - `app/login.js` ya no incluye credenciales por defecto.
  - `app/_layout.js` y `app/(app)/_layout.js` usan tokens en loaders y superficies base.
  - `app/(app)/profile/index.js` y `components/ui/Button.js` quedan alineados con tokens y variante `danger`.
  - `app/(app)/index.js` y `app/(app)/users/index.js` reducen hardcodes visibles apoyandose en tokens y `Card`.
  - `components/property/PropertyCardCompact.js`, `PropertyCardDetailed.js` y `propertyCardHelpers.js` ya consumen tokens compartidos y dejan atras iconos/textos corruptos por encoding.
- [x] Infraestructura de produccion ajustada para media en el CRM desplegado:
  - permisos/ownership de `public/img/uploads` y `public/video/uploads`;
  - limites `upload_max_filesize` / `post_max_size` elevados para video.
- [x] Limpieza post-QA realizada: propiedades temporales `77` y `83` eliminadas con `200`.
- [x] Patrón validado a reutilizar para detalle/preview por tipo:
  - `components/property/detail/propertyDetailMapper.js` como adaptador de payload por tipo.
  - `components/property/detail/LocalPremisesDetailView.js`, `HouseChaletDetailView.js`, `ApartmentDetailView.js`, `RusticHouseDetailView.js`, `GarageDetailView.js` y `LandDetailView.js` como referencias de composicion modular.
  - `app/(app)/property/[id].js` y `app/(app)/property/preview/[id].js` deben resolver por `type_id` y renderizar variante especifica.

## Fase 8 - Gestion de Leads (Cerrado)
// Agent: Gemma
- [x] Implementar listado de Prospectos/Leads vinculados a inmuebles (Endpoint API CRM).
- [x] Integrar acciones rapidas de contacto (WhatsApp/Llamada) desde la ficha de detalle.
- [x] Visualizar historial de actividad de contactos por propiedad.
- [x] Incorporar widget de "Nuevos Contactos" en Dashboard movil.

## Fase 9 - Gestión de Media Avanzada (Cerrado)
// Agent: Gemma (Architect)
- [x] Refactor del selector de imágenes para permitir selección múltiple.
- [x] Implementación de **Async Preview & Upload Queue** (carga asíncrona).
- [x] Soporte nativo para **Reordenación de Galería** con persistencia en CRM.
- [x] Lógica de **Borrado Remoto Instantáneo** y sincronización de IDs.
- [x] Auditoría de seguridad post-implementación (Mistral).

## Fase 10 - Refactoring y Hardening Modular (Abierta)
// Agent: Gemma (Architect) - FOCO: Frontend Nativo (CRM Legado es solo lectura)
- [x] Refactor de `Step2Media.tsx` en sub-componentes (Completado).
- [x] Implementar Slider Horizontal para Galerías (Qwen).
- [x] Integrar Gradientes y Sombras Premium (DeepSeek).
- [x] Fix: Confirmación de borrado universal (Web/Mobile) (DeepSeek).
- [ ] Auditoría de seguridad del mapeo de datos en Perfil (CLIENT-SIDE) (Mistral).
- [ ] Implementar sistema de temas: Modo Oscuro / Claro inicial (Qwen).
