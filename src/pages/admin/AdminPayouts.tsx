import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DollarSign, Clock, Check, Phone, Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAppStore, PaymentMethod } from '@/store/appStore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminPayouts() {
  const [searchParams] = useSearchParams();
  const { payouts, detailers, createPayout, approvePayout } = useAppStore();
  
  const statusParam = searchParams.get('status');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<string | null>(null);
  const [payoutMethod, setPayoutMethod] = useState<PaymentMethod>('mpesa');
  const [payoutReference, setPayoutReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredPayouts = statusParam === 'pending' 
    ? payouts.filter((p) => p.status === 'pending')
    : payouts;

  const pendingCount = payouts.filter((p) => p.status === 'pending').length;
  const totalPending = payouts
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleApprovePayout = () => {
    if (!selectedPayout) return;
    setIsProcessing(true);
    
    setTimeout(() => {
      const reference = payoutMethod === 'mpesa' 
        ? 'QK' + Math.random().toString(36).slice(2, 10).toUpperCase()
        : '0x' + Math.random().toString(16).slice(2, 18);
      
      approvePayout(selectedPayout, reference);
      toast({ 
        title: 'Payout approved!', 
        description: `Reference: ${reference}` 
      });
      setShowPayoutModal(false);
      setSelectedPayout(null);
      setPayoutReference('');
      setIsProcessing(false);
    }, 1500);
  };

  const openPayoutModal = (payoutId: string) => {
    setSelectedPayout(payoutId);
    setShowPayoutModal(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-card border-b border-border">
        <div className="container section-padding py-6">
          <h1 className="text-2xl font-bold text-foreground">
            {statusParam === 'pending' ? 'Pending Payouts' : 'All Payouts'}
          </h1>
          <p className="text-muted-foreground">
            Manage detailer payouts
          </p>
        </div>
      </div>

      <div className="container section-padding py-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="card-elevated p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Payouts</p>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              </div>
            </div>
          </div>
          <div className="card-elevated p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pending</p>
                <p className="text-2xl font-bold text-foreground">KES {totalPending.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payouts List */}
        <div className="space-y-3">
          {filteredPayouts.length === 0 ? (
            <div className="card-elevated p-8 text-center">
              <Check className="w-12 h-12 text-success mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">All caught up!</h3>
              <p className="text-muted-foreground text-sm">No pending payouts</p>
            </div>
          ) : (
            filteredPayouts.map((p) => (
              <div
                key={p.id}
                className="card-elevated p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{p.detailerName}</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      p.status === 'pending' && 'bg-warning/10 text-warning',
                      p.status === 'approved' && 'bg-primary/10 text-primary',
                      p.status === 'paid' && 'bg-success/10 text-success',
                    )}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()} • {p.method === 'mpesa' ? 'M-Pesa' : 'Crypto'}
                  </p>
                  {p.reference && (
                    <p className="text-xs text-muted-foreground font-mono mt-1">{p.reference}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <p className="text-lg font-bold text-primary">KES {p.amount.toLocaleString()}</p>
                  {p.status === 'pending' && (
                    <Button size="sm" onClick={() => openPayoutModal(p.id)}>
                      Approve
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Approve Payout Modal */}
      <Dialog open={showPayoutModal} onOpenChange={setShowPayoutModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-sm mb-2 block">Payment Method</Label>
              <RadioGroup value={payoutMethod} onValueChange={(v) => setPayoutMethod(v as PaymentMethod)}>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="mpesa" />
                    <Phone className="w-4 h-4" />
                    M-Pesa
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="crypto" />
                    <Wallet className="w-4 h-4" />
                    Crypto
                  </label>
                </div>
              </RadioGroup>
            </div>
            <Button
              className="btn-primary w-full"
              onClick={handleApprovePayout}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Payout'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
