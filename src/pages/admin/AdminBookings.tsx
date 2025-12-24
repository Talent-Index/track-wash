import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore, BookingStatus, nairobiAreas } from '@/store/appStore';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function AdminBookings() {
  const [searchParams] = useSearchParams();
  const { bookings } = useAppStore();
  
  const filterParam = searchParams.get('filter');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(filterParam === 'today' ? 'all' : 'all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const today = new Date().toISOString().split('T')[0];
  
  const filteredBookings = bookings.filter((b) => {
    // Filter by today if requested
    if (filterParam === 'today' && b.scheduledDate !== today) return false;
    
    // Search filter
    if (search && !b.customerName.toLowerCase().includes(search.toLowerCase()) && 
        !b.vehiclePlate.toLowerCase().includes(search.toLowerCase()) &&
        !b.id.toLowerCase().includes(search.toLowerCase())) return false;
    
    // Status filter
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    
    // Area filter
    if (areaFilter !== 'all' && !b.location?.includes(areaFilter)) return false;
    
    // Payment filter
    if (paymentFilter !== 'all' && b.paymentMethod !== paymentFilter) return false;
    
    return true;
  });

  const statuses: BookingStatus[] = [
    'pending_payment', 'payment_confirmed', 'booking_confirmed', 
    'detailer_assigned', 'en_route', 'in_progress', 'completed', 'rated', 'cancelled'
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-card border-b border-border">
        <div className="container section-padding py-6">
          <h1 className="text-2xl font-bold text-foreground">
            {filterParam === 'today' ? "Today's Bookings" : 'All Bookings'}
          </h1>
          <p className="text-muted-foreground">
            {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      <div className="container section-padding py-6">
        {/* Filters */}
        <div className="card-elevated p-4 mb-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, plate..."
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All areas</SelectItem>
                {nairobiAreas.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="card-elevated p-8 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">No bookings found</h3>
              <p className="text-muted-foreground text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            filteredBookings.map((b) => (
              <Link
                key={b.id}
                to={`/admin/booking/${b.id}`}
                className="card-interactive p-4 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground truncate">{b.packageName}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {b.customerName} • {b.vehiclePlate} • {b.scheduledDate}
                  </p>
                  {b.location && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{b.location}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="text-right">
                    <p className="font-semibold text-primary">KES {b.totalPrice.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground capitalize">{b.paymentMethod || 'pending'}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
