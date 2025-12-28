// API client for TrackWash backend (Render)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://trackwash-api.onrender.com';

interface StkPushRequest {
  bookingId: string;
  phone: string;
  amountKes: number;
}

interface StkPushResponse {
  success: boolean;
  CheckoutRequestID: string;
  MerchantRequestID: string;
  ResponseDescription: string;
  error?: string;
}

interface MpesaStatusResponse {
  success: boolean;
  status: 'pending' | 'success' | 'failed' | 'timeout';
  ResultCode?: string;
  ResultDesc?: string;
  MpesaReceiptNumber?: string;
  TransactionDate?: string;
  PhoneNumber?: string;
  error?: string;
}

/**
 * Normalize phone number to 2547XXXXXXXX format
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('0')) {
    // 07XXXXXXXX -> 2547XXXXXXXX
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('7')) {
    // 7XXXXXXXX -> 2547XXXXXXXX
    cleaned = '254' + cleaned;
  } else if (cleaned.startsWith('254')) {
    // Already in correct format
  } else if (cleaned.startsWith('+254')) {
    cleaned = cleaned.substring(1);
  }
  
  return cleaned;
}

/**
 * Validate phone number format
 */
export function isValidKenyanPhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Should be 2547XXXXXXXX (12 digits)
  return /^254[17]\d{8}$/.test(normalized);
}

/**
 * Initiate M-Pesa STK Push
 */
export async function mpesaStkPush(data: StkPushRequest): Promise<StkPushResponse> {
  const response = await fetch(`${API_BASE_URL}/api/payments/mpesa/stkpush`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bookingId: data.bookingId,
      phone: normalizePhoneNumber(data.phone),
      amountKes: data.amountKes,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'Failed to initiate STK push');
  }

  return response.json();
}

/**
 * Check M-Pesa payment status
 */
export async function mpesaStatus(checkoutRequestId: string): Promise<MpesaStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/payments/mpesa/status/${checkoutRequestId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'Failed to check payment status');
  }

  return response.json();
}

/**
 * Poll M-Pesa status with timeout
 */
export async function pollMpesaStatus(
  checkoutRequestId: string,
  options: {
    maxAttempts?: number;
    intervalMs?: number;
    onStatusChange?: (status: MpesaStatusResponse) => void;
  } = {}
): Promise<MpesaStatusResponse> {
  const { maxAttempts = 24, intervalMs = 2500, onStatusChange } = options;
  
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const status = await mpesaStatus(checkoutRequestId);
      
      if (onStatusChange) {
        onStatusChange(status);
      }
      
      if (status.status === 'success' || status.status === 'failed') {
        return status;
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error) {
      console.error('Error polling M-Pesa status:', error);
      // Continue polling on error
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  
  // Timeout
  return {
    success: false,
    status: 'timeout',
    error: 'Payment confirmation timed out. Please check your M-Pesa messages.',
  };
}
