# PRD - Modulo Proveedores de Servicios (App Nativa)

## Objetivo de Producto
La app nativa debe gestionar el modulo de **Proveedores de servicios** del CRM Kconecta de punta a punta, consumiendo backend online de produccion.

## Alcance Actual
- Autenticacion por API ya operativa.
- Dashboard y gestion de inmuebles ya avanzados.
- Hardening de sesion y widget de leads ya incorporados.

## Nuevo Frente Prioritario
Implementar onboarding nativo para registro exclusivo de proveedores.

## Requisitos Funcionales (Registro)
1. El alta en app nativa debe ser solo para `Proveedor de servicios`.
2. La app no debe permitir seleccionar tipo de usuario en registro.
3. Campos de registro en app:
   - `company_name` (opcional)
   - `first_name` (opcional)
   - `last_name` (opcional)
   - `phone` (opcional)
   - `landline_phone` (opcional)
   - `email` (obligatorio)
   - `password` (obligatorio)
   - `password_confirmation` (obligatorio)
4. Tras registro exitoso:
   - guardar token,
   - cargar usuario,
   - entrar al area autenticada.

## Contrato Backend Objetivo
- Endpoint esperado: `POST /api/mobile/register-provider`.
- Regla obligatoria server-side: forzar `user_level_id = 4`.
- No confiar en `user_level_id` enviado por cliente.
- Respuesta esperada: `token` o `access_token`, `user`, `message`.

## Estado Produccion Verificado (2026-05-18)
- `GET /register`: disponible y activo.
- `GET /api/register`: `404` (sin endpoint API publico de registro actualmente).

## Criterios de Aceptacion
1. Usuario puede registrarse desde app nativa sin salir a web.
2. Todo usuario creado por este flujo queda con `user_level_id = 4`.
3. La app entra autenticada automaticamente tras registro correcto.
4. Errores de validacion y rate limit muestran mensajes claros en UI.

## No Objetivos (de este frente)
- Registro de agente inmobiliario o cliente final en app nativa.
- Onboarding multirole.
- Refactor visual mayor fuera de flujo de registro/login.
