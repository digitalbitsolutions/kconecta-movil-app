# Instrucciones Del Agente

Reglas operativas para desarrollo de la app movil KConecta.

## Entorno
- Shell oficial: PowerShell.
- Para rutas con parentesis usar comillas simples.
- Evitar comandos multilinea fragiles en consolas remotas.

## Alcance Funcional Activo
- Solo modulo de inmuebles.
- Servicios fuera de alcance en esta etapa.
- Blog fuera de alcance en esta etapa.
- Estado actual: alta/edicion de propiedades en app con formulario mobile-first modular.
- Proximo hito: cerrar paridad fina con CRM web (catalogos reales + validaciones por tipo).

## Fuente De Verdad De Logica
- La logica de roles/vistas se replica desde:
- `C:\MeegDev\kconecta-crm\web`

## Orquestacion IA
- Gemma: plan corto, review rapido y checklist.
- DeepSeek: propuesta de patch/codigo.
- Codex: integracion real en repo, pruebas, commit/push.
- Evidencia de proceso: salidas de apoyo local en `tmp/` (plan DeepSeek/Gemma por iteracion).

## Deploy CRM
- El backend CRM (`kconecta-crm`) en Dokploy tiene deploy automatico tras `push` a `main`.
- Flujo esperado: `commit + push` y luego solo verificar salud/endpoints.
- No pedir redeploy manual salvo que fallen health-checks o rutas despues del push.

## Estructura UI Activa
- Pantalla principal de crear/editar propiedad centralizada en:
- `screens/property/EditPropertyScreen.tsx`
- Entry route:
- `app/(app)/properties/new/index.js`
- Componentes reutilizables:
- `components/ui/*`
- `components/form/*`
