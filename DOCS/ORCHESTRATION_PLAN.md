# Plan De Orquestacion IA (Ahorro De Tokens)

Este plan define el flujo de trabajo con modelos locales para reducir costo de tokens.

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
