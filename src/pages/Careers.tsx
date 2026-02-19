import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Clock, ArrowRight, TrendingUp, Globe, Lightbulb } from 'lucide-react';

export default function Careers() {
  const { t } = useTranslation();

  const openPositions = [
    {
      title: t('careers.positions.aiEngineer.title'),
      department: t('careers.positions.aiEngineer.department'),
      location: t('careers.positions.aiEngineer.location'),
      type: t('careers.positions.aiEngineer.type'),
      description: t('careers.positions.aiEngineer.description'),
    },
    {
      title: t('careers.positions.fullstackDev.title'),
      department: t('careers.positions.fullstackDev.department'),
      location: t('careers.positions.fullstackDev.location'),
      type: t('careers.positions.fullstackDev.type'),
      description: t('careers.positions.fullstackDev.description'),
    },
    {
      title: t('careers.positions.consultant.title'),
      department: t('careers.positions.consultant.department'),
      location: t('careers.positions.consultant.location'),
      type: t('careers.positions.consultant.type'),
      description: t('careers.positions.consultant.description'),
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">{t('careers.hero.title')}</h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">{t('careers.hero.subtitle')}</p>
          <Link
            to="/contact"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
          >
            {t('careers.hero.cta')}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{t('careers.values.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
                title: t('careers.values.growth.title'),
                description: t('careers.values.growth.description'),
              },
              {
                icon: <Globe className="w-8 h-8 text-blue-600" />,
                title: t('careers.values.remote.title'),
                description: t('careers.values.remote.description'),
              },
              {
                icon: <Lightbulb className="w-8 h-8 text-blue-600" />,
                title: t('careers.values.innovation.title'),
                description: t('careers.values.innovation.description'),
              },
            ].map((value) => (
              <div key={value.title} className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">{t('careers.openPositions.title')}</h2>
          <div className="space-y-6">
            {openPositions.map((position) => (
              <div key={position.title} className="border border-gray-200 rounded-2xl p-8 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{position.title}</h3>
                  <span className="mt-2 sm:mt-0 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                    {position.department}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{position.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {position.location}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {position.type}
                  </div>
                  <div className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-1" />
                    {position.department}
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    to="/contact"
                    className="inline-flex items-center px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('careers.apply')}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center bg-gray-50 rounded-2xl p-10">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">{t('careers.openApplication.title')}</h3>
            <p className="text-gray-600 mb-6">{t('careers.openApplication.description')}</p>
            <Link
              to="/contact"
              className="inline-flex items-center px-8 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
            >
              {t('careers.openApplication.cta')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
