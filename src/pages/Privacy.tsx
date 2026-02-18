import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Privacy() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm">
            ← {t('common.backToHome', 'Back to Home')}
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('privacy.title', 'Privacy Policy')}
        </h1>
        <p className="text-gray-500 mb-10">
          {t('privacy.lastUpdated', 'Last updated')}: {t('privacy.lastUpdatedDate', 'January 1, 2025')}
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.sections.introduction.title', '1. Introduction')}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t('privacy.sections.introduction.content', 'XTeam.Pro ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.sections.dataCollected.title', '2. Information We Collect')}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t('privacy.sections.dataCollected.intro', 'We may collect the following types of information:')}
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>{t('privacy.sections.dataCollected.item1', 'Personal identification information (name, email address, phone number)')}</li>
              <li>{t('privacy.sections.dataCollected.item2', 'Business information (company name, industry, company size)')}</li>
              <li>{t('privacy.sections.dataCollected.item3', 'Usage data (pages visited, time spent, browser type)')}</li>
              <li>{t('privacy.sections.dataCollected.item4', 'Audit submission data you provide through our assessment tools')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.sections.dataUse.title', '3. How We Use Your Information')}
            </h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>{t('privacy.sections.dataUse.item1', 'To provide and maintain our services')}</li>
              <li>{t('privacy.sections.dataUse.item2', 'To send you audit results and recommendations')}</li>
              <li>{t('privacy.sections.dataUse.item3', 'To respond to your inquiries and support requests')}</li>
              <li>{t('privacy.sections.dataUse.item4', 'To improve our platform and services')}</li>
              <li>{t('privacy.sections.dataUse.item5', 'To send marketing communications (with your consent)')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.sections.dataSharing.title', '4. Information Sharing')}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t('privacy.sections.dataSharing.content', 'We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our website and conducting our business, so long as those parties agree to keep this information confidential.')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.sections.dataSecurity.title', '5. Data Security')}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t('privacy.sections.dataSecurity.content', 'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.sections.yourRights.title', '6. Your Rights')}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t('privacy.sections.yourRights.intro', 'Depending on your location, you may have the following rights:')}
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>{t('privacy.sections.yourRights.item1', 'Right to access your personal data')}</li>
              <li>{t('privacy.sections.yourRights.item2', 'Right to correct inaccurate data')}</li>
              <li>{t('privacy.sections.yourRights.item3', 'Right to request deletion of your data')}</li>
              <li>{t('privacy.sections.yourRights.item4', 'Right to withdraw consent at any time')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.sections.contact.title', '7. Contact Us')}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t('privacy.sections.contact.content', 'If you have questions about this Privacy Policy, please contact us at:')}
            </p>
            <p className="text-gray-600 mt-2">
              <strong>XTeam.Pro</strong><br />
              {t('footer.contact.email', 'info@xteam.pro')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
