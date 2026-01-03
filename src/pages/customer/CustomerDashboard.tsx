import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Gift, Car, History, Star, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface LoyaltyAccount {
  id: string;
  business_id: string;
  washes_count: number;
  free_washes_earned: number;
  free_washes_redeemed: number;
  business_name?: string;
}

interface WashHistory {
  id: string;
  service_type: string;
  amount: number;
  created_at: string;
  branch_name?: string;
}

export default function CustomerDashboard() {
  const { user, profile } = useAuth();
  const [loyaltyAccounts, setLoyaltyAccounts] = useState<LoyaltyAccount[]>([]);
  const [washHistory, setWashHistory] = useState<WashHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchCustomerData();
    }
  }, [user?.id]);

  async function fetchCustomerData() {
    setLoading(true);
    try {
      // Fetch loyalty accounts
      const { data: loyaltyData } = await supabase
        .from('loyalty_accounts')
        .select(`
          id,
          business_id,
          washes_count,
          free_washes_earned,
          free_washes_redeemed,
          businesses:business_id (name)
        `)
        .eq('customer_id', user?.id);

      if (loyaltyData) {
        setLoyaltyAccounts(
          loyaltyData.map((la: any) => ({
            ...la,
            business_name: la.businesses?.name
          }))
        );
      }

      // Fetch wash history
      const { data: washData } = await supabase
        .from('washes')
        .select(`
          id,
          service_type,
          amount,
          created_at,
          branches:branch_id (name)
        `)
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (washData) {
        setWashHistory(
          washData.map((w: any) => ({
            ...w,
            branch_name: w.branches?.name
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalWashes = loyaltyAccounts.reduce((acc, la) => acc + la.washes_count, 0);
  const availableFreeWashes = loyaltyAccounts.reduce(
    (acc, la) => acc + (la.free_washes_earned - la.free_washes_redeemed),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Header */}
      <div className="gradient-hero border-b border-border">
        <div className="section-padding py-6">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {profile?.full_name?.split(' ')[0] || 'Customer'}!
          </h1>
          <p className="text-muted-foreground">Your car wash loyalty dashboard</p>
        </div>
      </div>

      <div className="section-padding py-6 space-y-6">
        {/* Free Washes Alert */}
        {availableFreeWashes > 0 && (
          <Card className="card-elevated gradient-accent text-accent-foreground animate-pulse-glow">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Gift className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-lg">You have {availableFreeWashes} FREE wash{availableFreeWashes > 1 ? 'es' : ''}!</p>
                <p className="text-sm opacity-90">Redeem at any participating branch</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="card-elevated">
            <CardContent className="p-4 text-center">
              <Car className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{totalWashes}</p>
              <p className="text-sm text-muted-foreground">Total Washes</p>
            </CardContent>
          </Card>
          
          <Card className="card-elevated">
            <CardContent className="p-4 text-center">
              <Star className="w-8 h-8 text-warning mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{availableFreeWashes}</p>
              <p className="text-sm text-muted-foreground">Free Washes</p>
            </CardContent>
          </Card>
        </div>

        {/* Loyalty Progress */}
        {loyaltyAccounts.map((account) => {
          const progressToNext = (account.washes_count % 10) * 10;
          const washesUntilFree = 10 - (account.washes_count % 10);
          
          return (
            <Card key={account.id} className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  {account.business_name || 'Car Wash'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress to next free wash</span>
                    <span className="font-medium text-foreground">{account.washes_count % 10}/10</span>
                  </div>
                  <Progress value={progressToNext} className="h-3" />
                </div>
                
                <p className="text-sm text-muted-foreground text-center">
                  {washesUntilFree === 10 
                    ? "Start washing to earn loyalty points!" 
                    : `${washesUntilFree} more wash${washesUntilFree > 1 ? 'es' : ''} until your next free wash!`}
                </p>

                {account.free_washes_earned - account.free_washes_redeemed > 0 && (
                  <div className="p-3 rounded-xl bg-success/10 text-center">
                    <p className="font-medium text-success">
                      {account.free_washes_earned - account.free_washes_redeemed} free wash available!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {loyaltyAccounts.length === 0 && (
          <Card className="card-elevated">
            <CardContent className="p-8 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-foreground mb-2">No Loyalty Account Yet</h3>
              <p className="text-muted-foreground">
                Get your first car wash at a participating location to start earning points!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Wash History */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Wash History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {washHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No wash history yet. Your washes will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {washHistory.map((wash) => (
                  <div 
                    key={wash.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/30"
                  >
                    <div>
                      <p className="font-medium text-foreground capitalize">{wash.service_type} wash</p>
                      <p className="text-xs text-muted-foreground">
                        {wash.branch_name || 'Branch'} • {format(new Date(wash.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <p className="font-bold text-foreground">KES {Number(wash.amount).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
