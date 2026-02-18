import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiCall } from '../utils/api';
import { motion } from 'framer-motion';
import { Download, TrendingUp, Target, Zap, AlertCircle, CheckCircle2, ArrowRight, Clock, RefreshCw } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { toast } from 'sonner';

interface AuditResult {
  audit_id: string;
  company_name: string;
  maturity_score: number;
  automation_potential: number;
  roi_projection: number;
  implementation_timeline: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendations: string[];
  process_scores: Record<string, number>;
  priority_areas: string[];
  estimated_savings?: number;
  implementation_cost?: number;
  payback_period?: number;
  pdf_report_url?: string;
  created_at: string;
  status: string;
}

interface AuditStatus {
  audit_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function AuditResults() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const checkAuditStatus = async (): Promise<AuditStatus | null> => {
    try {
      const response = await apiCall(`/api/audit/status/${id}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (err) {
      console.error('Error checking audit status:', err);
      return null;
    }
  };

  const fetchResults = async (): Promise<boolean> => {
    try {
      const response = await apiCall(`/api/audit/results/${id}`);
      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setProcessing(false);
        setLoading(false);
        toast.success('Audit results are ready!');
        return true;
      } else if (response.status === 202) {
        // Still processing
        return false;
      } else {
        throw new Error('Failed to fetch audit results');
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('202')) {
        return false; // Still processing
      }
      throw err;
    }
  };

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    const startPolling = async () => {
      if (!id) return;

      try {
        // First, try to get results immediately
        const hasResults = await fetchResults();
        if (hasResults) return;

        // If no results, check status and start polling
        const status = await checkAuditStatus();
        if (status?.status === 'processing') {
          setProcessing(true);
          setLoading(false);
          
          // Simulate progress for better UX
          let currentProgress = 0;
          progressInterval = setInterval(() => {
            currentProgress += Math.random() * 15;
            if (currentProgress > 90) currentProgress = 90;
            setProgress(currentProgress);
          }, 2000);

          // Poll for results every 5 seconds
          pollInterval = setInterval(async () => {
            const hasResults = await fetchResults();
            if (hasResults) {
              clearInterval(pollInterval);
              clearInterval(progressInterval);
              setProgress(100);
            }
          }, 5000);
        } else if (status?.status === 'completed') {
          // Try fetching results again
          await fetchResults();
        } else {
          setError('Audit not found or failed to process');
          setLoading(false);
        }
      } catch (err) {
        setError('Unable to load audit results. Please try again later.');
        console.error('Error fetching audit results:', err);
        setLoading(false);
      }
    };

    startPolling();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [id]);

  const handleDownloadReport = () => {
    if (result?.pdf_report_url) {
      window.open(result.pdf_report_url, '_blank');
    } else {
      // Fallback to download endpoint
      window.open(`/api/audit/download/${id}`, '_blank');
    }
  };

  const handleBookConsultation = () => {
    navigate('/contact?source=audit');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('auditResults.loading')}</p>
        </div>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md mx-4">
          <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auditResults.processing.title')}</h2>
          <p className="text-gray-600 mb-6">
            {t('auditResults.processing.subtitle')}
          </p>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <p className="text-sm text-gray-500 mb-4">
            {Math.round(progress)}% {t('auditResults.processing.complete')}
          </p>
          
          <div className="flex items-center justify-center text-sm text-gray-500">
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            {t('auditResults.processing.timeEstimate')}
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md mx-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auditResults.error.title')}</h2>
          <p className="text-gray-600 mb-4">
            {error || t('auditResults.error.subtitle')}
          </p>
          <button
            onClick={() => window.location.href = '/audit'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('auditResults.error.button')}
          </button>
        </div>
      </div>
    );
  }

  // Prepare radar chart data from process_scores
  const radarData = Object.entries(result.process_scores).map(([category, score]) => ({
    category: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    score: score,
    fullMark: 100
  }));

  // Prepare ROI chart data
  const roiData = [
    {
      name: t('auditResults.metrics.currentState'),
      cost: result.implementation_cost || 0,
      savings: 0,
      net: -(result.implementation_cost || 0)
    },
    {
      name: `After ${result.payback_period || 12} Months`,
      cost: result.implementation_cost || 0,
      savings: result.estimated_savings || 0,
      net: (result.estimated_savings || 0) - (result.implementation_cost || 0)
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return t('auditResults.ratings.excellent');
    if (score >= 60) return t('auditResults.ratings.good');
    if (score >= 40) return t('auditResults.ratings.fair');
    return t('auditResults.ratings.needsImprovement');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('auditResults.title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('auditResults.subtitle')}
          </p>
        </motion.div>

        {/* Maturity Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('auditResults.maturityScore.title')}</h2>
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(result.maturity_score / 100) * 314} 314`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{result.maturity_score}</div>
                    <div className="text-sm text-gray-500">/ 100</div>
                  </div>
                </div>
              </div>
            </div>
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getScoreColor(result.maturity_score)}`}>
              {getScoreLabel(result.maturity_score)}
            </div>
          </div>
        </motion.div>

        {/* ROI Forecast */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
            {t('auditResults.roiForecast.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                ${result.estimated_savings?.toLocaleString() || 'TBD'}
              </div>
              <div className="text-sm text-gray-600">{t('auditResults.metrics.annualSavings')}</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                ${result.implementation_cost?.toLocaleString() || 'TBD'}
              </div>
              <div className="text-sm text-gray-600">{t('auditResults.metrics.implementationCost')}</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {result.payback_period || 'TBD'} months
              </div>
              <div className="text-sm text-gray-600">{t('auditResults.metrics.paybackPeriod')}</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {result.automation_potential}%
              </div>
              <div className="text-sm text-gray-600">{t('auditResults.metrics.automationPotential')}</div>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="cost" fill="#ef4444" name={t('auditResults.metrics.investment')} />
                <Bar dataKey="savings" fill="#10b981" name={t('auditResults.metrics.savings')} />
                <Bar dataKey="net" fill="#3b82f6" name={t('auditResults.metrics.netBenefit')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Maturity Assessment Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Target className="w-6 h-6 mr-2 text-blue-600" />
            {t('auditResults.maturityAssessment.title')}
          </h2>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name={t('auditResults.metrics.currentScore')}
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Strengths, Weaknesses & Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <CheckCircle2 className="w-6 h-6 mr-2 text-green-500" />
              {t('auditResults.sections.strengths')}
            </h2>
            
            <div className="space-y-4">
              {result.strengths.map((strength, index) => (
                <div key={index} className="flex items-start p-4 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{strength}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Weaknesses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <AlertCircle className="w-6 h-6 mr-2 text-red-500" />
              {t('auditResults.sections.weaknesses')}
            </h2>
            
            <div className="space-y-4">
              {result.weaknesses.map((weakness, index) => (
                <div key={index} className="flex items-start p-4 bg-red-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{weakness}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Opportunities */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-yellow-500" />
              {t('auditResults.sections.opportunities')}
            </h2>
            
            <div className="space-y-4">
              {result.opportunities.map((opportunity, index) => (
                <div key={index} className="flex items-start p-4 bg-yellow-50 rounded-lg">
                  <Zap className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{opportunity}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Strategic Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Target className="w-6 h-6 mr-2 text-blue-600" />
            {t('auditResults.sections.recommendations')}
          </h2>
          
          <div className="space-y-4">
            {result.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start p-4 bg-blue-50 rounded-lg">
                <ArrowRight className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{rec}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Implementation Priorities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('auditResults.sections.priorities')}</h2>
          
          <div className="space-y-4">
            {result.priority_areas && result.priority_areas.length > 0 ? (
              result.priority_areas.map((priority, index) => (
                <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                    {index + 1}
                  </div>
                  <span className="text-gray-700 font-medium">{priority}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>{t('auditResults.messages.priorityAreasAvailable')}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-4">{t('auditResults.cta.title')}</h2>
          <p className="text-lg mb-8 opacity-90">
            {t('auditResults.cta.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleDownloadReport}
              className="flex items-center justify-center px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              <Download className="w-5 h-5 mr-2" />
              {t('auditResults.cta.downloadReport')}
            </button>
            
            <button
              onClick={handleBookConsultation}
              className="flex items-center justify-center px-8 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium"
            >
              {t('auditResults.cta.bookConsultation')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
