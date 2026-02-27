import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock, Calendar, MessageSquare, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ContactForm {
  name: string;
  email: string;
  company: string;
  phone: string;
  position: string;
  inquiryType: string;
  subject: string;
  message: string;
  budget: string;
  timeline: string;
  services: string[];
  marketingConsent: boolean;
}

interface ContactResponse {
  inquiry_id: string;
  status: string;
  message: string;
  estimated_response_time: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface ContactInfo {
  icon: React.ReactNode;
  title: string;
  details: string[];
  action?: {
    text: string;
    href: string;
  };
}

type InquiryTypeValue = 'consultation' | 'demo' | 'partnership' | 'support' | 'other';

export default function Contact() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const sourceParam = searchParams.get('source');
  const caseParam = searchParams.get('case');
  const modelParam = searchParams.get('model');
  const tierParam = searchParams.get('tier');
  const addonParam = searchParams.get('addon');
  const refParam = searchParams.get('ref');
  const composedSource = [
    sourceParam,
    caseParam ? `case:${caseParam}` : null,
    modelParam ? `model:${modelParam}` : null,
    tierParam ? `tier:${tierParam}` : null,
    addonParam ? `addon:${addonParam}` : null,
    refParam ? `ref:${refParam}` : null
  ]
    .filter((value): value is string => Boolean(value))
    .join('|');
  const submissionSource = (composedSource || 'website_contact').slice(0, 100);
  const hasPrefillContext = Boolean(sourceParam || caseParam || modelParam || tierParam || addonParam || refParam);
  const missingPrefillValue = t('contact.form.prefill.missing');

  const inferredInquiryType: InquiryTypeValue =
    sourceParam?.startsWith('case_')
      ? 'demo'
      : sourceParam === 'blog_subscribe' || sourceParam === 'social_link'
        ? 'partnership'
        : sourceParam === 'audit_consultation'
          ? 'consultation'
          : 'consultation';

  const prefilledSubject = hasPrefillContext
    ? `${t('contact.form.prefill.subjectPrefix')}: ${sourceParam ?? missingPrefillValue}${caseParam ? ` (${caseParam})` : ''}`
    : '';

  const prefilledMessage = hasPrefillContext
    ? [
      `${t('contact.form.prefill.labels.source')}: ${sourceParam ?? missingPrefillValue}`,
      `${t('contact.form.prefill.labels.case')}: ${caseParam ?? missingPrefillValue}`,
      `${t('contact.form.prefill.labels.model')}: ${modelParam ?? missingPrefillValue}`,
      `${t('contact.form.prefill.labels.tier')}: ${tierParam ?? missingPrefillValue}`,
      `${t('contact.form.prefill.labels.addon')}: ${addonParam ?? missingPrefillValue}`,
      `${t('contact.form.prefill.labels.ref')}: ${refParam ?? missingPrefillValue}`,
      '',
      t('contact.form.prefill.briefPrompt')
    ].join('\n')
    : '';

  const createInitialFormData = (): ContactForm => ({
    name: '',
    email: '',
    company: '',
    phone: '',
    position: '',
    inquiryType: inferredInquiryType,
    subject: prefilledSubject,
    message: prefilledMessage,
    budget: '',
    timeline: '',
    services: [],
    marketingConsent: false
  });

  const localizedInfo = t('contact.info', { returnObjects: true }) as {
    email: { title: string; details: string[]; action?: string };
    phone: { title: string; details: string[]; action?: string };
    address: { title: string; details: string[]; action?: string };
    hours: { title: string; details: string[]; action?: string };
  };
  const [formData, setFormData] = useState<ContactForm>(() => createInitialFormData());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<ContactResponse | null>(null);

