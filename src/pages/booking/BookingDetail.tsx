import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Check, 
  Clock, 
  Car, 
  Sparkles, 
  Star, 
  MessageCircle, 
  X, 
  DollarSign,
  Phone,
  Wallet,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAppStore, BookingStatus, PaymentMethod } from '@/store/appStore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ActivityLog } from '@/components/booking/ActivityLog';

const statusSteps: { status: BookingStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'payment_confirmed', label: 'Payment Confirmed', icon: <DollarSign className="w-4 h-4" /> },
  { status: 'booking_confirmed', label: 'Booking Confirmed', icon: <Check className="w-4 h-4" /> },
  { status: 'detailer_assigned', label: 'Detailer Assigned', icon: <Check className="w-4 h-4" /> },
  { status: 'en_route', label: 'Detailer En Route', icon: <Car className="w-4 h-4" /> },
  { status: 'in_progress', label: 'Service In Progress', icon: <Sparkles className="w-4 h-4" /> },
  { status: 'completed', label: 'Completed', icon: <Check className="w-4 h-4" /> },
  { status: 'rated', label: 'Rated', icon: <Star className="w-4 h-4" /> },
];

const cannedMessages = [
  "Hi! I'm on my way",
  "How long will you be?",
  "I'll be there in 10 minutes",
  "Please hurry up",
  "Take your time, no rush",
  "Is there parking available?",
];

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    bookings, 
    currentUser, 
    updateBookingStatus, 
    cancelBooking, 
    rateBooking, 
    tipBooking,
    assignDetailer,
    detailers,
    addEmailLog,
    emailLogs,
    updateLoyalty
  } = useAppStore();

  const booking = bookings.find((b) => b.id === id);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const [tipAmount, setTipAmount] = useState('');
  const [tipMethod, setTipMethod] = useState<PaymentMethod>('mpesa');
  const [rating, setRating] = useState(0);
  const [selectedDetailer, setSelectedDetailer] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Booking not found</h2>
          <Button onClick={() => navigate('/history')}>View History</Button>
        </div>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex((s) => s.status === booking.status);
  const isCustomer = currentUser?.role === 'customer';
  const isDetailer = currentUser?.role === 'detailer';
  const isAdmin = currentUser?.role === 'admin';

  const handleStatusUpdate = (newStatus: BookingStatus) => {
    updateBookingStatus(booking.id, newStatus);
    addEmailLog({
      to: 'customer@email.com',
      subject: `Booking Update: ${newStatus.replace('_', ' ')}`,
      type: 'booking_confirmed',
      bookingId: booking.id,
    });
    toast({ title: 'Status updated' });
  };

  const handleCancel = () => {
    cancelBooking(booking.id);
    setShowCancelModal(false);
    toast({ title: 'Booking cancelled' });
    navigate('/history');
  };

  const handleTip = () => {
    setIsProcessing(true);
    setTimeout(() => {
      tipBooking(booking.id, parseInt(tipAmount), tipMethod);
      setShowTipModal(false);
      setIsProcessing(false);
      toast({ title: 'Tip sent!', description: `KES ${tipAmount} sent to ${booking.detailerName}` });
    }, 1500);
  };

  const handleRate = () => {
    rateBooking(booking.id, rating);
    setShowRatingModal(false);
    toast({ title: 'Thanks for rating!' });
  };

  const handleAssign = () => {
    if (!selectedDetailer) return;
    assignDetailer(booking.id, selectedDetailer);
    setShowAssignModal(false);
    toast({ title: 'Detailer assigned!' });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container section-padding py-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm text-muted-foreground">Booking #{booking.id.slice(0, 8)}</span>
              <h1 className="text-2xl font-bold text-foreground mt-1">{booking.packageName}</h1>
              <p className="text-muted-foreground">{booking.vehicleNickname} • {booking.vehiclePlate}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">KES {booking.totalPrice.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">
                {booking.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Crypto'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container section-padding py-6">
        {/* Status Timeline */}
        <div className="card-elevated p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-6">Status</h2>
          <div className="space-y-4">
            {statusSteps.map((step, i) => {
              const isCompleted = i <= currentStepIndex && booking.status !== 'cancelled';
              const isCurrent = step.status === booking.status;
              
              return (
                <div key={step.status} className="flex items-start gap-4">
                  <div className="relative">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                        isCompleted
                          ? 'gradient-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground',
                        isCurrent && 'animate-pulse-glow'
                      )}
                    >
                      {step.icon}
                    </div>
                    {i < statusSteps.length - 1 && (
                      <div
                        className={cn(
                          'absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-8',
                          isCompleted ? 'bg-primary' : 'bg-border'
                        )}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className={cn('font-medium', isCompleted ? 'text-foreground' : 'text-muted-foreground')}>
                      {step.label}
                    </p>
                    {booking.statusHistory.find((h) => h.status === step.status) && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.statusHistory.find((h) => h.status === step.status)!.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {booking.status === 'cancelled' && (
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center">
                  <X className="w-4 h-4 text-destructive-foreground" />
                </div>
                <div>
                  <p className="font-medium text-destructive">Cancelled</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Booking Details */}
        <div className="card-elevated p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-4">Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service type</span>
              <span className="text-foreground capitalize">{booking.serviceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Scheduled</span>
              <span className="text-foreground">{booking.scheduledDate} at {booking.scheduledTime}</span>
            </div>
            {booking.location && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="text-foreground text-right max-w-[60%]">{booking.location}</span>
              </div>
            )}
            {booking.detailerName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Detailer</span>
                <span className="text-foreground">{booking.detailerName}</span>
              </div>
            )}
            {booking.mpesaReceipt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">M-Pesa Receipt</span>
                <span className="text-foreground font-mono">{booking.mpesaReceipt}</span>
              </div>
            )}
            {booking.txHash && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tx Hash</span>
                <span className="text-foreground font-mono text-xs">{booking.txHash}</span>
              </div>
            )}
            {booking.rating && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Rating</span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-4 h-4',
                        i < booking.rating! ? 'text-warning fill-warning' : 'text-muted'
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Customer Actions */}
          {isCustomer && booking.status !== 'cancelled' && (
            <>
              {booking.detailerName && !['completed', 'rated', 'cancelled'].includes(booking.status) && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowMessageModal(true)}
                >
                  <MessageCircle className="w-5 h-5 mr-3" />
                  Message detailer
                </Button>
              )}
              {['completed', 'rated'].includes(booking.status) && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowTipModal(true)}
                >
                  <DollarSign className="w-5 h-5 mr-3" />
                  Tip detailer
                </Button>
              )}
              {booking.status === 'completed' && !booking.rating && (
                <Button
                  className="btn-primary w-full justify-start"
                  onClick={() => setShowRatingModal(true)}
                >
                  <Star className="w-5 h-5 mr-3" />
                  Rate this service
                </Button>
              )}
              {!['completed', 'rated', 'cancelled'].includes(booking.status) && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() => setShowCancelModal(true)}
                >
                  <X className="w-5 h-5 mr-3" />
                  Cancel booking
                </Button>
              )}
            </>
          )}

          {/* Detailer Actions */}
          {isDetailer && booking.detailerId === currentUser?.id && (
            <>
              {booking.status === 'detailer_assigned' && (
                <Button className="btn-primary w-full" onClick={() => handleStatusUpdate('en_route')}>
                  <Car className="w-5 h-5 mr-2" />
                  Start trip / En route
                </Button>
              )}
              {booking.status === 'en_route' && (
                <Button className="btn-primary w-full" onClick={() => handleStatusUpdate('in_progress')}>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Arrived - Start service
                </Button>
              )}
              {booking.status === 'in_progress' && (
                <Button className="btn-primary w-full" onClick={() => handleStatusUpdate('completed')}>
                  <Check className="w-5 h-5 mr-2" />
                  Complete service
                </Button>
              )}
            </>
          )}

          {/* Admin Actions */}
          {isAdmin && (
            <>
              {booking.status === 'payment_confirmed' && (
                <Button className="btn-primary w-full" onClick={() => handleStatusUpdate('booking_confirmed')}>
                  <Check className="w-5 h-5 mr-2" />
                  Confirm booking
                </Button>
              )}
              {booking.status === 'booking_confirmed' && !booking.detailerId && (
                <Button className="btn-primary w-full" onClick={() => setShowAssignModal(true)}>
                  Assign detailer
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel booking?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">This action cannot be undone.</p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowCancelModal(false)}>
              Keep booking
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Modal */}
      <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {booking.detailerName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {cannedMessages.map((msg) => (
              <Button
                key={msg}
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => {
                  toast({ title: 'Message sent', description: msg });
                  setShowMessageModal(false);
                }}
              >
                {msg}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Tip Modal */}
      <Dialog open={showTipModal} onOpenChange={setShowTipModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tip {booking.detailerName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-sm mb-1.5 block">Amount (KES)</Label>
              <Input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                placeholder="e.g., 200"
                className="input-field"
              />
            </div>
            <RadioGroup value={tipMethod} onValueChange={(v) => setTipMethod(v as PaymentMethod)}>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="mpesa" />
                  <Phone className="w-4 h-4" />
                  M-Pesa
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="crypto" />
                  <Wallet className="w-4 h-4" />
                  USDC
                </label>
              </div>
            </RadioGroup>
            <Button
              className="btn-primary w-full"
              onClick={handleTip}
              disabled={!tipAmount || isProcessing}
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send tip'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rating Modal */}
      <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate this service</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-2 py-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'w-10 h-10',
                    star <= rating ? 'text-warning fill-warning' : 'text-muted'
                  )}
                />
              </button>
            ))}
          </div>
          <Button className="btn-primary w-full" onClick={handleRate} disabled={rating === 0}>
            Submit rating
          </Button>
        </DialogContent>
      </Dialog>

      {/* Assign Detailer Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign detailer</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4 max-h-64 overflow-y-auto">
            {detailers
              .filter((d) => d.availability === 'available' && d.status === 'approved')
              .map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDetailer(d.id)}
                  className={cn(
                    'w-full p-3 rounded-lg border-2 text-left flex items-center gap-3',
                    selectedDetailer === d.id ? 'border-primary bg-primary/5' : 'border-border'
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {d.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{d.name}</p>
                    <p className="text-sm text-muted-foreground">{d.area} • {d.rating}★</p>
                  </div>
                  {selectedDetailer === d.id && <Check className="w-5 h-5 text-primary" />}
                </button>
              ))}
          </div>
          <Button className="btn-primary w-full mt-4" onClick={handleAssign} disabled={!selectedDetailer}>
            Assign
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
