# KConecta Mobile App

Aplicación móvil nativa desarrollada con React Native (Expo) que emula el comportamiento del CRM de KConecta, con un enfoque inicial especializado en la gestión de propiedades e inmuebles.

## Objetivo del Proyecto

Desarrollar una herramienta ágil para agentes inmobiliarios que permita gestionar el ciclo de vida de las propiedades (listado, creación, edición) manteniendo la lógica de roles y niveles de acceso del CRM original.

## Arquitectura

- **Frontend**: React Native + Expo + Expo Router.
- **Estado Global**: Zustand (Auth y Data Stores).
- **Backend API**: Laravel 12 (Sanctum) desplegado en Dokploy (`api.kconecta.com`).
- **Autenticación**: Basada en tokens (Sanctum) con persistencia en SecureStore.

## Características Principales

- [x] Autenticación de agentes.
- [x] Listado de propiedades personalizadas por usuario.
- [ ] Creación y edición de inmuebles.
- [ ] Gestión de niveles de acceso (Free, Premium, Agent, Admin).
- [ ] Sincronización en tiempo real con el CRM.

## Estructura de Agente (Agentic Workflow)

Este proyecto utiliza una estructura diseñada para la colaboración con asistentes de IA:

- `mcp/`: Conectores y herramientas compartidas.
- `skills/`: Scripts y lógica especializada para tareas recurrentes.
- `.agent/`: Instrucciones y reglas específicas para el desarrollo del proyecto.
