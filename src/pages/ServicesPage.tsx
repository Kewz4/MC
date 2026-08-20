import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TextLink } from '../components/LabUI';

const services = [
  {
    id: 'screen-printing',
    title: 'Screen printing',
    description: 'Bold, durable prints for tees, fleece, totes, and larger runs. We’ll help dial in the garment, ink, placement, and finish.',
    fit: ['Spot-color artwork', 'Tees, fleece, and totes', 'Consistent larger runs'],
    image: '/assets/images/about-printmaker-v2.webp',
  },
  {
    id: 'dtg-dtf',
    title: 'DTG and DTF',
    description: 'Flexible options for detailed, full-color artwork and shorter runs. We’ll recommend the right method for your fabric, quantity, and desired feel.',
    fit: ['Detailed artwork', 'Full-color graphics', 'Shorter or mixed runs'],
    image: '/assets/images/services-digital-v3.webp',
  },
  {
    id: 'embroidery',
    title: 'Embroidery',
    description: 'Clean, dimensional stitching for hats, workwear, outerwear, and premium brand pieces.',
    fit: ['Headwear', 'Workwear and outerwear', 'Premium brand marks'],
    image: '/assets/images/services-embroidery-v3.webp',
  },
  {
    id: 'finishing',
    title: 'Retail finishing',
    description: 'Custom labels, hangtags, folding, bagging, and barcodes that make every piece ready for retail or delivery.',
    fit: ['Labels and hangtags', 'Fold and bag', 'Retail-ready presentation'],
    image: '/assets/images/services-finishing-v3.webp',
  },
  {
    id: 'fulfillment',
    title: 'Fulfillment',
    description: 'Reliable support for launches, repeat orders, and ongoing merchandise programs.',
    fit: ['One-off launches', 'Repeat programs', 'Ongoing support'],
    image: '/assets/images/services-fulfillment-v3.webp',
  },
];

const process = [
  ['01', 'Share the idea', 'Tell us what you’re making, who it is for, and when you need it.'],
  ['02', 'Choose the approach', 'We align the garment, decoration method, placement, and finish.'],
  ['03', 'Approve the proof', 'Artwork, color, placement, and finishing details are reviewed with you.'],
  ['04', 'Make the order', 'The approved project moves through production and quality control.'],
  ['05', 'Prepare for delivery', 'Finished goods are packed for delivery or an ongoing fulfillment program.'],
];

