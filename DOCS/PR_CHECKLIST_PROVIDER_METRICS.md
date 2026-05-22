# [MOBILE][CRM] PR Checklist por fases - Integrar métricas reales de proveedor

## 1) Resumen
- Se integró lectura de métricas de proveedor en dashboard móvil.
- Se implementó tracking resiliente de visita y click de contacto (sin bloquear UX).
- Se añadió mapper tolerante a contratos mixtos (`data` y plano legacy) con defaults seguros.

## 2) Contrato final de endpoints

| Endpoint (candidatos) | Método | Payload | Response shape esperado | Campos usados UI | Auth |
|---|---|---|---|---|---|
| `/agent/services/metrics` (fallback: `/agent/provider/metrics`, `/agent/services/profile`, `/me`) | `GET` | N/A | `{ success, data }` o plano legacy | `visits`, `clicks`, `tickets` | Bearer |
| `/agent/services/register-visit` (fallback snake/híbrido) | `POST` | `{ service_id, provider_user_id, source }` | libre (no bloqueante) | N/A | Bearer |
| `/agent/services/register-contact-click` (fallback snake/híbrido) | `POST` | `{ service_id, provider_user_id, channel, source }` | libre (no bloqueante) | N/A | Bearer |

### Decisión de mapper para compatibilidad
- Mapper único: `mapProviderMetricsResponse(payload)`.
- Soporta:
  - `{ success, data: { ... } }`
  - `{ data: { ... } }`
  - respuesta plana legacy `{ visits_count, contact_clicks, work_codes_count, ... }`.
- Defaults estrictos:
  - `visits = 0`
  - `clicks = 0`
  - `tickets = 0`

## 3) Cambios por fase

### F0 - Descubrimiento de contrato real API
- [x] Confirmado que no existía cliente dedicado de métricas/tracking en `api/client.js`.
- [x] Confirmados endpoints candidatos y estrategia fallback para heterogeneidad de entorno.
- [x] Documentadas diferencias contrato esperado vs real (no estable único endpoint).

### F1 - Capa de datos (API client + mapper robusto)
- [x] `getProviderMetricsApi()` implementado.
- [x] `registerServiceVisitApi(...)` implementado.
- [x] `registerContactClickApi(...)` implementado.
- [x] Bearer token reutilizando interceptor global.
- [x] Mapper tolerante `{ success, data }` + plano legacy.
- [x] Defaults seguros para campos faltantes.
- [x] No crash en UI por errores: tracking con manejo silencioso + warnings debug.

### F2 - Dashboard proveedor (lectura real)
- [x] Reemplazo de métricas mock por `getProviderMetricsApi()` en dashboard proveedor.
- [x] Render real de:
  - Visitas al perfil
  - Clicks en contacto
  - Tickets de servicio
- [x] Fallback a `0` si falla API.
- [x] Sin cambios de layout estructural.

### F3 - Tracking visita a detalle
- [x] Tracking al abrir detalle con ids válidos.
- [x] Evita duplicados por re-render (`useRef` once-per-screen-session).
- [x] Tracking no bloquea navegación/render.
- [x] Error silencioso con `console.warn`.

### F4 - Tracking click contacto (WhatsApp)
- [x] En acción de contacto: tracking async no bloqueante y apertura posterior de deep link.
- [x] Si tracking falla, no bloquea apertura.
- [x] Si no hay `whatsappUrl`, fallback a email.

### F5 - Validación E2E + parity CRM web
- [ ] Pendiente validación manual en entorno real (staging/prod controlado).
- [ ] Pendiente evidencia antes/después de contadores.

## 4) Pruebas
- Unit tests nuevos:
  - `__tests__/providerMetrics.test.js`
    - shape `{ data }`
    - shape plano legacy
    - defaults en faltantes
    - payload inválido sin crash

## 5) Evidencia
- Evidencia funcional validada en emulador Android:
  - dashboard proveedor renderiza KPIs reales (visitas/clicks/tickets = `1/1/1`) tras ajustes de contrato y mapper.
- Pendiente adjuntar flujo completo E2E en PR final:
  - dashboard antes
  - visita detalle
  - click contacto
  - dashboard después

## 6) Riesgos y pendientes
- Riesgo: backend puede exponer variantes de endpoint no incluidas en candidatos.
  - Mitigación: fallback por lista de endpoints + mapper tolerante.
- Riesgo: payload tracking puede requerir campos adicionales.
  - Mitigación: llamadas no bloqueantes; UI no se rompe y queda log de diagnóstico.
- Pendiente F5: validación cruzada CRM web vs móvil con cuenta real de proveedor.

## Arquitectura aplicada (limpia y escalable)
- `api/client.js`: solo transporte HTTP y manejo de fallback de rutas.
- `utils/providerMetrics.js`: mapper puro y testeable del contrato de métricas.
- `services/providerMetricsService.js`: reglas de dominio:
  - cache local de métricas (web + nativo),
  - fallback API -> cache -> defaults,
  - generación de `event_id`/`idempotency_key`,
  - tracking resiliente con timeout corto y error no bloqueante.
- Pantallas (`dashboard`, `property detail`) consumen solo la capa de servicio.
