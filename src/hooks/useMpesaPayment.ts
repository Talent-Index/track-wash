import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MpesaPaymentResult {
  success: boolean;
  checkoutRequestId?: string;
  error?: string;
}

interface MpesaStatusResult {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  receipt?: string;
  error?: string;
}

export function useMpesaPayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle');
  
  const initiatePayment = async (
    phone: string,
    amount: number,
    bookingId: string
  ): Promise<MpesaPaymentResult> => {
    setIsLoading(true);
    setError(null);
    setPaymentStatus('pending');
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('mpesa-stk-push', {
        body: { phone, amount, bookingId },
      });
      
      if (invokeError) {
        throw new Error(invokeError.message);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setCheckoutRequestId(data.checkoutRequestId);
      setPaymentStatus('processing');
      
      return {
        success: true,
        checkoutRequestId: data.checkoutRequestId,
      };
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Payment initiation failed';
      setError(errorMessage);
      setPaymentStatus('failed');
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkStatus = async (checkoutId?: string): Promise<MpesaStatusResult> => {
    const id = checkoutId || checkoutRequestId;
    if (!id) {
      return { status: 'pending', error: 'No checkout request ID' };
    }
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('mpesa-status', {
        body: {},
        // Pass as query param
      });
      
      // Alternative: use fetch directly with query params
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mpesa-status?checkoutRequestId=${id}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      
      const result = await response.json();
      
      if (result.error) {
        return { status: 'pending', error: result.error };
      }
      
      const status = result.status as 'pending' | 'processing' | 'completed' | 'failed';
      setPaymentStatus(status);
      
      return {
        status,
        receipt: result.receipt,
      };
      
    } catch (err: unknown) {
      console.error('Status check failed:', err);
      return { status: 'pending', error: 'Failed to check status' };
    }
  };
  
  const pollStatus = async (
    onComplete: (receipt: string) => void,
    onFailed: (error: string) => void,
    maxAttempts = 30,
    intervalMs = 2000
  ) => {
    let attempts = 0;
    
    const poll = async () => {
      attempts++;
      const result = await checkStatus();
      
      if (result.status === 'completed' && result.receipt) {
        onComplete(result.receipt);
        return;
      }
      
      if (result.status === 'failed') {
        onFailed(result.error || 'Payment failed');
        return;
      }
      
      if (attempts >= maxAttempts) {
        onFailed('Payment confirmation timeout');
        return;
      }
      
      setTimeout(poll, intervalMs);
    };
    
    poll();
  };
  
  const reset = () => {
    setIsLoading(false);
    setError(null);
    setCheckoutRequestId(null);
    setPaymentStatus('idle');
  };
  
  return {
    isLoading,
    error,
    checkoutRequestId,
    paymentStatus,
    initiatePayment,
    checkStatus,
    pollStatus,
    reset,
  };
}
