import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { avalanche, avalancheFuji } from 'wagmi/chains';
import { Wallet, ChevronDown, LogOut, Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { CHAIN_NAMES } from '@/lib/wagmi-config';

interface ConnectWalletButtonProps {
  onConnect?: (address: string, chainId: number) => void;
  compact?: boolean;
}

export function ConnectWalletButton({ onConnect, compact = false }: ConnectWalletButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const { address, isConnected, isConnecting } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  const { data: balance } = useBalance({
    address,
  });

  const handleConnect = async (connectorId: number) => {
    const connector = connectors[connectorId];
    if (connector) {
      connect({ connector }, {
        onSuccess: (data) => {
          setShowModal(false);
          toast({
            title: 'Wallet connected',
            description: `Connected to ${shortenAddress(data.accounts[0])}`,
          });
          if (onConnect) {
            onConnect(data.accounts[0], data.chainId);
          }
        },
        onError: (error) => {
          toast({
            title: 'Connection failed',
            description: error.message,
            variant: 'destructive',
          });
        },
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: 'Wallet disconnected',
    });
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Address copied!' });
    }
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleSwitchToAvalanche = () => {
    // Switch to Avalanche Fuji for testing, or mainnet for production
    const targetChain = import.meta.env.PROD ? avalanche : avalancheFuji;
    switchChain({ chainId: targetChain.id });
  };

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="font-mono">{shortenAddress(address)}</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Connected Wallet</span>
              <span className="text-xs font-medium">{CHAIN_NAMES[chainId] || `Chain ${chainId}`}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{shortenAddress(address)}</span>
              <button onClick={copyAddress} className="p-1 hover:bg-muted rounded">
                {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            {balance && (
              <div className="text-sm">
                <span className="text-muted-foreground">Balance: </span>
                <span className="font-medium">
                  {(Number(balance.value) / 10 ** balance.decimals).toFixed(4)} {balance.symbol}
                </span>
              </div>
            )}
          </div>
          <DropdownMenuSeparator />
          {chainId !== avalanche.id && chainId !== avalancheFuji.id && (
            <DropdownMenuItem onClick={handleSwitchToAvalanche}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Switch to Avalanche
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        disabled={isConnecting || isPending}
        variant={compact ? "outline" : "default"}
        className={compact ? "gap-2" : "btn-primary gap-2"}
      >
        {(isConnecting || isPending) ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wallet className="w-4 h-4" />
        )}
        {compact ? 'Connect' : 'Connect Wallet'}
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md" aria-describedby="wallet-connect-description">
          <DialogHeader>
            <DialogTitle className="text-center">Connect Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <p id="wallet-connect-description" className="text-sm text-muted-foreground text-center mb-4">
              Choose your preferred wallet to connect
            </p>
            {connectors.length === 0 ? (
              <p className="text-sm text-destructive text-center py-4">
                No wallet connectors available. Please install a wallet extension.
              </p>
            ) : (
              connectors.map((connector, index) => (
                <Button
                  key={connector.uid}
                  onClick={() => handleConnect(index)}
                  variant="outline"
                  className="w-full justify-start gap-3 h-14"
                  disabled={isPending}
                >
                  {connector.name === 'WalletConnect' ? (
                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-medium">{connector.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {connector.name === 'WalletConnect' 
                        ? 'Scan with mobile wallet' 
                        : 'Browser extension'}
                    </p>
                  </div>
                </Button>
              ))
            )}
            <p className="text-xs text-muted-foreground text-center mt-4">
              By connecting, you agree to our Terms of Service
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
