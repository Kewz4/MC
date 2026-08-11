import { useLayoutEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowDown, ClipboardCheck, Layers3, PackageCheck, ScanLine, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LabLabel, RegistrationMarks, TextLink } from '../components/LabUI';

gsap.registerPlugin(ScrollTrigger);

const stations = [
  {
    index: '01',
    code: 'BRIEF / DIRECTION',
    title: 'Start with the reason.',
    copy: 'Before a garment is selected or a screen is burned, the team gets clear on the audience, use case, artwork, quantity, timing, and what the piece needs to communicate.',
    image: '/assets/images/bts-workshop.jpg',
    alt: 'Team members reviewing a project inside an apparel workshop',
    tags: ['Use case', 'Art direction', 'Garment path'],
  },
  {
    index: '02',
    code: 'PRINT / STITCH',
    title: 'Choose the right mark.',
    copy: 'Screen print, DTG, DTF, embroidery, and sewing each create a different result. Method, placement, scale, color, and fabric are calibrated as a single production decision.',
    image: '/assets/images/bts-table.jpg',
    alt: 'Apparel, patches, and color references arranged on a production table',
    tags: ['Print method', 'Thread + ink', 'Placement'],
  },
  {
    index: '03',
    code: 'FINISH / DETAIL',
    title: 'Make it feel complete.',
    copy: 'Neck labels, hangtags, sewing, fold and bag, and barcode stickers turn printed apparel into a considered product ready for retail, a team, or a launch.',
    image: '/assets/images/bts-hands.jpg',
    alt: 'Hands inspecting and folding a printed garment',
    tags: ['Labels', 'Hangtags', 'Retail finish'],
  },
  {
    index: '04',
    code: 'QC / DELIVERY',
    title: 'Finish the handoff.',
    copy: 'The build is reviewed against the approved proof, finished goods are prepared for their next stop, and ongoing programs can continue through a consistent fulfillment path.',
    image: '/assets/images/bts-folding.jpg',
    alt: 'A finished printed garment being inspected at a workbench',
    tags: ['Quality control', 'Delivery', 'Fulfillment'],
  },
];

const teamFunctions = [
  { icon: ClipboardCheck, code: 'STATION_01', title: 'Client partnerships', copy: 'Translates goals, timing, and program needs into a clear working brief.' },
  { icon: Layers3, code: 'STATION_02', title: 'Art + prepress', copy: 'Prepares artwork, placement, color references, and the proof that production follows.' },
  { icon: Sparkles, code: 'STATION_03', title: 'Production', copy: 'Brings the approved build to life through the selected print, stitch, and sewing methods.' },
  { icon: PackageCheck, code: 'STATION_04', title: 'Finishing + fulfillment', copy: 'Handles the details between the press and the final delivery or ongoing program.' },
];