  const contactInfo: ContactInfo[] = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: t('contact.info.email.title'),
      details: localizedInfo.email.details,
      action: {
        text: t('contact.info.email.action'),
        href: `mailto:${localizedInfo.email.details[0] ?? 'info@xteam.pro'}`
      }
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: t('contact.info.phone.title'),
      details: localizedInfo.phone.details,
      action: {
        text: t('contact.info.phone.action'),
        href: 'https://t.me/xteampro'
      }
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: t('contact.info.address.title'),
      details: localizedInfo.address.details.slice(0, 2),
      action: {
        text: t('contact.info.address.action'),
        href: 'mailto:info@xteam.pro'
      }
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: t('contact.info.hours.title'),
      details: localizedInfo.hours.details,
      action: {
        text: t('contact.info.hours.action'),
        href: '#contact-form'
      }
    }
  ];

  const inquiryTypes = [
    { value: 'consultation', label: t('contact.form.inquiryTypes.consultation') },
    { value: 'demo', label: t('contact.form.inquiryTypes.demo') },
    { value: 'partnership', label: t('contact.form.inquiryTypes.partnership') },
    { value: 'support', label: t('contact.form.inquiryTypes.support') },
    { value: 'other', label: t('contact.form.inquiryTypes.other') }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateContactData = (): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    // Required fields validation
    if (!formData.name.trim()) {
      errors.name = t('contact.form.validation.nameRequired');
    } else if (formData.name.trim().length > 100) {
      errors.name = t('contact.form.validation.nameTooLong');
    }
    
    if (!formData.email.trim()) {
      errors.email = t('contact.form.validation.emailRequired');
    } else {
      const emailRegex = /^[\w.-]+@[\w.-]+\.\w+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = t('contact.form.validation.emailInvalid');
      }
    }
    
    if (!formData.company.trim()) {
      errors.company = t('contact.form.validation.companyRequired');
    } else if (formData.company.trim().length > 200) {
      errors.company = t('contact.form.validation.companyTooLong');
    }
    
    if (!formData.subject.trim()) {
      errors.subject = t('contact.form.validation.subjectRequired');
    } else if (formData.subject.trim().length > 200) {
      errors.subject = t('contact.form.validation.subjectTooLong');
    }
    
    if (!formData.message.trim()) {
      errors.message = t('contact.form.validation.messageRequired');
    } else if (formData.message.trim().length < 10) {
      errors.message = t('contact.form.validation.messageTooShort');
    } else if (formData.message.trim().length > 2000) {
      errors.message = t('contact.form.validation.messageTooLong');
    }
    
    // Optional field validation
    if (formData.phone && formData.phone.length > 20) {
      errors.phone = t('contact.form.validation.phoneTooLong');
    }
    
    if (formData.position && formData.position.length > 100) {
      errors.position = t('contact.form.validation.positionTooLong');
    }
    
    return errors;
  };

  const transformContactData = (data: ContactForm) => {
    return {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      company: data.company.trim(),
      position: data.position?.trim() || null,
      subject: data.subject.trim(),
      message: data.message.trim(),
      inquiry_type: data.inquiryType,
      budget_range: data.budget || null,
      timeline: data.timeline || null,
      services_interested: data.services.length > 0 ? data.services : [],
      marketing_consent: data.marketingConsent,
      source: submissionSource
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setValidationErrors({});
    setSubmitError('');
    
    // Validate form data
    const errors = validateContactData();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const transformedData = transformContactData(formData);
      
      const response = await fetch('/api/contact/contact-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubmitSuccess(data);
        setIsSubmitted(true);
        
        // Reset form
        setFormData(createInitialFormData());
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle validation errors (422)
        if (response.status === 422 && errorData.errors) {
          setValidationErrors(errorData.errors);
          setSubmitError(t('contact.form.submitErrors.validation'));
        }
        // Handle server errors (500+)
        else if (response.status >= 500) {
          setSubmitError(t('contact.form.submitErrors.server'));
        }
        // Handle other errors
        else {
          setSubmitError(errorData.error || errorData.message || t('contact.form.submitErrors.generic'));
        }
      }
    } catch (error: unknown) {
      console.error('Error submitting contact form:', error);

      const maybeError = error as { name?: string; message?: string; status?: number };

      // Handle different types of errors
      if (maybeError.name === 'TypeError' && maybeError.message?.includes('fetch')) {
        setSubmitError(t('contact.form.submitErrors.network'));
      } else if (maybeError.status === 422) {
        setSubmitError(t('contact.form.submitErrors.validation'));
      } else if (typeof maybeError.status === 'number' && maybeError.status >= 500) {
        setSubmitError(t('contact.form.submitErrors.server'));
      } else {
        setSubmitError(t('contact.form.submitErrors.unexpected'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Error display component
  const ErrorMessage = ({ error }: { error: string }) => (
    <div className="flex items-center mt-1 text-red-600 text-sm">
      <AlertCircle className="w-4 h-4 mr-1" />
      <span>{error}</span>
    </div>
  );

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4 text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('contact.success.title')}</h2>
          <p className="text-gray-600 mb-4">
            {t('contact.success.message')}
          </p>
          {submitSuccess && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>{t('contact.success.referenceId')}:</strong> {submitSuccess.inquiry_id}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                {t('contact.success.status')}: {submitSuccess.status}
              </p>
            </div>
          )}
          <button
            onClick={() => {
              setIsSubmitted(false);
              setSubmitSuccess(null);
              setFormData(createInitialFormData());
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('contact.success.sendAnother')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

      {/* Hero + Contact Cards — single section, no gap */}
      <section className="pt-16 pb-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('contact.title')}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {t('contact.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index }}
                className="bg-white rounded-2xl shadow-md p-6 text-center hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-4 mx-auto">
                  {info.icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{info.title}</h3>
                <div className="space-y-1 mb-4 flex-1">
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="text-gray-600 text-sm">{detail}</p>
                  ))}
                </div>
                {info.action && (
                  <a
                    href={info.action.href}
                    className="inline-flex items-center justify-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm cursor-pointer"
                  >
                    {info.action.text}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-16 pt-6" id="contact-form">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-xl p-8 self-start"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('contact.form.title')}</h2>
                <p className="text-gray-600">
                  {t('contact.form.description')}
                </p>
              </div>

              {hasPrefillContext && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-2">
                    {t('contact.form.prefill.title')}:{' '}
                    <span className="normal-case font-mono text-[11px] break-all">
                      {sourceParam ?? missingPrefillValue}
                    </span>
                  </p>
                  <p className="text-sm text-blue-900">
                    {t('contact.form.prefill.hint')}
                  </p>
                </div>
              )}

              {/* Display submission errors */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <p className="text-red-800 font-medium">{t('contact.form.error')}</p>
                  </div>
                  <p className="text-red-700 mt-1">{submitError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('contact.form.fullName')} *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder={t('contact.form.fullName')}
                    />
                    {validationErrors.name && <ErrorMessage error={validationErrors.name} />}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('contact.form.email')} *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder={t('contact.form.email')}
                    />
                    {validationErrors.email && <ErrorMessage error={validationErrors.email} />}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('contact.form.company')} *
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          validationErrors.company ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder={t('contact.form.company')}
                      />
                      {validationErrors.company && <ErrorMessage error={validationErrors.company} />}
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('contact.form.phone')}
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          validationErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder={t('contact.form.phone')}
                      />
                      {validationErrors.phone && <ErrorMessage error={validationErrors.phone} />}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="inquiryType" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('contact.form.inquiryType')} *
                    </label>
                    <select
                      id="inquiryType"
                      name="inquiryType"
                      value={formData.inquiryType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {inquiryTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('contact.form.subject')} *
                  </label>
                  <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.subject ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder={t('contact.form.subject')}
                    />
                  {validationErrors.subject && <ErrorMessage error={validationErrors.subject} />}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('contact.form.message')} * <span className="text-sm text-gray-500">({formData.message.length}/2000)</span>
                  </label>
                  <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      maxLength={2000}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                        validationErrors.message ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder={t('contact.form.message')}
                    />
                  {validationErrors.message && <ErrorMessage error={validationErrors.message} />}
                </div>

                {/* Marketing consent checkbox */}
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="marketingConsent"
                    name="marketingConsent"
                    checked={formData.marketingConsent}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="marketingConsent" className="text-sm text-gray-600">
                    {t('contact.form.marketingConsent')}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      {t('contact.form.sending')}
                    </div>
                  ) : (
                    t('contact.form.sendMessage')
                  )}
                </button>
              </form>
            </motion.div>

            {/* Calendar & Additional Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              {/* Schedule Consultation */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('contact.consultation.title')}</h3>
                  <p className="text-gray-600">
                    {t('contact.consultation.description')}
                  </p>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">{t('contact.consultation.features.freeConsultation')}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">{t('contact.consultation.features.customRoadmap')}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">{t('contact.consultation.features.roiProjections')}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">{t('contact.consultation.features.noSalesPressure')}</span>
                  </div>
                </div>
                
                <Link
                  to="/audit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors inline-flex items-center justify-center"
                >
                  {t('contact.consultation.cta')}
                  <Calendar className="w-5 h-5 ml-2" />
                </Link>
              </div>

              {/* FAQ */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('contact.faq.title')}</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{t('contact.faq.questions.projectStart.question')}</h4>
                    <p className="text-gray-600 text-sm">{t('contact.faq.questions.projectStart.answer')}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{t('contact.faq.questions.smallBusiness.question')}</h4>
                    <p className="text-gray-600 text-sm">{t('contact.faq.questions.smallBusiness.answer')}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{t('contact.faq.questions.consultationIncluded.question')}</h4>
                    <p className="text-gray-600 text-sm">{t('contact.faq.questions.consultationIncluded.answer')}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{t('contact.faq.questions.ongoingSupport.question')}</h4>
                    <p className="text-gray-600 text-sm">{t('contact.faq.questions.ongoingSupport.answer')}</p>
                  </div>
                </div>
              </div>

              {/* Contact Methods */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">{t('contact.directContact.title')}</h3>
                <p className="mb-6 opacity-90">
                  {t('contact.directContact.description')}
                </p>
                
                <div className="space-y-4">
                  <a href="https://t.me/xteampro" target="_blank" rel="noreferrer" className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
                    <Phone className="w-5 h-5" />
                    <span>{localizedInfo.phone.details[0]}</span>
                  </a>
                  <a href={`mailto:${localizedInfo.email.details[0] ?? 'info@xteam.pro'}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
                    <Mail className="w-5 h-5" />
                    <span>{localizedInfo.email.details[0]}</span>
                  </a>
                  <div className="flex items-center space-x-3 opacity-80">
                    <MessageSquare className="w-5 h-5" />
                    <span>{t('contact.directContact.liveChat')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
