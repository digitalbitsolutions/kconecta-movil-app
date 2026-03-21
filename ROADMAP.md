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
- [ ] Ajustar payload frontend al contrato final completo por tipo (catalogos/selects y reglas finas).
- [x] Implementar edicion base en app movil (update form + guardado).
- [x] Refactor a pantalla modular mobile-first de editar/crear propiedad.
- [ ] Ajustar campos avanzados para paridad exacta 1:1 con CRM web por tipo.

## Fase 5 - Paridad Formulario CRM (Siguiente)
- [ ] Completar campos avanzados por tipo con selects reales de catalogos (tipologia, orientacion, etc.).
- [ ] Confirmar persistencia backend API de portada/galeria/video (`cover_image`, `more_images[]`, `video`) y cerrar ajustes.
- [x] Acciones de card en listado: publicar/inactivar y eliminar.
- [ ] Accion editar conectada end-to-end desde cards/detalle.
- [ ] QA funcional admin/no-admin end-to-end.
- [ ] QA visual mobile de secciones (espaciado, labels y orden final).
