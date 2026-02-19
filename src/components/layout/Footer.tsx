import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Linkedin, Twitter, Github } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { buildContactPath } from '@/utils/contactQuery';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    solutions: [
      { name: t('footer.links.processAutomation'), href: '/solutions' },
      { name: t('footer.links.dataIntegration'), href: '/solutions' },
      { name: t('footer.links.aiImplementation'), href: '/solutions' },
      { name: t('footer.links.customDevelopment'), href: '/solutions' },
    ],
    resources: [
      { name: t('footer.links.caseStudies'), href: '/case-studies' },
      { name: t('footer.links.blog'), href: '/blog' },
      { name: t('footer.links.roiCalculator'), href: '/pricing' },
      { name: t('footer.links.freeAudit'), href: '/audit' },
    ],
    company: [
      { name: t('footer.links.aboutUs'), href: '/about' },
      { name: t('footer.links.careers'), href: '/careers' },
      { name: t('footer.links.contact'), href: '/contact' },
      { name: t('footer.links.privacyPolicy'), href: '/privacy' },
    ],
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <span className="text-2xl font-bold text-primary">{t('common.companyName')}</span>
            </div>
            <p className="text-gray-300 mb-4">
              {t('footer.description')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-gray-300">
                <Mail className="h-4 w-4 mr-2" />
                <span>{t('footer.contact.email')}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Phone className="h-4 w-4 mr-2" />
                <span>{t('footer.contact.phone')}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{t('footer.contact.address')}</span>
              </div>
            </div>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.sections.solutions')}</h3>
            <ul className="space-y-2">
              {footerLinks.solutions.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.sections.resources')}</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.sections.company')}</h3>
            <ul className="space-y-2 mb-6">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Social Links */}
            <div className="flex space-x-4">
              <Link
                to={buildContactPath({ source: 'social_link' })}
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link
                to={buildContactPath({ source: 'social_link' })}
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                to={buildContactPath({ source: 'social_link' })}
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-300 text-sm">
            {t('footer.copyright', { year: currentYear })}
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/terms" className="text-gray-300 hover:text-white text-sm transition-colors">
              {t('footer.links.termsOfService')}
            </Link>
            <Link to="/privacy" className="text-gray-300 hover:text-white text-sm transition-colors">
              {t('footer.links.privacyPolicy')}
            </Link>
            <Link to="/cookies" className="text-gray-300 hover:text-white text-sm transition-colors">
              {t('footer.links.cookiePolicy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
