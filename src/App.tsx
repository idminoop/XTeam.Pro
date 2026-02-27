import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import ScrollToTop from '@/components/layout/ScrollToTop';

// Public pages
const Home        = lazy(() => import('@/pages/Home'));
const Audit       = lazy(() => import('@/pages/Audit'));
const AuditResults = lazy(() => import('@/pages/AuditResults'));
const Solutions   = lazy(() => import('./pages/Solutions'));
const CaseStudies = lazy(() => import('./pages/CaseStudies'));
const Pricing     = lazy(() => import('./pages/Pricing'));
const About       = lazy(() => import('./pages/About'));
const Contact     = lazy(() => import('./pages/Contact'));
const Blog        = lazy(() => import('./pages/Blog'));
const BlogPost    = lazy(() => import('./pages/BlogPost'));
const Privacy     = lazy(() => import('./pages/Privacy'));
const Terms       = lazy(() => import('./pages/Terms'));
const Cookies     = lazy(() => import('./pages/Cookies'));
const Careers     = lazy(() => import('./pages/Careers'));
const NotFound    = lazy(() => import('./pages/NotFound'));

// Admin pages
const AdminLogin     = lazy(() => import('@/pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminAudits    = lazy(() => import('@/pages/admin/AdminAudits'));
const AdminContacts       = lazy(() => import('@/pages/admin/AdminContacts'));
const AdminContactDetail  = lazy(() => import('@/pages/admin/AdminContactDetail'));
const AdminContactsKanban = lazy(() => import('@/pages/admin/AdminContactsKanban'));
const AdminEmailTemplates = lazy(() => import('@/pages/admin/AdminEmailTemplates'));
const AdminBlog           = lazy(() => import('@/pages/admin/AdminBlog'));
const AdminBlogEditor = lazy(() => import('@/pages/admin/AdminBlogEditor'));
const AdminCases      = lazy(() => import('@/pages/admin/AdminCases'));
const AdminCaseEditor = lazy(() => import('@/pages/admin/AdminCaseEditor'));
const AdminMedia      = lazy(() => import('@/pages/admin/AdminMedia'));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'));
const AdminAuditDetail = lazy(() => import('@/pages/admin/AdminAuditDetail'));
const AdminUsers     = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminSettings  = lazy(() => import('@/pages/admin/AdminSettings'));

const Spinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Suspense fallback={<Spinner />}>
        <Routes>
          {/* ── Public routes — with Header + Footer ── */}
          <Route element={<Layout />}>
            <Route path="/"                     element={<Home />} />
            <Route path="/audit"                element={<Audit />} />
            <Route path="/audit/results/:id"    element={<AuditResults />} />
            <Route path="/solutions"            element={<Solutions />} />
            <Route path="/case-studies"         element={<CaseStudies />} />
            <Route path="/cases"                element={<CaseStudies />} />
            <Route path="/pricing"              element={<Pricing />} />
            <Route path="/about"                element={<About />} />
            <Route path="/blog"                 element={<Blog />} />
            <Route path="/blog/:id"             element={<BlogPost />} />
            <Route path="/contact"              element={<Contact />} />
            <Route path="/privacy"              element={<Privacy />} />
            <Route path="/terms"                element={<Terms />} />
            <Route path="/cookies"              element={<Cookies />} />
            <Route path="/careers"              element={<Careers />} />
          </Route>

          {/* ── Admin login — standalone (no layout) ── */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* ── Protected admin routes — with AdminLayout (sidebar + topbar) ── */}
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="audits"    element={<AdminAudits />} />
              <Route path="audits/:id" element={<AdminAuditDetail />} />
              <Route path="contacts"              element={<AdminContacts />} />
              <Route path="contacts/:id"         element={<AdminContactDetail />} />
              <Route path="contacts/kanban"      element={<AdminContactsKanban />} />
              <Route path="email-templates"      element={<AdminEmailTemplates />} />
              <Route path="blog"             element={<AdminBlog />} />
              <Route path="blog/new"         element={<AdminBlogEditor />} />
              <Route path="blog/:id/edit"    element={<AdminBlogEditor />} />
              <Route path="cases"            element={<AdminCases />} />
              <Route path="cases/new"        element={<AdminCaseEditor />} />
              <Route path="cases/:id/edit"   element={<AdminCaseEditor />} />
              <Route path="media"     element={<AdminMedia />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="users"     element={<AdminUsers />} />
              <Route path="settings"  element={<AdminSettings />} />
            </Route>
          </Route>

          {/* ── Legacy /admin redirect ── */}
          <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />

          {/* ── 404 ── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
