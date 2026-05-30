-- Creación de Tablas para el Ecosistema Chatbot WhatsApp

-- 1. Sesiones de Chat (Máquina de Estados Finitos)
CREATE TABLE IF NOT EXISTS chat_sessions (
    user_id VARCHAR(50) PRIMARY KEY,
    current_step VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Clientes (Prospección e Identificación)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    is_registered BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE clients ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 3. Plantillas de Saludos Dinámicos (Módulo 1)
CREATE TABLE IF NOT EXISTS greeting_templates (
    id VARCHAR(50) PRIMARY KEY,
    day_type VARCHAR(30) NOT NULL, -- 'WEEKDAY', 'WEEKEND', 'SATURDAY_WORKABLE', etc.
    time_period VARCHAR(15) NOT NULL, -- 'MORNING', 'AFTERNOON', 'NIGHT'
    text TEXT NOT NULL,
    category VARCHAR(20) NOT NULL DEFAULT 'RESPONSE' -- 'RESPONSE' | 'INITIATION' | 'CONTINUITY'
);

-- Asegurar compatibilidad y migración automática si la tabla ya existía
ALTER TABLE greeting_templates ALTER COLUMN day_type TYPE VARCHAR(30);
ALTER TABLE greeting_templates ADD COLUMN IF NOT EXISTS category VARCHAR(20) NOT NULL DEFAULT 'RESPONSE';

-- 3.1. Configuraciones Especiales de Calendario (Festivos o Sábados/Domingos Laborables)
CREATE TABLE IF NOT EXISTS calendar_settings (
    date DATE PRIMARY KEY,
    day_type VARCHAR(30) NOT NULL
);

-- 3.2. Configuraciones Globales (Horarios, Días de Atención, Parámetros del Bot)
CREATE TABLE IF NOT EXISTS global_settings (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Historial de Mensajes Real
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    sender VARCHAR(10) NOT NULL, -- 'user' | 'bot'
    text TEXT NOT NULL,
    status VARCHAR(15) DEFAULT 'sent',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone_number);
CREATE INDEX IF NOT EXISTS idx_greetings_context ON greeting_templates(day_type, time_period);
CREATE INDEX IF NOT EXISTS idx_messages_user_time ON messages(user_id, timestamp DESC);

-- Datos Iniciales (Seed) para Módulo 1
INSERT INTO greeting_templates (id, day_type, time_period, text, category) VALUES
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
-- Nuevos Saludos Onboarding para Clientes Nuevos
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
-- Plantillas para Domingo Laborable (SUNDAY_WORKABLE)
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
-- Plantillas para Sábado Laborable (SATURDAY_WORKABLE)
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
('t_cont_sat_nit', 'SATURDAY_WORKABLE', 'NIGHT', 'Hola de nuevo{{name}}. Noto que han pasado {{time}} desde nuestra última interacción esta noche de sábado y me gustaría saber si sigues ahí. ¡Sigo atento! 😊', 'CONTINUITY')
ON CONFLICT (id) DO NOTHING;

-- Registro Semilla para pruebas de festivo no laborable (Fecha actual del sistema: 2026-05-21)
INSERT INTO calendar_settings (date, day_type) VALUES
('2026-05-21', 'HOLIDAY_NON_WORKABLE')
ON CONFLICT (date) DO NOTHING;

-- Registro Semilla para Horario de Atención y Días de Oficina
INSERT INTO global_settings (key, value) VALUES
('schedule', '{"work_hours_start": "08:00", "work_hours_end": "18:00", "working_days": [1, 2, 3, 4, 5], "timezone": "America/Bogota"}')
ON CONFLICT (key) DO NOTHING;

-- 5. Tabla de Configuración de Módulos (Feature Toggles)
CREATE TABLE IF NOT EXISTS system_modules (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed de módulos iniciales
INSERT INTO system_modules (id, name, is_enabled) VALUES
('dashboard_home', 'Área de Inicio (Gráficas)', true),
('module_clients', 'Gestión de Clientes', true),
('module_greetings', 'Motor de Saludos Dinámicos', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Tabla de Auditoría y Trazabilidad de Cambios de Módulos
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'ACTIVATED' | 'DEACTIVATED'
    admin_name VARCHAR(100) NOT NULL, -- Para el simulador usaremos "Admin de Turno"
    previous_state BOOLEAN,
    new_state BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES system_modules(id)
);

-- Índice para búsquedas rápidas por fecha
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(created_at DESC);

