# KConecta Mobile App

Aplicacion movil (Expo + React Native) para consumir el backend del CRM de KConecta.

Estado actual del alcance funcional:
- Solo modulo de inmuebles.
- Login funcional con backend de produccion.
- Dashboard admin de inmuebles funcional.
- Servicios y Blog fuera de alcance por ahora.

## API y autenticacion

- API principal: `https://www.kconecta.com/api`
- Fallback web automatico: `www` -> raiz -> `api.kconecta.com`
- Auth: token Bearer (Sanctum)
- Persistencia de token:
  - Web: `localStorage`
  - Nativo: `expo-secure-store`

## Stack tecnico

- Frontend: Expo Router + React Native + React Native Web
- Estado global: Zustand
- Cliente HTTP: Axios con interceptores y manejo uniforme de errores

## Estado actual implementado

- Login y carga de sesion
- Obtencion de `me` y propiedades
- Dashboard admin inspirado en CRM web (solo inmuebles)
- Refresh de datos desde app
- Navegacion a detalle de propiedad (estructura base)

## Siguiente etapa

- Navegacion principal:
  - Dashboard
  - Mis propiedades
  - Usuarios
  - Mi perfil
- Sin Servicios
- Sin Blog
