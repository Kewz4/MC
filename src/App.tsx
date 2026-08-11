import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import SiteFooter from './components/SiteFooter';
import SiteHeader from './components/SiteHeader';
import HomePage from './pages/HomePage';

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
    title: 'Services | Merchcraft',
    description: 'Explore Merchcraft screen printing, embroidery, retail finishing, and fulfillment services.',
  },
  '/about': {
    title: 'About | Merchcraft',
    description: 'Meet the people and process behind Merchcraft custom apparel production.',
  },
  '/contact': {
    title: 'Contact | Merchcraft',
    description: 'Contact Merchcraft about production, partnerships, or a custom apparel project.',
  },
  '/quote': {
    title: 'Request a Quote | Merchcraft',
    description: 'Share your project details to request a custom apparel quote from Merchcraft.',
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

function InteriorLayout() {
  return (
    <>
      <SiteHeader />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-lab-white">
            <img src="/assets/brand/merchcraft-primary-full.svg" alt="Merchcraft" className="h-9 w-auto" />
          </div>
        }
      >
        <Outlet />
      </Suspense>
      <SiteFooter />
    </>
  );
}

function PageRoutes() {
  return (
    <>
      <RouteEffects />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route element={<InteriorLayout />}>
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/quote" element={<QuotePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
