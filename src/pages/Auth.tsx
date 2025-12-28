import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, User, Shield, ChevronRight, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { z } from 'zod';

type SelectedRole = 'customer' | 'detailer' | 'admin';

const roles: { role: SelectedRole; icon: React.ReactNode; title: string; description: string }[] = [
  {
    role: 'customer',
    icon: <User className="w-6 h-6" />,
    title: 'Customer',
    description: 'Book washes, track progress, earn rewards',
  },
  {
    role: 'detailer',
    icon: <Sparkles className="w-6 h-6" />,
    title: 'Detailer',
    description: 'Accept jobs, earn money, build reputation',
  },
  {
    role: 'admin',
    icon: <Shield className="w-6 h-6" />,
    title: 'Admin',
    description: 'Manage bookings, payouts, and analytics',
  },
];

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export default function Auth() {
  const [selectedRole, setSelectedRole] = useState<SelectedRole>('customer');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated, loading } = useAuth();

  // Redirect authenticated users to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render form if already authenticated (will redirect)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const validateInputs = (): boolean => {
    setError(null);
    
    try {
      emailSchema.parse(email);
    } catch {
      setError('Please enter a valid email address');
      return false;
    }
    
    try {
      passwordSchema.parse(password);
    } catch {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    if (!isLogin && !fullName.trim()) {
      setError('Please enter your full name');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please verify your email before signing in.');
          } else {
            setError(error.message);
          }
          return;
        }
        
        toast({ title: 'Welcome back!', description: 'Successfully signed in' });
        navigate('/');
      } else {
        const { error } = await signUp(email, password, {
          full_name: fullName,
          phone: phone || undefined,
        });
        
        if (error) {
          if (error.message.includes('already registered')) {
            setError('This email is already registered. Please sign in instead.');
          } else {
            setError(error.message);
          }
          return;
        }
        
        toast({ 
          title: 'Account created!', 
          description: 'You can now sign in with your credentials.',
        });
        
        // Auto sign in after signup
        const { error: signInError } = await signIn(email, password);
        if (!signInError) {
          navigate('/');
        } else {
          setIsLogin(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Car className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isLogin ? 'Welcome back' : 'Join TrackWash'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isLogin ? 'Sign in to continue' : 'Create your account'}
          </p>
        </div>

        <div className="card-elevated p-6">
          {/* Role Selection - Only show for signup */}
          {!isLogin && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                I am a
              </label>
              <div className="grid gap-3">
                {roles.slice(0, 2).map((r) => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setSelectedRole(r.role)}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left',
                      selectedRole === r.role
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                        selectedRole === r.role
                          ? 'gradient-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground'
                      )}
                    >
                      {r.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{r.title}</p>
                      <p className="text-sm text-muted-foreground">{r.description}</p>
                    </div>
                    {selectedRole === r.role && (
                      <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="input-field"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Phone (optional)
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254712345678"
                    className="input-field"
                    disabled={isLoading}
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="input-field"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>

            <Button 
              type="submit" 
              className="btn-primary w-full text-base py-3 h-auto"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ChevronRight className="w-5 h-5 ml-1" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              disabled={isLoading}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
