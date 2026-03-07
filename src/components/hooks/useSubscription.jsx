import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Core subscription hook.
 * Returns the user's current plan, subscription record, and a `can(featureKey)` helper.
 *
 * Usage:
 *   const { plan_slug, can, subscription, isLoading } = useSubscription();
 *   if (can('media_upload')) { ... }
 *   if (can('moments_per_month', 5)) { ... } // check against a numeric limit
 */
export function useSubscription() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => base44.functions.invoke('getSubscriptionData').then(r => r.data),
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const can = (featureKey, currentCount = null) => {
    if (!data?.features) return false; // default deny while loading
    const f = data.features[featureKey];
    if (!f || !f.enabled) return false;
    if (currentCount !== null && f.limit_value !== null) {
      return currentCount < f.limit_value;
    }
    return true;
  };

  return {
    subscription: data?.subscription || null,
    plan_slug: data?.plan_slug || 'free',
    plan: data?.plan || null,
    features: data?.features || {},
    can,
    isLoading,
    refetch
  };
}