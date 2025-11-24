import { Test, TestingModule } from '@nestjs/testing';
import { DidController } from './did.controller';
import { DidService } from './did.service';
import { KeyManagementService } from '../credentials/key-management.service';

describe('DidController', () => {
  let controller: DidController;
  let service: DidService;

  beforeEach(async () => {
    const keyMgmtService = new KeyManagementService();
    keyMgmtService.initializeKeys();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DidController],
      providers: [
        DidService,
        {
          provide: KeyManagementService,
          useValue: keyMgmtService,
        },
      ],
    }).compile();

    controller = module.get<DidController>(DidController);
    service = module.get<DidService>(DidService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /.well-known/did.json', () => {
    it('should return DID document', () => {
      const result = controller.getDidDocument();
      
      expect(result).toBeDefined();
      expect(result['@context']).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^did:web:/);
      expect(result.verificationMethod).toBeDefined();
    });

    it('should return DID document with verification method', () => {
      const result = controller.getDidDocument();
      
      expect(result.verificationMethod).toBeDefined();
      expect(Array.isArray(result.verificationMethod)).toBe(true);
      expect(result.verificationMethod.length).toBeGreaterThan(0);
      
      const vm = result.verificationMethod[0];
      expect(vm.id).toBeDefined();
      expect(vm.type).toBe('RsaVerificationKey2018');
      expect(vm.publicKeyPem).toBeDefined();
    });

    it('should include correct context', () => {
      const result = controller.getDidDocument();
      
      expect(result['@context']).toContain('https://www.w3.org/ns/did/v1');
      expect(result['@context']).toContain('https://w3id.org/security/suites/rsa-2018/v1');
    });

    it('should return consistent DID document', () => {
      const result1 = controller.getDidDocument();
      const result2 = controller.getDidDocument();
      
      expect(result1.id).toBe(result2.id);
      expect(result1.verificationMethod[0].publicKeyPem).toBe(
        result2.verificationMethod[0].publicKeyPem
      );
    });
  });
});

