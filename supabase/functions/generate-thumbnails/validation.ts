
import { ValidationResult } from './types.ts';

export const validateEnvironment = (): void => {
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  for (const envVar of requiredEnvVars) {
    if (!Deno.env.get(envVar)) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
};

export const validatePdfData = (pdfArrayBuffer: ArrayBuffer): ValidationResult => {
  console.log('Validating PDF data...');
  
  if (!pdfArrayBuffer || pdfArrayBuffer.byteLength === 0) {
    return { valid: false, error: 'PDF data is empty' };
  }

  // Check PDF header
  const header = new Uint8Array(pdfArrayBuffer.slice(0, 8));
  const pdfSignature = [0x25, 0x50, 0x44, 0x46]; // %PDF
  
  for (let i = 0; i < 4; i++) {
    if (header[i] !== pdfSignature[i]) {
      return { valid: false, error: 'Invalid PDF signature - file may be corrupted' };
    }
  }

  console.log(`PDF validation passed - size: ${pdfArrayBuffer.byteLength} bytes`);
  return { valid: true };
};
