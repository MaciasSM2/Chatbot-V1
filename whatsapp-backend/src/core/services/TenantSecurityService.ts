/**
 * @file TenantSecurityService.ts
 * @description Servicio de cifrado y descifrado simétrico AES-256-GCM para llaves de API.
 */

import crypto from 'crypto';

export interface IEncryptedPayload {
  encryptedDataHex: string;
  ivHex: string;
  authTagHex: string;
}

export class TenantSecurityService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly masterKey: Buffer;

  constructor() {
    const rawMasterKey = process.env.MASTER_ENCRYPTION_KEY || 'e8f902a34b12c8567123456789abcdef0123456789abcdef0123456789abcdef';
    this.masterKey = Buffer.from(rawMasterKey, 'hex');
  }

  /**
   * Cifra un secreto plano usando AES-256-GCM.
   */
  public encryptSecret(plainText: string): IEncryptedPayload {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encryptedDataHex: encrypted,
      ivHex: iv.toString('hex'),
      authTagHex: authTag.toString('hex'),
    };
  }

  /**
   * Descifra un secreto usando AES-256-GCM con validación de Auth Tag.
   */
  public decryptSecret(encryptedDataHex: string, ivHex: string, authTagHex: string): string {
    try {
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);

      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (cryptoError: unknown) {
      const errorMessage = cryptoError instanceof Error ? cryptoError.message : 'Error desconocido';
      throw new Error(`🚨 [Crypto Violation] Falló el descifrado o el tag fue alterado: ${errorMessage}`);
    }
  }
}
