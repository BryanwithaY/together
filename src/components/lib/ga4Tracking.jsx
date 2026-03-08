/**
 * GA4 conversion and attribution tracking integration
 * Bridges Base44 Analytics with Google Analytics 4 for marketing metrics
 */

export const GA4 = {
  // ─── Conversions ────────────────────────────────────────────────────
  signupComplete: (source = 'organic') => {
    window.gtag?.('event', 'sign_up', {
      method: source,
      event_category: 'conversion',
    });
  },

  subscriptionUpgrade: (plan, price, previousPlan = null) => {
    window.gtag?.('event', 'purchase', {
      currency: 'USD',
      value: price,
      items: [{
        item_name: plan,
        item_category: 'subscription',
        price: price,
      }],
      previous_plan: previousPlan,
      event_category: 'conversion',
    });
  },

  subscriptionCancelled: (plan) => {
    window.gtag?.('event', 'remove_from_cart', {
      items: [{
        item_name: plan,
        item_category: 'subscription',
      }],
      event_category: 'cancellation',
    });
  },

  // ─── Engagement ─────────────────────────────────────────────────────
  partnerInviteSent: (relationshipType) => {
    window.gtag?.('event', 'share', {
      method: 'partner_invite',
      content_type: relationshipType,
      event_category: 'engagement',
    });
  },

  partnerAccepted: (relationshipType) => {
    window.gtag?.('event', 'view_item', {
      content_type: 'relationship',
      content_id: relationshipType,
      event_category: 'engagement',
    });
  },

  firstMomentLogged: (type) => {
    window.gtag?.('event', 'view_item', {
      content_type: 'moment',
      content_id: type,
      event_category: 'onboarding',
    });
  },

  // ─── Attribution ────────────────────────────────────────────────────
  captureUTMParams: () => {
    const params = new URLSearchParams(window.location.search);
    const utm = {
      source: params.get('utm_source'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign'),
      content: params.get('utm_content'),
      term: params.get('utm_term'),
    };

    // Only set if at least one UTM param exists
    if (Object.values(utm).some(v => v)) {
      window.gtag?.('config', 'G-TRYSSYL0JL', {
        'custom_map': {
          'dimension1': 'utm_source_custom',
          'dimension2': 'utm_medium_custom',
          'dimension3': 'utm_campaign_custom',
        }
      });

      window.gtag?.('event', 'page_view', {
        utm_source_custom: utm.source,
        utm_medium_custom: utm.medium,
        utm_campaign_custom: utm.campaign,
      });
    }

    return utm;
  },

  // ─── Facilitator ────────────────────────────────────────────────────
  facilitatorApplicationSubmitted: (facilitatorType) => {
    window.gtag?.('event', 'generate_lead', {
      event_category: 'facilitator',
      facilitator_type: facilitatorType,
    });
  },

  // ─── Custom Events ──────────────────────────────────────────────────
  customEvent: (eventName, params = {}) => {
    window.gtag?.('event', eventName, params);
  },
};