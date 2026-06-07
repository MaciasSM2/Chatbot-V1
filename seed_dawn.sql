-- Insertar plantillas para el nuevo periodo de Madrugada (1am - 6am)
INSERT INTO greeting_templates (id, day_type, time_period, category, text) VALUES
-- 1. Respuesta a Cliente Existente (Día de semana)
('greet-dawn-weekday-resp', 'WEEKDAY', 'EARLY_MORNING', 'RESPONSE', 
 '¡Hola{{name}}! 🌙 Te escribe el equipo de atención. En este momento estamos descansando, pero recibimos tu mensaje. Nuestra jornada inicia a las *6:00 a.m.* y serás nuestra prioridad. ¡Gracias por tu paciencia!'),

-- 2. Iniciación / Registro (Cliente Nuevo)
('greet-dawn-weekday-init-new', 'WEEKDAY', 'EARLY_MORNING', 'INITIATION', 
 '¡Muy pronto estaremos contigo! 👋 Notamos que nos escribes en la madrugada. A partir de las *6:00 a.m.* procesaremos tu solicitud de inmediato. ¿Podrías dejarnos tu nombre y cédula para adelantar tu registro?'),

-- 3. Respuesta en Fin de Semana (Madrugada)
('greet-dawn-weekend-resp', 'WEEKEND', 'EARLY_MORNING', 'RESPONSE', 
 '¡Hola{{name}}! 🌙 Estamos en horario de descanso de fin de semana. Recibimos tu consulta y a partir de las *6:00 a.m.* nuestro equipo de guardia la revisará. ¡Feliz madrugada!'),

-- 4. Mensaje de Continuidad (Si el usuario escribió hace tiempo)
('greet-dawn-cont', 'WEEKDAY', 'EARLY_MORNING', 'CONTINUITY', 
 'Hola de nuevo{{name}}. 🌙 Seguimos atentos a tu mensaje de hace {{time}}. Recuerda que a las *6:00 a.m.* reactivamos nuestra operación completa para ayudarte.')
ON DUPLICATE KEY UPDATE text = VALUES(text);
