import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const navigation = [
  { label: 'Services', to: '/services' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileDialogRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setIsOpen(false), [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const backgroundRegions = Array.from(document.querySelectorAll<HTMLElement>('header, main, footer'));
    const previousInertStates = backgroundRegions.map((region) => region.inert);
    document.body.style.overflow = 'hidden';
    backgroundRegions.forEach((region) => { region.inert = true; });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus());
      }

      if (event.key === 'Tab') {
        const focusable = mobileDialogRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      backgroundRegions.forEach((region, index) => { region.inert = previousInertStates[index]; });
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-[80] border-b border-lab-line bg-white/95 px-5 backdrop-blur-md transition-all duration-300 sm:px-8 ${isScrolled ? 'py-2.5' : 'py-5'}`}>
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center">
          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `font-sans text-[13px] font-bold uppercase tracking-[0.12em] transition-opacity ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Link to="/" aria-label="Merchcraft home" className={`col-start-2 transition-all duration-500 ${isScrolled ? 'h-6' : 'h-10'}`}>
            <img src="/assets/brand/merchcraft-primary-full.svg" alt="Merchcraft" className="h-full w-auto" />
          </Link>

          <div className="hidden justify-end lg:flex">
            <Link to="/quote" className="rounded-full bg-lab-red px-6 py-3 font-sans text-[12px] font-bold uppercase tracking-widest text-white shadow-lg transition-colors hover:bg-lab-black">
              Begin Your Build
            </Link>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Open navigation"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsOpen(true)}
            className="col-start-3 ml-auto inline-flex h-11 w-11 items-center justify-center lg:hidden"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={mobileDialogRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] flex flex-col bg-lab-white p-8 sm:p-10"
          >
            <div className="flex items-center justify-between">
              <img src="/assets/brand/merchcraft-primary-full.svg" alt="Merchcraft" className="h-7 w-auto" />
              <button
                type="button"
                aria-label="Close navigation"
                autoFocus
                onClick={() => {
                  setIsOpen(false);
                  requestAnimationFrame(() => menuButtonRef.current?.focus());
                }}
                className="inline-flex h-11 w-11 items-center justify-center"
              >
                <X className="h-8 w-8" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Mobile" className="my-auto flex flex-col gap-7">
              {[{ label: 'Home', to: '/' }, ...navigation].map((item, index) => (
                <motion.div key={item.to} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + index * 0.05 }}>
                  <NavLink to={item.to} className="font-impact text-[clamp(3rem,14vw,6rem)] uppercase leading-[0.9] tracking-tighter transition-colors hover:text-lab-red">
                    {item.label}
                  </NavLink>
                </motion.div>
              ))}
              <Link to="/quote" className="mt-3 rounded-full bg-lab-red py-5 text-center font-sans text-xs font-bold uppercase tracking-widest text-white">
                Begin Your Build
              </Link>
            </nav>

            <div className="border-t border-lab-line pt-7 font-sans text-[10px] font-bold uppercase tracking-widest text-lab-black/40">
              Orange County · Southern California
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
