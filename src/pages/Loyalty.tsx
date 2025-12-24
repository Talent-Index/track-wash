import { Gift, Star, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Loyalty() {
  const { currentUser, loyaltyProgress, redeemReward } = useAppStore();

  const progress = loyaltyProgress.find((l) => l.userId === currentUser?.id || l.userId === 'customer');
  const points = progress?.points || 0;
  const totalWashes = progress?.totalWashes || 0;
  const redeemed = progress?.redeemedRewards || 0;

  const canRedeem = points >= 10;

  const handleRedeem = () => {
    redeemReward(currentUser?.id || 'customer');
    toast({ title: 'Reward redeemed!', description: 'Your free wash has been added to your account.' });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-hero">
        <div className="container section-padding py-12 text-center">
          <div className="w-20 h-20 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Gift className="w-10 h-10 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">TrackWash Rewards</h1>
          <p className="text-muted-foreground">Every 10th wash is on us!</p>
        </div>
      </div>

      <div className="container section-padding -mt-8">
        {/* Punch Card */}
        <div className="card-elevated p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-foreground">Your Progress</h2>
            <span className="text-sm text-muted-foreground">{points}/10 washes</span>
          </div>

          <div className="grid grid-cols-5 gap-3 mb-6">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'aspect-square rounded-xl flex items-center justify-center transition-all duration-300',
                  i < points
                    ? 'gradient-primary text-primary-foreground shadow-glow animate-scale-in'
                    : 'bg-secondary text-muted-foreground'
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {i < points ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-bold">{i + 1}</span>
                )}
              </div>
            ))}
          </div>

          {canRedeem ? (
            <Button className="btn-accent w-full" onClick={handleRedeem}>
              <Gift className="w-5 h-5 mr-2" />
              Redeem Free Wash
            </Button>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                {10 - points} more wash{10 - points !== 1 ? 'es' : ''} until your free wash!
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card-elevated p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{totalWashes}</p>
            <p className="text-sm text-muted-foreground">Total washes</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-3xl font-bold text-accent">{redeemed}</p>
            <p className="text-sm text-muted-foreground">Free washes earned</p>
          </div>
        </div>

        {/* Rules */}
        <div className="card-elevated p-6">
          <h2 className="font-semibold text-foreground mb-4">How it works</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Star className="w-3 h-3 text-primary" />
              </div>
              Complete 10 washes to earn 1 free wash
            </li>
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Star className="w-3 h-3 text-primary" />
              </div>
              Free wash value up to KES 1,000
            </li>
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Star className="w-3 h-3 text-primary" />
              </div>
              Funded 100% by TrackWash — thank you for your loyalty!
            </li>
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Star className="w-3 h-3 text-primary" />
              </div>
              Points never expire
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
