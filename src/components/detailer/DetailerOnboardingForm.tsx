import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  CreditCard, 
  Phone, 
  Mail, 
  Building2, 
  MapPin,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';

// Validation schemas
const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .refine((val) => /^(\+?254|0)?[17]\d{8}$/.test(val.replace(/\s/g, '')), {
    message: 'Enter a valid Kenyan phone number',
  });

const emailSchema = z.string().email('Enter a valid email address');

const nationalIdSchema = z.string()
  .min(7, 'National ID must be 7-10 digits')
  .max(10, 'National ID must be 7-10 digits')
  .refine((val) => /^\d{7,10}$/.test(val), {
    message: 'National ID must be 7-10 digits only',
  });

interface DetailerOnboardingFormProps {
  onSuccess?: () => void;
}

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  } else if (cleaned.startsWith('+254')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

export function DetailerOnboardingForm({ onSuccess }: DetailerOnboardingFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Required fields
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+254');
  
  // Optional fields
  const [businessName, setBusinessName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [city, setCity] = useState('Nairobi');
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    try {
      nationalIdSchema.parse(nationalId);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.nationalId = e.errors[0].message;
      }
    }
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    try {
      phoneSchema.parse(phone);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.phone = e.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({ title: 'Please fix the errors', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Attempt to save to Supabase operators table
      // Note: The operators table requires branch_id and user_id which we may not have
      // For now, we'll update the user's profile with operator info
      
      if (user) {
        // Update the user's profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName.trim(),
            phone: normalizePhone(phone),
            email: email.trim(),
          })
          .eq('id', user.id);
        
        if (profileError) {
          throw profileError;
        }
        
        // TODO: Create operator record when branch assignment is implemented
        // For MVP, we store the detailer application info in a note or separate flow
        
        setIsSuccess(true);
        toast({ 
          title: 'Application submitted!', 
          description: 'We\'ll contact you soon for onboarding.',
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // No Supabase user - store locally for demo
        console.log('Detailer onboarding data (no auth):', {
          fullName,
          nationalId,
          email,
          phone: normalizePhone(phone),
          businessName,
          branchName,
          city,
        });
        
        setIsSuccess(true);
        toast({ 
          title: 'Application submitted!', 
          description: 'We\'ll contact you soon for onboarding.',
        });
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({ 
        title: 'Submission failed', 
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Application Submitted!</h2>
        <p className="text-muted-foreground mb-6">
          We'll review your details and contact you at {email} or {phone}.
        </p>
        <Button onClick={() => navigate('/')} className="btn-primary">
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Become a Detailer</h2>
        <p className="text-muted-foreground mt-1">
          We'll use these details to contact you for bookings and payments.
        </p>
      </div>

      {/* Required Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Kamau Mwangi"
            className="input-field"
          />
          {errors.fullName && (
            <p className="text-xs text-destructive">{errors.fullName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nationalId" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            National ID Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nationalId"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
            placeholder="12345678"
            maxLength={10}
            className="input-field"
          />
          {errors.nationalId && (
            <p className="text-xs text-destructive">{errors.nationalId}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="input-field"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0712345678"
            className="input-field"
          />
          <p className="text-xs text-muted-foreground">
            Accepts: 07xxxxxxxx, +2547xxxxxxxx
          </p>
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Optional Fields */}
      <div className="border-t border-border pt-6 space-y-4">
        <p className="text-sm text-muted-foreground">Optional Information</p>
        
        <div className="space-y-2">
          <Label htmlFor="businessName" className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            Business Name
          </Label>
          <Input
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Your car wash business name"
            className="input-field"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="branchName" className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            Branch / Location Name
          </Label>
          <Input
            id="branchName"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="e.g., Westlands Branch"
            className="input-field"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city" className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            City
          </Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Nairobi"
            className="input-field"
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="btn-primary w-full" 
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            Submit Application
            <ChevronRight className="w-5 h-5 ml-1" />
          </>
        )}
      </Button>
    </form>
  );
}
