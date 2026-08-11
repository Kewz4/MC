import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, PackageCheck, PenTool, Scissors, Shirt, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LabLabel, PageIntro, RegistrationMarks, TextLink } from '../components/LabUI';

const capabilities = [
  {
    id: 'screen-printing',
    index: '01',
    title: 'Screen printing',
    code: 'PRINT_LAB / SP',
    description: 'A tactile, proven method for strong graphics across tees, fleece, totes, and larger apparel runs. Artwork, mesh, ink, placement, and garment are reviewed as one build.',
    fit: ['Bold spot-color artwork', 'Discharge-capable briefs', 'Consistent branded programs'],
    image: '/assets/images/bts-table.jpg',
    icon: PenTool,
  },
  {
    id: 'dtg-dtf',
    index: '02',
    title: 'DTG + DTF',
    code: 'PRINT_LAB / DIGITAL',
    description: 'Digital print paths for artwork that calls for fine detail, broad color, or flexible production. The team recommends DTG or DTF after reviewing fabric, image, quantity, and feel.',
    fit: ['Detailed or multi-color art', 'Shorter or mixed runs', 'Method guidance included'],
    image: '/assets/images/bts-folding.jpg',
    icon: Sparkles,
  },
  {
    id: 'embroidery',
    index: '03',
    title: 'Embroidery',
    code: 'STITCH_LAB / EMB',
    description: 'Thread-driven dimension for hats, workwear, outerwear, and premium identity pieces. Digitizing, scale, placement, and garment structure are calibrated before production.',
    fit: ['Headwear and outerwear', 'Tactile brand marks', 'Sewing and patch programs'],
    image: '/assets/images/bts-hands.jpg',
    icon: Shirt,
  },
  {
    id: 'finishing',
    index: '04',
    title: 'Retail finishing',
    code: 'FINISH_BENCH / RTL',
    description: 'The final details that make a garment feel like a product: neck labels, hangtags, sewing, fold and bag, and barcode stickers—planned as part of the build, not after it.',
    fit: ['Neck labels and hangtags', 'Fold, bag, and barcode', 'Retail-ready presentation'],
    image: '/assets/images/bts-folding.jpg',
    icon: Scissors,
  },
  {
    id: 'fulfillment',
    index: '05',
    title: 'Program support',
    code: 'PROGRAM / FULFILL',
    description: 'Support from initial direction through final delivery, whether you are building one focused drop or an ongoing merch program that needs consistency over time.',
    fit: ['One-off launches', 'Ongoing fulfillment', 'Agency and marketing teams'],
    image: '/assets/images/bts-workshop.jpg',
    icon: PackageCheck,
  },
];

const process = [
  ['01', 'Brief', 'Share the use case, artwork, quantities, timing, and references.'],
  ['02', 'Direction', 'We align the garment, method, placement, and finishing path.'],
  ['03', 'Proof', 'Internal review comes first, followed by written client approval.'],
  ['04', 'Production', 'The approved build moves through print, stitch, finishing, and QC.'],
  ['05', 'Delivery', 'Finished goods are prepared for the agreed delivery or fulfillment path.'],
];

function TechPackDiagram() {
  return (
    <div className="relative overflow-hidden border border-white/15 bg-white/[0.035] p-5 sm:p-9">
      <RegistrationMarks light />
      <svg viewBox="0 0 760 500" className="relative z-10 h-auto w-full text-white" role="img" aria-labelledby="tech-pack-title tech-pack-description">
        <title id="tech-pack-title">Front and back garment proof diagram</title>
        <desc id="tech-pack-description">Technical T-shirt outlines with animated placement and measurement guides.</desc>
        <g fill="none" stroke="currentColor" strokeWidth="2">
          <motion.path
            d="M116 124 188 84l72 24 72-24 72 40-44 85-42-20v225H202V189l-42 20-44-85Z"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.3, ease: 'easeInOut' }}
          />
          <motion.path
            d="M430 124 502 84l72 24 72-24 72 40-44 85-42-20v225H516V189l-42 20-44-85Z"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.3, delay: 0.16, ease: 'easeInOut' }}
          />
          <path d="M225 106c6 34 64 34 70 0M539 106c6 34 64 34 70 0" opacity=".45" />
          <path d="M220 216h78v86h-78zM532 220h84v112h-84z" stroke="#CB9933" strokeDasharray="7 7" />
          <path d="M220 198v-40M298 198v-40M532 202v-44M616 202v-44" stroke="#CC112C" />
          <path d="M207 167h104M519 167h110" stroke="#CC112C" />
          <path d="m207 167 12-6v12Zm104 0-12-6v12ZM519 167l12-6v12Zm110 0-12-6v12Z" fill="#CC112C" stroke="none" />
        </g>
        <g fill="currentColor" fontFamily="Space Grotesk" fontSize="12" fontWeight="600" letterSpacing="2">
          <text x="204" y="148">PLACEMENT WIDTH</text>
          <text x="520" y="148">BACK ART WIDTH</text>
          <text x="226" y="260" fill="#CB9933">FRONT</text>
          <text x="548" y="278" fill="#CB9933">BACK</text>
          <text x="116" y="454" opacity=".45">VIEW: FRONT + BACK</text>
          <text x="510" y="454" opacity=".45">ARTWORK: NOT TO SCALE</text>
        </g>
      </svg>
    </div>
  );
}

