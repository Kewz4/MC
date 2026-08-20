import { type ReactNode, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Instagram, Menu, Search, Twitter, User, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

function HeaderLink({ children, to = '#', className = '' }: { children: ReactNode; to?: string; className?: string }) {
  return (
    <Link to={to} className={`whitespace-nowrap font-sans text-[13px] font-bold uppercase tracking-[0.12em] opacity-60 transition-opacity hover:opacity-100 ${className}`}>
      {children}
    </Link>
  );
}

export default function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileDialogRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsScrolled(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const backgroundRegions = Array.from(document.querySelectorAll<HTMLElement>('header, main, footer'));
    const previousInertStates = backgroundRegions.map((region) => region.inert);
    document.body.style.overflow = 'hidden';
    backgroundRegions.forEach((region) => { region.inert = true; });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
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
  }, [isMenuOpen]);

  return (
    <>
      <header className={`fixed left-0 top-0 z-50 flex w-full items-center justify-between border-b border-lab-line bg-white/95 px-8 backdrop-blur-md transition-all duration-300 ${isScrolled ? 'py-2.5' : 'py-5'}`}>
        <nav aria-label="Primary" className="hidden flex-1 items-center gap-6 xl:flex">
          <HeaderLink to="/services">Services</HeaderLink>
          <HeaderLink to="/stickers">Stickers</HeaderLink>
          <HeaderLink>Showroom</HeaderLink>
          <HeaderLink>Culture</HeaderLink>
          <HeaderLink>Projects</HeaderLink>
        </nav>

        <div className="flex flex-1 justify-center">
          <Link to="/" aria-label="Merchcraft home" className={`block cursor-pointer transition-all duration-500 ${isScrolled ? 'h-6' : 'h-10'}`}>
            <img src="/assets/brand/merchcraft-primary-full.svg" alt="Merchcraft Logo" className="h-full w-auto" />
          </Link>
        </div>

        <div className="hidden flex-1 items-center justify-end gap-8 xl:flex">
          <div className="flex items-center gap-4">
            <div className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-50">
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-sans text-[12px] font-bold uppercase tracking-widest">Search</span>
            </div>
            <div className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-50">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-sans text-[12px] font-bold uppercase tracking-widest">Account</span>
            </div>
            <Link to="/quote" className="rounded-full bg-lab-red px-5 py-2 font-sans text-[12px] font-bold uppercase tracking-widest text-white shadow-lg transition-all duration-300 hover:bg-lab-black">
              Begin Your Build
            </Link>
          </div>
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          className="flex items-center gap-4 xl:hidden"
          aria-label="Open navigation"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
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
            className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-lab-white p-6 transition-colors duration-300 sm:p-10"
          >
            <div className="mb-10 flex items-center justify-between sm:mb-16">
              <Link to="/" aria-label="Merchcraft home" className="h-6" onClick={() => setIsMenuOpen(false)}>
                <img src="/assets/brand/merchcraft-primary-full.svg" alt="" className="h-full w-auto" />
              </Link>
              <button
                type="button"
                aria-label="Close navigation"
                autoFocus
                onClick={() => {
                  setIsMenuOpen(false);
                  requestAnimationFrame(() => menuButtonRef.current?.focus());
                }}
              >
                <X className="h-8 w-8" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Mobile" className="flex flex-col gap-5 sm:gap-7">
              <Link to="/services" className="font-impact text-4xl uppercase tracking-tighter transition-all hover:text-stroke sm:text-5xl md:text-6xl" onClick={() => setIsMenuOpen(false)}>Services</Link>
              <Link to="/stickers" className="font-impact text-4xl uppercase tracking-tighter transition-all hover:text-stroke sm:text-5xl md:text-6xl" onClick={() => setIsMenuOpen(false)}>Stickers</Link>
              {['Showroom', 'Culture', 'Projects'].map((item) => (
                <a key={item} href="#" className="font-impact text-4xl uppercase tracking-tighter transition-all hover:text-stroke sm:text-5xl md:text-6xl" onClick={() => setIsMenuOpen(false)}>
                  {item}
                </a>
              ))}
              <Link to="/quote" className="mt-3 w-full rounded-full bg-lab-red py-4 text-center font-sans text-xs font-bold uppercase tracking-widest text-white shadow-lg transition-all duration-300 hover:bg-lab-black" onClick={() => setIsMenuOpen(false)}>
                Begin Your Build
              </Link>
            </nav>

            <div className="mt-12 flex items-end justify-between border-t border-lab-line pt-8 sm:mt-auto">
              <div className="font-sans text-[10px] uppercase tracking-widest text-lab-black/40">
                Santa Ana / CA<br />Quality Apparel Printing
              </div>
              <div className="flex gap-6" aria-hidden="true">
                <Instagram className="h-5 w-5" />
                <Twitter className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
