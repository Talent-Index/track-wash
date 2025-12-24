import { cn } from '@/lib/utils';
import { BookingStatus } from '@/store/appStore';
import { Check, Clock, MapPin, Sparkles, Car, CreditCard, Star, X } from 'lucide-react';

interface StatusBadgeProps {
  status: BookingStatus | 'available' | 'busy' | 'offline' | 'pending' | 'approved' | 'suspended';
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: string; icon: React.ReactNode }> = {
  pending_payment: { label: 'Pending Payment', variant: 'badge-warning', icon: <CreditCard className="w-3 h-3" /> },
  payment_confirmed: { label: 'Payment Confirmed', variant: 'badge-success', icon: <Check className="w-3 h-3" /> },
  booking_confirmed: { label: 'Booking Confirmed', variant: 'badge-success', icon: <Check className="w-3 h-3" /> },
  detailer_assigned: { label: 'Detailer Assigned', variant: 'badge-primary', icon: <Check className="w-3 h-3" /> },
  en_route: { label: 'En Route', variant: 'badge-primary', icon: <Car className="w-3 h-3" /> },
  in_progress: { label: 'In Progress', variant: 'badge-primary', icon: <Sparkles className="w-3 h-3" /> },
  completed: { label: 'Completed', variant: 'badge-success', icon: <Check className="w-3 h-3" /> },
  rated: { label: 'Rated', variant: 'badge-success', icon: <Star className="w-3 h-3" /> },
  cancelled: { label: 'Cancelled', variant: 'badge-error', icon: <X className="w-3 h-3" /> },
  available: { label: 'Available', variant: 'badge-success', icon: <Check className="w-3 h-3" /> },
  busy: { label: 'Busy', variant: 'badge-warning', icon: <Clock className="w-3 h-3" /> },
  offline: { label: 'Offline', variant: 'badge-error', icon: <MapPin className="w-3 h-3" /> },
  pending: { label: 'Pending', variant: 'badge-warning', icon: <Clock className="w-3 h-3" /> },
  approved: { label: 'Approved', variant: 'badge-success', icon: <Check className="w-3 h-3" /> },
  suspended: { label: 'Suspended', variant: 'badge-error', icon: <X className="w-3 h-3" /> },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'badge-status bg-muted text-muted-foreground', icon: null };

  return (
    <span className={cn(config.variant, className)}>
      {config.icon}
      {config.label}
    </span>
  );
}
