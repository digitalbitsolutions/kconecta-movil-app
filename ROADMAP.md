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

## Fase 7 - Hardening Post-QA (Completado)
// Agent: Gemma
- [x] Endurecer visibilidad UI por rol en shell, detalle y preview.
- [x] Alinear shell (`BackofficeNavShell`), layouts y pantallas base con tokens centrales.
- [x] Reducir hardcodes en Dashboard, Usuarios, Perfil y Cards de inmuebles.
- [x] Bateria de tests unitarios (36 passed) para helpers en `/components/`.
- [x] Marcaje de componentes refactorizados con marcas `// DONE (Codex)`.

## Fase 8 - Gesti贸n de Leads y Seguimiento (Completado)
// Agent: Gemma
- [x] Implementar listado de Prospectos/Leads vinculados a inmuebles (Endpoint API CRM).
- [x] Integrar acciones rapidas de contacto (WhatsApp/Llamada) desde la ficha de detalle.
- [x] Visualizar historial de actividad de contactos por propiedad.
- [x] Mejorar el Dashboard con un widget de "Leads Recientes" modular.

## Fase 9 - Gesti贸n de Media Avanzada (Completado)
// Agent: Gemma (Architect)
- [x] Refactor del selector de im谩genes para permitir selecci贸n m煤ltiple.
- [x] Implementaci贸n de **Async Preview & Upload Queue** (carga as铆ncrona).
- [x] Soporte nativo para **Reordenaci贸n de Galer铆a** con persistencia en CRM.
- [x] L贸gica de **Borrado Remoto Instant谩neo** y sincronizaci贸n de IDs.
- [x] Guarda de seguridad `hasActiveUploads` para evitar estados inconsistentes (Auditada por Mistral).

## Fase 10 - Refactoring y Hardening Modular (Abierta)
// Agent: Gemma (Architect) - FOCO: Frontend Nativo (CRM Legado es solo lectura)
- [x] Refactor de `Step2Media.tsx` en sub-componentes (Completado).
- [x] Implementar Slider Horizontal para Galer铆as (Qwen).
- [x] Integrar Gradientes y Sombras Premium (DeepSeek).
- [x] Fix: Confirmaci贸n de borrado universal (Web/Mobile) (DeepSeek).
- [ ] Auditor铆a de seguridad del mapeo de datos en Perfil (CLIENT-SIDE) (Mistral).
- [ ] Implementar sistema de temas: Modo Oscuro / Claro inicial (Qwen).

## Fase 11 - Onboarding Nativo Proveedor (Abierta)
// Agent: Codex - FOCO: Registro nativo exclusivo para proveedor de servicios
- [x] Auditoria online de registro web productivo (`GET /register`) completada.
  - Confirmado en produccion: opciones de tipo de usuario incluyen `4=Proveedor`, `5=Agente`, `6=Cliente final`.
  - Confirmado en produccion: endpoint `POST /api/register` no disponible (`404` al consultar `GET /api/register`).
- [ ] Definir contrato backend para `POST /api/mobile/register-provider` (forzando `user_level_id=4` server-side).
- [ ] Implementar endpoint backend con validaciones, rate limit y respuesta con token.
- [x] Implementar pantalla nativa `register` (solo proveedor) y consumo de API.
- [x] Integrar CTA desde login hacia registro y autologin post-registro.
- [ ] QA E2E en produccion controlada con cuentas de prueba y limpieza operativa.

## Fase 12 - Infraestructura Local Android (Completado)
- [x] Fix: Bloqueo de toolchain Gradle (`IBM_SEMERU`) resuelto con Gradle 8.13.
- [x] Fix: Error de descarga de bundle remoto en Expo Go resuelto mediante configuracion en `app.json`.
- [x] Setup: Entorno Java estabilizado con JDK 21.

## Actualizacion UI Servicios (2026-05-20)
- [x] Hero superior con overlay corporativo y chip 'kconecta'.
- [x] Reorden de cards: 'Descripcion' antes de 'Servicios ofrecidos'.
- [x] Iconografia en cards/chips y boton de editar en Descripcion.
- [x] Rediseno de nav inferior estilo pill manteniendo paleta corporativa.
- [x] Ajustes de densidad/espaciado de chips para reducir aire lateral.
- [x] Correccion de textos ES/UTF-8 visibles en Servicios.

## Actualizacion Perfil Proveedor Mobile (2026-05-21)
- [x] Redise駉 integral de Mi perfil mobile-first inspirado en CRM web (estructura editable + preview).
- [x] Integraci髇 frontend con contrato can髇ico de logo proveedor (provider_logo_url / provider_logo_path).
- [x] Subida de logo alineada a backend (provider_logo) con compat legacy temporal.
- [x] Resoluci髇 de logo correcta en card de perfil (sin usar portada de servicios).
- [x] Ajuste visual final de logo en card (contain + altura optimizada).

## Soporte Expo Go Local (2026-05-21)
- [x] Diagnostico de conflicto de puerto: 8081 ocupado por proceso node (PID 17872).
- [x] Arranque limpio de Metro con npx expo start --clear en Expo Go.
- [x] Validacion funcional en emulador Android: dashboard carga correctamente y contador de servicios consistente.

- [x] Nota operativa: fue necesario reiniciar el PC para que Expo Go aplicara correctamente los cambios del conteo de servicios.

## Perfil Proveedor - Estabilidad Final (2026-05-21)
- [x] Corregido error de sintaxis en `app/(app)/profile/index.js` (`Unexpected token`) por cierre incompleto del componente/estilos.
- [x] Restaurado bloque `StyleSheet.create(...)` y estructura JSX final para compilacion estable en Expo Go.
- [x] Corregidos textos visibles en espanol (UTF-8) en Mi perfil: Direccion, Numero, Razon, contrasena, sesion.
- [x] Modal de tipo de documento validado visualmente en emulador Android.
