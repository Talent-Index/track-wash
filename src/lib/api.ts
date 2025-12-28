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
  try {
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

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = result?.error || result?.message || result?.ResponseDescription || `HTTP ${response.status}: Request failed`;
      const errorCode = result?.errorCode || result?.ResponseCode || response.status.toString();
      
      // Log detailed error in development
      if (import.meta.env.DEV) {
        console.error('M-Pesa STK Push Error:', { status: response.status, result });
      }
      
      throw new Error(`[${errorCode}] ${errorMessage}`);
    }

    if (!result) {
      throw new Error('Empty response from M-Pesa API');
    }

    if (result.error || result.ResponseCode !== '0') {
      const errorMessage = result.error || result.ResponseDescription || 'STK push request failed';
      throw new Error(errorMessage);
    }

    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to payment server. Please check your connection.');
    }
    throw error;
  }
}

/**
 * Check M-Pesa payment status
 */
export async function mpesaStatus(checkoutRequestId: string): Promise<MpesaStatusResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/mpesa/status/${checkoutRequestId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = result?.error || result?.message || `HTTP ${response.status}: Status check failed`;
      
      if (import.meta.env.DEV) {
        console.error('M-Pesa Status Error:', { status: response.status, result });
      }
      
      throw new Error(errorMessage);
    }

    if (!result) {
      throw new Error('Empty response from status API');
    }

    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to payment server.');
    }
    throw error;
  }
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