export default function ServicesPage() {
  const [activeId, setActiveId] = useState(capabilities[0].id);
  const active = capabilities.find((item) => item.id === activeId) ?? capabilities[0];
  const ActiveIcon = active.icon;

  return (
    <main className="overflow-hidden bg-white">
      <PageIntro
        index="01"
        label="Capabilities"
        title={<>Every mark<br /><span className="text-lab-gold">has a method.</span></>}
        copy="Print, stitch, finish, and fulfillment are treated as one connected system. We help select the right path, then build it with a clear proof and production plan."
        dark
        compactTitle
      />

      <section className="border-b border-lab-line bg-lab-paper px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-12 grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <LabLabel>Capability switchboard</LabLabel>
            <h2 className="font-display text-[clamp(2.7rem,5.5vw,6rem)] font-semibold uppercase leading-[0.92] tracking-[-0.04em]">Choose the build path.<br />We’ll calibrate the rest.</h2>
          </div>

          <div className="border border-lab-line bg-white">
            <div role="tablist" aria-label="Apparel capabilities" className="no-scrollbar flex overflow-x-auto border-b border-lab-line lg:grid lg:grid-cols-5">
              {capabilities.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={activeId === item.id}
                  aria-controls={`panel-${item.id}`}
                  onClick={() => setActiveId(item.id)}
                  className={`min-w-[190px] border-r border-lab-line px-5 py-5 text-left transition-colors last:border-r-0 lg:min-w-0 ${
                    activeId === item.id ? 'bg-lab-black text-white' : 'bg-white text-lab-black hover:bg-lab-paper'
                  }`}
                >
                  <span className={`mb-3 block font-display text-[9px] font-bold tracking-[0.24em] ${activeId === item.id ? 'text-lab-gold' : 'text-lab-red'}`}>{item.index}</span>
                  <span className="font-display text-xs font-bold uppercase tracking-[0.12em]">{item.title}</span>
                </button>
              ))}
            </div>

            <div id={`panel-${active.id}`} role="tabpanel" className="grid min-h-[570px] lg:grid-cols-2">
              <div className="relative min-h-[380px] overflow-hidden bg-lab-black lg:min-h-full">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={active.image + active.id}
                    src={active.image}
                    alt="Behind the scenes in the Merchcraft apparel lab"
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 0.82, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-lab-black via-lab-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between p-7 text-white sm:p-10">
                  <span className="font-display text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">Method preview</span>
                  <span className="font-display text-[10px] font-bold uppercase tracking-[0.28em] text-lab-gold">{active.code}</span>
                </div>
              </div>

              <motion.div key={active.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col p-7 sm:p-12 lg:p-16">
                <div className="mb-10 flex h-14 w-14 items-center justify-center rounded-full bg-lab-red text-white">
                  <ActiveIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.28em] text-lab-red">{active.code}</span>
                <h3 className="mt-4 font-display text-4xl font-semibold uppercase tracking-[-0.035em] sm:text-5xl">{active.title}</h3>
                <p className="mt-7 max-w-xl text-base font-medium leading-relaxed text-lab-black/62">{active.description}</p>

                <ul className="mt-9 grid gap-3 sm:grid-cols-3">
                  {active.fit.map((item) => (
                    <li key={item} className="flex gap-2 border-t border-lab-line pt-4 text-xs font-semibold leading-relaxed text-lab-black/65">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lab-red" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/quote?service=${active.id}`}
                  className="group mt-auto inline-flex min-h-12 items-center gap-5 self-start pt-10 font-display text-[11px] font-bold uppercase tracking-[0.18em]"
                >
                  Add to build
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lab-gold transition-colors group-hover:bg-lab-black group-hover:text-white">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-lab-black px-6 py-20 text-white sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1500px] gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <LabLabel dark>Proofing standard</LabLabel>
            <h2 className="mt-8 font-impact text-[clamp(4rem,8vw,8.5rem)] uppercase leading-[0.82]">Measure twice.<br /><span className="text-lab-gold">Pull once.</span></h2>
            <p className="mt-9 max-w-xl text-base font-medium leading-relaxed text-white/62">
              A build only moves when the details agree. Approved mockups, Pantone references, method checklists, and a two-touch approval path keep the production file clear.
            </p>
            <ul className="mt-10 grid gap-3 text-sm font-semibold text-white/75 sm:grid-cols-2">
              {['Approved proof templates', 'Pantone references', 'Internal art review', 'Client sign-off in writing'].map((item) => (
                <li key={item} className="flex items-center gap-3 border-t border-white/15 py-4">
                  <span className="h-1.5 w-1.5 rotate-45 bg-lab-red" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <TechPackDiagram />
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-8 border-b border-lab-line pb-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <LabLabel>Production flow</LabLabel>
            <h2 className="font-display text-[clamp(2.8rem,5.5vw,6rem)] font-semibold uppercase leading-[0.92] tracking-[-0.04em]">One brief.<br />Five controlled handoffs.</h2>
          </div>
          <div className="grid lg:grid-cols-5">
            {process.map(([index, title, copy], itemIndex) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ delay: itemIndex * 0.08 }}
                className="relative border-b border-lab-line py-9 lg:border-b-0 lg:border-r lg:px-7 lg:py-12 first:lg:pl-0 last:lg:border-r-0"
              >
                <span className="font-impact text-5xl text-lab-gold">{index}</span>
                <h3 className="mt-8 font-display text-lg font-bold uppercase tracking-[-0.02em]">{title}</h3>
                <p className="mt-4 text-sm font-medium leading-relaxed text-lab-black/55">{copy}</p>
              </motion.article>
            ))}
          </div>
          <div className="mt-14 flex flex-col items-start justify-between gap-7 border-t border-lab-line pt-10 sm:flex-row sm:items-center">
            <p className="max-w-xl font-display text-xl font-semibold uppercase tracking-[-0.02em]">Not sure which method fits? That’s part of the brief.</p>
            <TextLink to="/quote">Start with the project</TextLink>
          </div>
        </div>
      </section>
    </main>
  );
}
