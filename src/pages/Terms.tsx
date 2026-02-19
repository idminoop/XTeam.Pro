import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Terms() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm">
            {'<-'} {t('common.backToHome')}
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('terms.title')}</h1>
        <p className="text-gray-500 mb-10">
          {t('terms.lastUpdated')}: {t('terms.lastUpdatedDate')}
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('terms.sections.acceptance.title')}
            </h2>
            <p className="text-gray-600 leading-relaxed">{t('terms.sections.acceptance.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('terms.sections.services.title')}
            </h2>
            <p className="text-gray-600 leading-relaxed">{t('terms.sections.services.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('terms.sections.userObligations.title')}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">{t('terms.sections.userObligations.intro')}</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>{t('terms.sections.userObligations.item1')}</li>
              <li>{t('terms.sections.userObligations.item2')}</li>
              <li>{t('terms.sections.userObligations.item3')}</li>
              <li>{t('terms.sections.userObligations.item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('terms.sections.intellectualProperty.title')}
            </h2>
            <p className="text-gray-600 leading-relaxed">{t('terms.sections.intellectualProperty.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('terms.sections.limitation.title')}
            </h2>
            <p className="text-gray-600 leading-relaxed">{t('terms.sections.limitation.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('terms.sections.termination.title')}
            </h2>
            <p className="text-gray-600 leading-relaxed">{t('terms.sections.termination.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('terms.sections.governing.title')}
            </h2>
            <p className="text-gray-600 leading-relaxed">{t('terms.sections.governing.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('terms.sections.contact.title')}
            </h2>
            <p className="text-gray-600 leading-relaxed">{t('terms.sections.contact.content')}</p>
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
