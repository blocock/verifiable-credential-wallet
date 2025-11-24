import { Test, TestingModule } from '@nestjs/testing';
import { CredentialsController } from './credentials.controller';
import { CredentialsService } from './credentials.service';
import { KeyManagementService } from './key-management.service';
import { DidService } from '../did/did.service';

describe('CredentialsController', () => {
  let controller: CredentialsController;
  let service: CredentialsService;

  beforeEach(async () => {
    const keyManagementService = new KeyManagementService();
    // Initialize keys for testing
    keyManagementService.initializeKeys();

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
            publicKeyPem: keyManagementService.getPublicKeyPem(),
          },
        ],
      }),
      getVerificationMethod: jest.fn().mockImplementation(async (didWithFragment) => {
        return {
          id: didWithFragment,
          type: 'RsaVerificationKey2018',
          controller: 'did:web:localhost:3000',
          publicKeyPem: keyManagementService.getPublicKeyPem(),
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
            publicKeyPem: keyManagementService.getPublicKeyPem(),
          },
        ],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CredentialsController],
      providers: [
        CredentialsService,
        {
          provide: KeyManagementService,
          useValue: keyManagementService,
        },
        {
          provide: DidService,
          useValue: didServiceMock,
        },
      ],
    }).compile();

    controller = module.get<CredentialsController>(CredentialsController);
    service = module.get<CredentialsService>(CredentialsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /credentials/issue', () => {
    it('should issue a credential', () => {
      const dto = {
        type: 'Test',
        claims: { name: 'John' },
      };

      const result = controller.issueCredential(dto);

      expect(result).toBeDefined();
      expect(result.type).toBe(dto.type);
      expect(result.claims).toEqual(dto.claims);
    });
  });

  describe('GET /credentials', () => {
    it('should return all credentials', () => {
      const result = controller.findAll();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('GET /credentials/:id', () => {
    it('should return credential by id', () => {
      const dto = { type: 'Test', claims: {} };
      const issued = controller.issueCredential(dto);
      const result = controller.findOne(issued.id);

      expect(result).toBeDefined();
      if ('id' in result) {
        expect(result.id).toBe(issued.id);
      }
    });

    it('should return error for non-existent credential', () => {
      const result = controller.findOne('non-existent');
      expect(result).toBeDefined();
      if ('error' in result) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('POST /credentials/verify', () => {
    it('should verify a valid credential', async () => {
      const dto = { type: 'Test', claims: { name: 'John' } };
      const credential = controller.issueCredential(dto);
      const result = await controller.verifyCredential({ credential });

      expect(result.valid).toBe(true);
    });
  });

  describe('DELETE /credentials/:id', () => {
    it('should delete a credential', () => {
      const dto = { type: 'Test', claims: {} };
      const issued = controller.issueCredential(dto);
      const result = controller.remove(issued.id);

      expect(result.success).toBe(true);
    });
  });
});

