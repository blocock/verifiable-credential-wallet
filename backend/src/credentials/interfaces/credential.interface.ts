export interface Credential {
  id: string;
  type: string;
  claims: Record<string, any>;
  issuer: string;
  issuedAt: string;
  proof: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    signatureValue: string;
  };
}

