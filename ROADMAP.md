# Roadmap de Desarrollo: KConecta Mobile App

## Fase 1: Cimentación e Infraestructura (Completado ✅)
- [x] Inicialización del proyecto Expo Router.
- [x] Configuración de Axios con Interceptors para Sanctum.
- [x] Sincronización del repositorio de producción (`kconecta-ag`).
- [x] Configuración de subdominio `api.kconecta.com` con SSL.

## Fase 2: Gestión de Propiedades y Roles (En Progreso 🏗️)
- [x] Listado básico de propiedades del agente.
- [ ] Detalle de propiedad (Vista extendida).
- [ ] Formulario de creación de propiedades (con subida de imágenes).
- [ ] Lógica de filtrado por estatus y tipo de inmueble.
- [ ] **Control de Acceso**: Validar `user_level_id` para restringir funciones según el plan del usuario.

## Fase 3: Integración y UX Premium (Pendiente)
- [ ] Implementación de diseño "Premium" (Gradients, micro-animaciones).
- [ ] Modo oscuro / Modo claro.
- [ ] Notificaciones Push para nuevas consultas de visitantes.
- [ ] Sincronización offline (Caché local).

## Fase 4: Despliegue y Beta Testing (Pendiente)
- [ ] Generación de builds de desarrollo (EAS Build).
- [ ] Pruebas con agentes reales.
- [ ] Publicación en App Store / Play Store.
