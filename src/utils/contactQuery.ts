export type ContactSource =
  | 'home_final_cta'
  | 'home_hero_cta'
  | 'home_hero_pilot'
  | 'home_benefits_cta'
  | 'solutions_cta'
  | 'solutions_hero'
  | 'solutions_automation'
  | 'solutions_xlogos'
  | 'solutions_analytics'
  | 'solutions_hrxteam'
  | 'solutions_final_cta'
  | 'pricing_tier'
  | 'pricing_model'
  | 'pricing_addon'
  | 'pricing_final_cta'
  | 'pricing_brief'
  | 'about_cta'
  | 'case_study'
  | 'case_studies_final_cta'
  | 'blog_subscribe'
  | 'header_login'
  | 'social_link'
  | 'audit_consultation';

export interface ContactQueryParams {
  source: ContactSource;
  tier?: string;
  addon?: string;
  case?: string;
  model?: string;
}

export const buildContactPath = (params: ContactQueryParams): string => {
  const query = new URLSearchParams();
  query.set('source', params.source);

  if (params.tier) {
    query.set('tier', params.tier);
  }

  if (params.addon) {
    query.set('addon', params.addon);
  }

  if (params.case) {
    query.set('case', params.case);
  }

  if (params.model) {
    query.set('model', params.model);
  }

  return `/contact?${query.toString()}`;
};
