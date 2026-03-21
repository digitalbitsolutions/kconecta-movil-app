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
- [x] Implementar accion publicar/inactivar desde app.
- [x] Implementar eliminacion de propiedad desde app.
- [x] Implementar pipeline frontend de imagenes (seleccion + conversion WebP + upload multipart).
- [ ] Verificar persistencia de imagenes en backend (`cover_image` y `more_images[]`) y ajustar API si aplica.
- [ ] Verificar persistencia de video en backend (`video`) y ajustar API si aplica.
- [ ] Completar campos avanzados por tipo con catalogos reales (selects) en lugar de IDs manuales.
- [ ] Validacion manual E2E admin y no-admin para CRUD de inmuebles.
- [ ] QA de layout mobile de la edicion (comparativa visual final contra CRM web).

## Restricciones Activas
- [x] Solo inmuebles en esta etapa.
- [x] Excluir Servicios.
- [x] Excluir Blog.

## Notas Operativas
- [x] Deploy del CRM en Dokploy es automatico tras `push` a `main`.
- [ ] Usar redeploy manual solo si health-check o endpoints fallan post-push.
- [x] Workspace activo para desarrollo movil: `C:\MeegDev\kconecta-app-movil`.
- [x] CRM web (`C:\MeegDev\kconecta-crm\web`) queda como referencia funcional de logica/vistas.
