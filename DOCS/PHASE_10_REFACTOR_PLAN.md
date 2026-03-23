# Fase 10 - Refactoring y Hardening Modular 🏗️
// Agent: Gemma (Architect)

## 1. Problema Actual
`Step2Media.tsx` ha superado las 250 líneas y maneja demasiadas responsabilidades (Galeria, Portada, Video, Validaciones, Sincronización). Esto dificulta futuras mejoras.

## 2. Propuesta de Descomposición (Target: Qwen)
Dividir `Step2Media.tsx` en los siguientes sub-componentes dentro de `components/property/form/media/`:

- `GallerySection`: Manejo de `more_images[]`, reorden y borrado.
- `CoverSection`: Manejo de `cover_image` y su sincronización.
- `VideoSection`: Gestión del video MP4.
- `MediaHeader`: Títulos y ayudas visuales.

## 3. Hoja de Ruta de los Agentes

1.  **Architect (Gemma-3)**: Definir la estructura de carpetas y props compartidas.
2.  **Refactor (Qwen-2.5)**: 
    - Extraer secciones de código a los nuevos archivos.
    - Asegurar que el `PropertyFormContext` siga siendo la fuente de la verdad.
3.  **Auditor (Mistral)**: 
    - Validar que no se rompa la guarda `hasActiveUploads` durante la refactorización.
    - Revisar consistencia de `serverId`.
4.  **Coder (DeepSeek)**: 
    - Integrar micro-animaciones en las transiciones de carga de cada sección.

---
**¿Damos luz verde a Qwen para empezar la extracción de componentes en Media?**
