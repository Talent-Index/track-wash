import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { getRoleDashboard, getRoleOnboarding } from '@/components/auth/ProtectedRoute';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Car, ArrowRight, Loader2 } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading, initialized, role, signIn, signUp } = useAuth();
  const { business, operatorInfo, loading: roleDataLoading } = useUserRole();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'owner'>('customer');

  // Get the intended destination from location state
  const from = (location.state as any)?.from?.pathname || null;

  // Redirect authenticated users based on role and onboarding status
  useEffect(() => {
    if (!initialized || authLoading || roleDataLoading) return;
    if (!isAuthenticated || !role) return;

    // Determine where to redirect
    let redirectPath: string;

    if (from) {
      // If there was an intended destination, go there
      redirectPath = from;
    } else if (role === 'owner' || role === 'admin') {
      redirectPath = business ? getRoleDashboard(role) : getRoleOnboarding(role);
    } else if (role === 'operator') {
      redirectPath = operatorInfo ? getRoleDashboard(role) : getRoleOnboarding(role);
    } else {
      redirectPath = getRoleDashboard(role);
    }

    navigate(redirectPath, { replace: true });
  }, [isAuthenticated, initialized, authLoading, roleDataLoading, role, business, operatorInfo, navigate, from]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error, user } = await signUp(email, password, {
        full_name: fullName,
        phone: phone || undefined,
        role: selectedRole as UserRole,
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else if (error.message.includes('Password')) {
          toast.error('Password must be at least 6 characters');
        } else {
          toast.error(error.message || 'Failed to create account');
        }
        return;
      }

      if (user) {
        toast.success('Account created successfully!');
        // The AuthContext will handle loading the user data and the useEffect will handle redirect
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email, password);

      if (error) {
        // Provide clear error messages
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please verify your email before signing in.');
        } else if (error.message.includes('User not found')) {
          toast.error('No account found with this email. Please sign up first.');
        } else {
          toast.error(error.message || 'Failed to sign in');
        }
      }
      // Redirect will be handled by useEffect
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (!initialized || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, show loading while redirecting
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Track Wash</h1>
          <p className="text-muted-foreground">Car Wash Management Platform</p>
        </div>

        <Card className="card-elevated">
          <Tabs defaultValue="signin" className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="signin" className="mt-0">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      required
                      disabled={loading}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full btn-primary"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-field"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone (Optional)</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+254 7XX XXX XXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      required
                      minLength={6}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>I am a:</Label>
                    <RadioGroup 
                      value={selectedRole} 
                      onValueChange={(v) => setSelectedRole(v as 'customer' | 'owner')}
                      className="flex gap-4"
                      disabled={loading}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="customer" id="customer" />
                        <Label htmlFor="customer" className="font-normal cursor-pointer">
                          Customer
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="owner" id="owner" />
                        <Label htmlFor="owner" className="font-normal cursor-pointer">
                          Car Wash Owner
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full btn-primary"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Operators: Use an invite code from your manager after signing up.
                </p>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}