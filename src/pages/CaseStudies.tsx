import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Filter, Search, TrendingUp, Clock, Users, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { buildContactPath } from '@/utils/contactQuery';

interface CaseStudy {
  id: string;
  title: string;
  company: string;
  industry: string;
  challenge: string;
  challengeShort: string;
  solution: string;
  implementation: string;
  results: {
    metric: string;
    value: string;
    improvement: string;
  }[];
  testimonial: {
    quote: string;
    author: string;
    position: string;
  };
  tags: string[];
  timeline: string;
  investment: string;
  roi: string;
  featured: boolean;
}

const STAT_ICONS = [
  <TrendingUp className="w-6 h-6 text-blue-600" />,
  <Zap className="w-6 h-6 text-green-600" />,
  <Users className="w-6 h-6 text-purple-600" />,
  <Clock className="w-6 h-6 text-orange-600" />,
];

const STAT_COLORS = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600'];

export default function CaseStudies() {
  const { t } = useTranslation();
  const ALL_INDUSTRIES = '__all_industries__';
  const [selectedIndustry, setSelectedIndustry] = useState<string>(ALL_INDUSTRIES);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const caseStudies: CaseStudy[] = [
    {
      id: 'ecommerce-automation',
      title: t('caseStudies.studies.ecommerceAutomation.title'),
      company: t('caseStudies.studies.ecommerceAutomation.company'),
      industry: t('caseStudies.studies.ecommerceAutomation.industry'),
      challenge: t('caseStudies.studies.ecommerceAutomation.challenge'),
      challengeShort: t('caseStudies.studies.ecommerceAutomation.challengeShort'),
      solution: t('caseStudies.studies.ecommerceAutomation.solution'),
      implementation: t('caseStudies.studies.ecommerceAutomation.implementation'),
      results: [
        { metric: t('caseStudies.studies.ecommerceAutomation.results.responseTime.metric'), value: t('caseStudies.studies.ecommerceAutomation.results.responseTime.value'), improvement: t('caseStudies.studies.ecommerceAutomation.results.responseTime.improvement') },
        { metric: t('caseStudies.studies.ecommerceAutomation.results.satisfaction.metric'), value: t('caseStudies.studies.ecommerceAutomation.results.satisfaction.value'), improvement: t('caseStudies.studies.ecommerceAutomation.results.satisfaction.improvement') },
        { metric: t('caseStudies.studies.ecommerceAutomation.results.tickets.metric'), value: t('caseStudies.studies.ecommerceAutomation.results.tickets.value'), improvement: t('caseStudies.studies.ecommerceAutomation.results.tickets.improvement') },
        { metric: t('caseStudies.studies.ecommerceAutomation.results.savings.metric'), value: t('caseStudies.studies.ecommerceAutomation.results.savings.value'), improvement: t('caseStudies.studies.ecommerceAutomation.results.savings.improvement') }
      ],
      testimonial: {
        quote: t('caseStudies.studies.ecommerceAutomation.testimonial.quote'),
        author: t('caseStudies.studies.ecommerceAutomation.testimonial.author'),
        position: t('caseStudies.studies.ecommerceAutomation.testimonial.position')
      },
      tags: [t('caseStudies.tags.customerService'), t('caseStudies.tags.automation'), t('caseStudies.tags.costReduction')],
      timeline: t('caseStudies.studies.ecommerceAutomation.timeline'),
      investment: t('caseStudies.studies.ecommerceAutomation.investment'),
      roi: t('caseStudies.studies.ecommerceAutomation.roi'),
      featured: true
    },
    {
      id: 'healthcare-analytics',
      title: t('caseStudies.studies.healthcareAnalytics.title'),
      company: t('caseStudies.studies.healthcareAnalytics.company'),
      industry: t('caseStudies.studies.healthcareAnalytics.industry'),
      challenge: t('caseStudies.studies.healthcareAnalytics.challenge'),
      challengeShort: t('caseStudies.studies.healthcareAnalytics.challengeShort'),
      solution: t('caseStudies.studies.healthcareAnalytics.solution'),
      implementation: t('caseStudies.studies.healthcareAnalytics.implementation'),
      results: [
        { metric: t('caseStudies.studies.healthcareAnalytics.results.accuracy.metric'), value: t('caseStudies.studies.healthcareAnalytics.results.accuracy.value'), improvement: t('caseStudies.studies.healthcareAnalytics.results.accuracy.improvement') },
        { metric: t('caseStudies.studies.healthcareAnalytics.results.waitTime.metric'), value: t('caseStudies.studies.healthcareAnalytics.results.waitTime.value'), improvement: t('caseStudies.studies.healthcareAnalytics.results.waitTime.improvement') },
        { metric: t('caseStudies.studies.healthcareAnalytics.results.cost.metric'), value: t('caseStudies.studies.healthcareAnalytics.results.cost.value'), improvement: t('caseStudies.studies.healthcareAnalytics.results.cost.improvement') },
        { metric: t('caseStudies.studies.healthcareAnalytics.results.efficiency.metric'), value: t('caseStudies.studies.healthcareAnalytics.results.efficiency.value'), improvement: t('caseStudies.studies.healthcareAnalytics.results.efficiency.improvement') }
      ],
      testimonial: {
        quote: t('caseStudies.studies.healthcareAnalytics.testimonial.quote'),
        author: t('caseStudies.studies.healthcareAnalytics.testimonial.author'),
        position: t('caseStudies.studies.healthcareAnalytics.testimonial.position')
      },
      tags: [t('caseStudies.tags.healthcare'), t('caseStudies.tags.dataAnalytics'), t('caseStudies.tags.efficiency')],
      timeline: t('caseStudies.studies.healthcareAnalytics.timeline'),
      investment: t('caseStudies.studies.healthcareAnalytics.investment'),
      roi: t('caseStudies.studies.healthcareAnalytics.roi'),
      featured: true
    },
    {
      id: 'energy-digitalization',
      title: t('caseStudies.studies.financialFraudDetection.title'),
      company: t('caseStudies.studies.financialFraudDetection.company'),
      industry: t('caseStudies.studies.financialFraudDetection.industry'),
      challenge: t('caseStudies.studies.financialFraudDetection.challenge'),
      challengeShort: t('caseStudies.studies.financialFraudDetection.challengeShort'),
      solution: t('caseStudies.studies.financialFraudDetection.solution'),
      implementation: t('caseStudies.studies.financialFraudDetection.implementation'),
      results: [
        { metric: t('caseStudies.studies.financialFraudDetection.results.detectionRate.metric'), value: t('caseStudies.studies.financialFraudDetection.results.detectionRate.value'), improvement: t('caseStudies.studies.financialFraudDetection.results.detectionRate.improvement') },
        { metric: t('caseStudies.studies.financialFraudDetection.results.falsePositives.metric'), value: t('caseStudies.studies.financialFraudDetection.results.falsePositives.value'), improvement: t('caseStudies.studies.financialFraudDetection.results.falsePositives.improvement') },
        { metric: t('caseStudies.studies.financialFraudDetection.results.processingTime.metric'), value: t('caseStudies.studies.financialFraudDetection.results.processingTime.value'), improvement: t('caseStudies.studies.financialFraudDetection.results.processingTime.improvement') },
        { metric: t('caseStudies.studies.financialFraudDetection.results.savings.metric'), value: t('caseStudies.studies.financialFraudDetection.results.savings.value'), improvement: t('caseStudies.studies.financialFraudDetection.results.savings.improvement') }
      ],
      testimonial: {
        quote: t('caseStudies.studies.financialFraudDetection.testimonial.quote'),
        author: t('caseStudies.studies.financialFraudDetection.testimonial.author'),
        position: t('caseStudies.studies.financialFraudDetection.testimonial.position')
      },
      tags: [t('caseStudies.tags.processOptimization'), t('caseStudies.tags.automation'), t('caseStudies.tags.dataAnalytics')],
      timeline: t('caseStudies.studies.financialFraudDetection.timeline'),
      investment: t('caseStudies.studies.financialFraudDetection.investment'),
      roi: t('caseStudies.studies.financialFraudDetection.roi'),
      featured: false
    },
    {
      id: 'study-ninja',
      title: t('caseStudies.studies.studyNinja.title'),
      company: t('caseStudies.studies.studyNinja.company'),
      industry: t('caseStudies.studies.studyNinja.industry'),
      challenge: t('caseStudies.studies.studyNinja.challenge'),
      challengeShort: t('caseStudies.studies.studyNinja.challengeShort'),
      solution: t('caseStudies.studies.studyNinja.solution'),
      implementation: t('caseStudies.studies.studyNinja.implementation'),
      results: [
        { metric: t('caseStudies.studies.studyNinja.results.retention.metric'), value: t('caseStudies.studies.studyNinja.results.retention.value'), improvement: t('caseStudies.studies.studyNinja.results.retention.improvement') },
        { metric: t('caseStudies.studies.studyNinja.results.learningTime.metric'), value: t('caseStudies.studies.studyNinja.results.learningTime.value'), improvement: t('caseStudies.studies.studyNinja.results.learningTime.improvement') },
        { metric: t('caseStudies.studies.studyNinja.results.accuracy.metric'), value: t('caseStudies.studies.studyNinja.results.accuracy.value'), improvement: t('caseStudies.studies.studyNinja.results.accuracy.improvement') },
        { metric: t('caseStudies.studies.studyNinja.results.savings.metric'), value: t('caseStudies.studies.studyNinja.results.savings.value'), improvement: t('caseStudies.studies.studyNinja.results.savings.improvement') }
      ],
      testimonial: {
        quote: t('caseStudies.studies.studyNinja.testimonial.quote'),
        author: t('caseStudies.studies.studyNinja.testimonial.author'),
        position: t('caseStudies.studies.studyNinja.testimonial.position')
      },
      tags: [t('caseStudies.tags.education'), t('caseStudies.tags.aiTutor'), t('caseStudies.tags.personalizedLearning')],
      timeline: t('caseStudies.studies.studyNinja.timeline'),
      investment: t('caseStudies.studies.studyNinja.investment'),
      roi: t('caseStudies.studies.studyNinja.roi'),
      featured: false
    },
  ];

  const industries = [ALL_INDUSTRIES, ...Array.from(new Set(caseStudies.map(study => study.industry)))];

  const filteredStudies = caseStudies.filter(study => {
    const matchesIndustry = selectedIndustry === ALL_INDUSTRIES || study.industry === selectedIndustry;
    const matchesSearch = searchTerm === '' ||
      study.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      study.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      study.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesIndustry && matchesSearch;
  });

  const stats = [
    { key: 'projects', color: STAT_COLORS[0], icon: STAT_ICONS[0] },
    { key: 'savings', color: STAT_COLORS[1], icon: STAT_ICONS[1] },
    { key: 'efficiency', color: STAT_COLORS[2], icon: STAT_ICONS[2] },
    { key: 'timeline', color: STAT_COLORS[3], icon: STAT_ICONS[3] },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="pt-16 pb-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              {t('caseStudies.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('caseStudies.description')}
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, i) => (
              <div key={stat.key} className="bg-white rounded-2xl p-5 text-center shadow-sm">
                <div className="flex justify-center mb-2">{stat.icon}</div>
                <div className={`text-3xl font-bold ${stat.color} mb-1`}>
                  {t(`caseStudies.stats.${stat.key}.value`)}
                </div>
                <div className="text-gray-500 text-sm">{t(`caseStudies.stats.${stat.key}.label`)}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          {/* Filters */}
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
                {industries.map(industry => (
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

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {filteredStudies.map((study, index) => (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow flex flex-col overflow-hidden"
              >
                {/* Card top accent */}
                <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />

                <div className="p-5 flex flex-col flex-1">
                  {/* Header: industry tag + timeline */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                      {study.industry}
                    </span>
                    <span className="text-xs text-gray-400">{study.timeline}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-gray-900 mb-1 leading-snug line-clamp-3">{study.title}</h3>
                  <p className="text-blue-600 text-xs font-medium mb-3 truncate">{study.company}</p>

                  {/* Challenge snippet — fixed 2-line height */}
                  <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2 min-h-[2.5rem]">
                    {study.challengeShort}
                  </p>

                  {/* Key metrics — label on top, value big, context small below */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {study.results.slice(0, 2).map((result, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-xl p-3 text-center flex flex-col justify-between min-h-[5.5rem]">
                        <div className="text-xs text-gray-400 leading-tight line-clamp-2">{result.metric}</div>
                        <div className="text-xl font-bold text-green-600 leading-tight my-1">{result.value}</div>
                        <div className="text-xs text-green-500 leading-tight">{result.improvement}</div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                    <div className="text-xs">
                      <span className="text-gray-400">{t('caseStudies.paybackLabel')}: </span>
                      <span className="font-semibold text-gray-700">{study.roi}</span>
                    </div>
                    <Link
                      to={buildContactPath({ source: 'case_study', case: study.id })}
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white"
          >
            <h2 className="text-4xl font-bold mb-4">{t('caseStudies.cta.title')}</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              {t('caseStudies.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={buildContactPath({ source: 'case_studies_final_cta' })}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                {t('caseStudies.cta.button')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/solutions"
                className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
              >
                {t('caseStudies.cta.downloadButton')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
