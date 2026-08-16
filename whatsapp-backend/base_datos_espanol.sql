-- Base de datos para el ecosistema de Chatbot de WhatsApp en MariaDB/MySQL
-- Codificación UTF-8 tradicional compatible

-- 1. Sesiones de Chat (sesiones_chat)
CREATE TABLE IF NOT EXISTS sesiones_chat (
    usuario_id VARCHAR(50) PRIMARY KEY,
    paso_actual VARCHAR(50) NOT NULL,
    metadatos JSON DEFAULT NULL,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Clientes (clientes)
CREATE TABLE IF NOT EXISTS clientes (
    id VARCHAR(36) PRIMARY KEY,
    numero_telefono VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100),
    esta_registrado BOOLEAN DEFAULT FALSE,
    metadatos JSON DEFAULT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_clientes_telefono (numero_telefono)
);

-- 3. Plantillas de Saludos Dinámicos (plantillas_saludos)
CREATE TABLE IF NOT EXISTS plantillas_saludos (
    id VARCHAR(50) PRIMARY KEY,
    tipo_dia VARCHAR(30) NOT NULL, -- 'WEEKDAY', 'WEEKEND', 'SATURDAY_WORKABLE', etc.
    periodo_tiempo VARCHAR(15) NOT NULL, -- 'MORNING', 'AFTERNOON', 'NIGHT', 'EARLY_MORNING'
    texto TEXT NOT NULL,
    categoria VARCHAR(20) NOT NULL DEFAULT 'RESPONSE', -- 'RESPONSE' | 'INITIATION' | 'CONTINUITY'
    KEY idx_saludos_contexto (tipo_dia, periodo_tiempo)
);

-- 4. Configuraciones Especiales de Calendario (configuraciones_calendario)
CREATE TABLE IF NOT EXISTS configuraciones_calendario (
    fecha DATE PRIMARY KEY,
    tipo_dia VARCHAR(30) NOT NULL
);

