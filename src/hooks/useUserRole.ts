import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface Business {
  id: string;
  name: string;
  currency: string;
}

interface Branch {
  id: string;
  name: string;
  business_id: string;
}

interface OperatorInfo {
  id: string;
  branch_id: string;
  branch?: Branch;
}

export function useUserRole() {
  const { user, role, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [operatorInfo, setOperatorInfo] = useState<OperatorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoleData() {
      if (!user || authLoading) {
        setLoading(false);
        return;
      }

      try {
        // If owner, fetch their business
        if (role === 'owner' || role === 'admin') {
          const { data: businessData } = await supabase
            .from('businesses')
            .select('id, name, currency:description')
            .eq('owner_id', user.id)
            .maybeSingle();
          
          if (businessData) {
            setBusiness({
              id: businessData.id,
              name: businessData.name,
              currency: businessData.currency || 'KES'
            });
          }
        }

        // If operator, fetch their operator info
        if (role === 'operator') {
          const { data: operatorData } = await supabase
            .from('operators')
            .select(`
              id,
              branch_id,
              branches:branch_id (
                id,
                name,
                business_id
              )
            `)
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (operatorData) {
            setOperatorInfo({
              id: operatorData.id,
              branch_id: operatorData.branch_id,
              branch: operatorData.branches as unknown as Branch
            });
          }
        }
      } catch (error) {
        console.error('Error fetching role data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRoleData();
  }, [user, role, authLoading]);

  const isOwner = role === 'owner';
  const isOperator = role === 'operator';
  const isCustomer = role === 'customer';
  const isAdmin = role === 'admin';
  const needsOnboarding = isOwner && !business;

  return {
    role,
    isOwner,
    isOperator,
    isCustomer,
    isAdmin,
    business,
    operatorInfo,
    needsOnboarding,
    loading: loading || authLoading
  };
}
