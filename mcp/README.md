# MCP Tools

Este directorio contiene conectores MCP y configuraciones para extender capacidades del asistente en este proyecto.

Nota operativa:
- El deploy del backend CRM en Dokploy es automatico al hacer `push` a `main` en `kconecta-crm`.
- En flujo normal no se solicita redeploy manual; solo se verifican endpoints y health-check post-push.
- Para orquestacion local de modelos (ahorro de tokens), usar wrapper:
- `tools/deepseek/ds.ps1`
- Salidas de apoyo de cada iteracion en `tmp/`.
