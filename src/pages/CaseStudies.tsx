import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Users, Clock, DollarSign, Target, CheckCircle, ExternalLink, Filter, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CaseStudy {
  id: string;
  title: string;
  company: string;
  industry: string;
  challenge: string;
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

export default function CaseStudies() {
  const { t: tRaw } = useTranslation();
  const t = (key: string, options?: any): string =>
    tRaw(key.startsWith('caseStudies.') ? `blog.${key}` : key, options) as unknown as string;
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const caseStudies: CaseStudy[] = [
    {
      id: 'ecommerce-automation',
      title: t('caseStudies.studies.ecommerceAutomation.title'),
      company: t('caseStudies.studies.ecommerceAutomation.company'),
      industry: t('caseStudies.studies.ecommerceAutomation.industry'),
      challenge: t('caseStudies.studies.ecommerceAutomation.challenge'),
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
      id: 'financial-fraud-detection',
      title: t('caseStudies.studies.financialFraudDetection.title'),
      company: t('caseStudies.studies.financialFraudDetection.company'),
      industry: t('caseStudies.studies.financialFraudDetection.industry'),
      challenge: t('caseStudies.studies.financialFraudDetection.challenge'),
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
      tags: [t('caseStudies.tags.financialServices'), t('caseStudies.tags.fraudDetection'), t('caseStudies.tags.riskManagement')],
      timeline: t('caseStudies.studies.financialFraudDetection.timeline'),
      investment: t('caseStudies.studies.financialFraudDetection.investment'),
      roi: t('caseStudies.studies.financialFraudDetection.roi'),
      featured: false
    },
    {
      id: 'manufacturing-optimization',
      title: t('caseStudies.studies.manufacturingOptimization.title'),
      company: t('caseStudies.studies.manufacturingOptimization.company'),
      industry: t('caseStudies.studies.manufacturingOptimization.industry'),
      challenge: t('caseStudies.studies.manufacturingOptimization.challenge'),
      solution: t('caseStudies.studies.manufacturingOptimization.solution'),
      implementation: t('caseStudies.studies.manufacturingOptimization.implementation'),
      results: [
        { metric: t('caseStudies.studies.manufacturingOptimization.results.downtime.metric'), value: t('caseStudies.studies.manufacturingOptimization.results.downtime.value'), improvement: t('caseStudies.studies.manufacturingOptimization.results.downtime.improvement') },
        { metric: t('caseStudies.studies.manufacturingOptimization.results.defectRate.metric'), value: t('caseStudies.studies.manufacturingOptimization.results.defectRate.value'), improvement: t('caseStudies.studies.manufacturingOptimization.results.defectRate.improvement') },
        { metric: t('caseStudies.studies.manufacturingOptimization.results.maintenance.metric'), value: t('caseStudies.studies.manufacturingOptimization.results.maintenance.value'), improvement: t('caseStudies.studies.manufacturingOptimization.results.maintenance.improvement') },
        { metric: t('caseStudies.studies.manufacturingOptimization.results.efficiency.metric'), value: t('caseStudies.studies.manufacturingOptimization.results.efficiency.value'), improvement: t('caseStudies.studies.manufacturingOptimization.results.efficiency.improvement') }
      ],
      testimonial: {
        quote: t('caseStudies.studies.manufacturingOptimization.testimonial.quote'),
        author: t('caseStudies.studies.manufacturingOptimization.testimonial.author'),
        position: t('caseStudies.studies.manufacturingOptimization.testimonial.position')
      },
      tags: [t('caseStudies.tags.manufacturing'), t('caseStudies.tags.predictiveMaintenance'), t('caseStudies.tags.qualityControl')],
      timeline: t('caseStudies.studies.manufacturingOptimization.timeline'),
      investment: t('caseStudies.studies.manufacturingOptimization.investment'),
      roi: t('caseStudies.studies.manufacturingOptimization.roi'),
      featured: false
    },
    {
      id: 'retail-personalization',
      title: 'AI-Powered Retail Personalization',
      company: 'FashionForward',
      industry: 'Retail',
      challenge: 'Low conversion rates (2.1%) and high cart abandonment (78%) due to generic shopping experiences and poor product recommendations.',
      solution: 'Implemented AI personalization engine with real-time recommendation system, dynamic pricing, and personalized marketing automation.',
      implementation: 'Integrated over 8 weeks with A/B testing and gradual feature rollout to optimize performance.',
      results: [
        { metric: 'Conversion Rate', value: '6.8%', improvement: '+224%' },
        { metric: 'Cart Abandonment', value: '45%', improvement: '42% reduction' },
        { metric: 'Average Order Value', value: '$127', improvement: '+85%' },
        { metric: 'Revenue Growth', value: '$4.2M', improvement: '340% increase' }
      ],
      testimonial: {
        quote: "The personalization AI has completely transformed our customer experience. Sales have tripled, and customers are genuinely excited about the recommendations they receive. It's like having a personal shopper for every customer.",
        author: 'Amanda Foster',
        position: 'Chief Marketing Officer'
      },
      tags: ['Retail', 'Personalization', 'Revenue Growth'],
      timeline: '8 weeks',
      investment: '$200K',
      roi: '2100% in 6 months',
      featured: true
    },
    {
      id: 'logistics-optimization',
      title: 'Supply Chain Intelligence System',
      company: 'GlobalLogistics Pro',
      industry: 'Logistics',
      challenge: 'Inefficient route planning and inventory management were causing 25% higher delivery costs and frequent stockouts affecting customer satisfaction.',
      solution: 'Deployed AI-powered supply chain optimization with predictive analytics, dynamic routing, and automated inventory management.',
      implementation: 'Rolled out across 15 distribution centers over 14 weeks with comprehensive staff training.',
      results: [
        { metric: 'Delivery Costs', value: '$2.1M', improvement: '35% reduction' },
        { metric: 'On-time Delivery', value: '97%', improvement: '+22%' },
        { metric: 'Inventory Turnover', value: '12x', improvement: '+50%' },
        { metric: 'Customer Satisfaction', value: '92%', improvement: '+28%' }
      ],
      testimonial: {
        quote: "The AI system has revolutionized our supply chain operations. We're delivering faster, cheaper, and more reliably than ever before. Our customers notice the difference, and our bottom line reflects it.",
        author: 'Carlos Martinez',
        position: 'VP of Operations'
      },
      tags: ['Logistics', 'Supply Chain', 'Optimization'],
      timeline: '14 weeks',
      investment: '$350K',
      roi: '600% in 8 months',
      featured: false
    }
  ];

  const industries = ['All', ...Array.from(new Set(caseStudies.map(study => study.industry)))];

  const filteredStudies = caseStudies.filter(study => {
    const matchesIndustry = selectedIndustry === 'All' || study.industry === selectedIndustry;
    const matchesSearch = searchTerm === '' || 
      study.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      study.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      study.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesIndustry && matchesSearch;
  });

  const featuredStudies = caseStudies.filter(study => study.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              {t('caseStudies.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              {t('caseStudies.description')}
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{t('caseStudies.stats.projects.value')}</div>
              <div className="text-gray-600">{t('caseStudies.stats.projects.label')}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{t('caseStudies.stats.savings.value')}</div>
              <div className="text-gray-600">{t('caseStudies.stats.savings.label')}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">{t('caseStudies.stats.efficiency.value')}</div>
              <div className="text-gray-600">{t('caseStudies.stats.efficiency.label')}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">{t('caseStudies.stats.timeline.value')}</div>
              <div className="text-gray-600">{t('caseStudies.stats.timeline.label')}</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Case Studies */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('caseStudies.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('caseStudies.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredStudies.slice(0, 2).map((study, index) => (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                    {study.industry}
                  </span>
                  <span className="text-sm text-gray-500">{study.timeline}</span>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{study.title}</h3>
                <p className="text-lg font-semibold text-blue-600 mb-4">{study.company}</p>
                
                <p className="text-gray-600 mb-6 line-clamp-3">{study.challenge}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {study.results.slice(0, 4).map((result, idx) => (
                    <div key={idx} className="text-center p-3 bg-white rounded-lg">
                      <div className="text-lg font-bold text-green-600">{result.value}</div>
                      <div className="text-xs text-gray-600">{result.metric}</div>
                      <div className="text-xs text-green-500">{result.improvement}</div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-600">ROI: </span>
                    <span className="font-semibold text-green-600">{study.roi}</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center">
                    {t('caseStudies.viewDetails')}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* All Case Studies */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('caseStudies.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('caseStudies.description')}
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row gap-4 mb-8"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder={t('caseStudies.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </motion.div>

          {/* Case Studies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStudies.map((study, index) => (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                    {study.industry}
                  </span>
                  {study.featured && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                      {t('caseStudies.featured')}
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{study.title}</h3>
                <p className="text-blue-600 font-semibold mb-3">{study.company}</p>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{study.challenge}</p>
                
                <div className="space-y-2 mb-4">
                  {study.results.slice(0, 2).map((result, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{result.metric}:</span>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{result.value}</div>
                        <div className="text-green-600 text-xs">{result.improvement}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {study.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-sm">
                    <span className="text-gray-600">ROI: </span>
                    <span className="font-semibold text-green-600">{study.roi}</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center">
                    {t('caseStudies.details')}
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </button>
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
              <button className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center">
                {t('caseStudies.cta.button')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                {t('caseStudies.cta.downloadButton')}
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