export default function ServicesPage() {
  const [activeId, setActiveId] = useState(services[0].id);
  const active = services.find((item) => item.id === activeId) ?? services[0];

  return (
    <main className="overflow-hidden bg-white">
      <section className="px-6 pb-16 pt-32 sm:px-8 lg:px-10 lg:pb-24 lg:pt-40">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <p className="font-accent text-sm font-bold uppercase tracking-[0.14em] text-lab-red">Our services</p>
            <h1 className="mt-7 font-display text-[clamp(4rem,8.5vw,8.5rem)] font-bold uppercase leading-[0.84] tracking-tighter">
              Apparel made<br />for <span className="font-display normal-case text-lab-gold">your brand.</span>
            </h1>
            <p className="mt-9 max-w-xl text-base font-medium leading-relaxed text-lab-black/60 sm:text-lg">
              From screen printing and embroidery to finishing and fulfillment, we help turn your ideas into apparel people want to wear.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/quote" className="rounded-full bg-lab-red px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-lab-black">Request a quote</Link>
              <a href="#services" className="rounded-full border border-lab-black/20 px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest transition-colors hover:bg-lab-black hover:text-white">Explore services</a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden bg-lab-white">
            <img src="/assets/images/services-still-life-v2.webp" alt="Premium blank apparel, embroidery thread, hangtag, and screen-printing tools" className="aspect-[4/3] h-full w-full object-cover" />
          </motion.div>
        </div>
      </section>

      <section id="services" className="border-y border-lab-line bg-lab-white px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
            <h2 className="font-display text-[clamp(3rem,6vw,6.5rem)] font-bold uppercase leading-[0.9] tracking-tighter">The right method<br />for every idea.</h2>
            <p className="max-w-xl text-base font-medium leading-relaxed text-lab-black/60 lg:justify-self-end">Choose a service to see how it can support your project. If you are not sure where to start, we will recommend the best option.</p>
          </div>

          <div className="mt-14 border-t border-lab-line">
            <div role="group" aria-label="Apparel services" className="no-scrollbar flex overflow-x-auto border-b border-lab-line">
              {services.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={activeId === item.id}
                  onClick={() => setActiveId(item.id)}
                  className={`min-w-max border-r border-lab-line px-6 py-5 font-sans text-xs font-bold uppercase tracking-[0.12em] transition-colors last:border-r-0 ${activeId === item.id ? 'bg-lab-black text-white' : 'bg-transparent text-lab-black/60 hover:text-lab-black'}`}
                >
                  {item.title}
                </button>
              ))}
            </div>

            <div className="grid bg-white lg:grid-cols-2">
              <div className="relative aspect-[4/3] overflow-hidden lg:aspect-auto lg:min-h-[590px]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={active.id}
                    src={active.image}
                    alt={`${active.title} production at Merchcraft`}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </AnimatePresence>
              </div>

              <motion.div key={active.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col p-8 sm:p-12 lg:p-16">
                <h3 className="font-display text-4xl font-bold uppercase tracking-tighter sm:text-6xl">{active.title}</h3>
                <p className="mt-7 max-w-xl text-base font-medium leading-relaxed text-lab-black/60">{active.description}</p>
                <ul className="mt-10 space-y-4 border-t border-lab-line pt-7">
                  {active.fit.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm font-semibold text-lab-black/65">
                      <Check className="h-4 w-4 text-lab-red" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to={`/quote?service=${active.id}`} className="group mt-12 inline-flex items-center gap-4 self-start rounded-full bg-lab-black px-7 py-4 font-sans text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-lab-red">
                  Request a quote
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl overflow-hidden bg-lab-black text-white lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-8 sm:p-12 lg:p-16">
            <p className="font-accent text-sm font-bold uppercase tracking-[0.14em] text-lab-gold">Beyond apparel</p>
            <h2 className="mt-6 font-display text-[clamp(3rem,5.5vw,5.8rem)] font-bold uppercase tracking-tighter">Custom stickers<br />built for the brand.</h2>
            <p className="mt-7 max-w-xl text-base font-medium leading-relaxed text-white/68">Explore sticker formats and surface directions, then send a project-specific quote request with size, quantity, and artwork details.</p>
            <Link to="/stickers" className="group mt-9 inline-flex min-h-14 items-center gap-4 rounded-full bg-lab-gold px-8 font-sans text-xs font-bold uppercase tracking-widest text-lab-black transition-colors hover:bg-white">
              Explore custom stickers <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
          <img src="/assets/images/stickers-materials-v1.webp" alt="A close-up comparison of custom sticker surface directions" loading="lazy" className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto" />
        </div>
      </section>

      <section className="bg-lab-black px-6 py-20 text-white sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center">
          <div className="overflow-hidden">
            <img src="/assets/images/services-quality-v2.webp" alt="Screen-print and embroidery samples being inspected before production" loading="lazy" className="aspect-[4/3] h-full w-full object-cover" />
          </div>
          <div className="lg:pl-10">
            <p className="font-accent text-sm font-bold uppercase tracking-[0.14em] text-lab-gold">Before production</p>
            <h2 className="mt-7 font-display text-[clamp(3.2rem,6vw,6.5rem)] font-bold uppercase leading-[0.9] tracking-tighter">Approved before<br />it goes to press.</h2>
            <p className="mt-8 max-w-xl text-base font-medium leading-relaxed text-white/65">We review artwork, placement, color, and finishing details with you before production begins.</p>
            <ul className="mt-10 grid gap-x-8 sm:grid-cols-2">
              {['Artwork review', 'Placement and scale', 'Color references', 'Written approval'].map((item) => (
                <li key={item} className="border-t border-white/15 py-4 text-sm font-semibold text-white/75">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 border-b border-lab-line pb-10 lg:grid-cols-2 lg:items-end">
            <h2 className="font-display text-[clamp(3rem,6vw,6.5rem)] font-bold uppercase leading-[0.9] tracking-tighter">From first idea<br />to final delivery.</h2>
            <p className="max-w-lg text-base font-medium leading-relaxed text-lab-black/60 lg:justify-self-end">A clear process keeps the creative idea intact while every production detail gets resolved.</p>
          </div>

          <div className="grid lg:grid-cols-5">
            {process.map(([index, title, copy], itemIndex) => (
              <motion.article key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.45 }} transition={{ delay: itemIndex * 0.07 }} className="border-b border-lab-line py-9 lg:border-b-0 lg:border-r lg:px-7 lg:py-12 first:lg:pl-0 last:lg:border-r-0">
                <span className="font-impact text-5xl text-lab-gold">{index}</span>
                <h3 className="mt-8 font-display text-lg font-bold uppercase tracking-tight">{title}</h3>
                <p className="mt-4 text-sm font-medium leading-relaxed text-lab-black/55">{copy}</p>
              </motion.article>
            ))}
          </div>

          <div className="mt-14 flex flex-col items-start justify-between gap-7 border-t border-lab-line pt-10 sm:flex-row sm:items-center">
            <p className="max-w-xl font-display text-xl font-semibold uppercase tracking-tight">Not sure which method fits? Start with the project.</p>
            <TextLink to="/quote">Tell us what you’re making</TextLink>
          </div>
        </div>
      </section>
    </main>
  );
}
