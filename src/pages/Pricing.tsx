import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { apiCall } from '../utils/api';
import { Check, ArrowRight, Calculator, TrendingUp, Zap, Shield, Star, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { buildContactPath } from '@/utils/contactQuery';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: string;
  period: string;
  popular?: boolean;
  features: string[];
  limitations?: string[];
  cta: string;
  color: string;
  icon: React.ReactNode;
}

interface ROIInput {
  currentCosts: number;
  employeeCount: number;
  avgSalary: number;
  timeSpentOnTasks: number;
  errorRate: number;
}

interface ROIResults {
  currentWaste: number;
  annualSavings: number;
  monthlyROI: number;
  paybackPeriod: number;
  threeYearROI: number;
  timeSavings: number;
  errorSavings: number;
  npv?: number;
  irr?: number;
  insights?: string[];
  riskFactors?: string[];
  recommendations?: string[];
}

interface ROICalculationRequest {
  company_size: string;
  industry: string;
  annual_revenue: number;
  current_processes: string[];
  employee_count: number;
  automation_readiness: number;
  processes_to_automate: string[];
  expected_efficiency_gain: number;
  implementation_timeline: number;
  budget_range: string;
  maintenance_budget_percentage: number;
  change_management_readiness: number;
  technical_complexity: number;
  regulatory_requirements: boolean;
}

