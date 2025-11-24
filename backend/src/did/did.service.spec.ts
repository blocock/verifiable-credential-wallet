import { Test, TestingModule } from '@nestjs/testing';
import { DidService } from './did.service';
import { KeyManagementService } from '../credentials/key-management.service';

describe('DidService', () => {
  let service: DidService;
  let keyManagementService: KeyManagementService;

  beforeEach(async () => {
    const keyMgmtService = new KeyManagementService();
    keyMgmtService.initializeKeys();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DidService,
        {
          provide: KeyManagementService,
          useValue: keyMgmtService,
        },
      ],
    }).compile();

    service = module.get<DidService>(DidService);
    keyManagementService = keyMgmtService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateDid', () => {
    it('should generate a DID:web identifier', () => {
      const did = service.generateDid();
      
      expect(did).toBeDefined();
      expect(did).toMatch(/^did:web:/);
    });

    it('should generate DID with localhost', () => {
      const did = service.generateDid();
      
      expect(did).toContain('localhost');
    });

    it('should generate consistent DIDs for same base URL', () => {
      const did1 = service.generateDid();
      const did2 = service.generateDid();
      
      expect(did1).toBe(did2);
    });
  });

  describe('generateDidDocument', () => {
    it('should generate a valid DID document', () => {
      const didDocument = service.generateDidDocument();
      
      expect(didDocument).toBeDefined();
      expect(didDocument['@context']).toBeDefined();
      expect(Array.isArray(didDocument['@context'])).toBe(true);
      expect(didDocument.id).toBeDefined();
      expect(didDocument.id).toMatch(/^did:web:/);
      expect(didDocument.verificationMethod).toBeDefined();
      expect(Array.isArray(didDocument.verificationMethod)).toBe(true);
    });

    it('should include verification method with public key', () => {
      const didDocument = service.generateDidDocument();
      const verificationMethod = didDocument.verificationMethod[0];
      
      expect(verificationMethod).toBeDefined();
      expect(verificationMethod.id).toBeDefined();
      expect(verificationMethod.id).toContain('#key-1');
      expect(verificationMethod.type).toBe('RsaVerificationKey2018');
      expect(verificationMethod.controller).toBe(didDocument.id);
      expect(verificationMethod.publicKeyPem).toBeDefined();
      expect(verificationMethod.publicKeyPem).toContain('-----BEGIN PUBLIC KEY-----');
    });

    it('should include correct context URLs', () => {
      const didDocument = service.generateDidDocument();
      
      expect(didDocument['@context']).toContain('https://www.w3.org/ns/did/v1');
      expect(didDocument['@context']).toContain('https://w3id.org/security/suites/rsa-2018/v1');
    });
  });

  describe('resolveDid', () => {
    it('should resolve a valid DID:web', async () => {
      const did = service.generateDid();
      const didDocument = await service.resolveDid(did);
      
      expect(didDocument).toBeDefined();
      expect(didDocument.id).toBe(did);
      expect(didDocument.verificationMethod).toBeDefined();
    });

    it('should return null for invalid DID format', async () => {
      const result = await service.resolveDid('did:example:123');
      
      expect(result).toBeNull();
    });

    it('should return null for non-did:web DIDs', async () => {
      const result = await service.resolveDid('did:ethr:0x123');
      
      expect(result).toBeNull();
    });

    it('should handle localhost DIDs', async () => {
      const did = 'did:web:localhost:3000';
      const didDocument = await service.resolveDid(did);
      
      expect(didDocument).toBeDefined();
      expect(didDocument.id).toBeDefined();
    });
  });

  describe('getVerificationMethod', () => {
    it('should get verification method from DID with fragment', async () => {
      const did = service.generateDid();
      const didWithFragment = `${did}#key-1`;
      
      const verificationMethod = await service.getVerificationMethod(didWithFragment);
      
      expect(verificationMethod).toBeDefined();
      expect(verificationMethod.id).toBe(didWithFragment);
      expect(verificationMethod.type).toBe('RsaVerificationKey2018');
      expect(verificationMethod.publicKeyPem).toBeDefined();
    });

    it('should return null for non-existent fragment', async () => {
      const did = service.generateDid();
      const didWithFragment = `${did}#key-999`;
      
      const verificationMethod = await service.getVerificationMethod(didWithFragment);
      
      expect(verificationMethod).toBeNull();
    });

    it('should return null for invalid DID', async () => {
      const verificationMethod = await service.getVerificationMethod('invalid-did#key-1');
      
      expect(verificationMethod).toBeNull();
    });
  });
});

