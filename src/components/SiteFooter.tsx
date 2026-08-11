import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const footerLinks = [
  { label: 'Services', to: '/services' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Quote', to: '/quote' },
];

export default function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-lab-black px-6 pb-8 pt-20 text-white sm:px-8 lg:px-10 lg:pt-28">
      <div className="lab-grid pointer-events-none absolute inset-0 opacity-20 [--grid-color:rgba(255,255,255,0.09)]" />
      <div className="relative mx-auto max-w-[1500px]">
        <div className="grid gap-16 border-b border-white/15 pb-20 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
          <div>
            <span className="mb-7 flex items-center gap-3 font-display text-[11px] font-semibold uppercase tracking-[0.32em] text-lab-gold">
              <span className="h-px w-10 bg-lab-red" />
              Next production run
            </span>
            <h2 className="max-w-4xl font-impact text-[clamp(4rem,9vw,9rem)] uppercase leading-[0.82] tracking-[-0.025em]">
              Put your mark<br />on something real.
            </h2>
          </div>
          <div className="lg:justify-self-end">
            <p className="mb-7 max-w-sm text-base font-medium leading-relaxed text-white/65">
              Bring the brief. We’ll help shape the method, garment, finishing, and path to delivery.
            </p>
            <Link
              to="/quote"
              className="group inline-flex min-h-14 items-center gap-7 rounded-full bg-lab-gold px-8 font-display text-xs font-bold uppercase tracking-[0.18em] text-lab-black transition-colors hover:bg-white"
            >
              Start your build
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
            </Link>
          </div>
        </div>

        <div className="grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_0.6fr_0.8fr]">
          <div>
            <Link to="/" aria-label="Merchcraft home">
              <img src="/assets/brand/merchcraft-primary-white.svg" alt="Merchcraft" className="h-9 w-auto" />
            </Link>
            <p className="mt-7 max-w-md text-sm font-medium leading-relaxed text-white/55">
              Custom apparel and finishing for founders, marketing teams, agencies, and creative directors—from one-off drops to ongoing fulfillment.
            </p>
          </div>

          <div>
            <h3 className="mb-6 font-display text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">Navigate</h3>
            <ul className="space-y-3">
              {footerLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="font-display text-sm font-semibold uppercase tracking-[0.1em] transition-colors hover:text-lab-gold">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-6 font-display text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">Talk shop</h3>
            <a href="mailto:shop@merchcraft.com" className="block font-display text-sm font-semibold uppercase tracking-[0.08em] transition-colors hover:text-lab-gold">
              shop@merchcraft.com
            </a>
            <a href="mailto:brand@merchcraft.com" className="mt-3 block font-display text-sm font-semibold uppercase tracking-[0.08em] transition-colors hover:text-lab-gold">
              brand@merchcraft.com
            </a>
            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Orange County · Southern California</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/15 pt-7 font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Merchcraft. All rights reserved.</span>
          <span>Your merch, our craft.</span>
        </div>
      </div>
    </footer>
  );
}
