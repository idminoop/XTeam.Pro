import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Cookies() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm">
            {'<-'} {t('common.backToHome')}
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('cookies.title')}</h1>
        <p className="text-gray-500 mb-10">
          {t('cookies.lastUpdated')}: {t('cookies.lastUpdatedDate')}
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('cookies.sections.whatAreCookies.title')}
            </h2>
            <p className="text-gray-600 leading-relaxed">{t('cookies.sections.whatAreCookies.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('cookies.sections.howWeUse.title')}</h2>
            <p className="text-gray-600 leading-relaxed mb-4">{t('cookies.sections.howWeUse.intro')}</p>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {t('cookies.sections.howWeUse.essential.title')}
                </h3>
                <p className="text-gray-600 text-sm">{t('cookies.sections.howWeUse.essential.description')}</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {t('cookies.sections.howWeUse.analytics.title')}
                </h3>
                <p className="text-gray-600 text-sm">{t('cookies.sections.howWeUse.analytics.description')}</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {t('cookies.sections.howWeUse.preferences.title')}
                </h3>
                <p className="text-gray-600 text-sm">{t('cookies.sections.howWeUse.preferences.description')}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('cookies.sections.thirdParty.title')}</h2>
            <p className="text-gray-600 leading-relaxed">{t('cookies.sections.thirdParty.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('cookies.sections.control.title')}</h2>
            <p className="text-gray-600 leading-relaxed">{t('cookies.sections.control.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('cookies.sections.contact.title')}</h2>
            <p className="text-gray-600 leading-relaxed">{t('cookies.sections.contact.content')}</p>
            <p className="text-gray-600 mt-2">
              <strong>XTeam.Pro</strong>
              <br />
              {t('footer.contact.email')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
