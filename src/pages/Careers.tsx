import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Clock, ArrowRight } from 'lucide-react';

export default function Careers() {
  const { t } = useTranslation();

  const openPositions = [
    {
      title: t('careers.positions.aiEngineer.title', 'AI/ML Engineer'),
      department: t('careers.positions.aiEngineer.department', 'Engineering'),
      location: t('careers.positions.aiEngineer.location', 'Remote'),
      type: t('careers.positions.aiEngineer.type', 'Full-time'),
      description: t('careers.positions.aiEngineer.description', 'Design and implement AI models for business process automation. Work with cutting-edge ML frameworks and large language models.'),
    },
    {
      title: t('careers.positions.fullstackDev.title', 'Full-Stack Developer'),
      department: t('careers.positions.fullstackDev.department', 'Engineering'),
      location: t('careers.positions.fullstackDev.location', 'Remote / Hybrid'),
      type: t('careers.positions.fullstackDev.type', 'Full-time'),
      description: t('careers.positions.fullstackDev.description', 'Build scalable web applications using React, TypeScript, and Python FastAPI. Contribute to our core platform development.'),
    },
    {
      title: t('careers.positions.consultant.title', 'Business Automation Consultant'),
      department: t('careers.positions.consultant.department', 'Consulting'),
      location: t('careers.positions.consultant.location', 'Remote'),
      type: t('careers.positions.consultant.type', 'Full-time'),
      description: t('careers.positions.consultant.description', 'Help clients identify automation opportunities and implement AI solutions. Strong background in process optimization required.'),
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">
            {t('careers.hero.title', 'Join Our Team')}
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {t('careers.hero.subtitle', "Help us transform how businesses operate with AI. We're building the future of business automation and we want you to be part of it.")}
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
          >
            {t('careers.hero.cta', 'Get in Touch')}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {t('careers.values.title', 'Why Work With Us')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🚀',
                title: t('careers.values.growth.title', 'Career Growth'),
                description: t('careers.values.growth.description', 'Continuous learning opportunities, mentorship programs, and clear career progression paths.')
              },
              {
                icon: '🌍',
                title: t('careers.values.remote.title', 'Remote-First'),
                description: t('careers.values.remote.description', 'Work from anywhere in the world with flexible hours and a focus on results, not hours logged.')
              },
              {
                icon: '💡',
                title: t('careers.values.innovation.title', 'Innovation Culture'),
                description: t('careers.values.innovation.description', 'Work on cutting-edge AI technology and have a direct impact on product direction.')
              }
            ].map((value) => (
              <div key={value.title} className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">
            {t('careers.openPositions.title', 'Open Positions')}
          </h2>
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
                    {t('careers.apply', 'Apply Now')}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center bg-gray-50 rounded-2xl p-10">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('careers.openApplication.title', "Don't See Your Role?")}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('careers.openApplication.description', "We're always looking for talented people. Send us your CV and we'll reach out when there's a match.")}
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center px-8 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
            >
              {t('careers.openApplication.cta', 'Send Open Application')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
