import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Calendar, Star, ExternalLink, Download, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/hooks/use-toast';

export default function History() {
  const { vehicles, bookings, currentUser } = useAppStore();
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  const userVehicles = vehicles.filter((v) => v.userId === currentUser?.id || v.userId === 'customer');
  const userBookings = bookings.filter((b) => b.customerId === currentUser?.id || b.customerId === 'customer');

  const filteredBookings = selectedVehicle
    ? userBookings.filter((b) => b.vehicleId === selectedVehicle)
    : userBookings;

  const completedBookings = filteredBookings.filter((b) => ['completed', 'rated'].includes(b.status));

  const handleExport = () => {
    toast({ title: 'Export started', description: 'Your service history will be downloaded shortly.' });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-card border-b border-border">
        <div className="container section-padding py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Service History</h1>
              <p className="text-muted-foreground text-sm">Track all washes per vehicle</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="container section-padding py-6">
        {/* Vehicle Selector */}
        <div className="mb-6">
          <p className="text-sm font-medium text-foreground mb-3">Select vehicle</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedVehicle(null)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                !selectedVehicle
                  ? 'gradient-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              )}
            >
              All vehicles
            </button>
            {userVehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v.id)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                  selectedVehicle === v.id
                    ? 'gradient-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                )}
              >
                {v.nickname}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {completedBookings.length === 0 ? (
          <EmptyState
            icon={<Car className="w-8 h-8 text-muted-foreground" />}
            title="No service history yet"
            description="Your completed washes will appear here"
            action={
              <Link to="/booking/new">
                <Button className="btn-primary">Book your first wash</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {completedBookings.map((booking, i) => (
              <Link
                key={booking.id}
                to={`/booking/${booking.id}`}
                className="card-interactive p-4 flex items-center gap-4 animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Car className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{booking.packageName}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {booking.vehicleNickname} • {booking.vehiclePlate}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {booking.scheduledDate}
                    </span>
                    {booking.rating && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-warning fill-warning" />
                        {booking.rating}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">KES {booking.totalPrice.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{booking.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Crypto'}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
