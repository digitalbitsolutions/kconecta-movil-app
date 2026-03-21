# Plan De Orquestacion IA (Ahorro De Tokens)

Este plan define el flujo de trabajo con modelos locales para reducir costo de tokens.

## Estado De Sincronizacion (2026-03-21)
- Workspace principal activo: `C:\MeegDev\kconecta-app-movil`.
- CRM web de referencia (solo consulta): `C:\MeegDev\kconecta-crm\web`.
- El flujo de alta movil ya replica la estructura funcional del CRM:
  - Paso 1: seleccion de tipo.
  - Paso 2: formulario dinamico por tipo.
  - Imagenes: seleccion + WebP + upload.
- Pantalla modular activa para crear/editar:
  - `screens/property/EditPropertyScreen.tsx`
  - `app/(app)/properties/new/index.js` apunta a esa pantalla.
- Validacion tecnica reciente:
  - `npx expo export --platform web --output-dir tmp/web-build` OK.
- Siguiente bloque: cerrar paridad fina de campos/catalogos y QA visual final de edicion.

## Objetivo
- Usar modelos locales para planificacion, generacion de cambios y review.
- Mantener prompts cortos y contexto minimo.
- Dejar a Codex la integracion final en repositorio y validaciones.

## Reparto De Roles
- Gemma (`gemma3:4b`): plan corto y review rapido.
- DeepSeek (`deepseek-coder-v2:16b`): patch y cambios de codigo.
- Codex: aplicar cambios reales, ejecutar validaciones, commit y push.

## Flujo Estandar
1. Definir una sola tarea por iteracion.
2. Enviar a Gemma un plan en 5-6 pasos maximo.
3. Enviar a DeepSeek patch concreto sobre archivos puntuales.
4. Integrar en repo y validar.
5. Commit pequeno y trazable.

## Regla De Contexto Minimo
- Incluir solo archivos necesarios por tarea.
- Evitar logs largos.
- Preferir salida en formato patch.

## Wrapper Local
- Script: `tools/deepseek/ds.ps1`
- Alias:
  - `dscode` -> DeepSeek
  - `dsplan` -> Gemma plan
  - `dsreview` -> Gemma review

## Estado Backend
- API objetivo: `https://www.kconecta.com/api`
- Endpoints base usados:
  - `POST /login`
  - `GET /me`
  - `GET /agent/properties`
  - `POST /agent/properties`
  - `PATCH /agent/properties/{id}`
  - `DELETE /agent/properties/{id}`

## Proxima Iteracion
- Objetivo: completar paridad de formulario por tipo (catalogos/selects y reglas) y editar propiedad.
- Reparto sugerido:
  - Gemma: checklist de campos faltantes por tipo (comparando `form_*.blade.php` vs app actual).
  - DeepSeek: patch de UI/estado para campos faltantes y mapeo de payload.
  - DeepSeek: patch de afinado visual/UX en secciones (margen, labels, orden).
  - Codex: integracion final, pruebas, commit y push.
