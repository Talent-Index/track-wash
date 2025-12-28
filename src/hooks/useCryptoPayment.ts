import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { STABLECOINS, ERC20_ABI, PAYMENT_RECEIVER_ADDRESS, CHAIN_NAMES } from '@/lib/wagmi-config';
import { supabase } from '@/integrations/supabase/client';

interface CryptoPaymentResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export function useCryptoPayment() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'USDT'>('USDC');
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  // Get native balance for gas
  const { data: nativeBalance } = useBalance({ address });
  
  // Fetch token balance
  useEffect(() => {
    async function fetchBalance() {
      if (!address || !chainId) return;
      
      const tokenAddress = STABLECOINS[chainId]?.[selectedToken];
      if (!tokenAddress) {
        setTokenBalance('0');
        return;
      }
      
      setIsLoadingBalance(true);
      try {
        // This would need a proper balance fetch - simplified for now
        setTokenBalance('--');
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        setTokenBalance('0');
      } finally {
        setIsLoadingBalance(false);
      }
    }
    
    fetchBalance();
  }, [address, chainId, selectedToken]);
  
  const connectWallet = async () => {
    const connector = connectors[0]; // Use first available connector
    if (connector) {
      connect({ connector });
    }
  };
  
  const getAvailableTokens = () => {
    if (!chainId) return [];
    const tokens = STABLECOINS[chainId] || {};
    return Object.keys(tokens) as ('USDC' | 'USDT')[];
  };
  
  const sendPayment = async (
    amountUsd: number,
    bookingId: string
  ): Promise<CryptoPaymentResult> => {
    if (!address || !chainId) {
      return { success: false, error: 'Wallet not connected' };
    }
    
    const tokenAddress = STABLECOINS[chainId]?.[selectedToken];
    if (!tokenAddress) {
      return { success: false, error: `${selectedToken} not available on this chain` };
    }
    
    try {
      // Most stablecoins have 6 decimals
      const decimals = 6;
      const amount = parseUnits(amountUsd.toString(), decimals);
      
      const txHash = await writeContractAsync({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [PAYMENT_RECEIVER_ADDRESS as `0x${string}`, amount],
      } as any); // Type assertion to handle wagmi version differences
      
      // Record payment in database
      const { error: dbError } = await supabase.functions.invoke('crypto-payment', {
        body: {
          bookingId,
          txHash,
          walletAddress: address,
          chainId,
          tokenSymbol: selectedToken,
          amountUsd,
        },
      });
      
      if (dbError) {
        console.error('Failed to record payment:', dbError);
      }
      
      return { success: true, txHash };
      
    } catch (error: unknown) {
      console.error('Crypto payment failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      return { success: false, error: errorMessage };
    }
  };
  
  return {
    // Wallet state
    address,
    isConnected,
    isConnecting,
    chainId,
    chainName: chainId ? CHAIN_NAMES[chainId] : undefined,
    
    // Actions
    connectWallet,
    disconnect,
    switchChain,
    
    // Token state
    selectedToken,
    setSelectedToken,
    tokenBalance,
    isLoadingBalance,
    availableTokens: getAvailableTokens(),
    
    // Native balance for gas
    nativeBalance: nativeBalance ? formatUnits(nativeBalance.value, nativeBalance.decimals) : '0',
    
    // Payment
    sendPayment,
  };
}
