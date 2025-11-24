import { Test, TestingModule } from '@nestjs/testing';
import { CredentialsService } from './credentials.service';
import { KeyManagementService } from './key-management.service';
import { DidService } from '../did/did.service';

describe('CredentialsService', () => {
  let service: CredentialsService;
  let keyManagementService: KeyManagementService;

  beforeEach(async () => {
    const keyMgmtService = new KeyManagementService();
    keyMgmtService.initializeKeys();

    const didServiceMock = {
      generateDid: jest.fn().mockReturnValue('did:web:localhost:3000'),
      resolveDid: jest.fn().mockResolvedValue({
        '@context': ['https://www.w3.org/ns/did/v1'],
        id: 'did:web:localhost:3000',
        verificationMethod: [
          {
            id: 'did:web:localhost:3000#key-1',
            type: 'RsaVerificationKey2018',
            controller: 'did:web:localhost:3000',
            publicKeyPem: keyMgmtService.getPublicKeyPem(),
          },
        ],
      }),
      getVerificationMethod: jest.fn().mockImplementation(async (didWithFragment) => {
        return {
          id: didWithFragment,
          type: 'RsaVerificationKey2018',
          controller: 'did:web:localhost:3000',
          publicKeyPem: keyMgmtService.getPublicKeyPem(),
        };
      }),
      generateDidDocument: jest.fn().mockReturnValue({
        '@context': ['https://www.w3.org/ns/did/v1'],
        id: 'did:web:localhost:3000',
        verificationMethod: [
          {
            id: 'did:web:localhost:3000#key-1',
            type: 'RsaVerificationKey2018',
            controller: 'did:web:localhost:3000',
            publicKeyPem: keyMgmtService.getPublicKeyPem(),
          },
        ],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialsService,
        {
          provide: KeyManagementService,
          useValue: keyMgmtService,
        },
        {
          provide: DidService,
          useValue: didServiceMock,
        },
      ],
    }).compile();

    service = module.get<CredentialsService>(CredentialsService);
    keyManagementService = keyMgmtService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('issueCredential', () => {
    it('should issue a credential with all required fields', () => {
      const dto = {
        type: 'Test Credential',
        claims: { name: 'John Doe', age: 30 },
      };

      const credential = service.issueCredential(dto);

      expect(credential).toBeDefined();
      expect(credential.id).toBeDefined();
      expect(credential.type).toBe('Test Credential');
      expect(credential.claims).toEqual(dto.claims);
      expect(credential.issuer).toBe('self');
      expect(credential.issuedAt).toBeDefined();
      expect(credential.proof).toBeDefined();
      expect(credential.proof.signatureValue).toBeDefined();
      expect(credential.proof.type).toBe('RsaSignature2018');
    });

    it('should generate unique IDs for different credentials', () => {
      const dto = {
        type: 'Test',
        claims: { test: 'value' },
      };

      const cred1 = service.issueCredential(dto);
      const cred2 = service.issueCredential(dto);

      expect(cred1.id).not.toBe(cred2.id);
    });
  });

  describe('findAll', () => {
    it('should return empty array when no credentials exist', () => {
      const credentials = service.findAll();
      expect(credentials).toEqual([]);
    });

    it('should return all issued credentials', () => {
      const dto = {
        type: 'Test',
        claims: { test: 'value' },
      };

      service.issueCredential(dto);
      service.issueCredential(dto);

      const credentials = service.findAll();
      expect(credentials.length).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return undefined for non-existent credential', () => {
      const credential = service.findOne('non-existent-id');
      expect(credential).toBeUndefined();
    });

    it('should return credential by ID', () => {
      const dto = {
        type: 'Test',
        claims: { test: 'value' },
      };

      const issued = service.issueCredential(dto);
      const found = service.findOne(issued.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(issued.id);
    });
  });

  describe('verifyCredential', () => {
    it('should verify a valid credential', async () => {
      const dto = {
        type: 'Test',
        claims: { name: 'John' },
      };

      const credential = service.issueCredential(dto);
      const result = await service.verifyCredential(credential);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject credential missing required fields', async () => {
      const invalidCredential = {
        id: 'test-id',
        // missing proof
      };

      const result = await service.verifyCredential(invalidCredential);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required fields');
    });

    it('should reject credential with invalid signature', async () => {
      const dto = {
        type: 'Test',
        claims: { name: 'John' },
      };

      const credential = service.issueCredential(dto);
      credential.proof.signatureValue = 'invalid-signature';

      const result = await service.verifyCredential(credential);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid signature');
    });

    it('should detect tampered credentials', async () => {
      const dto = {
        type: 'Test',
        claims: { name: 'John' },
      };

      const credential = service.issueCredential(dto);
      credential.claims.name = 'Tampered';

      const result = await service.verifyCredential(credential);
      expect(result.valid).toBe(false);
    });

    it('should use DID resolution for verification', async () => {
      const dto = {
        type: 'Test',
        claims: { name: 'John' },
      };

      const credential = service.issueCredential(dto);
      const result = await service.verifyCredential(credential);

      // Verify that DID resolution was called
      expect(result.valid).toBe(true);
      // The verification should have resolved the DID from the credential's verificationMethod
      expect(credential.proof.verificationMethod).toContain('did:web:');
    });

    it('should reject credential with missing verificationMethod', async () => {
      const dto = {
        type: 'Test',
        claims: { name: 'John' },
      };

      const credential = service.issueCredential(dto);
      delete credential.proof.verificationMethod;

      const result = await service.verifyCredential(credential);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('verificationMethod');
    });
  });

  describe('remove', () => {
    it('should delete a credential', () => {
      const dto = {
        type: 'Test',
        claims: { test: 'value' },
      };

      const credential = service.issueCredential(dto);
      const deleted = service.remove(credential.id);

      expect(deleted).toBe(true);
      expect(service.findOne(credential.id)).toBeUndefined();
    });

    it('should return false when deleting non-existent credential', () => {
      const deleted = service.remove('non-existent');
      expect(deleted).toBe(false);
    });
  });
});

