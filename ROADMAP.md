# Roadmap De Desarrollo

## Fase 1 - Base Tecnica (Completado)
- [x] Inicializacion de proyecto Expo Router.
- [x] Cliente API con Axios e interceptores.
- [x] Login contra backend CRM en produccion.
- [x] Persistencia de token web/nativo.

## Fase 2 - Inmuebles Base (Completado)
- [x] Carga de propiedades desde `/api/agent/properties`.
- [x] Dashboard admin de inmuebles (solo propiedades).
- [x] Fallback de host API en web para tolerar problemas de certificado por dominio.
- [x] Pantalla de detalle de propiedad con datos reales.
- [x] Pantalla de listado `Propiedades/Mis propiedades` separada del dashboard.
- [x] Filtros basicos de listado (texto/estado/tipo/categoria).

## Fase 3 - Navegacion Backoffice Movil (Completado)
- [x] Sidebar/menu movil con:
- [x] Dashboard
- [x] Propiedades/Mis propiedades
- [x] Usuarios
- [x] Mi perfil
- [x] Reglas de visibilidad por rol replicadas desde CRM web.
- [x] Servicios fuera de alcance.
- [x] Blog fuera de alcance.

## Fase 4 - CRUD API Inmuebles (En progreso)
- [x] `store/update/destroy` implementados en backend (`/api/agent/properties`).
- [x] Endpoint de tipos para app movil (`/api/agent/property-types`).
- [x] Verificacion de despliegue automatico Dokploy tras push.
- [x] Ajuste base de payload frontend (`operation_type`, `sale_price`, `rental_price`, direccion extendida).
- [x] Alta de propiedad en app con flujo por tipo (Paso 1 -> Paso 2 dinamico) alineado a CRM web.
- [x] Formularios de alta por cada tipo de inmueble (1, 13, 4, 14, 9, 15) con campos del CRM.
- [x] Pipeline frontend de imagenes: seleccion + conversion WebP + envio multipart.
- [x] Ajustar payload frontend al contrato final completo por tipo (catalogos/selects y reglas finas).
- [x] Implementar edicion base en app movil (update form + guardado).
- [x] Refactor a pantalla modular mobile-first de editar/crear propiedad.
- [x] Variante especifica de edicion para `Local o nave` con media, mapa y estructura CRM adaptada a movil.
- [x] Ajustar campos avanzados para paridad exacta 1:1 con CRM web por tipo.

## Fase 5 - Paridad Formulario CRM (En progreso)
- [x] Completar campos avanzados por tipo con selects reales de catalogos (tipologia, orientacion, etc.).
- [x] Exponer endpoint CRM agregado de catalogos por tipo (`/api/agent/property-form-catalogs`).
- [x] Consumir catalogos remotos en app con cache por `type_id`.
- [x] Ajustar backend API para persistencia de portada/galeria/video (`cover_image`, `more_images[]`, `video`).
- [x] Confirmar E2E real de persistencia de portada/galeria/video con autenticacion API valida.
  - Token valido ya confirmado contra produccion.
  - Alta de control sin media ya pasa con `201`, confirmando `6f09e5e` desplegado.
  - En el contrato real de la app (`POST` + `_method=PATCH`), portada WebP, galeria WebP y video MP4 ya persisten correctamente.
  - Fixes finales CRM desplegados: `ecc02e0` (limites/permisos en imagen Docker + entrypoint) y `1fbd585` (refuerzo Apache `.htaccess`).
- [x] Acciones de card en listado: publicar/inactivar y eliminar.
- [x] Accion editar conectada end-to-end desde cards/detalle.
- [x] QA funcional admin/no-admin end-to-end.
  - Smoke admin ya verificado en produccion con token API valido (`/me` + `/agent/properties?scope=all&per_page=250`).
  - Reglas visibles por rol ya endurecidas en app:
    - `Usuarios` solo para admin.
    - `Editar` en detalle/preview solo para admin o propietario con rol habilitado.
  - Usuario QA no-admin (`user_level_id = 2`) ya validado en produccion con login + CRUD propio + acceso ajeno `403`.
- [x] QA visual mobile de secciones (espaciado, labels y orden final).
  - Pase correctivo reciente en `EditPropertyScreen.tsx`:
    - reorden y visibilidad por tipo en `Ubicacion` y `Caracteristicas`;
    - recuperado `Sitio web` en edicion;
    - recuperado bloque residencial de alquiler (`max_num_tenants`, ninos, mascotas);
    - ocultados bloques no existentes en CRM para `Garaje` y `Terreno` (`Estado conservacion`, `Energia`, etc.).
  - Cierre de QA visual apoyado en contraste de codigo/layout contra formularios CRM y build web estable.

## Fase 6 - Detalle Movil Por Tipo (En progreso)
- [x] Enriquecer `GET /agent/properties/{id}` en CRM para soportar detalle/preview movil con media y contexto rico.
- [x] Crear arquitectura reusable de detalle por tipo:
  - `components/property/detail/`
  - mapper por tipo
  - pantalla de detalle (`app/(app)/property/[id].js`)
  - pantalla de preview (`app/(app)/property/preview/[id].js`)
- [x] Implementar y validar `Local o nave` como tipo piloto.
- [x] Replicar el patron a `Casa o chalet`.
- [x] Replicar el patron a `Piso` (misma familia de complejidad alta).
- [x] Replicar el patron a `Casa rustica`.
- [x] Replicar el patron a `Garaje`.
- [x] Replicar el patron a `Terreno`.
- [x] Enriquecer CRM con labels relacionales de detalle para `Piso`, `Garaje` y `Terreno`.
- [x] QA visual final de detalle/preview por tipo contra CRM web.
  - Smoke tecnico de detalle completado con propiedades reales de `Casa o chalet`, `Piso`, `Local o nave`, `Garaje`, `Terreno` y `Casa rustica`.
  - `npx expo export --platform web --output-dir tmp/web-build` sigue pasando tras el endurecimiento de permisos UI.
  - Pase correctivo reciente en detalle/preview:
    - `Video` recuperado cuando existe media;
    - `Sitio web` (`page_url`) recuperado en la ficha;
    - `Bloque / Esc.` y `Puerta` visibles en la cabecera;
    - contacto alineado a `Ultima actualizacion`.
  - Bloque de QA de detalle cerrado con contraste CRM + validacion funcional por rol + build OK.

## Fase 7 - Hardening Post-QA (En progreso)
- [x] Endurecer visibilidad UI por rol en shell, detalle y preview.
- [x] Verificar limpieza de la cuenta QA temporal usada para la validacion no-admin.
  - La cuenta temporal ya no autentica en API (`401`), dejando el entorno operativo limpio.
- [x] Eliminar defaults inseguros de autenticacion en la app (`login` sin credenciales precargadas).
- [x] Alinear loaders y pantallas base criticas (`login`, layouts, `Mi perfil`) con tokens del design system.
- [x] Reducir hardcodes visibles en `Dashboard` y `Usuarios`, manteniendo la logica funcional intacta.
- [x] Reducir hardcodes visibles y artefactos de encoding en cards legacy de propiedades (`PropertyCardCompact`, `PropertyCardDetailed`, helpers).
- [ ] Revisar solo residuos menores post-polish si aparece una nueva necesidad visual puntual.
