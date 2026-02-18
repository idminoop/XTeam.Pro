import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { apiCall } from '../utils/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  Users, FileText, TrendingUp, DollarSign,
  Settings, Download, Search, Eye, Edit, Trash2,
  CheckCircle, Clock, AlertCircle, Mail, Phone, LogOut
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Interfaces matching FastAPI backend
interface AuditSubmission {
  audit_id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  submitted_at: string;
  status: 'pending' | 'processing' | 'completed';
  maturity_score: number | null;
  estimated_roi: number | null;
  industry: string;
  company_size: string;
}

interface ContactInquiry {
  inquiry_id: string;
  name: string;
  email: string;
  company: string;
  inquiry_type: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  response_sent: boolean;
}

interface DashboardStats {
  total_audits: number;
  audits_this_month: number;
  total_contacts: number;
  contacts_this_month: number;
  total_blog_posts: number;
  published_posts: number;
  average_audit_score: number;
  conversion_rate: number;
  recent_activities: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

interface AuditConfiguration {
  ai_model: string;
  analysis_depth: string;
  include_roi_analysis: boolean;
  include_risk_assessment: boolean;
  include_implementation_roadmap: boolean;
  pdf_template: string;
  auto_generate_pdf: boolean;
  pdf_generation_enabled: boolean;
  auto_send_reports: boolean;
  notification_settings: {
    email_on_completion?: boolean;
    slack_notifications?: boolean;
    new_submissions?: boolean;
    weekly_reports?: boolean;
    completion_alerts?: boolean;
  };
  custom_prompts?: Record<string, string>;
}

interface AnalyticsData {
  totalSubmissions: number;
  completedAudits: number;
  averageMaturityScore: number;
  totalEstimatedROI: number;
  conversionRate: number;
  monthlySubmissions: { month: string; submissions: number; conversions: number }[];
  industryBreakdown: { industry: string; count: number; percentage: number }[];
  companySizeBreakdown: { size: string; count: number; percentage: number }[];
  maturityScoreDistribution: { range: string; count: number }[];
}

export default function Admin() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [submissions, setSubmissions] = useState<AuditSubmission[]>([]);
  const [contacts, setContacts] = useState<ContactInquiry[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [configuration, setConfiguration] = useState<AuditConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Authentication functions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const response = await apiCall('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      const token = data.access_token;
      setAuthToken(token);
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_token', token);
      await loadDashboardData(token);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('admin.login.error');
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthToken(null);
    sessionStorage.removeItem('admin_token');
    setLoginForm({ username: '', password: '' });
  };

  // Data loading functions — accepts token directly to avoid React state race condition
  const loadDashboardData = async (token?: string) => {
    const activeToken = token ?? authToken;
    if (!activeToken) return;

    try {
      setLoading(true);
      const [dashResponse, analyticsResponse] = await Promise.all([
        apiCall('/api/admin/dashboard', { headers: { 'Authorization': `Bearer ${activeToken}` } }),
        apiCall('/api/admin/analytics', { headers: { 'Authorization': `Bearer ${activeToken}` } })
      ]);
      const stats = await dashResponse.json();
      const analyticsData = await analyticsResponse.json();
      setDashboardStats(stats);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    if (!authToken) return;

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status_filter', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await apiCall(`/api/admin/audits?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  };

  const loadContacts = async () => {
    if (!authToken) return;

    try {
      const response = await apiCall('/api/admin/contacts', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const loadConfiguration = async () => {
    if (!authToken) return;

    try {
      const response = await apiCall('/api/admin/configuration', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const config = await response.json();
      setConfiguration(config);
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  };

  const updateConfiguration = async (newConfig: Partial<AuditConfiguration>) => {
    if (!authToken) return;

    try {
      await apiCall('/api/admin/configuration', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      });
      setConfiguration(prev => prev ? { ...prev, ...newConfig } : null);
    } catch (error) {
      console.error('Failed to update configuration:', error);
    }
  };

  useEffect(() => {
    // Check for existing token on component mount
    const token = sessionStorage.getItem('admin_token');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
      loadDashboardData(token); // pass token directly — state not yet updated
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && authToken) {
      if (activeTab === 'submissions') {
        loadSubmissions();
      } else if (activeTab === 'contacts') {
        loadContacts();
      } else if (activeTab === 'configuration') {
        loadConfiguration();
      }
    }
  }, [activeTab, isAuthenticated, authToken, statusFilter, searchTerm]);

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.industry.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const handleViewSubmission = (id: string) => {
    // Navigate to audit results page
    window.open(`/audit/results/${id}`, '_blank');
  };

  const handleEditSubmission = (id: string) => {
    void id;
    toast.error('Edit functionality is coming soon. Use View to review audit results.');
  };

  const handleDeleteSubmission = async (id: string) => {
    try {
      await apiCall(`/api/admin/submissions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      toast.success('Submission deleted');
      loadSubmissions();
    } catch {
      toast.error('Failed to delete submission');
    }
  };

  const handleExportData = async () => {
    try {
      const response = await apiCall('/api/admin/export?format=csv', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit_submissions.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Export downloaded');
    } catch {
      toast.error('Failed to export data');
    }
  };

  // Login form component
  const LoginForm = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('admin.login.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('admin.login.subtitle')}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('admin.login.username')}
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('admin.login.password')}
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>
          </div>

          {authError && (
            <div className="text-red-600 text-sm text-center">
              {authError}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={authLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {authLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>{t('admin.login.submit')}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('admin.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('admin.dashboard.title')}</h1>
              <p className="text-gray-600">{t('admin.dashboard.subtitle')}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleExportData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('admin.dashboard.exportData')}
              </button>
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                {t('admin.dashboard.settings')}
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('admin.actions.logout')}
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'dashboard', label: t('admin.actions.dashboard'), icon: BarChart },
              { id: 'submissions', label: t('admin.actions.submissions'), icon: FileText },
              { id: 'analytics', label: t('admin.tabs.analytics'), icon: TrendingUp },
              { id: 'configuration', label: t('admin.actions.configuration'), icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && dashboardStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('admin.dashboard.stats.users')}</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboardStats.total_audits}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-green-600 text-sm font-medium">+12% from last month</span>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('admin.dashboard.stats.audits')}</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboardStats.audits_this_month}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-green-600 text-sm font-medium">+8% completion rate</span>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('admin.dashboard.stats.avgMaturityScore')}</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboardStats.average_audit_score}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <TrendingUp className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-yellow-600 text-sm font-medium">{t('admin.dashboard.stats.industryAverage')}</span>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('admin.dashboard.stats.totalEstROI')}</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboardStats.total_contacts}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-purple-600 text-sm font-medium">{t('admin.dashboard.stats.conversionRate', { rate: dashboardStats.conversion_rate })}</span>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Monthly Submissions */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('admin.dashboard.charts.monthlySubmissions')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics?.monthlySubmissions || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="submissions" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="conversions" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.8} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Industry Breakdown */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('admin.dashboard.charts.industryBreakdown')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics?.industryBreakdown || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props) => {
                        const industry = 'industry' in props ? String(props.industry) : '';
                        const percentage = 'percentage' in props ? Number(props.percentage) : 0;
                        return `${industry} (${percentage}%)`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(analytics?.industryBreakdown || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'submissions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder={t('admin.dashboard.search.placeholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="md:w-48">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">{t('admin.dashboard.filters.allStatus')}</option>
                    <option value="pending">{t('admin.dashboard.filters.pending')}</option>
                    <option value="processing">{t('admin.dashboard.filters.processing')}</option>
                    <option value="completed">{t('admin.dashboard.filters.completed')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submissions Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.dashboard.table.company')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.dashboard.table.contact')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.dashboard.table.industry')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.dashboard.table.status')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.dashboard.table.maturityScore')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.dashboard.table.estROI')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.dashboard.table.submitted')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.dashboard.table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSubmissions.map((submission) => (
                      <tr key={submission.audit_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{submission.company_name}</div>
                            <div className="text-sm text-gray-500">{submission.company_size} employees</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{submission.contact_name}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {submission.email}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {submission.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{submission.industry}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                            {getStatusIcon(submission.status)}
                            <span className="ml-1 capitalize">{submission.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {submission.maturity_score ? (
                            <div className="text-sm font-medium text-gray-900">{submission.maturity_score}/100</div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {submission.estimated_roi ? (
                            <div className="text-sm font-medium text-gray-900">{formatCurrency(submission.estimated_roi)}</div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(submission.submitted_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleViewSubmission(submission.audit_id)}
                              className="text-blue-600 hover:text-blue-900"
                              title={t('admin.dashboard.actions.viewResults')}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditSubmission(submission.audit_id)}
                              className="text-gray-600 hover:text-gray-900"
                              title={t('admin.dashboard.actions.editSubmission')}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteSubmission(submission.audit_id)}
                              className="text-red-600 hover:text-red-900"
                              title={t('admin.dashboard.actions.deleteSubmission')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && analytics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Company Size Distribution */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('admin.dashboard.charts.companySizeDistribution')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.companySizeBreakdown || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="size" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Maturity Score Distribution */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('admin.dashboard.charts.maturityScoreDistribution')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.maturityScoreDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {activeTab === 'contacts' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{t('admin.dashboard.contactInquiries')}</h3>
                <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder={t('admin.dashboard.search.contactsPlaceholder')}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.dashboard.table.contact')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.dashboard.table.company')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.dashboard.table.inquiryType')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.dashboard.table.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.dashboard.table.date')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.dashboard.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <tr key={contact.inquiry_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {contact.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{contact.company}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {contact.inquiry_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          contact.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                          contact.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                          contact.status === 'qualified' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {contact.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(contact.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="text-blue-600 hover:text-blue-900" title={t('admin.dashboard.actions.viewDetails')}>
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900" title={t('admin.dashboard.actions.editContact')}>
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'configuration' && configuration && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('admin.dashboard.configuration.title')}</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.dashboard.configuration.aiModel')}
                    </label>
                    <select 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={configuration.ai_model}
                      onChange={(e) => setConfiguration({ ...configuration, ai_model: e.target.value })}
                    >
                      <option value="gpt-4">{t('admin.dashboard.configuration.models.gpt4')}</option>
                      <option value="gpt-3.5-turbo">{t('admin.dashboard.configuration.models.gpt35')}</option>
                      <option value="claude-3">{t('admin.dashboard.configuration.models.claude')}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.dashboard.configuration.analysisDepth')}
                    </label>
                    <select 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={configuration.analysis_depth}
                      onChange={(e) => setConfiguration({ ...configuration, analysis_depth: e.target.value })}
                    >
                      <option value="basic">{t('admin.dashboard.configuration.depths.basic')}</option>
                      <option value="standard">{t('admin.dashboard.configuration.depths.standard')}</option>
                      <option value="comprehensive">{t('admin.dashboard.configuration.depths.comprehensive')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.dashboard.configuration.pdfGeneration')}
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={configuration.pdf_generation_enabled}
                        onChange={(e) => setConfiguration({ ...configuration, pdf_generation_enabled: e.target.checked })}
                      />
                      <span className="ml-2 text-sm text-gray-700">{t('admin.dashboard.configuration.pdfGeneration')}</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.dashboard.configuration.autoSendReports')}
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={configuration.auto_send_reports}
                        onChange={(e) => setConfiguration({ ...configuration, auto_send_reports: e.target.checked })}
                      />
                      <span className="ml-2 text-sm text-gray-700">{t('admin.dashboard.configuration.autoSend')}</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.dashboard.configuration.emailNotifications')}
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={configuration.notification_settings?.new_submissions}
                        onChange={(e) => setConfiguration({ 
                          ...configuration, 
                          notification_settings: { 
                            ...configuration.notification_settings, 
                            new_submissions: e.target.checked 
                          }
                        })}
                      />
                      <span className="ml-2 text-sm text-gray-700">{t('admin.dashboard.configuration.newSubmissionNotifications')}</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={configuration.notification_settings?.weekly_reports}
                        onChange={(e) => setConfiguration({ 
                          ...configuration, 
                          notification_settings: { 
                            ...configuration.notification_settings, 
                            weekly_reports: e.target.checked 
                          }
                        })}
                      />
                      <span className="ml-2 text-sm text-gray-700">{t('admin.dashboard.configuration.weeklySummaryReports')}</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={configuration.notification_settings?.completion_alerts}
                        onChange={(e) => setConfiguration({ 
                          ...configuration, 
                          notification_settings: { 
                            ...configuration.notification_settings, 
                            completion_alerts: e.target.checked 
                          }
                        })}
                      />
                      <span className="ml-2 text-sm text-gray-700">{t('admin.dashboard.configuration.auditCompletionAlerts')}</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.dashboard.configuration.customPrompts')}
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder={t('admin.dashboard.configuration.customPromptsPlaceholder')}
                    value={JSON.stringify(configuration.custom_prompts || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setConfiguration({ ...configuration, custom_prompts: parsed });
                      } catch {
                        // Invalid JSON, keep current value
                      }
                    }}
                  />
                </div>
                
                <div className="flex justify-end space-x-4 pt-4">
                  <button 
                    onClick={() => loadConfiguration()}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('admin.dashboard.configuration.reset')}
                  </button>
                  <button 
                    onClick={() => updateConfiguration(configuration)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('admin.dashboard.configuration.save')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
