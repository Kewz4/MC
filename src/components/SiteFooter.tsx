import { Link } from 'react-router-dom';

const footerLinks = [
  { label: 'Services', to: '/services' },
  { label: 'Stickers', to: '/stickers' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Request a quote', to: '/quote' },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-lab-line bg-lab-white px-6 py-20 sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 pb-20 md:grid-cols-12">
          <div className="md:col-span-6">
            <img src="/assets/brand/merchcraft-primary-full.svg" alt="Merchcraft" className="mb-12 h-10 w-auto" />
            <h2 className="font-display text-5xl font-bold uppercase leading-tight tracking-tighter md:text-6xl">
              Ready to start<br />your next order?
            </h2>
            <Link to="/quote" className="mt-10 inline-flex rounded-full bg-lab-black px-12 py-6 font-sans text-[12px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-80">
              Enter Production
            </Link>
          </div>

          <div className="md:col-span-3">
            <h3 className="mb-8 font-sans text-[12px] font-bold uppercase tracking-[0.3em] text-lab-black/30">Company</h3>
            <ul className="space-y-4">
              {footerLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="font-sans text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-50">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="mb-8 font-sans text-[12px] font-bold uppercase tracking-[0.3em] text-lab-black/30">Contact</h3>
            <a href="mailto:shop@merchcraft.com" className="block font-sans text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-50">shop@merchcraft.com</a>
            <a href="mailto:brand@merchcraft.com" className="mt-4 block font-sans text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-50">brand@merchcraft.com</a>
            <p className="mt-8 font-sans text-xs font-bold uppercase tracking-widest text-lab-black/35">Orange County · Southern California</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-lab-line pt-8 font-sans text-[11px] font-bold uppercase tracking-[0.25em] text-lab-black/30 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Merchcraft. All rights reserved.</span>
          <span>Your merch, our craft.</span>
        </div>
      </div>
    </footer>
  );
}
