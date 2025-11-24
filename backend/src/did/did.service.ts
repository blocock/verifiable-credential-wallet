import { Injectable } from '@nestjs/common';
import { KeyManagementService } from '../credentials/key-management.service';

export interface DIDDocument {
  '@context': string[];
  id: string;
  verificationMethod: VerificationMethod[];
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyPem: string;
}

@Injectable()
export class DidService {
  private readonly baseUrl: string;

  constructor(private readonly keyManagement: KeyManagementService) {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  }

  /**
   * Generate DID:web identifier from base URL
   */
  generateDid(): string {
    const host = new URL(this.baseUrl).hostname;
    const port = new URL(this.baseUrl).port;
    const path = new URL(this.baseUrl).pathname.replace(/\/$/, '');
    
    if (port && port !== '80' && port !== '443') {
      return `did:web:${host}%3A${port}${path ? ':' + path.replace(/\//g, ':') : ''}`;
    }
    return `did:web:${host}${path ? ':' + path.replace(/\//g, ':') : ''}`;
  }

  /**
   * Resolve DID:web to DID Document
   * DID:web resolution follows: https://w3c-ccg.github.io/did-method-web/
   */
  async resolveDid(did: string): Promise<DIDDocument | null> {
    try {
      // Parse DID:web format: did:web:domain:path:to:resource
      if (!did.startsWith('did:web:')) {
        return null;
      }

      const didWithoutPrefix = did.replace('did:web:', '');
      const parts = didWithoutPrefix.split(':');
      
      // Decode URL encoding (%3A becomes :)
      const decodedParts = parts.map(part => decodeURIComponent(part));
      
      // First part is domain, rest is path
      const domain = decodedParts[0];
      const pathParts = decodedParts.slice(1);
      
      // Construct URL for DID document
      // DID:web documents are served at /.well-known/did.json
      let didUrl: string;
      if (pathParts.length > 0) {
        const path = '/' + pathParts.join('/');
        const protocol = domain.includes('localhost') ? 'http' : 'https';
        didUrl = `${protocol}://${domain}${path}/.well-known/did.json`;
      } else {
        const protocol = domain.includes('localhost') ? 'http' : 'https';
        didUrl = `${protocol}://${domain}/.well-known/did.json`;
      }

      // For local development, return the DID document directly
      // In production, this would fetch from the URL
      if (domain.includes('localhost')) {
        return this.generateDidDocument();
      }

      // In production, fetch from the URL
      // const response = await fetch(didUrl);
      // return await response.json();
      
      return this.generateDidDocument();
    } catch (error) {
      console.error('Error resolving DID:', error);
      return null;
    }
  }

  /**
   * Generate DID Document for this service
   */
  generateDidDocument(): DIDDocument {
    const did = this.generateDid();
    const publicKeyPem = this.keyManagement.getPublicKeyPem();

    return {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/rsa-2018/v1',
      ],
      id: did,
      verificationMethod: [
        {
          id: `${did}#key-1`,
          type: 'RsaVerificationKey2018',
          controller: did,
          publicKeyPem: publicKeyPem,
        },
      ],
    };
  }

  /**
   * Get verification method from DID
   */
  async getVerificationMethod(didWithFragment: string): Promise<VerificationMethod | null> {
    const [did, fragment] = didWithFragment.split('#');
    const didDocument = await this.resolveDid(did);
    
    if (!didDocument) {
      return null;
    }

    const verificationMethod = didDocument.verificationMethod.find(
      (vm) => vm.id === `${did}#${fragment}` || vm.id === didWithFragment,
    );

    return verificationMethod || null;
  }
}

