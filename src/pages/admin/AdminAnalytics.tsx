import { DollarSign, TrendingUp, Users, Calendar, Star, BarChart3 } from 'lucide-react';
import { useAppStore, nairobiAreas, servicePackages } from '@/store/appStore';

export default function AdminAnalytics() {
  const { bookings, detailers, loyaltyProgress } = useAppStore();

  const completedBookings = bookings.filter((b) => ['completed', 'rated'].includes(b.status));
  const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const avgRating = completedBookings.filter((b) => b.rating).reduce((sum, b, _, arr) => sum + (b.rating || 0) / arr.length, 0);
  
  // Revenue by service type
  const revenueByService = servicePackages.map((pkg) => {
    const revenue = completedBookings
      .filter((b) => b.packageId === pkg.id)
      .reduce((sum, b) => sum + b.totalPrice, 0);
    return { name: pkg.name, revenue };
  });

  // Bookings by area
  const bookingsByArea = nairobiAreas.map((area) => {
    const count = bookings.filter((b) => b.location?.includes(area)).length;
    return { area, count };
  }).filter((a) => a.count > 0).sort((a, b) => b.count - a.count);

  // Repeat customers
  const customerBookings: Record<string, number> = {};
  bookings.forEach((b) => {
    customerBookings[b.customerId] = (customerBookings[b.customerId] || 0) + 1;
  });
  const repeatCustomers = Object.values(customerBookings).filter((c) => c > 1).length;
  const totalCustomers = Object.keys(customerBookings).length;
  const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers * 100).toFixed(0) : 0;

  // Loyalty cost estimate
  const totalRedeemedRewards = loyaltyProgress.reduce((sum, l) => sum + l.redeemedRewards, 0);
  const loyaltyCost = totalRedeemedRewards * 1000; // KES 1,000 per free wash

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-card border-b border-border">
        <div className="container section-padding py-6">
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">TrackWash performance metrics</p>
        </div>
      </div>

      <div className="container section-padding py-6">
        {/* KPI Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card-elevated p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <span className="text-sm text-muted-foreground">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-foreground">KES {totalRevenue.toLocaleString()}</p>
          </div>
          <div className="card-elevated p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Completed Washes</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{completedBookings.length}</p>
          </div>
          <div className="card-elevated p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-warning" />
              </div>
              <span className="text-sm text-muted-foreground">Avg Rating</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
          </div>
          <div className="card-elevated p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <span className="text-sm text-muted-foreground">Repeat Rate</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{repeatRate}%</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue by Service */}
          <div className="card-elevated p-5">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Revenue by Service
            </h2>
            <div className="space-y-3">
              {revenueByService.map((item) => {
                const maxRevenue = Math.max(...revenueByService.map((r) => r.revenue));
                const width = maxRevenue > 0 ? (item.revenue / maxRevenue * 100) : 0;
                return (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground">{item.name}</span>
                      <span className="text-muted-foreground">KES {item.revenue.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full gradient-primary transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bookings by Area */}
          <div className="card-elevated p-5">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              Bookings by Area
            </h2>
            <div className="space-y-3">
              {bookingsByArea.slice(0, 6).map((item) => {
                const maxCount = Math.max(...bookingsByArea.map((a) => a.count));
                const width = maxCount > 0 ? (item.count / maxCount * 100) : 0;
                return (
                  <div key={item.area}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground">{item.area}</span>
                      <span className="text-muted-foreground">{item.count} bookings</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Loyalty Stats */}
          <div className="card-elevated p-5">
            <h2 className="font-semibold text-foreground mb-4">Loyalty Program</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary/30 rounded-xl">
                <p className="text-sm text-muted-foreground mb-1">Free Washes Given</p>
                <p className="text-xl font-bold text-foreground">{totalRedeemedRewards}</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-xl">
                <p className="text-sm text-muted-foreground mb-1">Loyalty Cost</p>
                <p className="text-xl font-bold text-foreground">KES {loyaltyCost.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Detailer Stats */}
          <div className="card-elevated p-5">
            <h2 className="font-semibold text-foreground mb-4">Detailer Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary/30 rounded-xl">
                <p className="text-sm text-muted-foreground mb-1">Active Detailers</p>
                <p className="text-xl font-bold text-foreground">
                  {detailers.filter((d) => d.isOnline && d.status === 'approved').length}
                </p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-xl">
                <p className="text-sm text-muted-foreground mb-1">Total Detailers</p>
                <p className="text-xl font-bold text-foreground">{detailers.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
