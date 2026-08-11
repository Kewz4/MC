import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LabLabel({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span className={`flex items-center gap-3 font-display text-[10px] font-bold uppercase tracking-[0.32em] ${dark ? 'text-lab-gold' : 'text-lab-red'}`}>
      <span className="h-px w-9 bg-current" />
      {children}
    </span>
  );
}

export function TextLink({ to, children, light = false }: { to: string; children: ReactNode; light?: boolean }) {
  return (
    <Link
      to={to}
      className={`group inline-flex min-h-12 items-center gap-5 rounded-full border px-7 font-display text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
        light
          ? 'border-white/25 text-white hover:border-lab-gold hover:bg-lab-gold hover:text-lab-black'
          : 'border-lab-black/20 text-lab-black hover:border-lab-black hover:bg-lab-black hover:text-white'
      }`}
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1.5" aria-hidden="true" />
    </Link>
  );
}

export function RegistrationMarks({ light = false }: { light?: boolean }) {
  const color = light ? 'bg-white/35' : 'bg-lab-black/25';
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-5 z-20 hidden sm:block">
      <span className={`absolute left-0 top-0 h-px w-8 ${color}`} />
      <span className={`absolute left-0 top-0 h-8 w-px ${color}`} />
      <span className={`absolute right-0 top-0 h-px w-8 ${color}`} />
      <span className={`absolute right-0 top-0 h-8 w-px ${color}`} />
      <span className={`absolute bottom-0 left-0 h-px w-8 ${color}`} />
      <span className={`absolute bottom-0 left-0 h-8 w-px ${color}`} />
      <span className={`absolute bottom-0 right-0 h-px w-8 ${color}`} />
      <span className={`absolute bottom-0 right-0 h-8 w-px ${color}`} />
    </div>
  );
}

export function PageIntro({
  index,
  label,
  title,
  copy,
  dark = false,
  compactTitle = false,
}: {
  index: string;
  label: string;
  title: ReactNode;
  copy: string;
  dark?: boolean;
  compactTitle?: boolean;
}) {
  return (
    <section className={`relative overflow-hidden px-6 pb-20 pt-36 sm:px-8 lg:min-h-[76vh] lg:px-10 lg:pb-24 lg:pt-44 ${dark ? 'bg-lab-black text-white' : 'bg-white text-lab-black'}`}>
      <div className={`lab-grid absolute inset-0 opacity-40 ${dark ? '[--grid-color:rgba(255,255,255,0.07)]' : ''}`} />
      <RegistrationMarks light={dark} />
      <div className="relative mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-[0.42fr_1.58fr] lg:items-end">
        <div className="self-start">
          <span className={`font-display text-[10px] font-bold uppercase tracking-[0.3em] ${dark ? 'text-white/35' : 'text-lab-black/35'}`}>{index} / 04</span>
          <div className="mt-7">
            <LabLabel dark={dark}>{label}</LabLabel>
          </div>
        </div>
        <div>
          <h1 className={`max-w-[1200px] font-impact uppercase leading-[0.8] tracking-[-0.025em] ${compactTitle ? 'text-[clamp(4.25rem,10vw,10rem)]' : 'text-[clamp(4.8rem,12vw,12rem)]'}`}>{title}</h1>
          <div className={`mt-10 grid gap-8 border-t pt-8 sm:grid-cols-[1fr_auto] sm:items-end ${dark ? 'border-white/15' : 'border-lab-line'}`}>
            <p className={`max-w-2xl text-base font-medium leading-relaxed sm:text-lg ${dark ? 'text-white/62' : 'text-lab-black/62'}`}>{copy}</p>
            <span className={`font-display text-[10px] font-bold uppercase tracking-[0.24em] ${dark ? 'text-white/30' : 'text-lab-black/30'}`}>Scroll to inspect ↓</span>
          </div>
        </div>
      </div>
    </section>
  );
}
