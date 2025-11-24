import { Injectable, OnModuleInit } from '@nestjs/common';
import { generateKeyPairSync, createSign, createVerify, KeyObject, createPrivateKey, createPublicKey } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

export interface KeyPair {
  privateKey: KeyObject;
  publicKey: KeyObject;
  publicKeyPem: string;
}

@Injectable()
export class KeyManagementService implements OnModuleInit {
  private keyPair: KeyPair | null = null;
  private readonly keyDir: string;
  private readonly privateKeyPath: string;
  private readonly publicKeyPath: string;

  constructor() {
    // Resolve key directory path (works in both dev and production)
    const keyDirEnv = process.env.KEY_DIR || './keys';
    this.keyDir = keyDirEnv.startsWith('/') ? keyDirEnv : resolve(process.cwd(), keyDirEnv);
    this.privateKeyPath = join(this.keyDir, 'private.pem');
    this.publicKeyPath = join(this.keyDir, 'public.pem');
  }

  onModuleInit() {
    this.initializeKeys();
  }

  /**
   * Initialize keys - load from file or generate new ones
   * Made public for testing purposes
   */
  initializeKeys(): void {
    try {
      if (this.loadKeysFromFile()) {
        console.log('Keys loaded from file');
      } else {
        console.log('Generating new key pair...');
        this.generateKeyPair();
        this.saveKeysToFile();
        console.log('New key pair generated and saved');
      }
    } catch (error) {
      console.error('Error initializing keys:', error);
      // Fallback: generate in-memory keys
      this.generateKeyPair();
      console.warn('Using in-memory keys (not persisted)');
    }
  }

  /**
   * Generate a new RSA key pair
   */
  private generateKeyPair(): void {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    // Convert PEM strings to KeyObjects for signing/verification
    this.keyPair = {
      privateKey: this.pemToPrivateKey(privateKey),
      publicKey: this.pemToPublicKey(publicKey),
      publicKeyPem: publicKey,
    };
  }

  /**
   * Load keys from file system
   */
  private loadKeysFromFile(): boolean {
    try {
      if (existsSync(this.privateKeyPath) && existsSync(this.publicKeyPath)) {
        const privateKeyPem = readFileSync(this.privateKeyPath, 'utf8');
        const publicKeyPem = readFileSync(this.publicKeyPath, 'utf8');

        this.keyPair = {
          privateKey: this.pemToPrivateKey(privateKeyPem),
          publicKey: this.pemToPublicKey(publicKeyPem),
          publicKeyPem: publicKeyPem,
        };

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading keys from file:', error);
      return false;
    }
  }

  /**
   * Save keys to file system
   */
  private saveKeysToFile(): void {
    try {
      // Create key directory if it doesn't exist
      if (!existsSync(this.keyDir)) {
        mkdirSync(this.keyDir, { recursive: true });
      }

      // Export keys to PEM format
      const privateKeyPem = this.privateKeyToPem(this.keyPair.privateKey);
      const publicKeyPem = this.keyPair.publicKeyPem;

      writeFileSync(this.privateKeyPath, privateKeyPem, { mode: 0o600 }); // Read/write for owner only
      writeFileSync(this.publicKeyPath, publicKeyPem, { mode: 0o644 }); // Read for all, write for owner
    } catch (error) {
      console.error('Error saving keys to file:', error);
      throw error;
    }
  }

  /**
   * Get the private key for signing
   */
  getPrivateKey(): KeyObject {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized');
    }
    return this.keyPair.privateKey;
  }

  /**
   * Get the public key for verification
   */
  getPublicKey(): KeyObject {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized');
    }
    return this.keyPair.publicKey;
  }

  /**
   * Get the public key in PEM format (for sharing/export)
   */
  getPublicKeyPem(): string {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized');
    }
    return this.keyPair.publicKeyPem;
  }

  /**
   * Sign data with the private key
   */
  sign(data: string): string {
    const sign = createSign('RSA-SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(this.getPrivateKey(), 'base64');
  }

  /**
   * Verify a signature with the public key
   */
  verify(data: string, signature: string): boolean {
    try {
      const verify = createVerify('RSA-SHA256');
      verify.update(data);
      verify.end();
      return verify.verify(this.getPublicKey(), signature, 'base64');
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert PEM string to PrivateKeyObject
   */
  private pemToPrivateKey(pem: string): KeyObject {
    return createPrivateKey(pem);
  }

  /**
   * Convert PEM string to PublicKeyObject
   */
  private pemToPublicKey(pem: string): KeyObject {
    return createPublicKey(pem);
  }

  /**
   * Convert PrivateKeyObject to PEM string
   */
  private privateKeyToPem(key: KeyObject): string {
    return key.export({
      type: 'pkcs8',
      format: 'pem',
    }) as string;
  }
}

