
import { useState, useCallback, useRef } from 'react';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 30000,
};

export const useRetryableRequest = (config: Partial<RetryConfig> = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const consecutiveFailures = useRef(0);
  const circuitBreakerOpenUntil = useRef(0);

  const executeRequest = useCallback(async <T>(
    requestFn: () => Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void
  ): Promise<T | null> => {
    // Check circuit breaker
    const now = Date.now();
    if (consecutiveFailures.current >= fullConfig.circuitBreakerThreshold) {
      if (now < circuitBreakerOpenUntil.current) {
        const timeLeft = Math.ceil((circuitBreakerOpenUntil.current - now) / 1000);
        const errorMsg = `Too many failures. Retrying in ${timeLeft} seconds...`;
        setError(errorMsg);
        onError?.(errorMsg);
        return null;
      }
      // Reset circuit breaker after timeout
      consecutiveFailures.current = 0;
    }

    setIsLoading(true);
    setError(null);

    for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
      try {
        const result = await requestFn();
        
        // Success - reset failure counter
        consecutiveFailures.current = 0;
        setIsLoading(false);
        onSuccess?.(result);
        return result;
      } catch (err) {
        console.error(`Request attempt ${attempt + 1} failed:`, err);
        
        if (attempt === fullConfig.maxRetries) {
          // Final attempt failed
          consecutiveFailures.current++;
          
          if (consecutiveFailures.current >= fullConfig.circuitBreakerThreshold) {
            circuitBreakerOpenUntil.current = now + fullConfig.circuitBreakerTimeout;
          }
          
          const errorMessage = err instanceof Error ? err.message : 'Request failed';
          setError(errorMessage);
          setIsLoading(false);
          onError?.(errorMessage);
          return null;
        } else {
          // Wait before retry with exponential backoff
          const delay = Math.min(
            fullConfig.baseDelay * Math.pow(2, attempt),
            fullConfig.maxDelay
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    return null;
  }, [fullConfig]);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
    consecutiveFailures.current = 0;
    circuitBreakerOpenUntil.current = 0;
  }, []);

  return {
    executeRequest,
    isLoading,
    error,
    reset,
    isCircuitBreakerOpen: consecutiveFailures.current >= fullConfig.circuitBreakerThreshold
  };
};
