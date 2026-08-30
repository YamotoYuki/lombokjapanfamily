/**
 * UI feature flags. Backend/API/DB remain available even when disabled.
 * Flip a flag to `true` to re-enable the corresponding UI and routes.
 */
export const FEATURES = {
  /** Admin Sponsors CMS + public Sponsors section */
  sponsors: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;
