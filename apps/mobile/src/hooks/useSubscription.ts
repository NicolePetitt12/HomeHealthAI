import { useQuery } from '@tanstack/react-query';
import { getEntitlement, getSubscription, getPlans } from '../services/subscription';

export function useEntitlement() {
  return useQuery({
    queryKey: ['entitlement'],
    queryFn: getEntitlement,
    staleTime: 0,        // always refetch — scan count must be current
    retry: 1,
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscription,
    staleTime: 60_000,
    retry: 1,
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: getPlans,
    staleTime: 5 * 60_000, // 5 minutes — plans rarely change
    retry: 1,
  });
}
