import { Test, TestingModule } from '@nestjs/testing';
import { KeyManagementService } from './key-management.service';

describe('KeyManagementService', () => {
  let service: KeyManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KeyManagementService],
    }).compile();

    service = module.get<KeyManagementService>(KeyManagementService);
    service.initializeKeys();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sign and verify', () => {
    it('should sign and verify data correctly', () => {
      const data = 'test data to sign';
      const signature = service.sign(data);
      
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);

      const isValid = service.verify(data, signature);
      expect(isValid).toBe(true);
    });

    it('should reject invalid signatures', () => {
      const data = 'test data';
      const signature = service.sign(data);
      const invalidSignature = 'invalid-signature';

      const isValid = service.verify(data, invalidSignature);
      expect(isValid).toBe(false);
    });

    it('should reject signature for different data', () => {
      const data1 = 'test data 1';
      const data2 = 'test data 2';
      const signature = service.sign(data1);

      const isValid = service.verify(data2, signature);
      expect(isValid).toBe(false);
    });

    it('should produce consistent signatures for same data', () => {
      const data = 'test data';
      const signature1 = service.sign(data);
      const signature2 = service.sign(data);

      expect(signature1).toBe(signature2);
    });
  });

  describe('getPublicKeyPem', () => {
    it('should return public key in PEM format', () => {
      const publicKey = service.getPublicKeyPem();
      
      expect(publicKey).toBeDefined();
      expect(typeof publicKey).toBe('string');
      expect(publicKey).toContain('-----BEGIN PUBLIC KEY-----');
      expect(publicKey).toContain('-----END PUBLIC KEY-----');
    });
  });
});

