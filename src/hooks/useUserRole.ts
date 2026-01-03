import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useCallback } from 'react';

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
  const { user, role, loading: authLoading, initialized } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [operatorInfo, setOperatorInfo] = useState<OperatorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchRoleData = useCallback(async () => {
    if (!user || !initialized) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // If owner, fetch their business
      if (role === 'owner' || role === 'admin') {
        const { data: businessData, error } = await supabase
          .from('businesses')
          .select('id, name, description')
          .eq('owner_id', user.id)
          .maybeSingle();
        
        if (!error && businessData) {
          setBusiness({
            id: businessData.id,
            name: businessData.name,
            currency: businessData.description || 'KES'
          });
        } else {
          setBusiness(null);
        }
      }

      // If operator, fetch their operator info
      if (role === 'operator') {
        const { data: operatorData, error } = await supabase
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
        
        if (!error && operatorData) {
          setOperatorInfo({
            id: operatorData.id,
            branch_id: operatorData.branch_id,
            branch: operatorData.branches as unknown as Branch
          });
        } else {
          setOperatorInfo(null);
        }
      }
      
      setHasFetched(true);
    } catch (error) {
      console.error('Error fetching role data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, role, initialized]);

  useEffect(() => {
    if (initialized && !authLoading && user && role) {
      fetchRoleData();
    } else if (initialized && !authLoading && !user) {
      setLoading(false);
      setBusiness(null);
      setOperatorInfo(null);
    }
  }, [user, role, authLoading, initialized, fetchRoleData]);

  const isOwner = role === 'owner';
  const isOperator = role === 'operator';
  const isCustomer = role === 'customer';
  const isAdmin = role === 'admin';
  const needsOnboarding = (isOwner || isAdmin) && hasFetched && !business;
  const operatorNeedsOnboarding = isOperator && hasFetched && !operatorInfo;

  return {
    role,
    isOwner,
    isOperator,
    isCustomer,
    isAdmin,
    business,
    operatorInfo,
    needsOnboarding,
    operatorNeedsOnboarding,
    loading: !initialized || authLoading || (user && !hasFetched),
    refetch: fetchRoleData
  };
}
