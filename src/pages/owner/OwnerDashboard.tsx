import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Car, 
  Building2, 
  Users, 
  TrendingUp, 
  Plus,
  Gift,
  Download,
  RefreshCw
} from 'lucide-react';
import { format, startOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  todayRevenue: number;
  monthlyRevenue: number;
  totalWashes: number;
  activeBranches: number;
  activeOperators: number;
  loyaltyLiability: number;
}

interface BranchPerformance {
  id: string;
  name: string;
  todayRevenue: number;
  todayWashes: number;
}

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { business, loading: roleLoading, needsOnboarding } = useUserRole();
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    monthlyRevenue: 0,
    totalWashes: 0,
    activeBranches: 0,
    activeOperators: 0,
    loyaltyLiability: 0
  });
  const [branchPerformance, setBranchPerformance] = useState<BranchPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect to onboarding if needed
  useEffect(() => {
    if (!roleLoading && needsOnboarding) {
      navigate('/owner/onboarding');
    }
  }, [roleLoading, needsOnboarding, navigate]);

  useEffect(() => {
    if (business?.id) {
      fetchDashboardData();
      
      // Set up realtime subscription for washes
      const channel = supabase
        .channel('owner-washes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'washes' },
          () => {
            fetchDashboardData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [business?.id]);

  async function fetchDashboardData() {
    if (!business?.id) return;
    
    setLoading(true);
    try {
      const today = startOfDay(new Date());
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());

      // Get all branches for this business
      const { data: branches } = await supabase
        .from('branches')
        .select('id, name, is_active')
        .eq('business_id', business.id);

      const branchIds = branches?.map(b => b.id) || [];
      const activeBranches = branches?.filter(b => b.is_active).length || 0;

      // Get operators count
      const { count: operatorsCount } = await supabase
        .from('operators')
        .select('id', { count: 'exact', head: true })
        .in('branch_id', branchIds)
        .eq('is_active', true);

      // Get today's washes
      const { data: todayWashes } = await supabase
        .from('washes')
        .select('amount, branch_id')
        .in('branch_id', branchIds)
        .gte('created_at', today.toISOString());

      // Get monthly washes
      const { data: monthlyWashes } = await supabase
        .from('washes')
        .select('amount')
        .in('branch_id', branchIds)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      // Get total washes count
      const { count: totalWashesCount } = await supabase
        .from('washes')
        .select('id', { count: 'exact', head: true })
        .in('branch_id', branchIds);

      // Get loyalty liability (free washes earned but not redeemed)
      const { data: loyaltyData } = await supabase
        .from('loyalty_accounts')
        .select('free_washes_earned, free_washes_redeemed')
        .eq('business_id', business.id);

      const loyaltyLiability = loyaltyData?.reduce(
        (acc, l) => acc + (l.free_washes_earned - l.free_washes_redeemed),
        0
      ) || 0;

      // Calculate stats
      const todayRevenue = todayWashes?.reduce((acc, w) => acc + Number(w.amount), 0) || 0;
      const monthlyRevenue = monthlyWashes?.reduce((acc, w) => acc + Number(w.amount), 0) || 0;

      // Calculate branch performance
      const branchStats = branches?.map(branch => {
        const branchWashes = todayWashes?.filter(w => w.branch_id === branch.id) || [];
        return {
          id: branch.id,
          name: branch.name,
          todayRevenue: branchWashes.reduce((acc, w) => acc + Number(w.amount), 0),
          todayWashes: branchWashes.length
        };
      }) || [];

      setStats({
        todayRevenue,
        monthlyRevenue,
        totalWashes: totalWashesCount || 0,
        activeBranches,
        activeOperators: operatorsCount || 0,
        loyaltyLiability
      });

      setBranchPerformance(branchStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    const curr = business?.currency || 'KES';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (roleLoading || loading) {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{business?.name}</h1>
              <p className="text-muted-foreground">Owner Dashboard</p>
            </div>
            <Button onClick={fetchDashboardData} variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="section-padding py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Today's Revenue</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(stats.todayRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(stats.monthlyRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Car className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Cars Washed</p>
                  <p className="text-lg font-bold text-foreground">{stats.totalWashes.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active Branches</p>
                  <p className="text-lg font-bold text-foreground">{stats.activeBranches}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          <Button 
            onClick={() => navigate('/owner/branches/new')} 
            className="btn-primary whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Branch
          </Button>
          <Button 
            onClick={() => navigate('/owner/operators')} 
            variant="outline"
            className="whitespace-nowrap"
          >
            <Users className="w-4 h-4 mr-2" />
            Manage Operators
          </Button>
          <Button 
            variant="outline"
            className="whitespace-nowrap"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Branch Performance */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Branch Performance (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {branchPerformance.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No branches yet. Add your first branch to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {branchPerformance.map((branch) => (
                  <div 
                    key={branch.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">{branch.name}</p>
                      <p className="text-sm text-muted-foreground">{branch.todayWashes} washes</p>
                    </div>
                    <p className="font-bold text-success">{formatCurrency(branch.todayRevenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loyalty Overview */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="w-5 h-5 text-accent" />
              Loyalty Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl bg-warning/10">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding Free Washes</p>
                <p className="text-2xl font-bold text-foreground">{stats.loyaltyLiability}</p>
              </div>
              <Gift className="w-8 h-8 text-warning" />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              These are free washes earned by customers but not yet redeemed.
            </p>
          </CardContent>
        </Card>

        {/* Operators */}
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Operators
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/owner/operators')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-foreground">{stats.activeOperators}</p>
              <p className="text-sm text-muted-foreground">Active operators</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
