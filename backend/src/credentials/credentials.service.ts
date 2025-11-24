import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Credential } from './interfaces/credential.interface';
import { IssueCredentialDto } from './dto/issue-credential.dto';
import { KeyManagementService } from './key-management.service';
import { JsonCanonicalizer } from '../common/utils/json-canonicalizer.util';
import { DidService } from '../did/did.service';

@Injectable()
export class CredentialsService {
  private credentials: Map<string, Credential> = new Map();

  constructor(
    private readonly keyManagement: KeyManagementService,
    private readonly didService: DidService,
  ) {}

  /**
   * Issue a new verifiable credential
   */
  issueCredential(dto: IssueCredentialDto): Credential {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Create the credential payload
    const credentialData = {
      id,
      type: dto.type,
      claims: dto.claims,
      issuer: 'self',
      issuedAt: now,
    };

    // Sign the credential payload
    const signature = this.signCredentialData(credentialData);

    // Get DID for verification method
    const did = this.didService.generateDid();
    const verificationMethod = `${did}#key-1`;

    // Create the complete credential with proof
    const credential: Credential = {
      ...credentialData,
      proof: {
        type: 'RsaSignature2018',
        created: now,
        proofPurpose: 'assertionMethod',
        verificationMethod: verificationMethod,
        signatureValue: signature,
      },
    };

    // Store the credential
    this.credentials.set(id, credential);

    return credential;
  }

  /**
   * List all credentials
   */
  findAll(): Credential[] {
    return Array.from(this.credentials.values());
  }

  /**
   * Find a credential by ID
   */
  findOne(id: string): Credential | undefined {
    return this.credentials.get(id);
  }

  /**
   * Verify a credential's signature using DID resolution
   */
  async verifyCredential(credential: any): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check if credential has required fields
      if (!credential.id || !credential.proof || !credential.proof.signatureValue) {
        return { valid: false, error: 'Credential missing required fields' };
      }

      // Check if verificationMethod exists
      if (!credential.proof.verificationMethod) {
        return { valid: false, error: 'Credential missing verificationMethod in proof' };
      }

      // Resolve DID and get verification method
      const verificationMethod = await this.didService.getVerificationMethod(
        credential.proof.verificationMethod,
      );

      if (!verificationMethod) {
        return { valid: false, error: 'Failed to resolve DID or verification method not found' };
      }

      // Recreate the signed payload
      const payload = this.createCredentialPayload(credential);
      
      // Verify the signature using the public key from DID document
      const isValid = await this.verifySignatureWithPublicKey(
        payload,
        credential.proof.signatureValue,
        verificationMethod.publicKeyPem,
      );

      if (!isValid) {
        return { valid: false, error: 'Invalid signature' };
      }

      // Check if credential exists in wallet (optional check)
      const storedCredential = this.credentials.get(credential.id);
      if (storedCredential) {
        // Verify it matches the stored version
        const storedPayload = this.createCredentialPayload(storedCredential);
        if (storedPayload !== payload) {
          return { valid: false, error: 'Credential has been tampered with' };
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Verification failed: ${error.message}` };
    }
  }

  /**
   * Delete a credential
   */
  remove(id: string): boolean {
    return this.credentials.delete(id);
  }

  /**
   * Sign a credential using RSA-SHA256
   */
  private signCredentialData(credentialData: {
    id: string;
    type: string;
    claims: Record<string, any>;
    issuer: string;
    issuedAt: string;
  }): string {
    const payload = this.createCredentialPayload(credentialData);
    return this.keyManagement.sign(payload);
  }

  /**
   * Verify a signature using RSA-SHA256 with a specific public key
   */
  private async verifySignatureWithPublicKey(
    payload: string,
    signature: string,
    publicKeyPem: string,
  ): Promise<boolean> {
    try {
      const crypto = require('crypto');
      const publicKey = crypto.createPublicKey(publicKeyPem);
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(payload);
      verify.end();
      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      console.error('Error verifying signature with public key:', error);
      return false;
    }
  }

  /**
   * Create a canonical payload for signing/verification
   * Recursively sorts all object keys to ensure consistent JSON representation
   */
  private createCredentialPayload(credential: any): string {
    // Extract credential data (excluding proof)
    const credentialData = {
      id: credential.id,
      type: credential.type,
      claims: credential.claims,
      issuer: credential.issuer,
      issuedAt: credential.issuedAt,
    };
    
    // Create canonical JSON string with recursively sorted keys
    return JsonCanonicalizer.toCanonicalString(credentialData);
  }
}

