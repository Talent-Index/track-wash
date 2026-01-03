import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Plus, 
  Car, 
  DollarSign, 
  Clock,
  CheckCircle
} from 'lucide-react';
import { format, startOfDay } from 'date-fns';

interface Wash {
  id: string;
  service_type: string;
  amount: number;
  payment_method: string;
  vehicle_plate: string | null;
  created_at: string;
}

const SERVICE_TYPES = [
  { value: 'basic', label: 'Basic Wash', price: 300 },
  { value: 'standard', label: 'Standard Wash', price: 500 },
  { value: 'premium', label: 'Premium Wash', price: 800 },
  { value: 'interior', label: 'Interior Clean', price: 600 },
  { value: 'full', label: 'Full Detail', price: 1500 },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'card', label: 'Card' },
];

export default function OperatorDashboard() {
  const { user } = useAuth();
  const { operatorInfo, loading: roleLoading } = useUserRole();
  const [todayWashes, setTodayWashes] = useState<Wash[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // New wash form
  const [serviceType, setServiceType] = useState('basic');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [customAmount, setCustomAmount] = useState('');

  useEffect(() => {
    if (operatorInfo?.branch_id) {
      fetchTodayWashes();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('operator-washes')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'washes',
            filter: `branch_id=eq.${operatorInfo.branch_id}`
          },
          (payload) => {
            setTodayWashes(prev => [payload.new as Wash, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [operatorInfo?.branch_id]);

  async function fetchTodayWashes() {
    if (!operatorInfo?.branch_id) return;
    
    setLoading(true);
    try {
      const today = startOfDay(new Date());
      
      const { data, error } = await supabase
        .from('washes')
        .select('*')
        .eq('branch_id', operatorInfo.branch_id)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodayWashes(data || []);
    } catch (error) {
      console.error('Error fetching washes:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleNewWash = async () => {
    if (!operatorInfo?.id || !operatorInfo?.branch_id) {
      toast.error('Operator not properly configured');
      return;
    }

    setSubmitting(true);
    try {
      const selectedService = SERVICE_TYPES.find(s => s.value === serviceType);
      const amount = customAmount ? parseFloat(customAmount) : selectedService?.price || 0;

      const { error } = await supabase
        .from('washes')
        .insert({
          branch_id: operatorInfo.branch_id,
          operator_id: operatorInfo.id,
          service_type: serviceType,
          amount,
          payment_method: paymentMethod,
          vehicle_plate: vehiclePlate.trim() || null
        });

      if (error) throw error;

      toast.success('Wash logged successfully!');
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to log wash');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setServiceType('basic');
    setPaymentMethod('cash');
    setVehiclePlate('');
    setCustomAmount('');
  };

  const todayTotal = todayWashes.reduce((acc, w) => acc + Number(w.amount), 0);
  const selectedService = SERVICE_TYPES.find(s => s.value === serviceType);

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!operatorInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="card-elevated max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              You are not assigned to any branch. Please contact your manager.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Header */}
      <div className="gradient-hero border-b border-border">
        <div className="section-padding py-6">
          <h1 className="text-2xl font-bold text-foreground">
            {operatorInfo.branch?.name || 'Your Branch'}
          </h1>
          <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      <div className="section-padding py-6 space-y-6">
        {/* Primary Action - New Wash */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full btn-primary h-16 text-lg shadow-glow">
              <Plus className="w-6 h-6 mr-2" />
              New Wash
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Log New Wash</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger className="input-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((service) => (
                      <SelectItem key={service.value} value={service.value}>
                        {service.label} - KES {service.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount (KES)</Label>
                <Input
                  type="number"
                  placeholder={`Default: ${selectedService?.price || 0}`}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="input-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vehicle Plate (Optional)</Label>
                <Input
                  placeholder="e.g., KDA 123A"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                  className="input-field"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleNewWash} 
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? 'Saving...' : 'Log Wash'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="card-elevated">
            <CardContent className="p-4 text-center">
              <Car className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{todayWashes.length}</p>
              <p className="text-sm text-muted-foreground">Cars Today</p>
            </CardContent>
          </Card>
          
          <Card className="card-elevated">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">
                {todayTotal.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">KES Today</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Washes */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Today's Washes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayWashes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No washes logged today. Tap "New Wash" to get started.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {todayWashes.map((wash) => (
                  <div 
                    key={wash.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground capitalize">
                          {wash.service_type} wash
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {wash.vehicle_plate || 'No plate'} • {format(new Date(wash.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">KES {Number(wash.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground capitalize">{wash.payment_method}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
