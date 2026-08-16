/**
 * @file setup-db.ts
 * @description Inicializador atómico de tablas maestras de MariaDB.
 * CORRECCIÓN: Eliminados DROP TABLE destructivos y DDL duplicado con MigrationRunner.
 */
import { Pool } from 'mysql2/promise';
import crypto from 'crypto';
import logger from '../logging/Logger';

export async function setupUnifiedDatabase(mariadbPool: Pool): Promise<void> {
  logger.info('Seeding core relational data...');

  const connection = await mariadbPool.getConnection();
  await connection.beginTransaction();

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS company_brand_configs (
        id VARCHAR(50) PRIMARY KEY,
        company_name VARCHAR(100) NOT NULL,
        company_slogan VARCHAR(255) NULL,
        company_logo_url VARCHAR(500) NULL,
        institutional_language TEXT NOT NULL,
        start_work_hour VARCHAR(5) DEFAULT '08:00',
        end_work_hour VARCHAR(5) DEFAULT '18:00',
        operation_mode TINYINT DEFAULT 1,
        theme_accent VARCHAR(50) DEFAULT 'WHATSAPP_GREEN'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS time_period_configs (
        id VARCHAR(50) PRIMARY KEY,
        label VARCHAR(100) NOT NULL,
        start_hour INT NOT NULL,
        end_hour INT NOT NULL,
        color VARCHAR(20),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS sesiones_chat (
        usuario_id VARCHAR(50) PRIMARY KEY,
        paso_actual VARCHAR(50) NOT NULL,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        metadatos JSON NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS mensajes (
        id VARCHAR(50) PRIMARY KEY,
        usuario_id VARCHAR(50) NOT NULL,
        remitente VARCHAR(10) NOT NULL,
        texto TEXT NOT NULL,
        estado VARCHAR(15) DEFAULT 'sent',
        marca_tiempo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_mensajes_usuario (usuario_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS greeting_templates (
        id VARCHAR(100) PRIMARY KEY,
        day_type VARCHAR(50) NOT NULL,
        time_period VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        text TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS holiday_exceptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        exception_date DATE NOT NULL UNIQUE,
        label VARCHAR(100) NOT NULL,
        type ENUM('HOLIDAY', 'ADMIN_CLOSE', 'WORKABLE_SPECIAL') DEFAULT 'HOLIDAY',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS sicetac_routes_matrix (
        id INT AUTO_INCREMENT PRIMARY KEY,
        origin_id VARCHAR(100) NOT NULL,
        destination_id VARCHAR(100) NOT NULL,
        base_cost DECIMAL(12, 2) NOT NULL,
        cost_per_ton DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        peajes_count INT NOT NULL DEFAULT 0,
        UNIQUE KEY idx_route (origin_id, destination_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS transport_invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_phone VARCHAR(20) NOT NULL,
        document_type ENUM('CC', 'NIT', 'CE', 'PPX') NOT NULL,
        document_number VARCHAR(50) NOT NULL,
        client_name VARCHAR(150) NOT NULL,
        origin VARCHAR(100) NOT NULL,
        destination VARCHAR(100) NOT NULL,
        base_cost DECIMAL(12, 2) NOT NULL,
        tax_amount DECIMAL(12, 2) NOT NULL,
        total_cost DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_invoice_doc (document_number),
        INDEX idx_invoice_phone (client_phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS configuraciones_globales (
        clave VARCHAR(100) PRIMARY KEY,
        valor LONGTEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS operadores_sistema (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'ADMIN',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS operador_push_suscripciones (
        operator_id VARCHAR(50) NOT NULL,
        endpoint_hash CHAR(32) NOT NULL,
        subscription_json JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (operator_id, endpoint_hash)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS configuraciones_calendario (
        fecha DATE PRIMARY KEY,
        tipo_dia VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS modulos_sistema (
        id VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        activo TINYINT(1) DEFAULT 1,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS undelivered_meta_messages (
        id VARCHAR(50) PRIMARY KEY,
        recipient_phone VARCHAR(20) NOT NULL,
        message_text TEXT NOT NULL,
        retry_count INT DEFAULT 0,
        is_sent TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seeds
    const timeSeeds = [
      ['EARLY_MORNING', 'Madrugada', 1, 6, '#6366f1'],
      ['MORNING', 'Mañana', 6, 12, '#10b981'],
      ['AFTERNOON', 'Tarde', 12, 19, '#f59e0b'],
      ['NIGHT', 'Noche', 19, 1, '#1e293b']
    ] as const;
    for (const [id, label, start, end, color] of timeSeeds) {
      await connection.query(`
        INSERT INTO time_period_configs (id, label, start_hour, end_hour, color)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE start_hour = VALUES(start_hour), end_hour = VALUES(end_hour), color = VALUES(color);
      `, [id, label, start, end, color]);
    }

    const greetingSeeds: [string, string, string, string, string][] = [
      ['greet_early_morning',          'WEEKDAY',           'EARLY_MORNING', 'INITIATION', '¡Hola! 🌙 Recibimos tu mensaje en la madrugada. Nuestra atención inicia a las 6:00 a.m. y serás nuestra prioridad.'],
      ['greet_morning_default',        'WEEKDAY',           'MORNING',       'INITIATION', '¡Buenos días! ☀️ Gracias por escribirnos, ¿en qué podemos ayudarte hoy?'],
      ['greet_afternoon_default',      'WEEKDAY',           'AFTERNOON',     'INITIATION', '¡Buenas tardes! 👋 Es un gusto saludarte, cuéntanos qué necesitas.'],
      ['greet_night_default',          'WEEKDAY',           'NIGHT',         'INITIATION', '¡Buenas noches! 🌑 Ya terminamos jornada, pero déjanos tu duda y mañana a primera hora te contactamos.'],
      ['greet_sat_early_morning',      'SATURDAY_WORKABLE', 'EARLY_MORNING', 'INITIATION', '¡Hola! 🌙 Es muy temprano por este sábado. Te respondemos cuando iniciemos atención.'],
      ['greet_sat_morning',            'SATURDAY_WORKABLE', 'MORNING',       'INITIATION', '¡Buenos días! ☀️ Trabajamos este sábado para servirte. ¿En qué te ayudamos?'],
      ['greet_sat_afternoon',          'SATURDAY_WORKABLE', 'AFTERNOON',     'INITIATION', '¡Buenas tardes! 👋 Estamos disponibles este sábado. Cuéntanos tu consulta.'],
      ['greet_sat_night',              'SATURDAY_WORKABLE', 'NIGHT',         'INITIATION', '¡Buenas noches! 🌑 Cerramos por hoy. El lunes retomamos con gusto.'],
      ['greet_hol_nowork_early',       'HOLIDAY_NON_WORKABLE', 'EARLY_MORNING', 'INITIATION', '¡Hola! 🌙 Hoy estamos de descanso. El próximo día hábil atendemos tu mensaje.'],
      ['greet_hol_nowork_morning',     'HOLIDAY_NON_WORKABLE', 'MORNING',       'INITIATION', '¡Buenos días! 🎉 Hoy es festivo y descansamos. Te respondemos el próximo día hábil.'],
      ['greet_hol_nowork_afternoon',   'HOLIDAY_NON_WORKABLE', 'AFTERNOON',     'INITIATION', '¡Buenas tardes! 🎉 Estamos de descanso. Deja tu mensaje y te contactamos pronto.'],
      ['greet_hol_nowork_night',       'HOLIDAY_NON_WORKABLE', 'NIGHT',         'INITIATION', '¡Buenas noches! 🌑 Día festivo de descanso. Te respondemos el próximo hábil.'],
    ];
    for (const [id, day, period, cat, text] of greetingSeeds) {
      await connection.query(`
        INSERT INTO greeting_templates (id, day_type, time_period, category, text)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE text = VALUES(text);
      `, [id, day, period, cat, text]);
    }

    await connection.query(`
      INSERT INTO sicetac_routes_matrix (origin_id, destination_id, base_cost, cost_per_ton, peajes_count)
      VALUES
        ('MEDELLIN', 'BOGOTA', 1850000.00, 45000.00, 6),
        ('MEDELLIN', 'CALI', 2100000.00, 50000.00, 7),
        ('MEDELLIN', 'BARRANQUILLA', 3400000.00, 80000.00, 10),
        ('MEDELLIN', 'CARTAGENA', 3100000.00, 75000.00, 9),
        ('MEDELLIN', 'TURBO', 1250000.00, 30000.00, 4),
        ('MEDELLIN', 'RIONEGRO', 450000.00, 12000.00, 1),
        ('MEDELLIN', 'LA_ESTRELLA', 150000.00, 4000.00, 0),
        ('MEDELLIN', 'CALDAS', 180000.00, 5000.00, 0)
      ON DUPLICATE KEY UPDATE base_cost = VALUES(base_cost), cost_per_ton = VALUES(cost_per_ton), peajes_count = VALUES(peajes_count);
    `);

    await connection.query(`
      INSERT INTO company_brand_configs (id, company_name, company_slogan, company_logo_url, institutional_language, start_work_hour, end_work_hour, operation_mode, theme_accent)
      VALUES (
        'MAIN_CONFIG',
        'Libros Medellín',
        'Tu lectura, nuestro camino',
        'https://api.dicebear.com/7.x/initials/svg?seed=LM&backgroundColor=10b981',
        'Saluda siempre con amabilidad. Usa un tono corporativo pero cercano. Menciona que somos aliados de la cultura en Medellín. Al final de cada interacción, ofrece agendar una cita o soporte.',
        '08:00',
        '18:00',
        1,
        'WHATSAPP_GREEN'
      )
      ON DUPLICATE KEY UPDATE company_name = IFNULL(company_name, VALUES(company_name)), company_slogan = IFNULL(company_slogan, VALUES(company_slogan));
    `);

    await connection.query(`
      INSERT INTO modulos_sistema (id, nombre, activo) VALUES
        ('dashboard_home', 'Área de Inicio (Gráficas)', 1),
        ('module_clients', 'Gestión de Clientes', 1),
        ('module_greetings', 'Motor de Saludos Dinámicos', 1)
      ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);
    `);

    const rawAdminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Dev_Admin_2026!';
    const jwtSecret = process.env.JWT_SECRET || '';
    const computedHash = crypto.createHmac('sha256', jwtSecret).update(rawAdminPassword).digest('hex');

    await connection.query(`
      INSERT INTO operadores_sistema (id, email, password_hash, role)
      VALUES ('OP-ADMIN-01', 'admin@example.com', ?, 'ADMIN')
      ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);
    `, [computedHash]);

    await connection.commit();
    logger.info('Core seed data committed.');
  } catch (err: any) {
    await connection.rollback();
    logger.error(`Seed transaction failed: ${err.message}`);
    throw err;
  } finally {
    connection.release();
  }
}

export async function setupBrandDatabaseSchema(pool: any): Promise<void> {
  return setupUnifiedDatabase(pool);
}

export const setupMySQL = async (pool: Pool) => {
  return setupUnifiedDatabase(pool);
};

export default setupMySQL;
