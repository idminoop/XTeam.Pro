import { motion } from 'framer-motion';
import { Check, ArrowRight, Zap, TrendingUp, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { buildContactPath } from '@/utils/contactQuery';

export default function Pricing() {
  const { t } = useTranslation();
  const iconColorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  const models = [
    {
      id: 'tm',
      icon: <Zap className="w-6 h-6" />,
      name: t('pricing.tiers.starter.name'),
      description: t('pricing.tiers.starter.description'),
      price: t('pricing.tiers.starter.price'),
      period: t('pricing.tiers.starter.period'),
      features: t('pricing.tiers.starter.features', { returnObjects: true }) as string[],
      cta: t('pricing.tiers.starter.cta'),
      popular: false,
      color: 'blue'
    },
    {
      id: 'fixed',
      icon: <TrendingUp className="w-6 h-6" />,
      name: t('pricing.tiers.professional.name'),
      description: t('pricing.tiers.professional.description'),
      price: t('pricing.tiers.professional.price'),
      period: t('pricing.tiers.professional.period'),
      features: t('pricing.tiers.professional.features', { returnObjects: true }) as string[],
      cta: t('pricing.tiers.professional.cta'),
      popular: true,
      color: 'indigo'
    },
    {
      id: 'subscription',
      icon: <Shield className="w-6 h-6" />,
      name: t('pricing.tiers.enterprise.name'),
      description: t('pricing.tiers.enterprise.description'),
      price: t('pricing.tiers.enterprise.price'),
      period: t('pricing.tiers.enterprise.period'),
      features: t('pricing.tiers.enterprise.features', { returnObjects: true }) as string[],
      cta: t('pricing.tiers.enterprise.cta'),
      popular: false,
      color: 'purple'
    }
  ];

  const processSteps = [
    t('pricing.process.steps.discovery', { returnObjects: true }),
    t('pricing.process.steps.architecture', { returnObjects: true }),
    t('pricing.process.steps.mvp', { returnObjects: true }),
    t('pricing.process.steps.pilot', { returnObjects: true }),
    t('pricing.process.steps.scale', { returnObjects: true })
  ] as Array<{ step: string; title: string; duration: string; description: string }>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              {t('pricing.hero.title')}
              <span className="text-blue-600"> {t('pricing.hero.titleHighlight')}</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('pricing.hero.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Collaboration Models */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('pricing.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('pricing.subtitle')}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {models.map((model, index) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                  model.popular ? 'ring-2 ring-blue-500 scale-105' : ''
                }`}
              >
                {model.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      {t('pricing.tiers.mostPopular')}
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${iconColorClasses[model.color] ?? 'bg-gray-100 text-gray-600'}`}>
                    {model.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{model.name}</h3>
                  <p className="text-gray-600 mb-4">{model.description}</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{model.price}</span>
                    <span className="text-gray-500 ml-1 text-sm">{model.period}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <h4 className="font-semibold text-gray-900">{t('pricing.tiers.whatsIncluded')}</h4>
                  {model.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to={buildContactPath({ source: 'pricing_model', model: model.id })}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors inline-flex items-center justify-center ${
                    model.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {model.cta}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Process */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('pricing.process.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('pricing.process.subtitle')}</p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-blue-200 hidden md:block"></div>

              <div className="space-y-8">
                {processSteps.map((step, index) => (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex gap-6"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg z-10 relative">
                        {step.step}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                        <span className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
                          {step.duration}
                        </span>
                      </div>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white"
          >
            <h2 className="text-4xl font-bold mb-4">{t('pricing.finalCta.title')}</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              {t('pricing.finalCta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={buildContactPath({ source: 'pricing_final_cta' })}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                {t('pricing.finalCta.scheduleConsultation')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to={buildContactPath({ source: 'pricing_brief' })}
                className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
              >
                {t('pricing.finalCta.startFreeTrial')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
