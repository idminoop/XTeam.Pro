import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "@/components/layout/Layout";

// Lazy load all pages for better performance
const Home = lazy(() => import("@/pages/Home"));
const Audit = lazy(() => import("@/pages/Audit"));
const AuditResults = lazy(() => import("@/pages/AuditResults"));
const Solutions = lazy(() => import('./pages/Solutions'));
const CaseStudies = lazy(() => import('./pages/CaseStudies'));
const Pricing = lazy(() => import('./pages/Pricing'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Admin = lazy(() => import('./pages/Admin'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Cookies = lazy(() => import('./pages/Cookies'));
const Careers = lazy(() => import('./pages/Careers'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <Router>
      <Layout>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/audit/results/:id" element={<AuditResults />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/case-studies" element={<CaseStudies />} />
            <Route path="/cases" element={<CaseStudies />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
}
