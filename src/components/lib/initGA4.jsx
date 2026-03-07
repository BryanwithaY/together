/**
 * Initialize GA4 tracking on app startup
 * Load gtag.js script and capture UTM parameters
 */
import { GA4 } from './ga4Tracking';

export const initializeGA4 = () => {
  // Inject GA4 script if not already present
  if (!window.gtag) {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-TRYSSYL0JL';
    document.head.appendChild(script);

    // Initialize dataLayer and gtag function
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', 'G-TRYSSYL0JL', {
      'page_path': window.location.pathname,
    });
  }

  // Capture UTM parameters for attribution
  GA4.captureUTMParams();
};