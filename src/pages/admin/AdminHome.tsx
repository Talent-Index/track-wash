import { Link } from 'react-router-dom';
import { Calendar, DollarSign, Users, TrendingUp, ArrowUpRight, Building2, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminHome() {
  // Fetch real counts from Supabase
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [bookingsRes, profilesRes, operatorsRes, branchesRes, paymentsRes] = await Promise.all([
        supabase.from('bookings').select('id, status, created_at', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('operators').select('id, is_active', { count: 'exact' }),
        supabase.from('branches').select('id', { count: 'exact' }),
        supabase.from('payments').select('amount_kes, status'),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayBookings = bookingsRes.data?.filter(
        (b) => b.created_at?.startsWith(today)
      ).length || 0;

      const totalRevenue = paymentsRes.data
        ?.filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + (Number(p.amount_kes) || 0), 0) || 0;

      const activeDetailers = operatorsRes.data?.filter((o) => o.is_active).length || 0;
      const pendingPayments = paymentsRes.data?.filter((p) => p.status === 'pending').length || 0;

      return {
        todayBookings,
        totalBookings: bookingsRes.count || 0,
        totalCustomers: profilesRes.count || 0,
        activeDetailers,
        totalDetailers: operatorsRes.count || 0,
        totalBranches: branchesRes.count || 0,
        totalRevenue,
        pendingPayments,
      };
    },
  });

  // Fetch recent bookings
  const { data: recentBookings } = useQuery({
    queryKey: ['admin-recent-bookings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          created_at,
          service_id,
          services (name, price_kes),
          vehicles (license_plate),
          profiles:customer_id (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const statCards = [
    { label: "Today's Bookings", value: stats?.todayBookings ?? 0, icon: Calendar, color: 'text-primary', link: '/admin/bookings?filter=today' },
    { label: 'Total Revenue', value: `KES ${(stats?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-500', link: '/admin/analytics' },
    { label: 'Active Detailers', value: stats?.activeDetailers ?? 0, icon: Users, color: 'text-blue-500', link: '/admin/detailers' },
    { label: 'Pending Payments', value: stats?.pendingPayments ?? 0, icon: TrendingUp, color: 'text-orange-500', link: '/admin/payouts?status=pending' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-card border-b border-border">
        <div className="container section-padding py-6">
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">TrackWash Operations Overview</p>
        </div>
      </div>

      <div className="container section-padding py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <Link key={stat.label} to={stat.link} className="card-interactive p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-sm text-primary">
                <span>View</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="card-elevated p-5">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Branches</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.totalBranches ?? 0}</p>
          </div>
          <div className="card-elevated p-5">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Customers</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.totalCustomers ?? 0}</p>
          </div>
          <div className="card-elevated p-5">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Bookings</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.totalBookings ?? 0}</p>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="card-elevated p-5">
          <h2 className="font-semibold text-foreground mb-4">Recent Bookings</h2>
          <div className="space-y-3">
            {recentBookings && recentBookings.length > 0 ? (
              recentBookings.map((b: any) => (
                <Link 
                  key={b.id} 
                  to={`/admin/booking/${b.id}`} 
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">{b.services?.name || 'Service'}</p>
                    <p className="text-sm text-muted-foreground">
                      {b.profiles?.full_name || 'Customer'} • {b.vehicles?.license_plate || 'N/A'}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    KES {(b.services?.price_kes || 0).toLocaleString()}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent bookings</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
