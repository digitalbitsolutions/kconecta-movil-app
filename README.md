# KConecta Mobile App

Aplicacion movil (Expo + React Native) que consume el backend del CRM de KConecta.

## Alcance funcional activo
- Solo modulo de inmuebles.
- Servicios fuera de alcance en esta etapa.
- Blog fuera de alcance en esta etapa.

## Backend y autenticacion
- API principal: `https://www.kconecta.com/api`
- Auth: token Bearer (Sanctum)
- Persistencia de token:
  - Web: `localStorage`
  - Nativo: `expo-secure-store`

## Estado actual (2026-03-21)
- Login estable en web y nativo.
- Navegacion backoffice implementada:
  - Dashboard
  - Propiedades / Mis propiedades (segun rol)
  - Usuarios
  - Mi perfil
- Dashboard admin enfocado en inmuebles.
- Listado de propiedades con filtros (buscar/estado/tipo/categoria).
- Flujo de alta/edicion centralizado en pantalla modular mobile-first:
  - `screens/property/EditPropertyScreen.tsx`
  - ruta: `/properties/new`
- Gestion de media en formulario:
  - portada
  - galeria
  - video (placeholder + seleccion + upload)
- Mapa embebido (fallback en web).
- Backend CRM ya expone:
  - `GET /api/agent/property-types`
  - CRUD en `api/agent/properties` (store/update/destroy)
- Nota de deploy CRM: Dokploy hace deploy automatico tras `push` a `main`.

## Siguiente etapa
- Igualar el formulario movil con el formulario real del CRM web.
- Extender campos por tipo de inmueble (paridad funcional).
- Validar persistencia final de media (`cover_image`, `more_images[]`, `video`) y ajustar payload fino.
- Completar catalogos/selects reales para campos avanzados.
- Cerrar QA visual/funcional final de editar propiedad.
