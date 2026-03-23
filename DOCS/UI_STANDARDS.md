# Estándares de Interfaz y Rendimiento (UI/UX) 🛡️
// Agent: Gemma (Architect)

Este documento contiene las reglas de oro para el desarrollo de la App Móvil de KConecta. Todos los agentes deben validar sus propuestas contra este archivo.

## 1. Gestión de Imágenes 📸
Para minimizar los ciclos de renderizado y el consumo de memoria:
- **PROHIBIDO**: Implementar "Pinch-to-zoom", modales de ampliación o visualizadores de imagen a pantalla completa. Las imágenes se muestran tal cual están en su contenedor original.
- **MOTIVO**: Reducción de la carga en el hilo de UI y optimización de memoria en dispositivos de gama media/baja.

## 2. Layouts de Galería 🧊
- **ESTÁNDAR**: Las galerías de múltiples imágenes deben usar **Sliders Horizontales** (equivalente a `horizontal ScrollView` o CSS Snap Sliders).
- **PROHIBIDO**: Usar cuadrículas (`grids`) o listas verticales extensas para media.
- **MOTIVO**: Optimización de espacio vertical en el formulario y mejora de la ergonomía en el uso con una sola mano.

## 3. Optimización de Renderizado
- Mantener los componentes de imagen con tamaños fijos siempre que sea posible.
- Usar `resizeMode="cover"` para consistencia visual sin cálculos de ratio complejos.

---
*Ultima actualización: 2026-03-23 | Agent: Gemma*
