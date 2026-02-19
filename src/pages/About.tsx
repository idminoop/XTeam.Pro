import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Award, Globe, ArrowRight, Linkedin, Twitter, Mail, MapPin, Phone, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { buildContactPath } from '@/utils/contactQuery';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  bio: string;
  expertise: string[];
  image: string;
  linkedin?: string;
  twitter?: string;
  email?: string;
}

interface Milestone {
  year: string;
  title: string;
  description: string;
}

export default function About() {
  const { t } = useTranslation();
  const teamMembers: TeamMember[] = [
    {
      id: 'sarah-chen',
      name: t('about.teamMembers.sarahChen.name'),
      position: t('about.teamMembers.sarahChen.position'),
      bio: t('about.teamMembers.sarahChen.bio'),
      expertise: t('about.teamMembers.sarahChen.expertise', { returnObjects: true }) as string[],
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20headshot%20of%20Asian%20woman%20CEO%20in%20business%20attire%2C%20confident%20smile%2C%20modern%20office%20background%2C%20high%20quality%20portrait&image_size=square',
      linkedin: 'https://linkedin.com/in/sarahchen',
      twitter: 'https://twitter.com/sarahchen_ai',
      email: 'sarah@xteam.pro'
    },
    {
      id: 'michael-rodriguez',
      name: t('about.teamMembers.michaelRodriguez.name'),
      position: t('about.teamMembers.michaelRodriguez.position'),
      bio: t('about.teamMembers.michaelRodriguez.bio'),
      expertise: t('about.teamMembers.michaelRodriguez.expertise', { returnObjects: true }) as string[],
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20headshot%20of%20Hispanic%20male%20CTO%20with%20glasses%2C%20friendly%20expression%2C%20tech%20office%20background%2C%20high%20quality%20portrait&image_size=square',
      linkedin: 'https://linkedin.com/in/michaelrodriguez',
      email: 'michael@xteam.pro'
    },
    {
      id: 'jennifer-walsh',
      name: t('about.teamMembers.jenniferWalsh.name'),
      position: t('about.teamMembers.jenniferWalsh.position'),
      bio: t('about.teamMembers.jenniferWalsh.bio'),
      expertise: t('about.teamMembers.jenniferWalsh.expertise', { returnObjects: true }) as string[],
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20headshot%20of%20Caucasian%20woman%20VP%20in%20business%20suit%2C%20warm%20smile%2C%20corporate%20office%20setting%2C%20high%20quality%20portrait&image_size=square',
      linkedin: 'https://linkedin.com/in/jenniferwalsh',
      email: 'jennifer@xteam.pro'
    },
    {
      id: 'david-kim',
      name: t('about.teamMembers.davidKim.name'),
      position: t('about.teamMembers.davidKim.position'),
      bio: t('about.teamMembers.davidKim.bio'),
      expertise: t('about.teamMembers.davidKim.expertise', { returnObjects: true }) as string[],
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20headshot%20of%20Korean%20male%20engineer%20in%20casual%20business%20attire%2C%20confident%20look%2C%20modern%20tech%20office%2C%20high%20quality%20portrait&image_size=square',
      linkedin: 'https://linkedin.com/in/davidkim',
      email: 'david@xteam.pro'
    },
    {
      id: 'amanda-foster',
      name: t('about.teamMembers.amandaFoster.name'),
      position: t('about.teamMembers.amandaFoster.position'),
      bio: t('about.teamMembers.amandaFoster.bio'),
      expertise: t('about.teamMembers.amandaFoster.expertise', { returnObjects: true }) as string[],
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20headshot%20of%20African%20American%20woman%20product%20manager%2C%20bright%20smile%2C%20creative%20office%20space%2C%20high%20quality%20portrait&image_size=square',
      linkedin: 'https://linkedin.com/in/amandafoster',
      email: 'amanda@xteam.pro'
    },
    {
      id: 'robert-johnson',
      name: t('about.teamMembers.robertJohnson.name'),
      position: t('about.teamMembers.robertJohnson.position'),
      bio: t('about.teamMembers.robertJohnson.bio'),
      expertise: t('about.teamMembers.robertJohnson.expertise', { returnObjects: true }) as string[],
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20headshot%20of%20Caucasian%20male%20VP%20sales%20in%20navy%20suit%2C%20professional%20smile%2C%20executive%20office%20background%2C%20high%20quality%20portrait&image_size=square',
      linkedin: 'https://linkedin.com/in/robertjohnson',
      email: 'robert@xteam.pro'
    }
  ];

  const milestones: Milestone[] = [
    {
      year: t('about.milestones.founded.year'),
      title: t('about.milestones.founded.title'),
      description: t('about.milestones.founded.description')
    },
    {
      year: t('about.milestones.firstClient.year'),
      title: t('about.milestones.firstClient.title'),
      description: t('about.milestones.firstClient.description')
    },
    {
      year: t('about.milestones.seriesA.year'),
      title: t('about.milestones.seriesA.title'),
      description: t('about.milestones.seriesA.description')
    },
    {
      year: t('about.milestones.hundredClients.year'),
      title: t('about.milestones.hundredClients.title'),
      description: t('about.milestones.hundredClients.description')
    },
    {
      year: t('about.milestones.aiAward.year'),
      title: t('about.milestones.aiAward.title'),
      description: t('about.milestones.aiAward.description')
    },
    {
      year: t('about.milestones.globalExpansion.year'),
      title: t('about.milestones.globalExpansion.title'),
      description: t('about.milestones.globalExpansion.description')
    }
  ];

  const values = [
    {
      icon: <Target className="w-8 h-8" />,
      title: t('about.values.resultsDriven.title'),
      description: t('about.values.resultsDriven.description')
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t('about.values.humanCenteredAI.title'),
      description: t('about.values.humanCenteredAI.description')
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: t('about.values.excellence.title'),
      description: t('about.values.excellence.description')
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: t('about.values.transparency.title'),
      description: t('about.values.transparency.description')
    }
  ];

  const stats = [
    {
      number: t('about.stats.clientsServed.number'),
      label: t('about.stats.clientsServed.label'),
      description: t('about.stats.clientsServed.description')
    },
    {
      number: t('about.stats.costSavings.number'),
      label: t('about.stats.costSavings.label'),
      description: t('about.stats.costSavings.description')
    },
    {
      number: t('about.stats.uptime.number'),
      label: t('about.stats.uptime.label'),
      description: t('about.stats.uptime.description')
    },
    {
      number: t('about.stats.support.number'),
      label: t('about.stats.support.label'),
      description: t('about.stats.support.description')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              {t('about.hero.title')}
              <span className="text-blue-600"> {t('about.hero.titleHighlight')}</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              {t('about.hero.subtitle')}
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">{t('about.story.title')}</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  {t('about.story.paragraph1')}
                </p>
                <p>
                  {t('about.story.paragraph2')}
                </p>
                <p>
                  {t('about.story.paragraph3')}
                </p>
                <p>
                  {t('about.story.paragraph4')}
                </p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <img
                src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Modern%20tech%20office%20with%20diverse%20team%20collaborating%20on%20AI%20projects%2C%20multiple%20monitors%20showing%20data%20visualizations%2C%20bright%20and%20innovative%20workspace&image_size=landscape_4_3"
                alt={t('about.story.officeImageAlt')}
                className="rounded-2xl shadow-lg"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('about.journey.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('about.journey.subtitle')}
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-blue-200"></div>
              
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`relative flex items-center mb-8 ${
                    index % 2 === 0 ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div className={`w-5/12 ${
                    index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'
                  }`}>
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <div className="text-2xl font-bold text-blue-600 mb-2">{milestone.year}</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{milestone.title}</h3>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('about.values.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('about.values.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('about.team.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('about.team.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="text-center mb-6">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-blue-600 font-semibold mb-3">{member.position}</p>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">{member.bio}</p>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">{t('about.team.expertise')}:</h4>
                  <div className="flex flex-wrap gap-1">
                    {member.expertise.map((skill, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-center space-x-3 pt-4 border-t border-gray-100">
                  {member.linkedin && (
                    <a href={member.linkedin} className="text-gray-400 hover:text-blue-600 transition-colors">
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {member.twitter && (
                    <a href={member.twitter} className="text-gray-400 hover:text-blue-400 transition-colors">
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {member.email && (
                    <a href={`mailto:${member.email}`} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <Mail className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('about.contact.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('about.contact.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('about.contact.headquarters.title')}</h3>
              <p className="text-gray-600">
                {t('about.contact.headquarters.address')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full mb-4">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('about.contact.contactInfo.title')}</h3>
              <p className="text-gray-600">
                {t('about.contact.contactInfo.details')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('about.contact.schedule.title')}</h3>
              <p className="text-gray-600">
                {t('about.contact.schedule.details')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white"
          >
            <h2 className="text-4xl font-bold mb-4">{t('about.cta.title')}</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              {t('about.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={buildContactPath({ source: 'about_cta' })}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                {t('about.cta.scheduleButton')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/case-studies"
                className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
              >
                {t('about.cta.downloadButton')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
