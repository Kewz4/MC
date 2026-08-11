import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TextLink({ to, children, light = false }: { to: string; children: ReactNode; light?: boolean }) {
  return (
    <Link
      to={to}
      className={`group inline-flex min-h-12 items-center gap-5 rounded-full border px-7 font-sans text-[11px] font-bold uppercase tracking-widest transition-colors ${
        light
          ? 'border-white/25 text-white hover:border-white hover:bg-white hover:text-lab-black'
          : 'border-lab-black/20 text-lab-black hover:border-lab-black hover:bg-lab-black hover:text-white'
      }`}
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1.5" aria-hidden="true" />
    </Link>
  );
}
