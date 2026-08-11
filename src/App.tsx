import { lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import SiteFooter from './components/SiteFooter';
import SiteHeader from './components/SiteHeader';

const HomePage = lazy(() => import('./pages/HomePage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const QuotePage = lazy(() => import('./pages/QuotePage'));

const metadata: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Merchcraft | Custom Apparel & Finishing',
    description: 'Custom apparel, screen printing, embroidery, finishing, and fulfillment for brands across Southern California and beyond.',
  },
  '/services': {
    title: 'Services | Merchcraft Apparel Lab',
    description: 'Explore Merchcraft screen printing, embroidery, garment finishing, proofing, fulfillment, and live production capabilities.',
  },
  '/about': {
    title: 'About | Merchcraft Apparel Lab',
    description: 'Meet the apparel lab behind Merchcraft and follow the hands-on path from project brief to finished garment.',
  },
  '/contact': {
    title: 'Contact | Merchcraft',
    description: 'Talk with Merchcraft about general questions, production support, partnerships, or a custom apparel project.',
  },
  '/quote': {
    title: 'Start a Build | Merchcraft',
    description: 'Share your project, method, quantity, timeline, and artwork to request a custom apparel quote from Merchcraft.',
  },
};

function RouteEffects() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const routeMeta = metadata[location.pathname] ?? metadata['/'];
    document.title = routeMeta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', routeMeta.description);
  }, [location.pathname]);

  return null;
}

function PageRoutes() {
  const location = useLocation();

  return (
    <>
      <RouteEffects />
      <SiteHeader />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-lab-black text-white">
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-lab-gold">Preparing the lab…</span>
          </div>
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/quote" element={<QuotePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </Suspense>
      <SiteFooter />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PageRoutes />
    </BrowserRouter>
  );
}
