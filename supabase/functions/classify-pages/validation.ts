
// Environment variable validation utilities
export const validateEnvironment = () => {
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  for (const envVar of requiredEnvVars) {
    if (!Deno.env.get(envVar)) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
};

export const validatePdfSize = (arrayBuffer: ArrayBuffer): boolean => {
  const maxPdfSize = 50 * 1024 * 1024; // 50MB
  return arrayBuffer.byteLength <= maxPdfSize;
};