export default function AboutPage() {
  const pageRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const processRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const scope = pageRef.current;
    if (!scope) return;

    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const heroImage = heroRef.current?.querySelector('.about-hero-image');
        const heroRule = heroRef.current?.querySelector('.about-hero-rule');
        const heroWords = heroRef.current?.querySelectorAll('.about-hero-word');

        if (heroImage) {
          gsap.fromTo(heroImage, { scale: 1.12 }, { scale: 1, duration: 1.6, ease: 'power3.out' });
          gsap.to(heroImage, {
            yPercent: 10,
            ease: 'none',
            scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: 1 },
          });
        }
        if (heroRule) gsap.fromTo(heroRule, { scaleX: 0 }, { scaleX: 1, duration: 1.1, delay: 0.3, ease: 'power3.out' });
        if (heroWords?.length) {
          gsap.from(heroWords, { yPercent: 115, stagger: 0.08, duration: 1, delay: 0.18, ease: 'power4.out' });
        }
      });

      media.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const section = processRef.current;
        if (!section) return;
        const images = gsap.utils.toArray<HTMLElement>('.process-image', section);
        const cards = gsap.utils.toArray<HTMLElement>('.process-card', section);
        const progress = section.querySelector<HTMLElement>('.process-progress');

        gsap.set(images, { autoAlpha: 0, scale: 1.035 });
        gsap.set(images[0], { autoAlpha: 1, scale: 1 });

        const showImage = (index: number) => {
          images.forEach((image, imageIndex) => {
            gsap.to(image, {
              autoAlpha: imageIndex === index ? 1 : 0,
              scale: imageIndex === index ? 1 : 1.035,
              duration: 0.6,
              overwrite: true,
              ease: 'power2.out',
            });
          });
        };

        cards.forEach((card, index) => {
          ScrollTrigger.create({
            trigger: card,
            start: 'top 58%',
            end: 'bottom 42%',
            onEnter: () => showImage(index),
            onEnterBack: () => showImage(index),
          });
        });

        if (progress) {
          gsap.fromTo(
            progress,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: 'none',
              scrollTrigger: { trigger: section, start: 'top 20%', end: 'bottom 80%', scrub: true },
            },
          );
        }
      });

    }, scope);

    return () => {
      media.revert();
      context.revert();
    };
  }, []);

  return (
    <main ref={pageRef} className="overflow-hidden bg-white">
      <section ref={heroRef} className="relative flex min-h-[94vh] items-end overflow-hidden bg-lab-black px-6 pb-10 pt-32 text-white sm:px-8 lg:px-10 lg:pb-12">
        <img src="/assets/images/lab-showroom.jpg" alt="Merchcraft apparel lab with team members working around a showroom table" className="about-hero-image absolute inset-0 h-[112%] w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-lab-black/40 via-lab-black/10 to-lab-black/95" />
        <div className="lab-dots halftone-mask absolute -right-10 top-10 h-[60%] w-[45%] opacity-20 [--dot-color:white]" />
        <RegistrationMarks light />

        <div className="relative z-10 mx-auto w-full max-w-[1500px]">
          <div className="mb-7 flex items-center justify-between">
            <LabLabel dark>About the lab</LabLabel>
            <span className="hidden font-display text-[10px] font-bold uppercase tracking-[0.26em] text-white/45 sm:block">Record 002 / Orange County</span>
          </div>
          <h1 className="font-impact text-[clamp(4.7rem,13vw,13rem)] uppercase leading-[0.78] tracking-[-0.025em]">
            <span className="block overflow-hidden"><span className="about-hero-word block">The people</span></span>
            <span className="block overflow-hidden"><span className="about-hero-word block text-lab-gold">behind the pull.</span></span>
          </h1>
          <div className="about-hero-rule mt-9 h-px origin-left bg-white/45" />
          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-2xl text-base font-medium leading-relaxed text-white/72 sm:text-lg">Not a corporate timeline. A closer look at the decisions, hands, and handoffs that turn an identity into a garment.</p>
            <a href="#lab-record" className="inline-flex min-h-11 items-center gap-3 self-start font-display text-[10px] font-bold uppercase tracking-[0.25em] text-white/55 transition-colors hover:text-white sm:self-auto">
              Open the record <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section id="lab-record" className="relative bg-white px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1500px] gap-14 lg:grid-cols-[0.55fr_1.45fr]">
          <div>
            <span className="font-impact text-8xl text-lab-gold">001</span>
            <div className="mt-6"><LabLabel>Lab record</LabLabel></div>
          </div>
          <div>
            <h2 className="max-w-5xl font-display text-[clamp(2.8rem,5.7vw,6.4rem)] font-semibold uppercase leading-[0.92] tracking-[-0.045em]">
              A custom apparel partner built around <span className="text-lab-red">production excellence</span> and the relationships that make it reliable.
            </h2>
            <div className="mt-12 grid gap-9 border-t border-lab-line pt-9 md:grid-cols-2">
              <p className="text-base font-medium leading-relaxed text-lab-black/65">
                Merchcraft brings custom apparel and finishing to life for Orange County clients and brand communities across Southern California—from one-off drops to ongoing fulfillment.
              </p>
              <p className="text-base font-medium leading-relaxed text-lab-black/65">
                Founders, marketing teams, agencies, and creative directors come to the lab for help connecting initial design, production method, retail details, and final delivery.
              </p>
            </div>
            <div className="mt-12 flex flex-wrap gap-2">
              {['Founders', 'Marketing teams', 'Agencies', 'Creative directors'].map((item) => (
                <span key={item} className="rounded-full border border-lab-line px-5 py-3 font-display text-[10px] font-bold uppercase tracking-[0.18em]">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section ref={processRef} className="relative border-y border-lab-line bg-lab-paper px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-12 grid gap-8 lg:grid-cols-[0.55fr_1.45fr] lg:items-end">
            <LabLabel>Production dossier</LabLabel>
            <h2 className="font-impact text-[clamp(4.4rem,10vw,10.5rem)] uppercase leading-[0.8] tracking-[-0.025em]">One garment.<br /><span className="text-lab-red">Many hands.</span></h2>
          </div>

          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div className="process-stage sticky top-[88px] hidden h-[calc(100vh-120px)] min-h-[590px] overflow-hidden bg-lab-black lg:block">
              <RegistrationMarks light />
              {stations.map((station) => (
                <img key={station.index} src={station.image} alt={station.alt} className="process-image absolute inset-0 h-full w-full object-cover opacity-0" />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-lab-black via-transparent to-lab-black/15" />
              <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between p-9 text-white">
                <div>
                  <span className="font-display text-[9px] font-bold uppercase tracking-[0.28em] text-lab-gold">Visual feed</span>
                  <p className="mt-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-white/65">Production path / live record</p>
                </div>
                <ScanLine className="h-6 w-6 text-white/45" aria-hidden="true" />
              </div>
              <div className="absolute right-5 top-5 h-[calc(100%-40px)] w-px bg-white/15">
                <div className="process-progress h-full w-px origin-top bg-lab-red" />
              </div>
            </div>

            <div>
              {stations.map((station, index) => (
                <article key={station.index} className="process-card flex min-h-[82vh] flex-col justify-center border-t border-lab-line py-16 first:border-t-0 lg:min-h-[88vh] lg:py-24">
                  <div className="mb-7 overflow-hidden bg-lab-black lg:hidden">
                    <img src={station.image} alt={station.alt} loading="lazy" className="aspect-[4/3] h-full w-full object-cover" />
                  </div>
                  <div className="flex items-start justify-between gap-5">
                    <span className="font-impact text-[clamp(4rem,7vw,7rem)] leading-none text-lab-gold">{station.index}</span>
                    <span className="mt-2 font-display text-[9px] font-bold uppercase tracking-[0.25em] text-lab-red">{station.code}</span>
                  </div>
                  <h3 className="mt-8 max-w-xl font-display text-[clamp(2.5rem,4vw,4.8rem)] font-semibold uppercase leading-[0.95] tracking-[-0.04em]">{station.title}</h3>
                  <p className="mt-7 max-w-xl text-base font-medium leading-relaxed text-lab-black/62">{station.copy}</p>
                  <div className="mt-9 grid grid-cols-3 gap-2">
                    {station.tags.map((tag) => (
                      <span key={tag} className="border-t border-lab-line pt-4 font-display text-[9px] font-bold uppercase tracking-[0.17em] text-lab-black/45">{tag}</span>
                    ))}
                  </div>
                  <span className="mt-10 font-display text-[9px] font-bold uppercase tracking-[0.26em] text-lab-black/25">Sequence {index + 1} / {stations.length}</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
            <div>
              <LabLabel>Experience, without the résumé</LabLabel>
              <h2 className="mt-8 font-display text-[clamp(3rem,5.5vw,6.2rem)] font-semibold uppercase leading-[0.92] tracking-[-0.045em]">Built for the drop.<br />Ready for the program.</h2>
            </div>
            <p className="max-w-xl text-base font-medium leading-relaxed text-lab-black/62 lg:justify-self-end">The work changes shape—from a focused first run to a continuing fulfillment rhythm. The standard stays the same: clear direction, an approved proof, and production details that hold together.</p>
          </div>
          <div className="mt-14 grid border border-lab-line md:grid-cols-2 lg:grid-cols-4">
            {[
              ['01', 'One-off drops', 'Launches, capsules, events, and special projects with a defined finish line.'],
              ['02', 'Ongoing fulfillment', 'Repeat programs that benefit from continuity across production and delivery.'],
              ['03', 'Brand-side teams', 'Support for founders and marketers balancing concept, timing, and internal needs.'],
              ['04', 'Creative partners', 'A production counterpart for agencies and creative directors protecting the idea through execution.'],
            ].map(([index, title, copy]) => (
              <motion.article key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.45 }} className="min-h-[300px] border-b border-lab-line p-7 last:border-b-0 md:border-r md:[&:nth-child(even)]:border-r-0 lg:border-b-0 lg:[&:nth-child(even)]:border-r lg:last:border-r-0">
                <span className="font-impact text-5xl text-lab-red">{index}</span>
                <h3 className="mt-12 font-display text-lg font-bold uppercase tracking-[-0.02em]">{title}</h3>
                <p className="mt-4 text-sm font-medium leading-relaxed text-lab-black/55">{copy}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-lab-black px-6 py-20 text-white sm:px-8 lg:px-10 lg:py-28">
        <div className="lab-grid absolute inset-0 opacity-20 [--grid-color:rgba(255,255,255,0.08)]" />
        <div className="relative mx-auto max-w-[1500px]">
          <LabLabel dark>The people are the process</LabLabel>
          <div className="mt-12 grid border border-white/15 md:grid-cols-2 lg:grid-cols-4">
            {teamFunctions.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.code} className="group min-h-[330px] border-b border-white/15 p-7 transition-colors last:border-b-0 hover:bg-white hover:text-lab-black md:border-r md:[&:nth-child(even)]:border-r-0 lg:border-b-0 lg:[&:nth-child(even)]:border-r lg:last:border-r-0">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[9px] font-bold uppercase tracking-[0.24em] text-lab-gold group-hover:text-lab-red">{item.code}</span>
                    <Icon className="h-5 w-5 text-white/45 group-hover:text-lab-red" aria-hidden="true" />
                  </div>
                  <h3 className="mt-20 font-display text-2xl font-semibold uppercase leading-tight tracking-[-0.03em]">{item.title}</h3>
                  <p className="mt-5 text-sm font-medium leading-relaxed text-white/55 group-hover:text-lab-black/60">{item.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-lab-gold px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1500px] gap-14 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
          <div>
            <img src="/assets/brand/merchcraft-mark-full.svg" alt="" className="h-20 w-auto" />
            <p className="mt-7 font-display text-xs font-bold uppercase tracking-[0.23em] text-lab-black/55">Mission / Vision / Standard</p>
          </div>
          <div>
            <h2 className="font-impact text-[clamp(4rem,9vw,9rem)] uppercase leading-[0.8] tracking-[-0.025em]">Built on craft.<br />Run on reliability.</h2>
            <div className="mt-10 flex flex-col items-start justify-between gap-8 border-t border-lab-black/20 pt-8 sm:flex-row sm:items-center">
              <p className="max-w-2xl text-base font-semibold leading-relaxed text-lab-black/70">The aim is simple: elevate the brands we serve through thoughtful apparel, production excellence, and the relationships clients can depend on.</p>
              <TextLink to="/quote">Put your identity on a garment</TextLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
