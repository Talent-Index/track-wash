import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Car, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Plus,
  Wallet,
  Phone,
  Loader2,
  Sparkles,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { servicePackages, ServiceType, PaymentMethod } from '@/store/appStore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { GoogleMapsProvider, LocationPicker, MapPreview, LocationData } from '@/components/maps';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { mpesaStkPush, pollMpesaStatus, normalizePhoneNumber, isValidKenyanPhone } from '@/lib/api';
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';
import { useAccount } from 'wagmi';

const steps = [
  { id: 1, title: 'Service Type', icon: Car },
  { id: 2, title: 'Package', icon: Sparkles },
  { id: 3, title: 'Vehicle', icon: Car },
  { id: 4, title: 'Schedule', icon: Calendar },
  { id: 5, title: 'Location', icon: MapPin },
  { id: 6, title: 'Confirm', icon: Check },
  { id: 7, title: 'Payment', icon: CreditCard },
];

type MpesaPaymentState = 'idle' | 'sending_stk' | 'waiting' | 'success' | 'failed' | 'timeout';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  license_plate: string | null;
  vehicle_type: string | null;
}

export default function NewBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { address: walletAddress, isConnected: walletConnected, chainId } = useAccount();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [serviceType, setServiceType] = useState<ServiceType>('doorstep');
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isAsap, setIsAsap] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleMake, setNewVehicleMake] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehicleType, setNewVehicleType] = useState<'sedan' | 'suv' | 'hatchback' | 'pickup' | 'van'>('sedan');
  
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState(profile?.phone || '+254');
  
  // M-Pesa payment state
  const [mpesaState, setMpesaState] = useState<MpesaPaymentState>('idle');
  const [mpesaCheckoutId, setMpesaCheckoutId] = useState<string | null>(null);
  const [mpesaReceipt, setMpesaReceipt] = useState<string | null>(null);
  const [mpesaError, setMpesaError] = useState<string | null>(null);
  const [pollStartTime, setPollStartTime] = useState<number | null>(null);
  
  // User vehicles from Supabase
  const [userVehicles, setUserVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  
  // Current booking ID
  const [bookingId, setBookingId] = useState<string | null>(null);

  const pkg = servicePackages.find((p) => p.id === selectedPackage);
  const vehicle = userVehicles.find((v) => v.id === selectedVehicle);

  // Fetch user vehicles
  useEffect(() => {
    async function fetchVehicles() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, license_plate, vehicle_type')
        .eq('owner_id', user.id);
      
      if (!error && data) {
        setUserVehicles(data);
      }
      setLoadingVehicles(false);
    }
    
    fetchVehicles();
  }, [user]);

  // Pre-select from URL params
  useEffect(() => {
    const detailerId = searchParams.get('detailer');
    const stationId = searchParams.get('station');
    if (detailerId) setServiceType('doorstep');
    if (stationId) setServiceType('station');
  }, [searchParams]);

  // Update phone when profile loads
  useEffect(() => {
    if (profile?.phone && mpesaPhone === '+254') {
      setMpesaPhone(profile.phone);
    }
  }, [profile]);

  const calculatePrices = () => {
    const basePrice = pkg?.price || 0;
    const opsCost = Math.round(basePrice * 0.15);
    const platformFee = Math.round(basePrice * 0.08);
    const total = basePrice + opsCost + platformFee;
    return { basePrice, opsCost, platformFee, total };
  };

  const { basePrice, opsCost, platformFee, total } = calculatePrices();

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!serviceType;
      case 2: return !!selectedPackage;
      case 3: return !!selectedVehicle;
      case 4: return isAsap || (scheduledDate && scheduledTime);
      case 5: return serviceType === 'station' || !!locationData;
      case 6: return true;
      case 7: return !!paymentMethod;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddVehicle = async () => {
    if (!newVehiclePlate || !newVehicleMake || !newVehicleModel || !user) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    
    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        owner_id: user.id,
        make: newVehicleMake,
        model: newVehicleModel,
        license_plate: newVehiclePlate.toUpperCase(),
        vehicle_type: newVehicleType,
      })
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Failed to add vehicle', description: error.message, variant: 'destructive' });
      return;
    }
    
    setUserVehicles([...userVehicles, data]);
    setSelectedVehicle(data.id);
    toast({ title: 'Vehicle added!' });
    setShowAddVehicle(false);
    setNewVehiclePlate('');
    setNewVehicleMake('');
    setNewVehicleModel('');
  };

  const handleConfirmBooking = () => {
    if (paymentMethod === 'crypto') {
      setShowCryptoModal(true);
    } else {
      setShowMpesaModal(true);
      setMpesaState('idle');
      setMpesaError(null);
    }
  };

  const createBookingInSupabase = async (): Promise<string | null> => {
    if (!user || !pkg || !vehicle) return null;
    
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        customer_id: user.id,
        vehicle_id: vehicle.id,
        service_type: serviceType === 'doorstep' ? 'at_location' : 'at_branch',
        scheduled_date: isAsap ? new Date().toISOString().split('T')[0] : scheduledDate,
        scheduled_time: isAsap ? null : scheduledTime,
        location_address: locationData?.formattedAddress,
        location_lat: locationData?.lat,
        location_lng: locationData?.lng,
        location_area: locationData?.area,
        status: 'created',
        notes: `Package: ${pkg.name}`,
      })
      .select('id, booking_code')
      .single();
    
    if (error) {
      toast({ title: 'Failed to create booking', description: error.message, variant: 'destructive' });
      return null;
    }
    
    return data.id;
  };

  const handleMpesaPayment = async () => {
    if (!isValidKenyanPhone(mpesaPhone)) {
      toast({ title: 'Invalid phone number', description: 'Enter a valid Kenyan phone number', variant: 'destructive' });
      return;
    }
    
    setMpesaState('sending_stk');
    setMpesaError(null);
    
    try {
      // Create booking first if not exists
      let currentBookingId = bookingId;
      if (!currentBookingId) {
        currentBookingId = await createBookingInSupabase();
        if (!currentBookingId) {
          setMpesaState('failed');
          return;
        }
        setBookingId(currentBookingId);
      }
      
      // Initiate STK Push
      const stkResponse = await mpesaStkPush({
        bookingId: currentBookingId,
        phone: mpesaPhone,
        amountKes: total,
      });
      
      if (!stkResponse.success) {
        throw new Error(stkResponse.error || 'Failed to initiate payment');
      }
      
      setMpesaCheckoutId(stkResponse.CheckoutRequestID);
      setMpesaState('waiting');
      setPollStartTime(Date.now());
      
      // Update booking with checkout ID
      await supabase
        .from('bookings')
        .update({ status: 'created' })
        .eq('id', currentBookingId);
      
      // Start polling
      const result = await pollMpesaStatus(stkResponse.CheckoutRequestID, {
        maxAttempts: 24, // 60 seconds
        intervalMs: 2500,
        onStatusChange: (status) => {
          if (status.status === 'success') {
            setMpesaReceipt(status.MpesaReceiptNumber || null);
          }
        },
      });
      
      if (result.status === 'success') {
        setMpesaState('success');
        setMpesaReceipt(result.MpesaReceiptNumber || null);
        
        // Update booking status
        await supabase
          .from('bookings')
          .update({ status: 'paid' })
          .eq('id', currentBookingId);
        
        // Create payment record
        await supabase
          .from('payments')
          .insert({
            booking_id: currentBookingId,
            payment_method: 'mpesa',
            amount_kes: total,
            status: 'completed',
            mpesa_checkout_request_id: stkResponse.CheckoutRequestID,
            mpesa_receipt_number: result.MpesaReceiptNumber,
            phone_number: normalizePhoneNumber(mpesaPhone),
            paid_at: new Date().toISOString(),
          });
        
        toast({ title: 'Payment successful!', description: `Receipt: ${result.MpesaReceiptNumber}` });
        
        // Navigate to booking detail after short delay
        setTimeout(() => {
          navigate(`/booking/${currentBookingId}`);
        }, 2000);
        
      } else if (result.status === 'failed') {
        setMpesaState('failed');
        setMpesaError(result.ResultDesc || 'Payment was declined');
      } else {
        setMpesaState('timeout');
        setMpesaError('Payment confirmation timed out. Check your M-Pesa messages.');
      }
      
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      setMpesaState('failed');
      setMpesaError(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  const handleResendStk = () => {
    setMpesaState('idle');
    setMpesaCheckoutId(null);
    setMpesaError(null);
  };

  const handleCryptoPayment = async () => {
    if (!walletConnected || !walletAddress) {
      toast({ title: 'Please connect your wallet first', variant: 'destructive' });
      return;
    }
    
    // Create booking if not exists
    let currentBookingId = bookingId;
    if (!currentBookingId) {
      currentBookingId = await createBookingInSupabase();
      if (!currentBookingId) return;
      setBookingId(currentBookingId);
    }
    
    // Save wallet address to booking and create pending payment
    await supabase
      .from('bookings')
      .update({ status: 'created' })
      .eq('id', currentBookingId);
    
    await supabase
      .from('payments')
      .insert({
        booking_id: currentBookingId,
        payment_method: 'crypto',
        amount_kes: total,
        status: 'pending',
        wallet_address: walletAddress,
        chain_id: chainId,
      });
    
    toast({ 
      title: 'Wallet connected!', 
      description: 'Your wallet address has been saved. Crypto transfers coming soon.',
    });
    
    navigate(`/booking/${currentBookingId}`);
  };

  const getElapsedTime = () => {
    if (!pollStartTime) return 0;
    return Math.floor((Date.now() - pollStartTime) / 1000);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Progress */}
      <div className="bg-card border-b border-border sticky top-16 z-40">
        <div className="container section-padding py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Step {currentStep} of 7</span>
            <span className="text-sm text-muted-foreground">{steps[currentStep - 1].title}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full gradient-primary transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 7) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="container section-padding py-6">
        <div className="max-w-xl mx-auto">
          {/* Step 1: Service Type */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-6">Choose service type</h2>
              <div className="grid gap-4">
                {[
                  { type: 'doorstep' as ServiceType, title: 'Doorstep', desc: 'We come to you anywhere in Nairobi' },
                  { type: 'station' as ServiceType, title: 'Station', desc: 'Visit one of our partner locations' },
                ].map((option) => (
                  <button
                    key={option.type}
                    onClick={() => setServiceType(option.type)}
                    className={cn(
                      'p-5 rounded-xl border-2 text-left transition-all duration-200',
                      serviceType === option.type
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">{option.title}</h3>
                        <p className="text-muted-foreground text-sm mt-1">{option.desc}</p>
                      </div>
                      {serviceType === option.type && (
                        <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Package */}
          {currentStep === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-6">Select a package</h2>
              <div className="grid gap-4">
                {servicePackages.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPackage(p.id)}
                    className={cn(
                      'p-5 rounded-xl border-2 text-left transition-all duration-200',
                      selectedPackage === p.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground text-lg">{p.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            {p.duration}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-primary mt-1">KES {p.price.toLocaleString()}</p>
                        <p className="text-muted-foreground text-sm mt-2">{p.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {p.features.slice(0, 3).map((f) => (
                            <span key={f} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                              {f}
                            </span>
                          ))}
                          {p.features.length > 3 && (
                            <span className="text-xs text-primary">+{p.features.length - 3} more</span>
                          )}
                        </div>
                      </div>
                      {selectedPackage === p.id && (
                        <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center ml-4">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Vehicle */}
          {currentStep === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-6">Select your vehicle</h2>
              {loadingVehicles ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid gap-4">
                  {userVehicles.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVehicle(v.id)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4',
                        selectedVehicle === v.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      )}
                    >
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                        <Car className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{v.make} {v.model}</h3>
                        <p className="text-sm text-muted-foreground">{v.license_plate} • {v.vehicle_type}</p>
                      </div>
                      {selectedVehicle === v.id && (
                        <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowAddVehicle(true)}
                    className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/30 text-left transition-all duration-200 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Add new vehicle</h3>
                      <p className="text-sm text-muted-foreground">Register a new car</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Schedule */}
          {currentStep === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-6">When do you need it?</h2>
              <div className="space-y-4">
                <button
                  onClick={() => setIsAsap(true)}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4',
                    isAsap ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">ASAP</h3>
                    <p className="text-sm text-muted-foreground">Get the next available slot</p>
                  </div>
                  {isAsap && (
                    <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center ml-auto">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-4 text-sm text-muted-foreground">or schedule</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-1.5 block">Date</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => { setScheduledDate(e.target.value); setIsAsap(false); }}
                      className="input-field"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Time</Label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => { setScheduledTime(e.target.value); setIsAsap(false); }}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Location */}
          {currentStep === 5 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                {serviceType === 'doorstep' ? 'Where should we come?' : 'Confirm location'}
              </h2>
              {serviceType === 'doorstep' ? (
                <GoogleMapsProvider>
                  <LocationPicker
                    value={locationData}
                    onChange={setLocationData}
                  />
                </GoogleMapsProvider>
              ) : (
                <div className="card-elevated p-4">
                  <p className="text-muted-foreground text-sm">
                    You'll be visiting a partner station. Details will be provided after booking.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 6: Confirm */}
          {currentStep === 6 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-6">Confirm your booking</h2>
              <div className="card-elevated p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium text-foreground">{pkg?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="font-medium text-foreground">{vehicle?.make} {vehicle?.model} ({vehicle?.license_plate})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">When</span>
                  <span className="font-medium text-foreground">
                    {isAsap ? 'ASAP' : `${scheduledDate} at ${scheduledTime}`}
                  </span>
                </div>
                {serviceType === 'doorstep' && locationData && (
                  <>
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium text-foreground text-right max-w-[60%]">{locationData.formattedAddress}</span>
                    </div>
                    <div className="pt-2">
                      <MapPreview lat={locationData.lat} lng={locationData.lng} height="120px" />
                    </div>
                  </>
                )}
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Base price</span>
                    <span className="text-foreground">KES {basePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Detailer ops</span>
                    <span className="text-foreground">KES {opsCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Platform fee</span>
                    <span className="text-foreground">KES {platformFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-xl font-bold text-primary">KES {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Payment */}
          {currentStep === 7 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-6">Choose payment method</h2>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="space-y-4">
                <label
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    paymentMethod === 'crypto' ? 'border-primary bg-primary/5' : 'border-border'
                  )}
                >
                  <RadioGroupItem value="crypto" id="crypto" />
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Pay with Crypto</p>
                    <p className="text-sm text-muted-foreground">Connect wallet • AVAX/USDC</p>
                  </div>
                  {walletConnected && (
                    <div className="text-xs text-success">Connected</div>
                  )}
                </label>
                <label
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    paymentMethod === 'mpesa' ? 'border-primary bg-primary/5' : 'border-border'
                  )}
                >
                  <RadioGroupItem value="mpesa" id="mpesa" />
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Pay with M-Pesa</p>
                    <p className="text-sm text-muted-foreground">Instant STK Push</p>
                  </div>
                </label>
              </RadioGroup>

              <div className="mt-6 p-4 bg-secondary/30 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  Amount to pay: <span className="font-bold text-foreground">KES {total.toLocaleString()}</span>
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-4 mt-8">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back
              </Button>
            )}
            {currentStep < 7 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="btn-primary flex-1"
              >
                Continue
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleConfirmBooking}
                disabled={!canProceed()}
                className="btn-primary flex-1"
              >
                Pay Now
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Add Vehicle Dialog */}
      <Dialog open={showAddVehicle} onOpenChange={setShowAddVehicle}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add new vehicle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-sm mb-1.5 block">Make</Label>
              <Input
                value={newVehicleMake}
                onChange={(e) => setNewVehicleMake(e.target.value)}
                placeholder="e.g., Toyota"
                className="input-field"
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Model</Label>
              <Input
                value={newVehicleModel}
                onChange={(e) => setNewVehicleModel(e.target.value)}
                placeholder="e.g., Camry"
                className="input-field"
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">License plate</Label>
              <Input
                value={newVehiclePlate}
                onChange={(e) => setNewVehiclePlate(e.target.value)}
                placeholder="KDA 123A"
                className="input-field uppercase"
              />
            </div>
            <Button onClick={handleAddVehicle} className="btn-primary w-full">
              Add Vehicle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crypto Payment Modal */}
      <Dialog open={showCryptoModal} onOpenChange={setShowCryptoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay with Crypto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {!walletConnected ? (
              <>
                <div className="p-4 bg-secondary/30 rounded-xl text-center">
                  <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Connect your wallet to continue</p>
                </div>
                <ConnectWalletButton onConnect={() => {}} />
              </>
            ) : (
              <>
                <div className="p-4 bg-success/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <span className="text-success font-medium">Wallet Connected</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    {walletAddress?.slice(0, 10)}...{walletAddress?.slice(-8)}
                  </p>
                </div>
                
                <div className="p-4 bg-secondary/30 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">Amount to pay:</p>
                  <p className="text-2xl font-bold text-foreground">KES {total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ≈ ${(total / 130).toFixed(2)} USD
                  </p>
                </div>
                
                <Button 
                  onClick={handleCryptoPayment} 
                  className="btn-primary w-full"
                >
                  Save Wallet & Continue
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  Crypto transfers coming soon. Your wallet will be saved for payment.
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* M-Pesa Payment Modal */}
      <Dialog open={showMpesaModal} onOpenChange={(open) => {
        if (!open && mpesaState !== 'waiting') {
          setShowMpesaModal(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay with M-Pesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Idle state - enter phone */}
            {mpesaState === 'idle' && (
              <>
                <div>
                  <Label className="text-sm mb-1.5 block">Phone number</Label>
                  <Input
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="0712345678"
                    className="input-field"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Accepted formats: 07XXXXXXXX, +2547XXXXXXXX, 2547XXXXXXXX
                  </p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-xl">
                  <p className="text-sm text-muted-foreground">
                    Amount: <span className="font-bold text-foreground">KES {total.toLocaleString()}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    An STK push will be sent to your phone. Enter your M-Pesa PIN to complete payment.
                  </p>
                </div>
                <Button 
                  onClick={handleMpesaPayment} 
                  className="btn-primary w-full"
                >
                  Send STK Push
                </Button>
              </>
            )}

            {/* Sending STK */}
            {mpesaState === 'sending_stk' && (
              <div className="py-8 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="font-medium text-foreground">Sending STK Push...</p>
                <p className="text-sm text-muted-foreground mt-1">Please wait</p>
              </div>
            )}

            {/* Waiting for confirmation */}
            {mpesaState === 'waiting' && (
              <div className="py-4 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <p className="font-medium text-foreground">Check your phone</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your M-Pesa PIN to complete payment
                </p>
                <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Waiting for confirmation... {getElapsedTime()}s
                  </p>
                </div>
                {getElapsedTime() > 30 && (
                  <Button 
                    onClick={handleResendStk} 
                    variant="outline" 
                    className="mt-4"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend STK Push
                  </Button>
                )}
              </div>
            )}

            {/* Success */}
            {mpesaState === 'success' && (
              <div className="py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <p className="font-medium text-foreground text-lg">Payment Successful!</p>
                {mpesaReceipt && (
                  <div className="mt-4 p-3 bg-success/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Receipt Number</p>
                    <p className="font-mono font-bold text-foreground">{mpesaReceipt}</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-4">
                  Redirecting to your booking...
                </p>
              </div>
            )}

            {/* Failed */}
            {mpesaState === 'failed' && (
              <div className="py-4 text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-10 h-10 text-destructive" />
                </div>
                <p className="font-medium text-foreground">Payment Failed</p>
                <p className="text-sm text-destructive mt-2">{mpesaError}</p>
                <div className="flex gap-2 mt-6">
                  <Button 
                    onClick={handleResendStk} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowMpesaModal(false);
                      setPaymentMethod('crypto');
                      setShowCryptoModal(true);
                    }} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Use Crypto
                  </Button>
                </div>
              </div>
            )}

            {/* Timeout */}
            {mpesaState === 'timeout' && (
              <div className="py-4 text-center">
                <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10 text-warning" />
                </div>
                <p className="font-medium text-foreground">Confirmation Timed Out</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {mpesaError}
                </p>
                <div className="flex gap-2 mt-6">
                  <Button 
                    onClick={handleResendStk} 
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend STK
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
