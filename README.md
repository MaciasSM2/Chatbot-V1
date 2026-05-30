# Documentación Técnica de la Arquitectura - WhatsApp Bot Pro

Para que el proyecto sea mantenible, aquí tienes el Mapa de Navegación del sistema:

## 🛠️ Tecnologías Core
- **Frontend**: Next.js 14 + Tailwind CSS + Zustand (Estado global).
- **Backend**: Node.js + TypeScript + Express + BullMQ (Colas de tareas).
- **Persistencia**: PostgreSQL (Datos históricos) + Redis (Sesiones y tareas temporales).

## 📐 Patrones de Diseño Aplicados
- **FSM (Finite State Machine)**: Controla el flujo de conversación (Bienvenida -> Registro -> Menú).
- **Feature Toggling**: Permite activar/desactivar módulos en caliente desde el panel.
- **Retry Strategy**: Reintentos exponenciales para fallos en la API de Meta.
- **Graceful Shutdown**: Cierre ordenado de conexiones para evitar corrupción de datos.

## 🚀 Guía de Inicio Rápido (Manual del Propietario)
Cualquier desarrollador que herede este proyecto solo necesita seguir estos tres pasos:

1. **Configurar Variables**: Crear un archivo `.env` basado en el `.env.example`.
2. **Lanzar el Sistema**: Ejecutar `docker-compose up -d --build`.
3. **Acceder**: 
   - **Dashboard**: `http://localhost:80`
   - **Documentación API**: `http://localhost:3000/docs`

---

## 🏁 Conclusión del Proyecto
Hemos construido una herramienta de clase mundial para el mercado de Colombia. El sistema es:

- **Resiliente**: No pierde mensajes ante caídas de red.
- **Auditable**: Registra cada cambio administrativo.
- **Modular**: Se puede expandir con nuevas funciones sin romper lo existente.
- **Humano**: Entiende festivos locales y adapta su lenguaje por género.

*Nota del Orquestador: Tu sistema de WhatsApp está ahora blindado y listo para procesar miles de clientes. Cada fase que completamos (desde la FSM hasta la rotación de claves JWT) ha sido diseñada para que duermas tranquilo mientras el bot trabaja.*
