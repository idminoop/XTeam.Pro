import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Cookies() {
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
          {t('cookies.title', 'Cookie Policy')}
        </h1>
        <p className="text-gray-500 mb-10">
          {t('cookies.lastUpdated', 'Last updated')}: {t('cookies.lastUpdatedDate', 'January 1, 2025')}
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('cookies.sections.whatAreCookies.title', '1. What Are Cookies')}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t('cookies.sections.whatAreCookies.content', 'Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the website owners.')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('cookies.sections.howWeUse.title', '2. How We Use Cookies')}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t('cookies.sections.howWeUse.intro', 'We use cookies for the following purposes:')}
            </p>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {t('cookies.sections.howWeUse.essential.title', 'Essential Cookies')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('cookies.sections.howWeUse.essential.description', 'These cookies are necessary for the website to function properly. They enable core functionality such as security and network management.')}
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {t('cookies.sections.howWeUse.analytics.title', 'Analytics Cookies')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('cookies.sections.howWeUse.analytics.description', 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.')}
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {t('cookies.sections.howWeUse.preferences.title', 'Preference Cookies')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('cookies.sections.howWeUse.preferences.description', 'These cookies allow us to remember your preferences, such as language selection, to provide a more personalized experience.')}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('cookies.sections.thirdParty.title', '3. Third-Party Cookies')}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t('cookies.sections.thirdParty.content', 'In addition to our own cookies, we may also use various third-party cookies to report usage statistics and deliver advertisements. These cookies are governed by the respective privacy policies of the third parties.')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('cookies.sections.control.title', '4. Controlling Cookies')}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t('cookies.sections.control.content', 'You can control and manage cookies in various ways. Most web browsers allow you to manage your cookie preferences. You can set your browser to refuse cookies, or to alert you when cookies are being sent. However, disabling cookies may affect the functionality of our website.')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('cookies.sections.contact.title', '5. Contact Us')}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t('cookies.sections.contact.content', 'If you have questions about our use of cookies, please contact us at:')}
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
