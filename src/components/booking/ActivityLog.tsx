import { Check, Clock, Car, Sparkles, Star, X, DollarSign, User, Mail } from 'lucide-react';
import { Booking, BookingStatus, EmailLog } from '@/store/appStore';
import { cn } from '@/lib/utils';

interface ActivityLogProps {
  booking: Booking;
  emailLogs: EmailLog[];
}

const statusIcons: Record<BookingStatus | 'email', React.ReactNode> = {
  pending_payment: <Clock className="w-4 h-4" />,
  payment_confirmed: <DollarSign className="w-4 h-4" />,
  booking_confirmed: <Check className="w-4 h-4" />,
  detailer_assigned: <User className="w-4 h-4" />,
  en_route: <Car className="w-4 h-4" />,
  in_progress: <Sparkles className="w-4 h-4" />,
  completed: <Check className="w-4 h-4" />,
  rated: <Star className="w-4 h-4" />,
  cancelled: <X className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
};

const statusLabels: Record<BookingStatus, string> = {
  pending_payment: 'Booking created',
  payment_confirmed: 'Payment confirmed',
  booking_confirmed: 'Booking confirmed',
  detailer_assigned: 'Detailer assigned',
  en_route: 'Detailer en route',
  in_progress: 'Service started',
  completed: 'Service completed',
  rated: 'Customer rated',
  cancelled: 'Booking cancelled',
};

interface LogEntry {
  id: string;
  type: 'status' | 'email';
  label: string;
  timestamp: string;
  note?: string;
  icon: React.ReactNode;
  variant: 'primary' | 'success' | 'warning' | 'error' | 'muted';
}

export function ActivityLog({ booking, emailLogs }: ActivityLogProps) {
  // Combine status history and email logs
  const entries: LogEntry[] = [];

  // Add status history
  booking.statusHistory.forEach((h) => {
    entries.push({
      id: `status-${h.status}-${h.timestamp}`,
      type: 'status',
      label: statusLabels[h.status],
      timestamp: h.timestamp,
      note: h.note,
      icon: statusIcons[h.status],
      variant: h.status === 'cancelled' ? 'error' : h.status.includes('confirmed') || h.status === 'completed' ? 'success' : 'primary',
    });
  });

  // Add email logs for this booking
  const bookingEmails = emailLogs.filter((e) => e.bookingId === booking.id);
  bookingEmails.forEach((e) => {
    entries.push({
      id: `email-${e.id}`,
      type: 'email',
      label: `Email sent: ${e.subject}`,
      timestamp: e.sentAt,
      note: `To: ${e.to}`,
      icon: statusIcons.email,
      variant: 'muted',
    });
  });

  // Sort by timestamp descending (newest first)
  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const variantClasses: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-destructive/10 text-destructive',
    muted: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="card-elevated p-5">
      <h2 className="font-semibold text-foreground mb-4">Activity Log</h2>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
              variantClasses[entry.variant]
            )}>
              {entry.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{entry.label}</p>
              {entry.note && (
                <p className="text-xs text-muted-foreground">{entry.note}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(entry.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
