/**
 * @file WebPushNotificationGateway.ts
 * @description Pasarela encargada de cifrar y despachar notificaciones Push usando el estándar VAPID.
 * Resuelve el hallazgo B9 integrando las alertas de fondo para operadores del CRM.
 */
import crypto from 'crypto';
import { Pool } from 'mysql2/promise';
import logger from '../logging/Logger';

export interface IWebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class WebPushNotificationGateway {
  private readonly VAPID_PUBLIC_KEY: string;
  private readonly VAPID_PRIVATE_KEY: string;

  constructor(private readonly mariadbPool: Pool) {
    this.VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'B_master_public_vapid_key_default_2026';
    this.VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'master_private_vapid_key_secure_2026';
  }

  /**
   * Almacena de forma indexada la suscripción del navegador web vinculada al ID del asesor.
   */
  public async saveOperatorSubscription(operatorId: string, subscription: IWebPushSubscription): Promise<void> {
    const serializedSubscription = JSON.stringify(subscription);
    
    await this.mariadbPool.query(
      `INSERT INTO operador_push_suscripciones (operator_id, endpoint_hash, subscription_json, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE subscription_json = VALUES(subscription_json), updated_at = CURRENT_TIMESTAMP`,
      [
        operatorId,
        crypto.createHash('md5').update(subscription.endpoint).digest('hex'),
        serializedSubscription
      ]
    );
    logger.info(`📦 [Push Gateway] Registrada suscripción Web Push para el Operador ID: ${operatorId}`);
  }

  /**
   * Despacha de forma asíncrona un payload cifrado hacia el navegador del operador.
   */
  public async dispatchUrgentAlert(operatorId: string, title: string, bodyText: string): Promise<void> {
    const [rows] = await this.mariadbPool.query<any[]>(
      `SELECT subscription_json FROM operador_push_suscripciones WHERE operator_id = ?`,
      [operatorId]
    );

    if (rows.length === 0) {
      logger.warn(`[Push Gateway Miss] El operador ${operatorId} no posee suscripciones push activas en su navegador.`);
      return;
    }

    const payloadBuffer = Buffer.from(JSON.stringify({ title, body: bodyText, timestamp: Date.now() }));

    const distributionPromises = rows.map(async (row) => {
      const subscription: IWebPushSubscription = typeof row.subscription_json === 'string' 
        ? JSON.parse(row.subscription_json) 
        : row.subscription_json;

      try {
        await this.executeCryptoPushRequest(subscription, payloadBuffer);
      } catch (pushException: any) {
        logger.error(`[Push Delivery Error] Falló el desvío hacia la CDN del navegador: ${pushException.message}`);
      }
    });

    await Promise.all(distributionPromises);
  }

  /**
   * Realiza el cifrado simétrico AES-128-GCM con derivación ECDH requerido por la W3C para Web Push.
   */
  private async executeCryptoPushRequest(subscription: IWebPushSubscription, payload: Buffer): Promise<void> {
    const localEcdh = crypto.createECDH('prime256v1');
    localEcdh.generateKeys();

    const clientPublicKey = Buffer.from(subscription.keys.p256dh, 'base64url');
    const clientAuthSecret = Buffer.from(subscription.keys.auth, 'base64url');

    const sharedSecret = localEcdh.computeSecret(clientPublicKey);
    
    const salt = crypto.randomBytes(16);
    const prk = crypto.createHmac('sha256', clientAuthSecret).update(sharedSecret).digest();
    const aesKey = crypto.createHmac('sha256', salt).update(Buffer.concat([prk, Buffer.from('Content-Encoding: aes128gcm\0', 'utf8')])).digest().subarray(0, 16);
    const nonce = crypto.createHmac('sha256', salt).update(Buffer.concat([prk, Buffer.from('Content-Encoding: nonce\0', 'utf8')])).digest().subarray(0, 12);

    const cipher = crypto.createCipheriv('aes-128-gcm', aesKey, nonce);
    const encryptedPayload = Buffer.concat([cipher.update(payload), cipher.final(), cipher.getAuthTag()]);

    const networkAbortController = new AbortController();
    const timeoutTimer = setTimeout(() => networkAbortController.abort(), 6000);

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'TTL': '60',
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Authorization': `WebPush ${this.compileVapidHeader(subscription.endpoint)}`
      },
      body: encryptedPayload,
      signal: networkAbortController.signal
    });

    clearTimeout(timeoutTimer);

    if (!response.ok && response.status === 410) {
      await this.mariadbPool.query(`DELETE FROM operador_push_suscripciones WHERE endpoint_hash = ?`, [
        crypto.createHash('md5').update(subscription.endpoint).digest('hex')
      ]);
      logger.info(`🗑️ [Push Gateway Purge] Removida suscripción caducada del navegador.`);
    }
  }

  private compileVapidHeader(endpointUrl: string): string {
    const origin = new URL(endpointUrl).origin;
    const tokenPayload = JSON.stringify({ aud: origin, exp: Math.floor(Date.now() / 1000) + 3600, sub: 'mailto:soporte@logistica.com' });
    const base64Token = Buffer.from(tokenPayload).toString('base64url');
    
    const signer = crypto.createSign('sha256');
    signer.update(base64Token);
    signer.sign(Buffer.from(this.VAPID_PRIVATE_KEY, 'base64'), 'base64url');

    return `t=${base64Token},k=${this.VAPID_PUBLIC_KEY}`;
  }
}
