# Incidencia Backend - `GET /api/agent/services/profile` devuelve 500

## Resumen
En la app nativa (módulo Proveedor de servicios), la carga del perfil comercial depende del endpoint:

- `GET /api/agent/services/profile`

Actualmente ese endpoint está fallando con `HTTP 500` para usuario autenticado QA, por lo que la app muestra aviso de degradación controlada y usa fallback desde `/me` + `services`.

## Fecha y contexto
- Detectado durante QA móvil: **18-05-2026**.
- Entorno: Producción (`https://kconecta.com/api`).
- Cliente: App nativa Expo/React Native.

## Síntoma observado en app
- Banner en sección `Servicios`:
  - "No se pudo cargar el perfil comercial completo. Mostrando datos disponibles."
- La pantalla sigue funcionando con datos parciales (fallback), pero faltan campos específicos del perfil comercial.

## Endpoint afectado
- `GET /api/agent/services/profile`

## Impacto funcional
1. `Servicios ofrecidos` puede salir vacío o incompleto.
2. Algunos campos del bloque de perfil comercial no llegan desde la fuente principal.
3. UX degradada (warning visible), aunque no bloqueante.

## Comportamiento esperado
El endpoint debe responder `200` con payload consistente para proveedor autenticado.

## Contrato mínimo esperado (respuesta)
```json
{
  "success": true,
  "data": {
    "company_name": "Reformas Buele",
    "description": "Reformas en general",
    "phone": "653252923",
    "page_url": "https://...",
    "address": "Carrer de la Riera d'Horta, 52...",
    "city": "Barcelona",
    "province": "Barcelona",
    "country": "España",
    "latitude": "41.XXXX",
    "longitude": "2.XXXX",
    "cover_image_url": "https://...",
    "updated_at": "2026-05-18T19:24:06.000000Z",
    "services": [
      { "id": 1, "name": "Albañilería" },
      { "id": 2, "name": "Carpintería" }
    ]
  },
  "message": "OK"
}
```

## Hipótesis técnicas a revisar en backend
1. Nulos no manejados en relaciones del proveedor (`services`, media, ubicación, contacto).
2. Error de serialización/transformer cuando faltan campos opcionales.
3. Consulta Eloquent con eager loading de relación inexistente o soft-deleted.
4. Accessor/mutator que asume valor no nulo.
5. Regresión reciente en controller/resource del módulo servicios.

## Evidencia mínima a capturar en backend
1. Stacktrace exacto de Laravel para request autenticado a `/api/agent/services/profile`.
2. SQL query fallida (si aplica).
3. `user_id` y `user_level_id` de la cuenta QA usada en la prueba.

## Criterio de cierre
1. `GET /api/agent/services/profile` responde `200` con payload válido.
2. La app deja de mostrar el banner amarillo de degradación.
3. `Servicios ofrecidos` y bloques de perfil salen con datos completos sin fallback.
