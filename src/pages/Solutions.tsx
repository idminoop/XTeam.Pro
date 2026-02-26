import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Zap, Brain, BarChart3, Users } from 'lucide-react';
import { buildContactPath, ContactSource } from '@/utils/contactQuery';

export default function Solutions() {
  const { t } = useTranslation();

  const solutions = [
    {
      id: 'automation',
      pain: t('solutions.blocks.automation.pain'),
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: t('solutions.blocks.automation.title'),
      description: t('solutions.blocks.automation.description'),
      benefits: [
        t('solutions.blocks.automation.benefits.0'),
        t('solutions.blocks.automation.benefits.1'),
        t('solutions.blocks.automation.benefits.2'),
        t('solutions.blocks.automation.benefits.3'),
      ],
      metric: t('solutions.blocks.automation.metric'),
      metricLabel: t('solutions.blocks.automation.metricLabel'),
      caseRef: t('solutions.blocks.automation.caseRef'),
      cta: t('solutions.blocks.automation.cta'),
      ctaSource: 'solutions_automation' as ContactSource,
    },
    {
      id: 'xlogos',
      pain: t('solutions.blocks.xlogos.pain'),
      icon: <Brain className="h-8 w-8 text-primary" />,
      title: t('solutions.xlogos.title'),
      description: t('solutions.xlogos.description'),
      benefits: [
        t('solutions.xlogos.benefits.0'),
        t('solutions.xlogos.benefits.1'),
        t('solutions.xlogos.benefits.2'),
        t('solutions.xlogos.benefits.3'),
      ],
      metric: t('solutions.blocks.xlogos.metric'),
      metricLabel: t('solutions.blocks.xlogos.metricLabel'),
      caseRef: t('solutions.blocks.xlogos.caseRef'),
      cta: t('solutions.blocks.xlogos.cta'),
      ctaSource: 'solutions_xlogos' as ContactSource,
    },
    {
      id: 'analytics',
      pain: t('solutions.blocks.analytics.pain'),
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      title: t('solutions.blocks.analytics.title'),
      description: t('solutions.blocks.analytics.description'),
      benefits: [
        t('solutions.blocks.analytics.benefits.0'),
        t('solutions.blocks.analytics.benefits.1'),
        t('solutions.blocks.analytics.benefits.2'),
        t('solutions.blocks.analytics.benefits.3'),
      ],
      metric: t('solutions.blocks.analytics.metric'),
      metricLabel: t('solutions.blocks.analytics.metricLabel'),
      caseRef: t('solutions.blocks.analytics.caseRef'),
      cta: t('solutions.blocks.analytics.cta'),
      ctaSource: 'solutions_analytics' as ContactSource,
    },
    {
      id: 'hrxteam',
      pain: t('solutions.blocks.hrxteam.pain'),
      icon: <Users className="h-8 w-8 text-primary" />,
      title: t('solutions.hrxteam.title'),
      description: t('solutions.hrxteam.description'),
      benefits: [
        t('solutions.hrxteam.solutions.0'),
        t('solutions.hrxteam.solutions.1'),
        t('solutions.hrxteam.solutions.2'),
        t('solutions.hrxteam.solutions.3'),
      ],
      metric: t('solutions.blocks.hrxteam.metric'),
      metricLabel: t('solutions.blocks.hrxteam.metricLabel'),
      caseRef: t('solutions.blocks.hrxteam.caseRef'),
      cta: t('solutions.blocks.hrxteam.cta'),
      ctaSource: 'solutions_hrxteam' as ContactSource,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {t('solutions.hero.title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {t('solutions.hero.subtitle')}
          </p>
          <Button asChild size="lg" className="text-lg px-8">
            <Link to={buildContactPath({ source: 'solutions_hero' })}>
              {t('solutions.hero.ctaButton')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Solution blocks */}
      {solutions.map((solution, index) => (
        <section
          key={solution.id}
          id={solution.id}
          className={`py-20 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className={index % 2 !== 0 ? 'lg:order-2' : ''}>
                <span className="inline-block text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full mb-4">
                  {solution.pain}
                </span>
                <div className="flex items-center gap-3 mb-4">
                  {solution.icon}
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {solution.title}
                  </h2>
                </div>
                <p className="text-lg text-gray-600 mb-6">{solution.description}</p>
                <ul className="space-y-3 mb-8">
                  {solution.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg">
                  <Link to={buildContactPath({ source: solution.ctaSource })}>
                    {solution.cta}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>

              <div className={`bg-gradient-to-br from-blue-50 to-indigo-100 p-10 rounded-2xl text-center ${index % 2 !== 0 ? 'lg:order-1' : ''}`}>
                <div className="text-6xl font-bold text-primary mb-3">
                  {solution.metric}
                </div>
                <p className="text-gray-600 mb-8 text-lg">{solution.metricLabel}</p>
                <Link
                  to="/case-studies"
                  className="inline-flex items-center text-primary font-semibold hover:underline"
                >
                  {solution.caseRef}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('solutions.cta.title')}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {t('solutions.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg px-8">
              <Link to={buildContactPath({ source: 'solutions_final_cta' })}>
                {t('solutions.cta.auditButton')}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-transparent text-lg px-8 border-white text-white hover:bg-white hover:text-primary"
            >
              <Link to="/solutions">
                {t('solutions.cta.casesButton')}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
