import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
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
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[80] border-b border-lab-line bg-white/95 backdrop-blur-xl transition-[height] duration-300 ${
          isScrolled ? 'h-[62px]' : 'h-[76px]'
        }`}
      >
        <div className="mx-auto grid h-full max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-8 lg:px-10">
          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative py-2 font-display text-[12px] font-bold uppercase tracking-[0.18em] transition-opacity ${
                    isActive ? 'opacity-100 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-lab-red' : 'opacity-50 hover:opacity-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Link to="/" aria-label="Merchcraft home" className="col-start-2 block">
            <img
              src="/assets/brand/merchcraft-primary-full.svg"
              alt="Merchcraft"
              className={`w-auto transition-[height] duration-300 ${isScrolled ? 'h-7' : 'h-9'}`}
            />
          </Link>

          <div className="hidden justify-end lg:flex">
            <Link
              to="/quote"
              className="group inline-flex min-h-11 items-center gap-3 rounded-full bg-lab-gold px-6 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-lab-black transition-colors hover:bg-lab-black hover:text-white"
            >
              Start a build
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Open menu"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsOpen(true)}
            className="col-start-3 ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-lab-line lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-lab-black px-6 py-6 text-white sm:px-10"
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-6">
              <img src="/assets/brand/merchcraft-primary-white.svg" alt="Merchcraft" className="h-8 w-auto" />
              <button
                type="button"
                aria-label="Close menu"
                autoFocus
                onClick={() => {
                  setIsOpen(false);
                  menuButtonRef.current?.focus();
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Mobile" className="my-auto flex flex-col py-14">
              {[{ label: 'Home', to: '/' }, ...navigation].map((item, index) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16 + index * 0.06 }}
                  className="border-b border-white/15"
                >
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center justify-between py-5 font-impact text-[clamp(2.75rem,12vw,5rem)] uppercase leading-none ${isActive ? 'text-lab-gold' : 'text-white'}`
                    }
                  >
                    {item.label}
                    <span className="font-display text-[10px] tracking-[0.2em] text-white/35">0{index + 1}</span>
                  </NavLink>
                </motion.div>
              ))}
            </nav>

            <Link
              to="/quote"
              className="flex min-h-14 items-center justify-between rounded-full bg-lab-gold px-7 font-display text-xs font-bold uppercase tracking-[0.18em] text-lab-black"
            >
              Start a build
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
