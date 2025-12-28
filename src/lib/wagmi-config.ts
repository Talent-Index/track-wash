import { createConfig, http } from 'wagmi';
import { mainnet, polygon, avalanche, avalancheFuji, arbitrum, base, optimism } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// WalletConnect Project ID from environment
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'trackwash-demo-id';

export const config = createConfig({
  // Avalanche chains first for TrackWash
  chains: [avalanche, avalancheFuji, mainnet, polygon, arbitrum, base, optimism],
  connectors: [
    injected(),
    walletConnect({ 
      projectId,
      metadata: {
        name: 'TrackWash',
        description: 'On-demand car wash booking with crypto payments',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://trackwash.app',
        icons: ['https://trackwash.app/logo.png'],
      },
    }),
  ],
  transports: {
    [avalanche.id]: http(),
    [avalancheFuji.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
  },
});

// Stablecoin contract addresses
export const STABLECOINS: Record<number, { USDC?: string; USDT?: string }> = {
  [mainnet.id]: {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
  [polygon.id]: {
    USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  },
  [avalanche.id]: {
    USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    USDT: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
  },
  [avalancheFuji.id]: {
    // Fuji testnet USDC
    USDC: '0x5425890298aed601595a70AB815c96711a31Bc65',
  },
  [arbitrum.id]: {
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  },
  [base.id]: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  [optimism.id]: {
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
  },
};

// Chain names for display
export const CHAIN_NAMES: Record<number, string> = {
  [mainnet.id]: 'Ethereum',
  [polygon.id]: 'Polygon',
  [avalanche.id]: 'Avalanche',
  [avalancheFuji.id]: 'Avalanche Fuji (Testnet)',
  [arbitrum.id]: 'Arbitrum',
  [base.id]: 'Base',
  [optimism.id]: 'Optimism',
};

// ERC20 ABI for transfers
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
] as const;

// TrackWash payment receiver address (replace with actual)
export const PAYMENT_RECEIVER_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f1e0E3';
