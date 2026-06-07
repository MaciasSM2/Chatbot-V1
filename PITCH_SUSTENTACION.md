# Fase Bonus 87 — Estructura del Discurso de Sustentación (10-Minute Master Pitch)

---

## ⏱️ Minuto 0–2: El Problema Logístico y el Enfoque de Negocio

**Qué decir:** *"El problema central de las empresas de transporte de carga terrestre en Colombia es la pérdida de prospectos debido a la alta latencia en la cotización de fletes y la rigidez de los canales de atención tradicionales. Desarrollamos una plataforma fullstack de marca blanca que automatiza el saludo, la captura de identidad y la liquidación de fletes bajo la normativa SICE-TAC directamente en WhatsApp, operando las 24 horas sin colgar las líneas de atención humana."*

**Qué mostrar:** Dashboard analítico Next.js (`/admin/inicio`) — gráficas de conversión y volumen neto movilizado.

---

## ⏱️ Minuto 2–5: Demostración de la FSM y el Motor SICE-TAC (El Núcleo)

**Qué decir:** *"Para garantizar un sistema determinista libre de las alucinaciones típicas de las IAs generativas convencionales, diseñamos una Máquina de Estados Finitos (FSM) polimórfica combinada con el patrón Strategy. El bot transiciona de forma segura por 7 estados conversacionales. Al llegar a la liquidación, el motor consulta un sistema de caché híbrido multinivel: resuelve en memoria RAM local en 0 milisegundos las rutas de alta frecuencia del Valle de Aburrá, y recurre de forma oportunista a Redis antes de estresar el disco de MariaDB."*

**Qué mostrar:** Simulador interactivo de chat en vivo + panel lateral `LiveDebugSidebar` — forzar escenario de día festivo, demostrar cálculo Ley Emiliani e inyección temática.

---

## ⏱️ Minuto 5–8: Infraestructura Cloud-Native y Blindaje Perimetral

**Qué decir:** *"El sistema fue concebido bajo el paradigma Cloud-Native. Todo el ecosistema opera como una caja negra empaquetada en una red bridge privada de Docker, protegida de forma perimetral por un proxy reverso Nginx. Saneamos la plataforma contra ataques de denegación de servicio e inyecciones de prompts mediante ventanas deslizantes distribuidas en Redis, y protegemos las identidades de los clientes aplicando cifrado transparente AES-256-GCM en el repositorio."*

**Qué mostrar:** Terminal ejecutando `orchestrate-production.sh` — pruebas de humo atómicas exitosas.

---

## ⏱️ Minuto 8–10: Resiliencia Avanzada y Cierre

**Qué decir:** *"Finalmente, el software es inmune a fallos de proveedores externos. Si la API de Meta se cae, nuestro Circuit Breaker estructural se abre en milisegundos, desviando los payloads a MariaDB mientras un demonio autónomo en background automatiza el reintento. Hemos construido una arquitectura de software cohesiva, desacoplada mediante un Bus de Eventos de Dominio y totalmente lista para escalar al mercado SaaS."*
