import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2, MapPin, ArrowRight, CheckCircle } from 'lucide-react';

type Step = 'business' | 'branch' | 'complete';

export default function OwnerOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('business');
  const [loading, setLoading] = useState(false);
  
  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [businessId, setBusinessId] = useState<string | null>(null);
  
  const [branchName, setBranchName] = useState('');
  const [branchLocation, setBranchLocation] = useState('');

  const handleCreateBusiness = async () => {
    if (!businessName.trim() || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          name: businessName.trim(),
          owner_id: user.id,
          description: currency // Using description field for currency temporarily
        })
        .select()
        .single();

      if (error) throw error;
      
      setBusinessId(data.id);
      setStep('branch');
      toast.success('Business created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!branchName.trim() || !businessId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('branches')
        .insert({
          name: branchName.trim(),
          business_id: businessId,
          address: branchLocation.trim() || null
        });

      if (error) throw error;
      
      setStep('complete');
      toast.success('Branch created successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/owner/dashboard');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create branch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-3 h-3 rounded-full ${step === 'business' ? 'bg-primary' : 'bg-primary/30'}`} />
          <div className={`w-12 h-0.5 ${step !== 'business' ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`w-3 h-3 rounded-full ${step === 'branch' ? 'bg-primary' : step === 'complete' ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`w-12 h-0.5 ${step === 'complete' ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`w-3 h-3 rounded-full ${step === 'complete' ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        {step === 'business' && (
          <Card className="card-elevated animate-in">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Create Your Business</CardTitle>
              <CardDescription>Let's set up your car wash business profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="e.g., Sparkle Car Wash"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="input-field">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleCreateBusiness} 
                disabled={!businessName.trim() || loading}
                className="w-full btn-primary mt-6"
              >
                {loading ? 'Creating...' : 'Continue'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'branch' && (
          <Card className="card-elevated animate-in">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Add Your First Branch</CardTitle>
              <CardDescription>Where is your car wash located?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="branchName">Branch Name</Label>
                <Input
                  id="branchName"
                  placeholder="e.g., Main Branch, CBD Branch"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="branchLocation">Location (Optional)</Label>
                <Input
                  id="branchLocation"
                  placeholder="e.g., Westlands, Nairobi"
                  value={branchLocation}
                  onChange={(e) => setBranchLocation(e.target.value)}
                  className="input-field"
                />
              </div>

              <Button 
                onClick={handleCreateBranch} 
                disabled={!branchName.trim() || loading}
                className="w-full btn-primary mt-6"
              >
                {loading ? 'Creating...' : 'Complete Setup'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'complete' && (
          <Card className="card-elevated animate-in">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <CardTitle className="text-2xl">You're All Set!</CardTitle>
              <CardDescription>Your car wash business is ready to go</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Redirecting you to your dashboard...
              </p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
