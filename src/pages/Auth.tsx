import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, User, Shield, ChevronRight, Sparkles, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore, UserRole } from '@/store/appStore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const roles: { role: UserRole; icon: React.ReactNode; title: string; description: string }[] = [
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

export default function Auth() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      toast({ title: 'Please select a role', variant: 'destructive' });
      return;
    }

    // Mock login
    login(selectedRole);
    toast({ title: `Welcome back!`, description: `Logged in as ${selectedRole}` });

    // Navigate based on role
    if (selectedRole === 'customer') {
      navigate('/');
    } else if (selectedRole === 'detailer') {
      navigate('/detailer/home');
    } else {
      navigate('/admin/home');
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
          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">
              Select your role
            </label>
            <div className="grid gap-3">
              {roles.map((r) => (
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

          <form onSubmit={handleSubmit} className="space-y-4">
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
              />
            </div>

            <Button type="submit" className="btn-primary w-full text-base py-3 h-auto">
              {isLogin ? 'Sign In' : 'Create Account'}
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
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
