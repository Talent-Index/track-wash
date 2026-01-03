import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserCheck, QrCode, ArrowRight, CheckCircle } from 'lucide-react';

export default function OperatorOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleJoinBranch = async () => {
    if (!inviteCode.trim() || !user) return;
    
    setLoading(true);
    try {
      // Find the invite
      const { data: invite, error: inviteError } = await supabase
        .from('operator_invites')
        .select('id, branch_id, expires_at, used_by')
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .maybeSingle();

      if (inviteError) throw inviteError;
      
      if (!invite) {
        throw new Error('Invalid invite code');
      }

      if (invite.used_by) {
        throw new Error('This invite code has already been used');
      }

      if (new Date(invite.expires_at) < new Date()) {
        throw new Error('This invite code has expired');
      }

      // Create operator record
      const { error: operatorError } = await supabase
        .from('operators')
        .insert({
          user_id: user.id,
          branch_id: invite.branch_id,
          is_active: true
        });

      if (operatorError) throw operatorError;

      // Mark invite as used
      await supabase
        .from('operator_invites')
        .update({ 
          used_by: user.id, 
          used_at: new Date().toISOString() 
        })
        .eq('id', invite.id);

      // Update user role to operator
      await supabase
        .from('user_roles')
        .update({ role: 'operator' })
        .eq('user_id', user.id);

      setSuccess(true);
      toast.success('You have joined the branch successfully!');
      
      setTimeout(() => {
        navigate('/operator/dashboard');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to join branch');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="card-elevated max-w-md w-full animate-in">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <CardTitle className="text-2xl">Welcome to the Team!</CardTitle>
            <CardDescription>You are now connected to your branch</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Redirecting you to your dashboard...
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="card-elevated animate-in">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Join Your Branch</CardTitle>
            <CardDescription>
              Enter the invite code provided by your manager
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                placeholder="e.g., TW-ABC123"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="input-field text-center text-lg tracking-wider"
                maxLength={10}
              />
            </div>

            <Button 
              onClick={handleJoinBranch} 
              disabled={!inviteCode.trim() || loading}
              className="w-full btn-primary"
            >
              {loading ? 'Joining...' : 'Join Branch'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              disabled
            >
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR Code (Coming Soon)
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Don't have an invite code? Contact your car wash manager to get one.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