-- 5. Configuraciones Globales (configuraciones_globales)
CREATE TABLE IF NOT EXISTS configuraciones_globales (
    clave VARCHAR(50) PRIMARY KEY,
    valor JSON NOT NULL,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Historial de Mensajes (mensajes)
CREATE TABLE IF NOT EXISTS mensajes (
    id VARCHAR(50) PRIMARY KEY,
    usuario_id VARCHAR(50) NOT NULL,
    remitente VARCHAR(10) NOT NULL, -- 'user' | 'bot'
    texto TEXT NOT NULL,
    estado VARCHAR(15) DEFAULT 'sent',
    marca_tiempo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_mensajes_usuario_tiempo (usuario_id, marca_tiempo DESC)
);

-- 7. Tabla de Configuración de Módulos (modulos_sistema)
CREATE TABLE IF NOT EXISTS modulos_sistema (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 8. Tabla de Auditoría y Trazabilidad (registros_auditoria)
CREATE TABLE IF NOT EXISTS registros_auditoria (
    id VARCHAR(36) PRIMARY KEY,
    modulo_id VARCHAR(50) NOT NULL,
    accion VARCHAR(20) NOT NULL, -- 'ACTIVATED' | 'DEACTIVATED'
    nombre_administrador VARCHAR(100) NOT NULL,
    estado_anterior BOOLEAN,
    estado_nuevo BOOLEAN,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (modulo_id) REFERENCES modulos_sistema(id),
    KEY idx_auditoria_fecha (creado_en DESC)
);

-- 9. Configuración de Franjas Horarias (configuraciones_franjas_horarias)
CREATE TABLE IF NOT EXISTS configuraciones_franjas_horarias (
    id VARCHAR(50) PRIMARY KEY, -- EARLY_MORNING, MORNING, etc.
    etiqueta VARCHAR(100) NOT NULL,
    hora_inicio INT NOT NULL,
    hora_fin INT NOT NULL,
    color VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================================
-- DATOS INICIALES (SEEDS)
-- =========================================================================

-- Plantillas de Saludos
INSERT INTO plantillas_saludos (id, tipo_dia, periodo_tiempo, texto, categoria) VALUES
('t1', 'WEEKDAY', 'MORNING', '¡Hola{{name}}! Gracias por escribirnos. Es un gusto saludarte. 👋 He recibido tu mensaje y estoy aquí para ayudarte de la mejor manera posible. Por favor, cuéntame un poco más sobre tu consulta para darte la solución ideal.', 'RESPONSE'),
('t2', 'WEEKDAY', 'AFTERNOON', '¡Hola{{name}}! Gracias por escribirnos. Es un gusto saludarte. 👋 He recibido tu mensaje y estoy aquí para ayudarte de la mejor manera posible. Por favor, cuéntame un poco más sobre tu consulta para darte la solución ideal.', 'RESPONSE'),
('t3', 'WEEKDAY', 'NIGHT', '¡Hola{{name}}! Gracias por escribirnos. Es un gusto saludarte. 👋 He recibido tu mensaje y estoy aquí para ayudarte de la mejor manera posible. Por favor, cuéntame un poco más sobre tu consulta para darte la solución ideal.', 'RESPONSE'),
('t4', 'WEEKEND', 'MORNING', '¡Hola{{name}}! Gracias por escribirnos. Es un gusto saludarte. 👋 He recibido tu mensaje y estoy aquí para ayudarte de la mejor manera posible. Por favor, cuéntame un poco más sobre tu consulta para darte la solución ideal.', 'RESPONSE'),
('t5', 'WEEKEND', 'AFTERNOON', '¡Hola{{name}}! Gracias por escribirnos. Es un gusto saludarte. 👋 He recibido tu mensaje y estoy aquí para ayudarte de la mejor manera posible. Por favor, cuéntame un poco más sobre tu consulta para darte la solución ideal.', 'RESPONSE'),
('t6', 'WEEKEND', 'NIGHT', '¡Hola{{name}}! Gracias por escribirnos. Es un gusto saludarte. 👋 He recibido tu mensaje y estoy aquí para ayudarte de la mejor manera posible. Por favor, cuéntame un poco más sobre tu consulta para darte la solución ideal.', 'RESPONSE'),
('t_init1', 'WEEKDAY', 'MORNING', '¡Hola{{name}}! Te escribe el equipo de atención. 🌟 Esperamos que estés teniendo un excelente día. Nos ponemos en contacto contigo para asistirte en lo que necesites o dar seguimiento a tu solicitud. ¿En qué podemos apoyarte hoy?', 'INITIATION'),
('t_init2', 'WEEKDAY', 'AFTERNOON', '¡Hola{{name}}! Te escribe el equipo de atención. 🌟 Esperamos que estés teniendo un excelente día. Nos ponemos en contacto contigo para asistirte en lo que necesites o dar seguimiento a tu solicitud. ¿En qué podemos apoyarte hoy?', 'INITIATION'),
('t_init3', 'WEEKDAY', 'NIGHT', '¡Hola{{name}}! Te escribe el equipo de atención. 🌟 Esperamos que estés teniendo un excelente día. Nos ponemos en contacto contigo para asistirte en lo que necesites o dar seguimiento a tu solicitud. ¿En qué podemos apoyarte hoy?', 'INITIATION'),
('t_cont1', 'WEEKDAY', 'MORNING', 'Hola de nuevo{{name}}. Noto que han pasado {{time}} desde nuestra última interacción y me gustaría saber si sigues ahí o si hay algo más en lo que pueda colaborar antes de cerrar este espacio de atención. ¡Sigo atento a ti! 😊', 'CONTINUITY'),
('t_cont2', 'WEEKDAY', 'AFTERNOON', 'Hola de nuevo{{name}}. Noto que han pasado {{time}} desde nuestra última interacción y me gustaría saber si sigues ahí o si hay algo más en lo que pueda colaborar antes de cerrar este espacio de atención. ¡Sigo atento a ti! 😊', 'CONTINUITY'),
('t_cont3', 'WEEKDAY', 'NIGHT', 'Hola de nuevo{{name}}. Noto que han pasado {{time}} desde nuestra última interacción y me gustaría saber si sigues ahí o si hay algo más en lo que pueda colaborar antes de cerrar este espacio de atención. ¡Sigo atento a ti! 😊', 'CONTINUITY'),
('t_holiday1', 'HOLIDAY_NON_WORKABLE', 'MORNING', '¡Hola! Hoy es día festivo no laborable, pero cuéntanos tu duda y te responderemos pronto.', 'RESPONSE'),
('t_holiday2', 'HOLIDAY_NON_WORKABLE', 'AFTERNOON', '¡Hola! Esperamos que disfrutes este festivo. Déjanos tu consulta y te responderemos pronto.', 'RESPONSE'),
('t_holiday3', 'HOLIDAY_NON_WORKABLE', 'NIGHT', '¡Buenas noches! En este día festivo nuestro equipo descansa, pero dinos en qué te apoyamos mañana.', 'RESPONSE'),
('t_init_new1', 'WEEKDAY', 'MORNING', '¡Hola! 👋 Te escribe el equipo de atención. Queremos brindarte la mejor experiencia, pero notamos que aún no estás en nuestros registros. Para empezar, ¿serías tan amable de indicarme tu nombre completo y tu número de identificación? Con esto podremos crear tu ficha de atención personalizada.', 'INITIATION'),
('t_init_new2', 'WEEKDAY', 'AFTERNOON', '¡Hola! 👋 Te escribe el equipo de atención. Queremos brindarte la mejor experiencia, pero notamos que aún no estás en nuestros registros. Para empezar, ¿serías tan amable de indicarme tu nombre completo y tu número de identificación? Con esto podremos crear tu ficha de atención personalizada.', 'INITIATION'),
('t_init_new3', 'WEEKDAY', 'NIGHT', '¡Hola! 👋 Te escribe el equipo de atención. Queremos brindarte la mejor experiencia, pero notamos que aún no estás en nuestros registros. Para empezar, ¿serías tan amable de indicarme tu nombre completo y tu número de identificación? Con esto podremos crear tu ficha de atención personalizada.', 'INITIATION'),
('t_resp_new1', 'WEEKDAY', 'MORNING', '¡Hola! Bienvenid[o/a]. 👋 Es un gusto saludarte. Veo que es la primera vez que nos escribes. Antes de continuar con tu solicitud, por favor ayúdame con tu nombre y número de cédula (o ID) para registrarte en nuestro sistema y darte una atención oficial. ¡Es solo un momento!', 'RESPONSE'),
('t_resp_new2', 'WEEKDAY', 'AFTERNOON', '¡Hola! Bienvenid[o/a]. 👋 Es un gusto saludarte. Veo que es la primera vez que nos escribes. Antes de continuar con tu solicitud, por favor ayúdame con tu nombre y número de cédula (o ID) para registrarte en nuestro sistema y darte una atención oficial. ¡Es solo un momento!', 'RESPONSE'),
('t_resp_new3', 'WEEKDAY', 'NIGHT', '¡Hola! Bienvenid[o/a]. 👋 Es un gusto saludarte. Veo que es la primera vez que nos escribes. Antes de continuar con tu solicitud, por favor ayúdame con tu nombre y número de cédula (o ID) para registrarte en nuestro sistema y darte una atención oficial. ¡Es solo un momento!', 'RESPONSE'),
('t_init_new_we1', 'WEEKEND', 'MORNING', '¡Hola! 👋 Te escribe el equipo de atención. Queremos brindarte la mejor experiencia, pero notamos que aún no estás en nuestros registros. Para empezar, ¿serías tan amable de indicarme tu nombre completo y tu número de identificación? Con esto podremos crear tu ficha de atención personalizada.', 'INITIATION'),
('t_init_new_we2', 'WEEKEND', 'AFTERNOON', '¡Hola! 👋 Te escribe el equipo de atención. Queremos brindarte la mejor experiencia, pero notamos que aún no estás en nuestros registros. Para empezar, ¿serías tan amable de indicarme tu nombre completo y tu número de identificación? Con esto podremos crear tu ficha de atención personalizada.', 'INITIATION'),
('t_init_new_we3', 'WEEKEND', 'NIGHT', '¡Hola! 👋 Te escribe el equipo de atención. Queremos brindarte la mejor experiencia, pero notamos que aún no estás en nuestros registros. Para empezar, ¿serías tan amable de indicarme tu nombre completo y tu número de identificación? Con esto podremos crear tu ficha de atención personalizada.', 'INITIATION'),
('t_resp_new_we1', 'WEEKEND', 'MORNING', '¡Hola! Bienvenid[o/a]. 👋 Es un gusto saludarte. Veo que es la primera vez que nos escribes. Antes de continuar con tu solicitud, por favor ayúdame con tu nombre y número de cédula (o ID) para registrarte en nuestro sistema y darte una atención oficial. ¡Es solo un momento!', 'RESPONSE'),
('t_resp_new_we2', 'WEEKEND', 'AFTERNOON', '¡Hola! Bienvenid[o/a]. 👋 Es un gusto saludarte. Veo que es la primera vez que nos escribes. Antes de continuar con tu solicitud, por favor ayúdame con tu nombre y número de cédula (o ID) para registrarte en nuestro sistema y darte una atención oficial. ¡Es solo un momento!', 'RESPONSE'),
('t_resp_new_we3', 'WEEKEND', 'NIGHT', '¡Hola! Bienvenid[o/a]. 👋 Es un gusto saludarte. Veo que es la primera vez que nos escribes. Antes de continuar con tu solicitud, por favor ayúdame con tu nombre y número de cédula (o ID) para registrarte en nuestro sistema y darte una atención oficial. ¡Es solo un momento!', 'RESPONSE'),
('t_absence_exist_we', 'WEEKEND', 'MORNING', '¡Hola{{name}}! 👋 Te saludamos con gusto. Te pedimos una sincera disculpa, pero hoy es un día no laborable en nuestro equipo. 🏠 Hemos recibido tu mensaje y, como ya eres parte de nuestra comunidad, le daremos prioridad a tu consulta el próximo día hábil a primera hora. ¡Gracias por tu comprensión!', 'RESPONSE'),
('t_absence_new_we', 'WEEKEND', 'MORNING', '¡Bienvenid[o/a]! 👋 Gracias por escribirnos. Nos disculpamos por no poder atenderte de inmediato, ya que hoy no nos encontramos laborando. Para que podamos ayudarte más rápido en nuestra apertura, ¿podrías indicarnos tu nombre y número de ID? Así te registraremos y serás de los primeros en ser contactado. 📋', 'RESPONSE'),
('t_absence_exist_hol', 'HOLIDAY_NON_WORKABLE', 'MORNING', '¡Hola{{name}}! 👋 Te saludamos con gusto. Te pedimos una sincera disculpa, pero hoy es un día no laborable en nuestro equipo. 🏠 Hemos recibido tu mensaje y, como ya eres parte de nuestra comunidad, le daremos prioridad a tu consulta el próximo día hábil a primera hora. ¡Gracias por tu comprensión!', 'RESPONSE'),
('t_absence_new_hol', 'HOLIDAY_NON_WORKABLE', 'MORNING', '¡Bienvenid[o/a]! 👋 Gracias por escribirnos. Nos disculpamos por no poder atenderte de inmediato, ya que hoy no nos encontramos laborando. Para que podamos ayudarte más rápido en nuestra apertura, ¿podrías indicarnos tu nombre y número de ID? Así te registraremos y serás de los primeros en ser contactado. 📋', 'RESPONSE'),
('t_absence_exist_sun', 'SUNDAY_WORKABLE', 'MORNING', '¡Hola{{name}}! Qué gusto saludarte en este domingo. 👋 He recibido tu mensaje y estoy listo para ayudarte de la mejor manera. ¿En qué puedo apoyarte hoy?', 'RESPONSE'),
('t_absence_new_sun', 'SUNDAY_WORKABLE', 'MORNING', '¡Bienvenid[o/a]! 👋 Qué alegría saludarte este domingo. Veo que es tu primera vez aquí. Por favor, indícanos tu nombre y número de identificación para registrarte y darte la mejor atención de inmediato.', 'RESPONSE'),
('t_welcome_exist_sun_aft', 'SUNDAY_WORKABLE', 'AFTERNOON', '¡Hola{{name}}! Buenas tardes en este domingo. 👋 Estoy disponible para ayudarte con cualquier consulta. Cuéntame, ¿en qué te puedo apoyar?', 'RESPONSE'),
('t_welcome_new_sun_aft', 'SUNDAY_WORKABLE', 'AFTERNOON', '¡Bienvenid[o/a]! 👋 Buenas tardes de domingo. Es un placer saludarte. Por favor, compártenos tu nombre e identificación para crear tu perfil y atender tu caso.', 'RESPONSE'),
('t_welcome_exist_sun_nit', 'SUNDAY_WORKABLE', 'NIGHT', '¡Hola{{name}}! Feliz noche de domingo. 👋 Gracias por escribirnos. Cuéntame en qué puedo colaborar antes de terminar el día.', 'RESPONSE'),
('t_welcome_new_sun_nit', 'SUNDAY_WORKABLE', 'NIGHT', '¡Bienvenid[o/a]! 👋 Feliz noche de domingo. Para registrarte en nuestro sistema, por favor facilítanos tu nombre e ID. ¡Será un placer atenderte!', 'RESPONSE'),
('t_init_sun_morn', 'SUNDAY_WORKABLE', 'MORNING', '¡Hola{{name}}! Te escribe el equipo de atención en este domingo. 🌟 Esperamos que tengas un gran día. Nos ponemos en contacto contigo para dar seguimiento a tu solicitud. ¿En qué podemos apoyarte hoy?', 'INITIATION'),
('t_init_sun_aft', 'SUNDAY_WORKABLE', 'AFTERNOON', '¡Hola{{name}}! Te escribe el equipo de atención este domingo por la tarde. 🌟 Esperamos que estés muy bien. ¿En qué podemos colaborarte hoy?', 'INITIATION'),
('t_init_sun_nit', 'SUNDAY_WORKABLE', 'NIGHT', '¡Hola{{name}}! Te escribe el equipo de atención este domingo por la noche. 🌟 Esperamos que estés muy bien. ¿En qué podemos colaborarte hoy?', 'INITIATION'),
('t_cont_sun_morn', 'SUNDAY_WORKABLE', 'MORNING', 'Hola de nuevo{{name}}. Noto que han pasado {{time}} desde nuestra última interacción este domingo y me gustaría saber si sigues ahí o si hay algo más en lo que pueda colaborar. ¡Sigo atento! 😊', 'CONTINUITY'),
('t_cont_sun_aft', 'SUNDAY_WORKABLE', 'AFTERNOON', 'Hola de nuevo{{name}}. Noto que han pasado {{time}} desde nuestra última interacción este domingo por la tarde y me gustaría saber si sigues ahí. ¡Sigo atento! 😊', 'CONTINUITY'),
('t_cont_sun_nit', 'SUNDAY_WORKABLE', 'NIGHT', 'Hola de nuevo{{name}}. Noto que han pasado {{time}} desde nuestra última interacción esta noche de domingo y me gustaría saber si sigues ahí. ¡Sigo atento! 😊', 'CONTINUITY'),
('t_welcome_exist_sat_morn', 'SATURDAY_WORKABLE', 'MORNING', '¡Hola{{name}}! Feliz sábado por la mañana. 👋 He recibido tu mensaje y estoy listo para ayudarte. ¿En qué puedo colaborarte hoy?', 'RESPONSE'),
('t_welcome_new_sat_morn', 'SATURDAY_WORKABLE', 'MORNING', '¡Bienvenid[o/a]! 👋 Excelente sábado para ti. Veo que aún no estás registrado. Por favor, indícanos tu nombre y número de cédula o ID para registrarte y ayudarte de inmediato.', 'RESPONSE'),
('t_welcome_exist_sat_aft', 'SATURDAY_WORKABLE', 'AFTERNOON', '¡Hola{{name}}! Buenas tardes de sábado. 👋 ¿Cómo va tu fin de semana? Cuéntame en qué puedo ayudarte hoy.', 'RESPONSE'),
('t_welcome_new_sat_aft', 'SATURDAY_WORKABLE', 'AFTERNOON', '¡Bienvenid[o/a]! 👋 Qué gusto que nos escribas este sábado por la tarde. Ayúdanos con tu nombre e ID para registrarte y darte soporte.', 'RESPONSE'),
('t_welcome_exist_sat_nit', 'SATURDAY_WORKABLE', 'NIGHT', '¡Hola{{name}}! Feliz noche de sábado. 👋 Espero que estés muy bien. Dime, ¿en qué te puedo asistir esta noche?', 'RESPONSE'),
('t_welcome_new_sat_nit', 'SATURDAY_WORKABLE', 'NIGHT', '¡Bienvenid[o/a]! 👋 Linda noche de sábado. Para darte la mejor atención, por favor regálanos tu nombre y número de ID para tu ficha.', 'RESPONSE'),
('t_init_sat_morn', 'SATURDAY_WORKABLE', 'MORNING', '¡Hola{{name}}! Te escribe el equipo de atención en este sábado. 🌟 Esperamos que tengas un gran fin de semana. ¿En qué podemos apoyarte hoy?', 'INITIATION'),
('t_init_sat_aft', 'SATURDAY_WORKABLE', 'AFTERNOON', '¡Hola{{name}}! Te escribe el equipo de atención este sábado por la tarde. 🌟 ¿En qué podemos colaborarte hoy?', 'INITIATION'),
('t_init_sat_nit', 'SATURDAY_WORKABLE', 'NIGHT', '¡Hola{{name}}! Te escribe el equipo de atención este sábado por la noche. 🌟 ¿En qué podemos colaborarte hoy?', 'INITIATION'),
('t_cont_sat_morn', 'SATURDAY_WORKABLE', 'MORNING', 'Hola de nuevo{{name}}. Noto que han pasado {{time}} desde nuestra última interacción este sábado y me gustaría saber si sigues ahí. ¡Sigo atento! 😊', 'CONTINUITY'),
('t_cont_sat_aft', 'SATURDAY_WORKABLE', 'AFTERNOON', 'Hola de nuevo{{name}}. Noto que han pasado {{time}} desde nuestra última interacción este sábado por la tarde y me gustaría saber si sigues ahí. ¡Sigo atento! 😊', 'CONTINUITY'),
('t_cont_sat_nit', 'SATURDAY_WORKABLE', 'NIGHT', 'Hola de nuevo{{name}}. Noto que han pasado {{time}} desde nuestra última interacción esta noche de sábado y me gustaría saber si sigues ahí. ¡Sigo atento! 😊', 'CONTINUITY'),
('greet-dawn-weekday-resp', 'WEEKDAY', 'EARLY_MORNING', '¡Hola{{name}}! 🌙 Te escribe el equipo de atención. En este momento estamos descansando, pero recibimos tu mensaje. Nuestra jornada inicia a las *6:00 a.m.* y serás nuestra prioridad. ¡Gracias por tu paciencia!', 'RESPONSE'),
('greet-dawn-weekday-init-new', 'WEEKDAY', 'EARLY_MORNING', '¡Muy pronto estaremos contigo! 👋 Notamos que nos escribes en la madrugada. A partir de las *6:00 a.m.* procesaremos tu solicitud de inmediato. ¿Podrías dejarnos tu nombre y cédula para adelantar tu registro?', 'INITIATION'),
('greet-dawn-weekend-resp', 'WEEKEND', 'EARLY_MORNING', '¡Hola{{name}}! 🌙 Estamos en horario de descanso de fin de semana. Recibimos tu consulta y a partir de las *6:00 a.m.* nuestro equipo de guardia la revisará. ¡Feliz madrugada!', 'RESPONSE'),
('greet-dawn-cont', 'WEEKDAY', 'EARLY_MORNING', 'Hola de nuevo{{name}}. 🌙 Seguimos atentos a tu mensaje de hace {{time}}. Recuerda que a las *6:00 a.m.* reactivamos nuestra operación completa para ayudarte.', 'CONTINUITY')
ON DUPLICATE KEY UPDATE id=id;

-- Configuración de festivo no laborable
INSERT INTO configuraciones_calendario (fecha, tipo_dia) VALUES
('2026-05-21', 'HOLIDAY_NON_WORKABLE')
ON DUPLICATE KEY UPDATE fecha=fecha;

-- Horario de atención y días de oficina
INSERT INTO configuraciones_globales (clave, valor) VALUES
('schedule', '{"work_hours_start": "08:00", "work_hours_end": "18:00", "working_days": [1, 2, 3, 4, 5], "timezone": "America/Bogota"}')
ON DUPLICATE KEY UPDATE clave=clave;

-- Módulos iniciales
INSERT INTO modulos_sistema (id, nombre, activo) VALUES
('dashboard_home', 'Área de Inicio (Gráficas)', true),
('module_clients', 'Gestión de Clientes', true),
('module_greetings', 'Motor de Saludos Dinámicos', true)
ON DUPLICATE KEY UPDATE id=id;

-- Franjas Horarias
INSERT INTO configuraciones_franjas_horarias (id, etiqueta, hora_inicio, hora_fin, color) VALUES 
('EARLY_MORNING', 'Madrugada', 1, 6, '#6366f1'),
('MORNING', 'Mañana', 6, 12, '#10b981'),
('AFTERNOON', 'Tarde', 12, 19, '#f59e0b'),
('NIGHT', 'Noche', 19, 1, '#1e293b')
ON DUPLICATE KEY UPDATE hora_inicio = VALUES(hora_inicio), hora_fin = VALUES(hora_fin);

-- 10. Usuarios Administradores (usuarios_admin)
CREATE TABLE IF NOT EXISTS usuarios_admin (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Configuraciones de Bots (configuracion_bots)
CREATE TABLE IF NOT EXISTS configuracion_bots (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    tipo_bot ENUM('JS', 'HYBRID', 'FULL_AI') NOT NULL,
    nombre_bot VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_user_bot (usuario_id, tipo_bot)
);

-- 12. Documentos Base por Bot (documentos_bot)
CREATE TABLE IF NOT EXISTS documentos_bot (
    id VARCHAR(36) PRIMARY KEY,
    bot_id VARCHAR(36) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(50) NOT NULL,
    contenido_texto LONGTEXT NOT NULL,
    estructura_json JSON DEFAULT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bot_id) REFERENCES configuracion_bots(id) ON DELETE CASCADE
);

-- 13. Reglas FSM Parseadas (reglas_bot)
CREATE TABLE IF NOT EXISTS reglas_bot (
    id VARCHAR(36) PRIMARY KEY,
    bot_id VARCHAR(36) NOT NULL,
    trigger_keyword VARCHAR(150) NOT NULL,
    respuesta_texto TEXT NOT NULL,
    nodo_siguiente VARCHAR(50) DEFAULT NULL,
    es_fallback BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (bot_id) REFERENCES configuracion_bots(id) ON DELETE CASCADE
);

-- 14. Configuración IA y Prompts (configuracion_ia)
CREATE TABLE IF NOT EXISTS configuracion_ia (
    id VARCHAR(36) PRIMARY KEY,
    bot_id VARCHAR(36) UNIQUE NOT NULL,
    proveedor ENUM('gemini', 'openai', 'anthropic') DEFAULT 'gemini',
    api_key VARCHAR(255) DEFAULT NULL,
    modelo VARCHAR(50) DEFAULT 'gemini-1.5-flash',
    prompt_sistema TEXT NOT NULL,
    umbral_heuristico INT DEFAULT 15,
    modo_caveman BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (bot_id) REFERENCES configuracion_bots(id) ON DELETE CASCADE
);

-- 15. Registro de Tokens y Metricas (registros_tokens)
CREATE TABLE IF NOT EXISTS registros_tokens (
    id VARCHAR(36) PRIMARY KEY,
    bot_id VARCHAR(36) NOT NULL,
    prompt_tokens INT NOT NULL DEFAULT 0,
    completion_tokens INT NOT NULL DEFAULT 0,
    total_tokens INT NOT NULL DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_bot_tokens (bot_id, creado_en)
);

-- 16. Personalización Widget Embebible (personalizacion_widget)
CREATE TABLE IF NOT EXISTS personalizacion_widget (
    bot_id VARCHAR(36) PRIMARY KEY,
    color_primario VARCHAR(20) DEFAULT '#075e54',
    color_burbuja VARCHAR(20) DEFAULT '#dcf8c6',
    avatar_url TEXT DEFAULT NULL,
    titulo_header VARCHAR(100) DEFAULT 'WhatsApp Chat',
    subtitulo_status VARCHAR(100) DEFAULT 'En línea',
    posicion ENUM('bottom-right', 'bottom-left') DEFAULT 'bottom-right',
    FOREIGN KEY (bot_id) REFERENCES configuracion_bots(id) ON DELETE CASCADE
);

