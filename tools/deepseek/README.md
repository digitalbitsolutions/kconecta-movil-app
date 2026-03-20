# DeepSeek Wrapper (PowerShell)

Wrapper minimo para reutilizar prompts con un solo comando sobre `ollama`.

## Requisitos

- `ollama` instalado y en PATH.
- Modelo disponible (por defecto: `deepseek-coder-v2:16b`).

## Uso rapido

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\deepseek\ds.ps1 -Mode plan -Task "Definir cambios para dashboard admin" -Files "app\(app)\index.js","api\client.js"
```

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\deepseek\ds.ps1 -Mode patch -Task "Agregar filtro por rol admin" -Files "app\(app)\index.js" -OutputFile ".\tmp\deepseek_patch.txt"
```

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\deepseek\ds.ps1 -Mode review -Task "Revisar regresiones de autenticacion" -Files "api\client.js","app\login.js"
```

## Modos

- `plan`: plan de implementacion corto.
- `patch`: propuesta de diff + checklist.
- `review`: hallazgos de code review.
- `custom`: usa `-Task` tal cual con contexto de archivos.

## Notas

- Las plantillas estan en `tools/deepseek/prompts`.
- El contexto de archivos se recorta automaticamente para ahorrar tokens.
- El wrapper usa la API local de Ollama (`http://127.0.0.1:11434`) para evitar ruido ANSI en consola.
