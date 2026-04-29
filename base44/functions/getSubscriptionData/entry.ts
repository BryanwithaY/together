import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Returns the current user's subscription + their enabled features
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [plans, features, tierFeatures] = await Promise.all([
    base44.asServiceRole.entities.SubscriptionPlan.list(),
    base44.asServiceRole.entities.SubscriptionFeature.filter({ is_active: true }),
    base44.asServiceRole.entities.SubscriptionTierFeature.list()
  ]);

  const [userSub] = await base44.entities.UserSubscription.filter({ user_email: user.email });

  // Determine effective plan slug
  const planSlug = (userSub?.status === 'active' || userSub?.status === 'trialing')
    ? (userSub.plan_slug || 'free')
    : 'free';

  // Build feature map for this plan
  const planFeatures = tierFeatures.filter(tf => tf.plan_slug === planSlug);
  const featureMap = {};
  for (const f of features) {
    const tierEntry = planFeatures.find(pf => pf.feature_key === f.key);
    featureMap[f.key] = {
      enabled: tierEntry ? tierEntry.enabled : false,
      limit_value: tierEntry?.limit_value ?? null,
      limit_label: tierEntry?.limit_label ?? null,
      label: f.label,
      category: f.category
    };
  }

  return Response.json({
    subscription: userSub || null,
    plan_slug: planSlug,
    plan: plans.find(p => p.slug === planSlug) || null,
    features: featureMap
  });
});