export default function Pricing() {
  const { t } = useTranslation();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [roiInputs, setROIInputs] = useState<ROIInput>({
    currentCosts: 50000,
    employeeCount: 10,
    avgSalary: 75000,
    timeSpentOnTasks: 30,
    errorRate: 5
  });
  
  const [extendedInputs, setExtendedInputs] = useState({
    companySize: 'medium',
    industry: 'technology',
    automationReadiness: 7,
    changeManagementReadiness: 6,
    technicalComplexity: 5,
    budgetRange: '50k-100k',
    implementationTimeline: 12,
    expectedEfficiencyGain: 40,
    regulatoryRequirements: false
  });
  const [showROICalculator, setShowROICalculator] = useState(false);

  const pricingTiers: PricingTier[] = [
    {
      id: 'starter',
      name: t('pricing.tiers.starter.name'),
      description: t('pricing.tiers.starter.description'),
      price: t('pricing.tiers.starter.price'),
      period: t('pricing.tiers.starter.period'),
      features: t('pricing.tiers.starter.features', { returnObjects: true }) as string[],
      cta: t('pricing.tiers.starter.cta'),
      color: 'blue',
      icon: <Zap className="w-6 h-6" />
    },
    {
      id: 'professional',
      name: t('pricing.tiers.professional.name'),
      description: t('pricing.tiers.professional.description'),
      price: t('pricing.tiers.professional.price'),
      period: t('pricing.tiers.professional.period'),
      popular: true,
      features: t('pricing.tiers.professional.features', { returnObjects: true }) as string[],
      cta: t('pricing.tiers.professional.cta'),
      color: 'indigo',
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      id: 'enterprise',
      name: t('pricing.tiers.enterprise.name'),
      description: t('pricing.tiers.enterprise.description'),
      price: t('pricing.tiers.enterprise.price'),
      period: t('pricing.tiers.enterprise.period'),
      features: t('pricing.tiers.enterprise.features', { returnObjects: true }) as string[],
      cta: t('pricing.tiers.enterprise.cta'),
      color: 'purple',
      icon: <Shield className="w-6 h-6" />
    }
  ];

  const addOns = [
    {
      id: 'analytics',
      name: t('pricing.addOns.analytics.name'),
      description: t('pricing.addOns.analytics.description'),
      price: t('pricing.addOns.analytics.price'),
      features: [t('pricing.addOns.analytics.features.0'), t('pricing.addOns.analytics.features.1'), t('pricing.addOns.analytics.features.2')]
    },
    {
      id: 'support',
      name: t('pricing.addOns.support.name'),
      description: t('pricing.addOns.support.description'),
      price: t('pricing.addOns.support.price'),
      features: [t('pricing.addOns.support.features.0'), t('pricing.addOns.support.features.1'), t('pricing.addOns.support.features.2')]
    },
    {
      id: 'custom',
      name: t('pricing.addOns.custom.name'),
      description: t('pricing.addOns.custom.description'),
      price: t('pricing.addOns.custom.price'),
      features: [t('pricing.addOns.custom.features.0'), t('pricing.addOns.custom.features.1'), t('pricing.addOns.custom.features.2')]
    }
  ];

  const validateROIInputs = (): string[] => {
    const errors: string[] = [];
    
    if (!roiInputs.currentCosts || roiInputs.currentCosts <= 0) {
      errors.push(t('pricing.roi.errors.currentCosts'));
    }
    if (!roiInputs.employeeCount || roiInputs.employeeCount <= 0) {
      errors.push(t('pricing.roi.errors.employeeCount'));
    }
    if (!roiInputs.avgSalary || roiInputs.avgSalary <= 0) {
      errors.push(t('pricing.roi.errors.avgSalary'));
    }
    if (roiInputs.timeSpentOnTasks < 0 || roiInputs.timeSpentOnTasks > 100) {
      errors.push(t('pricing.roi.errors.timeSpent'));
    }
    if (roiInputs.errorRate < 0 || roiInputs.errorRate > 100) {
      errors.push(t('pricing.roi.errors.errorRate'));
    }
    if (extendedInputs.implementationTimeline < 1 || extendedInputs.implementationTimeline > 36) {
      errors.push(t('pricing.roi.errors.timeline'));
    }
    if (extendedInputs.expectedEfficiencyGain < 0 || extendedInputs.expectedEfficiencyGain > 100) {
      errors.push(t('pricing.roi.errors.efficiency'));
    }
    
    return errors;
  };

  const transformROIData = (): ROICalculationRequest => {
    return {
      company_size: extendedInputs.companySize,
      industry: extendedInputs.industry,
      annual_revenue: roiInputs.currentCosts * 4, // Estimate revenue as 4x costs
      current_processes: [
        t('pricing.roi.currentProcesses.0'),
        t('pricing.roi.currentProcesses.1'),
        t('pricing.roi.currentProcesses.2'),
        t('pricing.roi.currentProcesses.3')
      ],
      employee_count: roiInputs.employeeCount,
      automation_readiness: extendedInputs.automationReadiness,
      processes_to_automate: [
        t('pricing.roi.processesToAutomate.0'),
        t('pricing.roi.processesToAutomate.1'),
        t('pricing.roi.processesToAutomate.2'),
        t('pricing.roi.processesToAutomate.3')
      ],
      expected_efficiency_gain: extendedInputs.expectedEfficiencyGain,
      implementation_timeline: extendedInputs.implementationTimeline,
      budget_range: extendedInputs.budgetRange,
      maintenance_budget_percentage: 15.0,
      change_management_readiness: extendedInputs.changeManagementReadiness,
      technical_complexity: extendedInputs.technicalComplexity,
      regulatory_requirements: extendedInputs.regulatoryRequirements
    };
  };

  const [roiLoading, setROILoading] = useState(false);
  const [roiError, setROIError] = useState<string | null>(null);

  const calculateROI = useCallback(async () => {
    // Validate inputs first
    const validationErrors = validateROIInputs();
    if (validationErrors.length > 0) {
      setROIError(validationErrors.join(', '));
      return;
    }

    setROILoading(true);
    setROIError(null);
    
    try {
      const requestData = transformROIData();
      
      const response = await apiCall('/api/calculator/roi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Transform backend response to frontend format
      return {
        currentWaste: result.initial_investment || 0,
        annualSavings: result.annual_savings || 0,
        monthlyROI: (result.annual_savings || 0) / 12,
        paybackPeriod: result.payback_period_months || 0,
        threeYearROI: result.roi_percentage || 0,
        timeSavings: result.savings_breakdown?.process_efficiency_savings || 0,
        errorSavings: result.savings_breakdown?.error_reduction_savings || 0
      };
    } catch (error) {
      console.error('ROI calculation error:', error);
      setROIError(error instanceof Error ? error.message : t('pricing.roi.errors.calculationFailed'));
      
      // Fallback to original calculation
      const { currentCosts, employeeCount, avgSalary, timeSpentOnTasks, errorRate } = roiInputs;
      
      const hourlyRate = avgSalary / (52 * 40);
      const timeWastedHours = (timeSpentOnTasks / 100) * employeeCount * 40 * 52;
      const timeWastedCost = timeWastedHours * hourlyRate;
      const errorCost = (errorRate / 100) * currentCosts;
      const totalCurrentWaste = timeWastedCost + errorCost;
      
      const timeEfficiencyGain = 0.6;
      const errorReduction = 0.8;
      const timeSavings = timeWastedCost * timeEfficiencyGain;
      const errorSavings = errorCost * errorReduction;
      const totalAnnualSavings = timeSavings + errorSavings;
      
      const implementationCost = 75000;
      const monthlyROI = (totalAnnualSavings - implementationCost) / 12;
      const paybackPeriod = implementationCost / (totalAnnualSavings / 12);
      const threeYearROI = ((totalAnnualSavings * 3) - implementationCost) / implementationCost * 100;
      
      return {
        currentWaste: totalCurrentWaste,
        annualSavings: totalAnnualSavings,
        monthlyROI: monthlyROI,
        paybackPeriod: paybackPeriod,
        threeYearROI: threeYearROI,
        timeSavings: timeSavings,
        errorSavings: errorSavings
      };
    } finally {
      setROILoading(false);
    }
  }, [extendedInputs, roiInputs, t]);

  const [roiResults, setROIResults] = useState<ROIResults | null>(null);

  const handleCalculateROI = useCallback(async () => {
    const results = await calculateROI();
    setROIResults(results);
  }, [calculateROI]);

  useEffect(() => {
    void handleCalculateROI();
  }, [handleCalculateROI]);

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
              {t('pricing.hero.title')}
              <span className="text-blue-600">{t('pricing.hero.titleHighlight')}</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              {t('pricing.hero.subtitle')}
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-8">
              <span className={`mr-3 ${billingPeriod === 'monthly' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                {t('pricing.hero.monthly')}
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    billingPeriod === 'annual' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`ml-3 ${billingPeriod === 'annual' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                {t('pricing.hero.annual')}
                <span className="ml-1 text-green-600 text-sm font-medium">{t('pricing.hero.save')}</span>
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                  tier.popular ? 'ring-2 ring-blue-500 scale-105' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      {t('pricing.tiers.mostPopular')}
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-${tier.color}-100 text-${tier.color}-600 mb-4`}>
                    {tier.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {tier.description}
                  </p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                    <span className="text-gray-600">{tier.period}</span>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <h4 className="font-semibold text-gray-900">{t('pricing.tiers.whatsIncluded')}:</h4>
                  {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">
                          {feature}
                        </span>
                      </div>
                    ))}
                  
                  {tier.limitations && (
                    <div className="pt-4 border-t border-gray-100">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">{t('pricing.tiers.limitations')}:</h5>
                      {tier.limitations.map((limitation, idx) => (
                        <div key={idx} className="flex items-start">
                          <Info className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-500">
                            {limitation}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <Link
                  to={buildContactPath({ source: 'pricing_tier', tier: tier.id })}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors inline-flex items-center justify-center ${
                    tier.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {tier.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('pricing.roiCalculator.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              {t('pricing.roiCalculator.subtitle')}
            </p>
            <button
              onClick={() => setShowROICalculator(!showROICalculator)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Calculator className="w-5 h-5 mr-2" />
              {showROICalculator ? t('pricing.roiCalculator.hideCalculator') : t('pricing.roiCalculator.showCalculator')}
            </button>
          </motion.div>

          {showROICalculator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="max-w-4xl mx-auto"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Form */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">{t('pricing.roiCalculator.inputs.currentSituation')}</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('pricing.roiCalculator.inputs.companySize.label')}
                        </label>
                        <select
                          value={extendedInputs.companySize}
                          onChange={(e) => setExtendedInputs({...extendedInputs, companySize: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="startup">{t('pricing.roiCalculator.inputs.companySize.options.startup')}</option>
                          <option value="small">{t('pricing.roiCalculator.inputs.companySize.options.small')}</option>
                          <option value="medium">{t('pricing.roiCalculator.inputs.companySize.options.medium')}</option>
                          <option value="large">{t('pricing.roiCalculator.inputs.companySize.options.large')}</option>
                          <option value="enterprise">{t('pricing.roiCalculator.inputs.companySize.options.enterprise')}</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('pricing.roiCalculator.inputs.industry.label')}
                        </label>
                        <select
                          value={extendedInputs.industry}
                          onChange={(e) => setExtendedInputs({...extendedInputs, industry: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="technology">{t('pricing.roiCalculator.inputs.industry.options.technology')}</option>
                          <option value="finance">{t('pricing.roiCalculator.inputs.industry.options.finance')}</option>
                          <option value="healthcare">{t('pricing.roiCalculator.inputs.industry.options.healthcare')}</option>
                          <option value="manufacturing">{t('pricing.roiCalculator.inputs.industry.options.manufacturing')}</option>
                          <option value="retail">{t('pricing.roiCalculator.inputs.industry.options.retail')}</option>
                          <option value="other">{t('pricing.roiCalculator.inputs.industry.options.other')}</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('pricing.roiCalculator.inputs.annualOperatingCosts.label')}
                      </label>
                      <input
                        type="number"
                        value={roiInputs.currentCosts}
                        onChange={(e) => setROIInputs({...roiInputs, currentCosts: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t('pricing.roiCalculator.inputs.annualOperatingCosts.placeholder')}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('pricing.roiCalculator.inputs.numberOfEmployees.label')}
                      </label>
                      <input
                        type="number"
                        value={roiInputs.employeeCount}
                        onChange={(e) => setROIInputs({...roiInputs, employeeCount: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t('pricing.roiCalculator.inputs.numberOfEmployees.placeholder')}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('pricing.roiCalculator.inputs.averageAnnualSalary.label')}
                      </label>
                      <input
                        type="number"
                        value={roiInputs.avgSalary}
                        onChange={(e) => setROIInputs({...roiInputs, avgSalary: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t('pricing.roiCalculator.inputs.averageAnnualSalary.placeholder')}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('pricing.roiCalculator.inputs.timeSpentOnRepetitiveTasks.label')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={roiInputs.timeSpentOnTasks}
                        onChange={(e) => setROIInputs({...roiInputs, timeSpentOnTasks: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t('pricing.roiCalculator.inputs.timeSpentOnRepetitiveTasks.placeholder')}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('pricing.roiCalculator.inputs.currentErrorRate.label')}
                      </label>
                      <input
                        type="number"
                        value={roiInputs.errorRate}
                        onChange={(e) => setROIInputs({...roiInputs, errorRate: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t('pricing.roiCalculator.inputs.currentErrorRate.placeholder')}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('pricing.roiCalculator.inputs.budgetRange.label')}
                        </label>
                        <select
                          value={extendedInputs.budgetRange}
                          onChange={(e) => setExtendedInputs({...extendedInputs, budgetRange: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="10k-50k">{t('pricing.roiCalculator.inputs.budgetRange.options.range1')}</option>
                          <option value="50k-100k">{t('pricing.roiCalculator.inputs.budgetRange.options.range2')}</option>
                          <option value="100k-500k">{t('pricing.roiCalculator.inputs.budgetRange.options.range3')}</option>
                          <option value="500k+">{t('pricing.roiCalculator.inputs.budgetRange.options.range4')}</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('pricing.roiCalculator.inputs.implementationTimeline.label')}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="36"
                          value={extendedInputs.implementationTimeline}
                          onChange={(e) => setExtendedInputs({...extendedInputs, implementationTimeline: Number(e.target.value)})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('pricing.roiCalculator.inputs.implementationTimeline.placeholder')}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('pricing.roiCalculator.inputs.expectedEfficiencyGain')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={extendedInputs.expectedEfficiencyGain}
                        onChange={(e) => setExtendedInputs({...extendedInputs, expectedEfficiencyGain: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('pricing.roiCalculator.inputs.automationReadiness')}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={extendedInputs.automationReadiness}
                          onChange={(e) => setExtendedInputs({...extendedInputs, automationReadiness: Number(e.target.value)})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('pricing.roiCalculator.inputs.changeManagement')}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={extendedInputs.changeManagementReadiness}
                          onChange={(e) => setExtendedInputs({...extendedInputs, changeManagementReadiness: Number(e.target.value)})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('pricing.roiCalculator.inputs.technicalComplexity')}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={extendedInputs.technicalComplexity}
                          onChange={(e) => setExtendedInputs({...extendedInputs, technicalComplexity: Number(e.target.value)})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="regulatory"
                        checked={extendedInputs.regulatoryRequirements}
                        onChange={(e) => setExtendedInputs({...extendedInputs, regulatoryRequirements: e.target.checked})}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="regulatory" className="text-sm font-medium text-gray-700">
                        {t('pricing.roiCalculator.inputs.regulatoryRequirements')}
                      </label>
                    </div>
                    
                    <button
                    onClick={handleCalculateROI}
                    disabled={roiLoading}
                    className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {roiLoading ? t('pricing.roiCalculator.calculating') : t('pricing.roiCalculator.calculateButton')}
                  </button>
                  </div>
                </div>

                {/* Results */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">{t('pricing.roiCalculator.results.title')}</h3>
                  
                  {roiError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="text-red-800 text-sm">
                        <strong>{t('pricing.roiCalculator.results.validationError')}:</strong> {roiError}
                      </div>
                    </div>
                  )}
                  
                  {roiLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">{t('pricing.roiCalculator.results.calculating')}</p>
                    </div>
                  ) : roiResults ? (
                    <div className="space-y-4">
                      {/* Main Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-2xl font-bold text-red-600">
                            ${roiResults.currentWaste.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">{t('pricing.roiCalculator.results.metrics.annualWasteFromInefficiencies')}</div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-2xl font-bold text-green-600">
                            ${roiResults.annualSavings.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">{t('pricing.roiCalculator.results.metrics.projectedAnnualSavings')}</div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-2xl font-bold text-blue-600">
                            {roiResults.paybackPeriod.toFixed(1)} months
                          </div>
                          <div className="text-sm text-gray-600">{t('pricing.roiCalculator.results.metrics.paybackPeriod')}</div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-2xl font-bold text-purple-600">
                            {roiResults.threeYearROI.toFixed(0)}%
                          </div>
                          <div className="text-sm text-gray-600">{t('pricing.roiCalculator.results.metrics.threeYearROI')}</div>
                        </div>
                      </div>
                      
                      {/* Advanced Metrics */}
                      {(roiResults.npv || roiResults.irr) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {roiResults.npv && (
                            <div className="bg-white rounded-lg p-4">
                              <div className="text-xl font-bold text-indigo-600">
                                ${roiResults.npv.toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-600">{t('pricing.roiCalculator.results.metrics.npv')}</div>
                            </div>
                          )}
                          {roiResults.irr && (
                            <div className="bg-white rounded-lg p-4">
                              <div className="text-xl font-bold text-teal-600">
                                {roiResults.irr.toFixed(1)}%
                              </div>
                              <div className="text-sm text-gray-600">{t('pricing.roiCalculator.results.metrics.irr')}</div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Breakdown */}
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-lg font-semibold text-gray-900 mb-2">{t('pricing.roiCalculator.results.savingsBreakdown.title')}:</div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>{t('pricing.roiCalculator.results.savingsBreakdown.categories.time_savings')}:</span>
                            <span className="font-medium">${roiResults.timeSavings.toLocaleString()}/year</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('pricing.roiCalculator.results.savingsBreakdown.categories.error_reduction')}:</span>
                            <span className="font-medium">${roiResults.errorSavings.toLocaleString()}/year</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* AI Insights */}
                      {roiResults.insights && roiResults.insights.length > 0 && (
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-lg font-semibold text-gray-900 mb-2">{t('pricing.roiCalculator.results.aiInsights')}:</div>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {roiResults.insights.map((insight, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                {insight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Risk Factors */}
                      {roiResults.riskFactors && roiResults.riskFactors.length > 0 && (
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-lg font-semibold text-gray-900 mb-2">{t('pricing.roiCalculator.results.riskFactors.title')}:</div>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {roiResults.riskFactors.map((risk, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-orange-500 mr-2">⚠</span>
                                {t(`pricing.roiCalculator.results.riskFactors.risk${index + 1}`)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Recommendations */}
                      {roiResults.recommendations && roiResults.recommendations.length > 0 && (
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-lg font-semibold text-gray-900 mb-2">{t('pricing.roiCalculator.results.recommendations.title')}:</div>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {roiResults.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-green-500 mr-2">✓</span>
                                {t(`pricing.roiCalculator.results.recommendations.recommendation${index + 1}`)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">{t('pricing.roiCalculator.results.fillForm')}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('pricing.addOns.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('pricing.addOns.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {addOns.map((addon, index) => (
              <motion.div
                key={addon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">{addon.name}</h3>
                <p className="text-gray-600 mb-4">{addon.description}</p>
                <div className="text-2xl font-bold text-blue-600 mb-4">{addon.price}</div>
                
                <div className="space-y-2 mb-6">
                  {addon.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Link
                  to={buildContactPath({ source: 'pricing_addon', addon: addon.id })}
                  className="w-full py-2 px-4 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                >
                  {t('pricing.addOns.addToPlan')}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('pricing.faq.title')}</h2>
            <p className="text-xl text-gray-600">{t('pricing.faq.subtitle')}</p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: "What's included in the implementation?",
                answer: "All packages include full implementation, data migration, staff training, and 90 days of support. We handle everything from setup to go-live."
              },
              {
                question: "How long does implementation take?",
                answer: "Typical implementation ranges from 4-12 weeks depending on complexity. We provide a detailed timeline during the consultation phase."
              },
              {
                question: "Do you offer custom pricing for large enterprises?",
                answer: "Yes, we offer custom pricing and solutions for enterprises with unique requirements. Contact our sales team for a personalized quote."
              },
              {
                question: "What kind of support do you provide?",
                answer: "All plans include ongoing support, with response times varying by tier. Enterprise customers get 24/7 support with dedicated account management."
              },
              {
                question: "Can I upgrade or downgrade my plan?",
                answer: "Yes, you can change your plan at any time. We'll help you transition smoothly and adjust billing accordingly."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-gray-50 rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t(`pricing.faq.questions.question${index + 1}.question`)}</h3>
                <p className="text-gray-600">{t(`pricing.faq.questions.question${index + 1}.answer`)}</p>
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
                to="/audit"
                className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
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
