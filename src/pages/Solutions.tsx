import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Zap, Users, BarChart3, Clock, DollarSign, Target, Bot, MessageSquare, FileText, Calculator, ShoppingCart, Headphones, Database, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Solution {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
  useCases: string[];
  roi: string;
  implementation: string;
}

interface IndustryScenario {
  industry: string;
  challenge: string;
  solution: string;
  results: string[];
  icon: React.ReactNode;
}

interface AIAgent {
  name: string;
  description: string;
  capabilities: string[];
  industries: string[];
  icon: React.ReactNode;
  color: string;
}

export default function Solutions() {
  const { t } = useTranslation();
  
  const solutions: Solution[] = [
    {
      id: 'customer-service',
      title: t('solutions.items.customer-service.title'),
      description: t('solutions.items.customer-service.description'),
      icon: <Headphones className="w-8 h-8" />,
      benefits: [
        t('solutions.items.customer-service.benefits.0'),
        t('solutions.items.customer-service.benefits.1'),
        t('solutions.items.customer-service.benefits.2'),
        t('solutions.items.customer-service.benefits.3')
      ],
      useCases: [
        t('solutions.items.customer-service.useCases.0'),
        t('solutions.items.customer-service.useCases.1'),
        t('solutions.items.customer-service.useCases.2'),
        t('solutions.items.customer-service.useCases.3')
      ],
      roi: t('solutions.items.customer-service.roi'),
      implementation: t('solutions.items.customer-service.implementation')
    },
    {
      id: 'data-analysis',
      title: t('solutions.items.data-analysis.title'),
      description: t('solutions.items.data-analysis.description'),
      icon: <BarChart3 className="w-8 h-8" />,
      benefits: [
        t('solutions.items.data-analysis.benefits.0'),
        t('solutions.items.data-analysis.benefits.1'),
        t('solutions.items.data-analysis.benefits.2'),
        t('solutions.items.data-analysis.benefits.3')
      ],
      useCases: [
        t('solutions.items.data-analysis.useCases.0'),
        t('solutions.items.data-analysis.useCases.1'),
        t('solutions.items.data-analysis.useCases.2'),
        t('solutions.items.data-analysis.useCases.3')
      ],
      roi: t('solutions.items.data-analysis.roi'),
      implementation: t('solutions.items.data-analysis.implementation')
    },
    {
      id: 'workflow-automation',
      title: t('solutions.items.workflow-automation.title'),
      description: t('solutions.items.workflow-automation.description'),
      icon: <Zap className="w-8 h-8" />,
      benefits: [
        t('solutions.items.workflow-automation.benefits.0'),
        t('solutions.items.workflow-automation.benefits.1'),
        t('solutions.items.workflow-automation.benefits.2'),
        t('solutions.items.workflow-automation.benefits.3')
      ],
      useCases: [
        t('solutions.items.workflow-automation.useCases.0'),
        t('solutions.items.workflow-automation.useCases.1'),
        t('solutions.items.workflow-automation.useCases.2'),
        t('solutions.items.workflow-automation.useCases.3')
      ],
      roi: t('solutions.items.workflow-automation.roi'),
      implementation: t('solutions.items.workflow-automation.implementation')
    },
    {
      id: 'content-generation',
      title: t('solutions.items.content-generation.title'),
      description: t('solutions.items.content-generation.description'),
      icon: <FileText className="w-8 h-8" />,
      benefits: [
        t('solutions.items.content-generation.benefits.0'),
        t('solutions.items.content-generation.benefits.1'),
        t('solutions.items.content-generation.benefits.2'),
        t('solutions.items.content-generation.benefits.3')
      ],
      useCases: [
        t('solutions.items.content-generation.useCases.0'),
        t('solutions.items.content-generation.useCases.1'),
        t('solutions.items.content-generation.useCases.2'),
        t('solutions.items.content-generation.useCases.3')
      ],
      roi: t('solutions.items.content-generation.roi'),
      implementation: t('solutions.items.content-generation.implementation')
    }
  ];

  const industryScenarios: IndustryScenario[] = [
    {
      industry: t('solutions.industryScenarios.retail.industry'),
      challenge: t('solutions.industryScenarios.retail.challenge'),
      solution: t('solutions.industryScenarios.retail.solution'),
      results: [
        t('solutions.industryScenarios.retail.results.0'),
        t('solutions.industryScenarios.retail.results.1'),
        t('solutions.industryScenarios.retail.results.2'),
        t('solutions.industryScenarios.retail.results.3')
      ],
      icon: <ShoppingCart className="w-6 h-6" />
    },
    {
      industry: t('solutions.industryScenarios.healthcare.industry'),
      challenge: t('solutions.industryScenarios.healthcare.challenge'),
      solution: t('solutions.industryScenarios.healthcare.solution'),
      results: [
        t('solutions.industryScenarios.healthcare.results.0'),
        t('solutions.industryScenarios.healthcare.results.1'),
        t('solutions.industryScenarios.healthcare.results.2'),
        t('solutions.industryScenarios.healthcare.results.3')
      ],
      icon: <Shield className="w-6 h-6" />
    },
    {
      industry: t('solutions.industryScenarios.finance.industry'),
      challenge: t('solutions.industryScenarios.finance.challenge'),
      solution: t('solutions.industryScenarios.finance.solution'),
      results: [
        t('solutions.industryScenarios.finance.results.0'),
        t('solutions.industryScenarios.finance.results.1'),
        t('solutions.industryScenarios.finance.results.2'),
        t('solutions.industryScenarios.finance.results.3')
      ],
      icon: <DollarSign className="w-6 h-6" />
    },
    {
      industry: t('solutions.industryScenarios.manufacturing.industry'),
      challenge: t('solutions.industryScenarios.manufacturing.challenge'),
      solution: t('solutions.industryScenarios.manufacturing.solution'),
      results: [
        t('solutions.industryScenarios.manufacturing.results.0'),
        t('solutions.industryScenarios.manufacturing.results.1'),
        t('solutions.industryScenarios.manufacturing.results.2'),
        t('solutions.industryScenarios.manufacturing.results.3')
      ],
      icon: <Target className="w-6 h-6" />
    }
  ];

  const aiAgents: AIAgent[] = [
    {
      name: t('solutions.aiAgents.customerservicebot.name'),
      description: t('solutions.aiAgents.customerservicebot.description'),
      capabilities: [
        t('solutions.aiAgents.customerservicebot.capabilities.0'),
        t('solutions.aiAgents.customerservicebot.capabilities.1'),
        t('solutions.aiAgents.customerservicebot.capabilities.2'),
        t('solutions.aiAgents.customerservicebot.capabilities.3'),
        t('solutions.aiAgents.customerservicebot.capabilities.4')
      ],
      industries: [
        t('solutions.aiAgents.customerservicebot.industries.0'),
        t('solutions.aiAgents.customerservicebot.industries.1'),
        t('solutions.aiAgents.customerservicebot.industries.2'),
        t('solutions.aiAgents.customerservicebot.industries.3')
      ],
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'bg-blue-500'
    },
    {
      name: t('solutions.aiAgents.dataanalyst.name'),
      description: t('solutions.aiAgents.dataanalyst.description'),
      capabilities: [
        t('solutions.aiAgents.dataanalyst.capabilities.0'),
        t('solutions.aiAgents.dataanalyst.capabilities.1'),
        t('solutions.aiAgents.dataanalyst.capabilities.2'),
        t('solutions.aiAgents.dataanalyst.capabilities.3'),
        t('solutions.aiAgents.dataanalyst.capabilities.4')
      ],
      industries: [
        t('solutions.aiAgents.dataanalyst.industries.0'),
        t('solutions.aiAgents.dataanalyst.industries.1'),
        t('solutions.aiAgents.dataanalyst.industries.2'),
        t('solutions.aiAgents.dataanalyst.industries.3')
      ],
      icon: <Database className="w-6 h-6" />,
      color: 'bg-green-500'
    },
    {
      name: t('solutions.aiAgents.salesassistant.name'),
      description: t('solutions.aiAgents.salesassistant.description'),
      capabilities: [
        t('solutions.aiAgents.salesassistant.capabilities.0'),
        t('solutions.aiAgents.salesassistant.capabilities.1'),
        t('solutions.aiAgents.salesassistant.capabilities.2'),
        t('solutions.aiAgents.salesassistant.capabilities.3'),
        t('solutions.aiAgents.salesassistant.capabilities.4')
      ],
      industries: [
        t('solutions.aiAgents.salesassistant.industries.0'),
        t('solutions.aiAgents.salesassistant.industries.1'),
        t('solutions.aiAgents.salesassistant.industries.2'),
        t('solutions.aiAgents.salesassistant.industries.3')
      ],
      icon: <Users className="w-6 h-6" />,
      color: 'bg-purple-500'
    },
    {
      name: t('solutions.aiAgents.contentcreator.name'),
      description: t('solutions.aiAgents.contentcreator.description'),
      capabilities: [
        t('solutions.aiAgents.contentcreator.capabilities.0'),
        t('solutions.aiAgents.contentcreator.capabilities.1'),
        t('solutions.aiAgents.contentcreator.capabilities.2'),
        t('solutions.aiAgents.contentcreator.capabilities.3'),
        t('solutions.aiAgents.contentcreator.capabilities.4')
      ],
      industries: [
        t('solutions.aiAgents.contentcreator.industries.0'),
        t('solutions.aiAgents.contentcreator.industries.1'),
        t('solutions.aiAgents.contentcreator.industries.2'),
        t('solutions.aiAgents.contentcreator.industries.3')
      ],
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-orange-500'
    },
    {
      name: t('solutions.aiAgents.processautomator.name'),
      description: t('solutions.aiAgents.processautomator.description'),
      capabilities: [
        t('solutions.aiAgents.processautomator.capabilities.0'),
        t('solutions.aiAgents.processautomator.capabilities.1'),
        t('solutions.aiAgents.processautomator.capabilities.2'),
        t('solutions.aiAgents.processautomator.capabilities.3'),
        t('solutions.aiAgents.processautomator.capabilities.4')
      ],
      industries: [
        t('solutions.aiAgents.processautomator.industries.0'),
        t('solutions.aiAgents.processautomator.industries.1'),
        t('solutions.aiAgents.processautomator.industries.2'),
        t('solutions.aiAgents.processautomator.industries.3')
      ],
      icon: <Bot className="w-6 h-6" />,
      color: 'bg-red-500'
    },
    {
      name: t('solutions.aiAgents.qualitycontroller.name'),
      description: t('solutions.aiAgents.qualitycontroller.description'),
      capabilities: [
        t('solutions.aiAgents.qualitycontroller.capabilities.0'),
        t('solutions.aiAgents.qualitycontroller.capabilities.1'),
        t('solutions.aiAgents.qualitycontroller.capabilities.2'),
        t('solutions.aiAgents.qualitycontroller.capabilities.3'),
        t('solutions.aiAgents.qualitycontroller.capabilities.4')
      ],
      industries: [
        t('solutions.aiAgents.qualitycontroller.industries.0'),
        t('solutions.aiAgents.qualitycontroller.industries.1'),
        t('solutions.aiAgents.qualitycontroller.industries.2'),
        t('solutions.aiAgents.qualitycontroller.industries.3')
      ],
      icon: <Calculator className="w-6 h-6" />,
      color: 'bg-indigo-500'
    }
  ];

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
              {t('solutions.hero.title')}
              <span className="text-blue-600"> {t('solutions.hero.titleHighlight')}</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              {t('solutions.hero.subtitle')}
            </p>
            <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center">
              {t('solutions.hero.ctaButton')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Core Solutions */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('solutions.coreSolutions.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('solutions.coreSolutions.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((solution, index) => (
              <motion.div
                key={solution.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow"
              >
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-blue-100 rounded-lg text-blue-600 mr-4">
                    {solution.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{solution.title}</h3>
                </div>
                
                <p className="text-gray-600 mb-6">{solution.description}</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">{t('solutions.coreSolutions.benefits')}</h4>
                    <ul className="space-y-2">
                      {solution.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">{t('solutions.coreSolutions.useCases')}</h4>
                    <ul className="space-y-2">
                      {solution.useCases.map((useCase, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-600">
                          <ArrowRight className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                          {useCase}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-green-800 mb-2 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      {t('solutions.coreSolutions.roiImpact')}
                    </h4>
                    <p className="text-green-700">{solution.roi}</p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      {t('solutions.coreSolutions.implementation')}
                    </h4>
                    <p className="text-blue-700">{solution.implementation}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Scenarios */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('solutions.industryStories.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('solutions.industryStories.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {industryScenarios.map((scenario, index) => (
              <motion.div
                key={scenario.industry}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8"
              >
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-600 text-white rounded-lg mr-3">
                    {scenario.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{scenario.industry}</h3>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-red-600 mb-2">{t('solutions.industryStories.challenge')}:</h4>
                  <p className="text-gray-600 text-sm">{scenario.challenge}</p>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-blue-600 mb-2">{t('solutions.industryStories.solution')}:</h4>
                  <p className="text-gray-600 text-sm">{scenario.solution}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">{t('solutions.industryStories.results')}:</h4>
                  <ul className="space-y-1">
                    {scenario.results.map((result, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {result}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Agents Showcase */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('solutions.aiWorkforce.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('solutions.aiWorkforce.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aiAgents.map((agent, index) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className={`p-3 ${agent.color} text-white rounded-lg mr-3`}>
                    {agent.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{agent.name}</h3>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{agent.description}</p>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">{t('solutions.aiWorkforce.capabilities')}:</h4>
                  <ul className="space-y-1">
                    {agent.capabilities.slice(0, 3).map((capability, idx) => (
                      <li key={idx} className="flex items-start text-xs text-gray-600">
                        <Zap className="w-3 h-3 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                        {capability}
                      </li>
                    ))}
                  </ul>
                  {agent.capabilities.length > 3 && (
                    <p className="text-xs text-gray-500 mt-1">+{agent.capabilities.length - 3} {t('solutions.aiWorkforce.moreCapabilities')}</p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">{t('solutions.aiWorkforce.industries')}:</h4>
                  <div className="flex flex-wrap gap-1">
                    {agent.industries.map((industry, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {industry}
                      </span>
                    ))}
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
            <h2 className="text-4xl font-bold mb-4">{t('solutions.cta.title')}</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              {t('solutions.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center">
                {t('solutions.cta.auditButton')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                {t('solutions.cta.consultationButton')}
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
