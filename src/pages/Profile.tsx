import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Mail, Phone, Building2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { role, isOwner, isOperator, isCustomer, business, operatorInfo } = useUserRole();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const getDashboardPath = () => {
    if (isOwner) return '/owner/dashboard';
    if (isOperator) return '/operator/dashboard';
    return '/customer/dashboard';
  };

  const getRoleDisplay = () => {
    switch (role) {
      case 'owner': return 'Car Wash Owner';
      case 'admin': return 'Administrator';
      case 'operator': return 'Operator';
      case 'customer': return 'Customer';
      default: return 'User';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Header */}
      <div className="gradient-hero border-b border-border">
        <div className="section-padding py-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(getDashboardPath())}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{profile?.full_name || 'User'}</h1>
              <p className="text-muted-foreground">{getRoleDisplay()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="section-padding py-6 space-y-6">
        {/* Contact Info */}
        <div className="card-elevated p-5">
          <h2 className="font-semibold text-foreground mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{profile?.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Phone className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">{profile?.phone || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Business Info (for owners) */}
        {isOwner && business && (
          <div className="card-elevated p-5">
            <h2 className="font-semibold text-foreground mb-4">Business</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{business.name}</p>
                <p className="text-sm text-muted-foreground">Currency: {business.currency}</p>
              </div>
            </div>
          </div>
        )}

        {/* Branch Info (for operators) */}
        {isOperator && operatorInfo?.branch && (
          <div className="card-elevated p-5">
            <h2 className="font-semibold text-foreground mb-4">Branch</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{operatorInfo.branch.name}</p>
                <p className="text-sm text-muted-foreground">Assigned Branch</p>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Log out
        </Button>
      </div>
    </div>
  );
}