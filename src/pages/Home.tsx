import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Brain,
  BarChart3,
  Zap,
  HeadphonesIcon,
  TrendingUp,
  FileText,
  Users,
  Cpu,
  ClipboardList,
  FlaskConical,
  BarChart2,
  Award,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { buildContactPath } from '@/utils/contactQuery';

export default function Home() {
  const { t } = useTranslation();

  // ─── Pain points ─────────────────────────────────────────────────────────
  const painPoints = [
    {
      icon: <AlertTriangle className="h-7 w-7 text-orange-500" />,
      title: t('home.features.aiAudit.title'),
      description: t('home.features.aiAudit.description'),
    },
    {
      icon: <Brain className="h-7 w-7 text-purple-500" />,
      title: t('home.features.processAutomation.title'),
      description: t('home.features.processAutomation.description'),
    },
    {
      icon: <BarChart3 className="h-7 w-7 text-blue-500" />,
      title: t('home.features.roiOptimization.title'),
      description: t('home.features.roiOptimization.description'),
    },
    {
      icon: <Zap className="h-7 w-7 text-yellow-500" />,
      title: t('home.features.scalableGrowth.title'),
      description: t('home.features.scalableGrowth.description'),
    },
  ];

  // ─── Proof strip stats ───────────────────────────────────────────────────
  const stats = [
    {
      number: t('home.stats.stat1Number'),
      label: t('home.stats.stat1Label'),
      context: t('home.stats.stat1Context'),
    },
    {
      number: t('home.stats.stat2Number'),
      label: t('home.stats.stat2Label'),
      context: t('home.stats.stat2Context'),
    },
    {
      number: t('home.stats.stat3Number'),
      label: t('home.stats.stat3Label'),
      context: t('home.stats.stat3Context'),
    },
    {
      number: t('home.stats.stat4Number'),
      label: t('home.stats.stat4Label'),
      context: t('home.stats.stat4Context'),
    },
  ];

  // ─── Role-based routing tiles ────────────────────────────────────────────
  const routingTiles = [
    {
      icon: <HeadphonesIcon className="h-6 w-6" />,
      title: t('home.routing.tile1Title'),
      desc: t('home.routing.tile1Desc'),
      anchor: 'customer',
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: t('home.routing.tile2Title'),
      desc: t('home.routing.tile2Desc'),
      anchor: 'sales',
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: t('home.routing.tile3Title'),
      desc: t('home.routing.tile3Desc'),
      anchor: 'backoffice',
    },
    {
      icon: <BarChart2 className="h-6 w-6" />,
      title: t('home.routing.tile4Title'),
      desc: t('home.routing.tile4Desc'),
      anchor: 'analytics',
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: t('home.routing.tile5Title'),
      desc: t('home.routing.tile5Desc'),
      anchor: 'hr',
    },
    {
      icon: <Cpu className="h-6 w-6" />,
      title: t('home.routing.tile6Title'),
      desc: t('home.routing.tile6Desc'),
      anchor: 'it',
    },
  ];

  // ─── Pilot steps ─────────────────────────────────────────────────────────
  const pilotSteps = [
    {
      icon: <ClipboardList className="h-6 w-6 text-primary" />,
      title: t('home.pilot.step1Title'),
      desc: t('home.pilot.step1Desc'),
      step: '01',
    },
    {
      icon: <FlaskConical className="h-6 w-6 text-primary" />,
      title: t('home.pilot.step2Title'),
      desc: t('home.pilot.step2Desc'),
      step: '02',
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-primary" />,
      title: t('home.pilot.step3Title'),
      desc: t('home.pilot.step3Desc'),
      step: '03',
    },
    {
      icon: <Award className="h-6 w-6 text-primary" />,
      title: t('home.pilot.step4Title'),
      desc: t('home.pilot.step4Desc'),
      step: '04',
    },
  ];

  // ─── Case studies ────────────────────────────────────────────────────────
  const cases = [
    {
      title: t('home.cases.case1Title'),
      process: t('home.cases.case1Process'),
      effect: t('home.cases.case1Effect'),
      period: t('home.cases.case1Period'),
      stack: t('home.cases.case1Stack'),
    },
    {
      title: t('home.cases.case2Title'),
      process: t('home.cases.case2Process'),
      effect: t('home.cases.case2Effect'),
      period: t('home.cases.case2Period'),
      stack: t('home.cases.case2Stack'),
    },
    {
      title: t('home.cases.case3Title'),
      process: t('home.cases.case3Process'),
      effect: t('home.cases.case3Effect'),
      period: t('home.cases.case3Period'),
      stack: t('home.cases.case3Stack'),
    },
  ];

  return (
    <div className="min-h-screen">

      {/* ═══════════════════════════════════════════════════════════
          1. HERO
      ═══════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
              </span>
              AI automation · B2B
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
              {t('home.hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl leading-relaxed">
              {t('home.hero.subtitle')}
            </p>

            {/* 3 CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Button
                asChild
                size="lg"
                className="text-base px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/25 transition-all duration-200"
              >
                <Link to={buildContactPath({ source: 'home_hero_pilot' })}>
                  {t('home.hero.ctaPrimary')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-base px-8 py-3 border-slate-500 text-slate-200 hover:bg-slate-800 hover:text-white bg-transparent transition-all duration-200"
              >
                <Link to="/blog?category=caseStudies">
                  {t('home.hero.ctaSecondary')}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="text-base px-6 py-3 text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
              >
                <Link to="/solutions">
                  {t('home.hero.ctaTertiary')}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Trust markers */}
            <div className="flex flex-col sm:flex-row gap-5 text-sm text-slate-400">
              {[
                t('home.hero.trustMarker1'),
                t('home.hero.trustMarker2'),
                t('home.hero.trustMarker3'),
              ].map((marker, i) => (
                <span key={i} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                  {marker}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. PROOF STRIP — статистика с микро-контекстом
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-14 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  {stat.number}
                </div>
                <div className="text-sm font-semibold text-gray-800 mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-gray-500 leading-tight">
                  {stat.context}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. PAIN POINTS — «Узнаёте свою компанию?»
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.features.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('home.features.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {painPoints.map((point, i) => (
              <Card
                key={i}
                className="border border-gray-200 hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 p-2 rounded-lg bg-gray-50 flex-shrink-0">
                      {point.icon}
                    </div>
                    <CardTitle className="text-lg leading-snug">
                      {point.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {point.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. ROLE ROUTING — маршрутизация по функциям
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.routing.title')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('home.routing.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {routingTiles.map((tile, i) => (
              <Link
                key={i}
                to={`/solutions#${tile.anchor}`}
                className="group flex flex-col gap-3 p-6 bg-white rounded-xl border border-gray-200 hover:border-primary/50 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-200">
                    {tile.icon}
                  </div>
                  <span className="font-semibold text-gray-900 group-hover:text-primary transition-colors duration-200">
                    {tile.title}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {tile.desc}
                </p>
                <span className="text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {t('home.routing.viewAll')}
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          5. HOW PILOTS WORK — снижение риска
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.pilot.title')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('home.pilot.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {pilotSteps.map((step, i) => (
              <div key={i} className="relative">
                {i < pilotSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(100%-1rem)] w-8 h-0.5 bg-primary/20 z-0" />
                )}
                <div className="relative z-10 flex flex-col gap-3 p-6 bg-slate-50 rounded-xl border border-slate-200 h-full">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-primary/40 font-mono tracking-widest">
                      {step.step}
                    </span>
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Safety badge */}
          <div className="flex items-center justify-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 max-w-2xl mx-auto">
            <Shield className="h-4 w-4 flex-shrink-0" />
            <span>{t('home.pilot.safetyNote')}</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          6. CASE STUDIES — 3 карточки
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.cases.title')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('home.cases.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {cases.map((c, i) => (
              <Card
                key={i}
                className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-200 flex flex-col"
              >
                <CardHeader className="pb-4 border-b border-gray-100">
                  <CardTitle className="text-base font-semibold text-gray-900 leading-snug">
                    {c.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 flex flex-col gap-4 flex-1">
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {t('home.cases.processLabel')}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">{c.process}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {t('home.cases.effectLabel')}
                    </span>
                    <p className="text-base font-bold text-primary mt-1">{c.effect}</p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400">{t('home.cases.periodLabel')}: </span>
                      <span className="text-xs font-semibold text-gray-700">{c.period}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">{t('home.cases.stackLabel')}: </span>
                      <span className="text-xs font-semibold text-gray-700">{c.stack}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button asChild variant="outline" size="lg">
              <Link to="/blog?category=caseStudies">
                {t('home.cases.viewAll')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          7. FINAL CTA — три следующих шага
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-5">
            {t('home.finalCta.title')}
          </h2>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('home.finalCta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="text-base px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/25 transition-all duration-200"
            >
              <Link to={buildContactPath({ source: 'home_final_cta' })}>
                {t('home.finalCta.consultation')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-base px-8 py-3 border-slate-500 text-slate-200 hover:bg-slate-800 hover:text-white bg-transparent transition-all duration-200"
            >
              <Link to="/blog?category=caseStudies">
                {t('home.finalCta.caseStudies')}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="text-base px-6 py-3 text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
            >
              <Link to="/solutions">
                {t('home.finalCta.solutions')}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
