// src/lib/encryption.ts - Data encryption and security utilities
import crypto from 'crypto';

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits

interface EncryptedData {
  encryptedData: string;
  iv: string;
  tag: string;
  algorithm: string;
}

interface FieldEncryptionConfig {
  fields: string[];
  keyId: string;
}

class EncryptionService {
  private static instance: EncryptionService;
  private encryptionKey: Buffer;
  
  private constructor() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
    }
    
    // Derive a proper encryption key from the environment variable
    this.encryptionKey = crypto.scryptSync(key, 'drivingschoolarwal-salt', KEY_LENGTH);
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  // Encrypt sensitive data
  encrypt(plaintext: string): EncryptedData {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, this.encryptionKey);
      cipher.setAAD(Buffer.from('drivingschoolarwal-aad')); // Additional authenticated data
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: ENCRYPTION_ALGORITHM
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt sensitive data
  decrypt(encryptedData: EncryptedData): string {
    try {
      const { encryptedData: data, iv, tag, algorithm } = encryptedData;
      
      if (algorithm !== ENCRYPTION_ALGORITHM) {
        throw new Error('Unsupported encryption algorithm');
      }

      const decipher = crypto.createDecipher(algorithm, this.encryptionKey);
      decipher.setAAD(Buffer.from('drivingschoolarwal-aad'));
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Hash passwords with salt
  hashPassword(password: string): { hash: string; salt: string } {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    
    return { hash, salt };
  }

  // Verify password against hash
  verifyPassword(password: string, hash: string, salt: string): boolean {
    try {
      const hashBuffer = crypto.scryptSync(password, salt, 64);
      const providedHash = Buffer.from(hash, 'hex');
      
      return crypto.timingSafeEqual(hashBuffer, providedHash);
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }

  // Generate secure random tokens
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Create HMAC signature for data integrity
  createSignature(data: string, secret?: string): string {
    const key = secret || this.encryptionKey;
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  // Verify HMAC signature
  verifySignature(data: string, signature: string, secret?: string): boolean {
    try {
      const key = secret || this.encryptionKey;
      const expectedSignature = crypto.createHmac('sha256', key).update(data).digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  // Encrypt object fields selectively
  encryptObjectFields(obj: any, config: FieldEncryptionConfig): any {
    const result = { ...obj };
    
    config.fields.forEach(field => {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = this.encrypt(result[field]);
        result[`${field}_encrypted`] = true;
      }
    });
    
    return result;
  }

  // Decrypt object fields selectively
  decryptObjectFields(obj: any, config: FieldEncryptionConfig): any {
    const result = { ...obj };
    
    config.fields.forEach(field => {
      if (result[field] && result[`${field}_encrypted`]) {
        try {
          result[field] = this.decrypt(result[field]);
          delete result[`${field}_encrypted`];
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
          // Keep encrypted data if decryption fails
        }
      }
    });
    
    return result;
  }

  // PII (Personally Identifiable Information) protection
  maskPII(data: string, type: 'email' | 'phone' | 'ssn' | 'license'): string {
    switch (type) {
      case 'email':
        const [username, domain] = data.split('@');
        if (!domain) return '***@***.***';
        return `${username.slice(0, 2)}***@${domain}`;
        
      case 'phone':
        return data.replace(/(\d{3})\d{3}(\d{4})/, '$1-***-$2');
        
      case 'ssn':
        return data.replace(/(\d{3})\d{2}(\d{4})/, '$1-**-$2');
        
      case 'license':
        return data.slice(0, 3) + '*'.repeat(data.length - 3);
        
      default:
        return '***';
    }
  }

  // Generate encryption key for new installations
  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Export singleton instance
export const encryption = EncryptionService.getInstance();

// Convenience functions
export const encryptData = (data: string) => encryption.encrypt(data);
export const decryptData = (encryptedData: EncryptedData) => encryption.decrypt(encryptedData);
export const hashPassword = (password: string) => encryption.hashPassword(password);
export const verifyPassword = (password: string, hash: string, salt: string) => 
  encryption.verifyPassword(password, hash, salt);
export const generateToken = (length?: number) => encryption.generateSecureToken(length);
export const createSignature = (data: string, secret?: string) => 
  encryption.createSignature(data, secret);
export const verifySignature = (data: string, signature: string, secret?: string) => 
  encryption.verifySignature(data, signature, secret);

// Field encryption configurations for different data types
export const ENCRYPTION_CONFIGS = {
  STUDENT_DATA: {
    fields: ['ssn', 'driversLicense', 'emergencyContactPhone'],
    keyId: 'student-data-key'
  },
  PAYMENT_DATA: {
    fields: ['bankAccount', 'routingNumber'],
    keyId: 'payment-data-key'
  },
  INSTRUCTOR_DATA: {
    fields: ['licenseNumber', 'certification'],
    keyId: 'instructor-data-key'
  }
} as const;

// Utility for handling encrypted fields in Firestore
export class SecureFirestoreHelper {
  static async saveWithEncryption(
    collection: any,
    docId: string,
    data: any,
    encryptionConfig: FieldEncryptionConfig
  ): Promise<void> {
    const encryptedData = encryption.encryptObjectFields(data, encryptionConfig);
    await collection.doc(docId).set(encryptedData);
  }

  static async getWithDecryption(
    collection: any,
    docId: string,
    encryptionConfig: FieldEncryptionConfig
  ): Promise<any> {
    const doc = await collection.doc(docId).get();
    if (!doc.exists) return null;
    
    const data = doc.data();
    return encryption.decryptObjectFields(data, encryptionConfig);
  }
}
