import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Filter, Search, TrendingUp, Clock, Users, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { buildContactPath } from '@/utils/contactQuery';

interface CaseMetric {
  metric: string;
  value: string;
  improvement: string;
}

interface CaseStudy {
  id: number;
  slug: string;
  title: string;
  client_company: string | null;
  industry: string;
  challenge: string;
  solution: string;
  results: CaseMetric[];
  roi: string | null;
  time_saved: string | null;
  testimonial: string | null;
  featured_image: string | null;
  is_featured: boolean;
}

interface CaseListResponse {
  total: number;
  items: CaseStudy[];
}

interface IndustriesResponse {
  industries: Array<{ industry: string; count: number }>;
}

const STAT_ICONS = [
  <TrendingUp className="w-6 h-6 text-blue-600" />,
  <Zap className="w-6 h-6 text-green-600" />,
  <Users className="w-6 h-6 text-indigo-600" />,
  <Clock className="w-6 h-6 text-orange-600" />,
];

const STAT_COLORS = ['text-blue-600', 'text-green-600', 'text-indigo-600', 'text-orange-600'];

export default function CaseStudies() {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const ALL_INDUSTRIES = '__all_industries__';
  const incomingSource = new URLSearchParams(location.search).get('source');
  const lang = (i18n.resolvedLanguage || i18n.language || 'en').startsWith('ru') ? 'ru' : 'en';

  const [selectedIndustry, setSelectedIndustry] = useState<string>(ALL_INDUSTRIES);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [casesRes, industriesRes] = await Promise.all([
          fetch(`/api/cases?limit=100&lang=${lang}`),
          fetch(`/api/cases/industries?lang=${lang}`),
        ]);

        const casesJson: CaseListResponse | null = casesRes.ok ? await casesRes.json() : null;
        const industriesJson: IndustriesResponse | null = industriesRes.ok ? await industriesRes.json() : null;

        if (!cancelled) {
          setCases(casesJson?.items ?? []);
          setIndustries((industriesJson?.industries ?? []).map(item => item.industry));
        }
      } catch {
        if (!cancelled) {
          setCases([]);
          setIndustries([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [lang]);

  const filteredStudies = useMemo(() => {
    return cases.filter(study => {
      const matchesIndustry = selectedIndustry === ALL_INDUSTRIES || study.industry === selectedIndustry;
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        study.title.toLowerCase().includes(q) ||
        (study.client_company ?? '').toLowerCase().includes(q) ||
        study.industry.toLowerCase().includes(q) ||
        study.challenge.toLowerCase().includes(q);
      return matchesIndustry && matchesSearch;
    });
  }, [cases, searchTerm, selectedIndustry]);

  const statCards = [
    { value: String(cases.length), label: t('caseStudies.stats.projects.label') },
    { value: String(cases.filter(item => item.is_featured).length), label: t('caseStudies.stats.savings.label') },
    { value: String(cases.filter(item => (item.results ?? []).length > 0).length), label: t('caseStudies.stats.efficiency.label') },
    { value: String(cases.filter(item => item.time_saved).length), label: t('caseStudies.stats.timeline.label') },
  ];

  const industryOptions = [ALL_INDUSTRIES, ...industries];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <section className="pt-16 pb-10">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">{t('caseStudies.title')}</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('caseStudies.description')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {statCards.map((stat, idx) => (
              <div key={stat.label} className="bg-white rounded-2xl p-5 text-center shadow-sm">
                <div className="flex justify-center mb-2">{STAT_ICONS[idx]}</div>
                <div className={`text-3xl font-bold ${STAT_COLORS[idx]} mb-1`}>{stat.value}</div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row gap-4 mb-8"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
              >
                {industryOptions.map(industry => (
                  <option key={industry} value={industry}>
                    {industry === ALL_INDUSTRIES ? t('caseStudies.allIndustries') : industry}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('caseStudies.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
              />
            </div>
          </motion.div>

          {loading ? (
            <div className="h-40 flex items-center justify-center text-gray-500">Загрузка...</div>
          ) : filteredStudies.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-500">Кейсы не найдены</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {filteredStudies.map((study, index) => (
                <motion.div
                  key={study.id}
                  id={study.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * index }}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow flex flex-col overflow-hidden scroll-mt-24"
                >
                  {study.featured_image ? (
                    <img src={study.featured_image} alt={study.title} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                  )}

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                        {study.industry}
                      </span>
                      {study.time_saved && <span className="text-xs text-gray-400">{study.time_saved}</span>}
                    </div>

                    <h3 className="text-base font-bold text-gray-900 mb-1 leading-snug line-clamp-3">{study.title}</h3>
                    <p className="text-blue-600 text-xs font-medium mb-3 truncate">{study.client_company || '—'}</p>

                    <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2 min-h-[2.5rem]">{study.challenge}</p>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {(study.results ?? []).slice(0, 2).map((result, idx) => (
                        <div key={`${study.id}-${idx}`} className="bg-gray-50 rounded-xl p-3 text-center flex flex-col justify-between min-h-[5.5rem]">
                          <div className="text-xs text-gray-400 leading-tight line-clamp-2">{result.metric}</div>
                          <div className="text-xl font-bold text-green-600 leading-tight my-1">{result.value}</div>
                          <div className="text-xs text-green-500 leading-tight">{result.improvement}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                      <div className="text-xs">
                        <span className="text-gray-400">{t('caseStudies.paybackLabel')}: </span>
                        <span className="font-semibold text-gray-700">{study.roi || '—'}</span>
                      </div>
                      <Link
                        to={buildContactPath({
                          source: 'case_study',
                          case: study.slug,
                          ref: incomingSource ?? undefined,
                        })}
                        className="text-blue-600 hover:text-blue-700 font-medium text-xs flex items-center gap-1"
                      >
                        {t('caseStudies.viewDetails')}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-white">
            <h2 className="text-4xl font-bold mb-4">{t('caseStudies.cta.title')}</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">{t('caseStudies.cta.description')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={buildContactPath({ source: 'case_studies_final_cta', ref: incomingSource ?? undefined })}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                {t('caseStudies.cta.button')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
