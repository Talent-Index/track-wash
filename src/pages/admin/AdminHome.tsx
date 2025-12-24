import { Link } from 'react-router-dom';
import { LayoutDashboard, Calendar, DollarSign, Users, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

export default function AdminHome() {
  const { bookings, detailers, payouts } = useAppStore();

  const todayBookings = bookings.filter((b) => b.scheduledDate === new Date().toISOString().split('T')[0]);
  const totalRevenue = bookings.filter((b) => b.status !== 'cancelled').reduce((sum, b) => sum + b.totalPrice, 0);
  const activeDetailers = detailers.filter((d) => d.isOnline && d.status === 'approved').length;
  const pendingPayouts = payouts.filter((p) => p.status === 'pending').length;

  const stats = [
    { label: "Today's Bookings", value: todayBookings.length, icon: Calendar, color: 'text-primary', link: '/admin/bookings?filter=today' },
    { label: 'Total Revenue', value: `KES ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-success', link: '/admin/analytics' },
    { label: 'Active Detailers', value: activeDetailers, icon: Users, color: 'text-accent', link: '/admin/detailers' },
    { label: 'Pending Payouts', value: pendingPayouts, icon: TrendingUp, color: 'text-warning', link: '/admin/payouts?status=pending' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-card border-b border-border">
        <div className="container section-padding py-6">
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">TrackWash Operations Overview</p>
        </div>
      </div>

      <div className="container section-padding py-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {stats.map((stat) => (
            <Link key={stat.label} to={stat.link} className="card-interactive p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-sm text-primary">
                <span>View details</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>

        <div className="card-elevated p-5">
          <h2 className="font-semibold text-foreground mb-4">Recent Bookings</h2>
          <div className="space-y-3">
            {bookings.slice(0, 5).map((b) => (
              <Link key={b.id} to={`/admin/booking/${b.id}`} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                <div>
                  <p className="font-medium text-foreground">{b.packageName}</p>
                  <p className="text-sm text-muted-foreground">{b.customerName} • {b.vehiclePlate}</p>
                </div>
                <span className="text-sm font-medium text-primary">KES {b.totalPrice.toLocaleString()}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
