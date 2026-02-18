import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Terms() {
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
          {t('terms.title', 'Terms of Service')}
        </h1>
        <p className="text-gray-500 mb-10">
          {t('terms.lastUpdated', 'Last updated')}: {t('terms.lastUpdatedDate', 'January 1, 2025')}
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('terms.sections.acceptance.title', '1. Acceptance of Terms')}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t('terms.sections.acceptance.content', 'By accessing or using XTeam.Pro services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('terms.sections.services.title', '2. Description of Services')}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t('terms.sections.services.content', 'XTeam.Pro provides AI-powered business process automation assessment, consulting, and implementation services. We reserve the right to modify, suspend, or discontinue any aspect of our services at any time.')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('terms.sections.userObligations.title', '3. User Obligations')}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t('terms.sections.userObligations.intro', 'When using our services, you agree to:')}
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>{t('terms.sections.userObligations.item1', 'Provide accurate and complete information')}</li>
              <li>{t('terms.sections.userObligations.item2', 'Not use our services for any unlawful purpose')}</li>
              <li>{t('terms.sections.userObligations.item3', 'Not attempt to gain unauthorized access to our systems')}</li>
              <li>{t('terms.sections.userObligations.item4', 'Respect intellectual property rights')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('terms.sections.intellectualProperty.title', '4. Intellectual Property')}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t('terms.sections.intellectualProperty.content', 'All content, features, and functionality on XTeam.Pro are owned by XTeam.Pro and are protected by international copyright, trademark, and other intellectual property laws.')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('terms.sections.limitation.title', '5. Limitation of Liability')}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t('terms.sections.limitation.content', 'XTeam.Pro shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use our services. Our total liability shall not exceed the amount paid by you in the twelve months preceding the claim.')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('terms.sections.termination.title', '6. Termination')}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t('terms.sections.termination.content', 'We reserve the right to terminate or suspend your access to our services at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('terms.sections.governing.title', '7. Governing Law')}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t('terms.sections.governing.content', 'These Terms shall be governed by applicable law. Any disputes shall be resolved through binding arbitration or in a court of competent jurisdiction.')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('terms.sections.contact.title', '8. Contact Us')}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t('terms.sections.contact.content', 'If you have questions about these Terms of Service, please contact us at:')}
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
