import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Users, 
  Plus, 
  Copy, 
  Clock,
  Building2,
  UserCheck,
  ArrowLeft
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Branch {
  id: string;
  name: string;
}

interface Operator {
  id: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  branch: Branch;
  profile?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

interface Invite {
  id: string;
  invite_code: string;
  branch_id: string;
  expires_at: string;
  used_by: string | null;
  branch: Branch;
}

export default function OperatorManagement() {
  const navigate = useNavigate();
  const { business, loading: roleLoading } = useUserRole();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');

  useEffect(() => {
    if (business?.id) {
      fetchData();
    }
  }, [business?.id]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch branches
      const { data: branchData } = await supabase
        .from('branches')
        .select('id, name')
        .eq('business_id', business?.id);

      setBranches(branchData || []);

      const branchIds = branchData?.map(b => b.id) || [];

      // Fetch operators
      const { data: operatorData } = await supabase
        .from('operators')
        .select(`
          id,
          user_id,
          is_active,
          created_at,
          branches:branch_id (id, name)
        `)
        .in('branch_id', branchIds);

      // Fetch profiles for operators
      if (operatorData && operatorData.length > 0) {
        const userIds = operatorData.map(o => o.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone')
          .in('id', userIds);

        const operatorsWithProfiles = operatorData.map((op: any) => ({
          ...op,
          branch: op.branches,
          profile: profiles?.find(p => p.id === op.user_id)
        }));

        setOperators(operatorsWithProfiles);
      } else {
        setOperators([]);
      }

      // Fetch active invites
      const { data: inviteData } = await supabase
        .from('operator_invites')
        .select(`
          id,
          invite_code,
          branch_id,
          expires_at,
          used_by,
          branches:branch_id (id, name)
        `)
        .in('branch_id', branchIds)
        .is('used_by', null)
        .gt('expires_at', new Date().toISOString());

      setInvites(
        inviteData?.map((inv: any) => ({
          ...inv,
          branch: inv.branches
        })) || []
      );
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createInvite() {
    if (!selectedBranch) return;

    setCreating(true);
    try {
      // Generate invite code
      const { data: codeData } = await supabase.rpc('generate_invite_code');
      const inviteCode = codeData || `TW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { error } = await supabase
        .from('operator_invites')
        .insert({
          branch_id: selectedBranch,
          invite_code: inviteCode,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          expires_at: addDays(new Date(), 7).toISOString()
        });

      if (error) throw error;

      toast.success('Invite code created!');
      setDialogOpen(false);
      setSelectedBranch('');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create invite');
    } finally {
      setCreating(false);
    }
  }

  function copyInviteCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success('Invite code copied!');
  }

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Header */}
      <div className="gradient-hero border-b border-border">
        <div className="section-padding py-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/owner/dashboard')}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Manage Operators</h1>
          <p className="text-muted-foreground">Invite and manage your staff</p>
        </div>
      </div>

      <div className="section-padding py-6 space-y-6">
        {/* Create Invite */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Invite Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Operator Invite</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Branch</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="input-field">
                    <SelectValue placeholder="Choose a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                The invite code will be valid for 7 days.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={createInvite} 
                disabled={!selectedBranch || creating}
                className="btn-primary"
              >
                {creating ? 'Creating...' : 'Create Invite'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Active Invites */}
        {invites.length > 0 && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning" />
                Active Invites
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invites.map((invite) => (
                <div 
                  key={invite.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/30"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-lg font-mono font-bold text-foreground">
                        {invite.invite_code}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyInviteCode(invite.invite_code)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {invite.branch.name} • Expires {format(new Date(invite.expires_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Operators List */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Active Operators ({operators.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {operators.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No operators yet. Create an invite code to add your first operator.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {operators.map((operator) => (
                  <div 
                    key={operator.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {operator.profile?.full_name || 'Unnamed Operator'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {operator.profile?.phone || operator.profile?.email || 'No contact'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="w-3 h-3" />
                        {operator.branch?.name}
                      </div>
                      <span className={`text-xs ${operator.is_active ? 'text-success' : 'text-destructive'}`}>
                        {operator.is_active ? 'Active' : 'Inactive'}
                      </span>
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
