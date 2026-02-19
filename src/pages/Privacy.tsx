import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Privacy() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm">
            {'<-'} {t('common.backToHome')}
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('privacy.title')}</h1>
        <p className="text-gray-500 mb-10">
          {t('privacy.lastUpdated')}: {t('privacy.lastUpdatedDate')}
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.sections.introduction.title')}
            </h2>
            <p className="text-gray-600 leading-relaxed">{t('privacy.sections.introduction.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.sections.dataCollected.title')}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">{t('privacy.sections.dataCollected.intro')}</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>{t('privacy.sections.dataCollected.item1')}</li>
              <li>{t('privacy.sections.dataCollected.item2')}</li>
              <li>{t('privacy.sections.dataCollected.item3')}</li>
              <li>{t('privacy.sections.dataCollected.item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('privacy.sections.dataUse.title')}</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>{t('privacy.sections.dataUse.item1')}</li>
              <li>{t('privacy.sections.dataUse.item2')}</li>
              <li>{t('privacy.sections.dataUse.item3')}</li>
              <li>{t('privacy.sections.dataUse.item4')}</li>
              <li>{t('privacy.sections.dataUse.item5')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.sections.dataSharing.title')}
            </h2>
            <p className="text-gray-600 leading-relaxed">{t('privacy.sections.dataSharing.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.sections.dataSecurity.title')}
            </h2>
            <p className="text-gray-600 leading-relaxed">{t('privacy.sections.dataSecurity.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('privacy.sections.yourRights.title')}</h2>
            <p className="text-gray-600 leading-relaxed mb-4">{t('privacy.sections.yourRights.intro')}</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>{t('privacy.sections.yourRights.item1')}</li>
              <li>{t('privacy.sections.yourRights.item2')}</li>
              <li>{t('privacy.sections.yourRights.item3')}</li>
              <li>{t('privacy.sections.yourRights.item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('privacy.sections.contact.title')}</h2>
            <p className="text-gray-600 leading-relaxed">{t('privacy.sections.contact.content')}</p>
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
