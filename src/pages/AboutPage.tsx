import { useLayoutEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowDown } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextLink } from '../components/LabUI';

gsap.registerPlugin(ScrollTrigger);

const processSteps = [
  {
    index: '01',
    title: 'Start with the idea.',
    copy: 'We get clear on the audience, use case, artwork, quantity, timing, and what the piece needs to communicate.',
    image: '/assets/images/about-planning-v2.webp',
    alt: 'Two collaborators arranging garments, fabric swatches, thread, and color references',
  },
  {
    index: '02',
    title: 'Choose the right method.',
    copy: 'Garment, print or stitch method, placement, scale, and color are considered together so the result feels intentional.',
    image: '/assets/images/about-method-v3.webp',
    alt: 'Screen-print and embroidery samples being compared on black fabric',
  },
  {
    index: '03',
    title: 'Finish every detail.',
    copy: 'Labels, hangtags, sewing, folding, bagging, and barcodes turn decorated apparel into a complete product.',
    image: '/assets/images/about-finishing-v2.webp',
    alt: 'A finished black sweatshirt being folded into tissue for packing',
  },
  {
    index: '04',
    title: 'Prepare for delivery.',
    copy: 'The order is checked against the approved proof and prepared for delivery, launch, or an ongoing program.',
    image: '/assets/images/quote-still-life-v2.webp',
    alt: 'Folded apparel, a cap, tags, and packaging prepared for delivery',
  },
];

const teamFunctions = [
  ['Client partnerships', 'Turns goals, timing, and program needs into a clear working brief.'],
  ['Art and prepress', 'Prepares artwork, placement, color references, and the proof used for production.'],
  ['Production', 'Brings the approved project to life through print, stitch, and sewing.'],
  ['Finishing and fulfillment', 'Handles the details between the press and final delivery.'],
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
        const heroWords = heroRef.current?.querySelectorAll('.about-hero-word');

        if (heroImage) {
          gsap.fromTo(heroImage, { scale: 1.1 }, { scale: 1, duration: 1.6, ease: 'power3.out' });
          gsap.to(heroImage, {
            yPercent: 8,
            ease: 'none',
            scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: 1 },
          });
        }

        if (heroWords?.length) {
          gsap.from(heroWords, { yPercent: 115, stagger: 0.09, duration: 1, delay: 0.16, ease: 'power4.out' });
        }
      });

      media.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const section = processRef.current;
        if (!section) return;

        const images = gsap.utils.toArray<HTMLElement>('.process-image', section);
        const cards = gsap.utils.toArray<HTMLElement>('.process-card', section);

        gsap.set(images, { autoAlpha: 0, scale: 1.025 });
        gsap.set(images[0], { autoAlpha: 1, scale: 1 });

        const showImage = (activeIndex: number) => {
          images.forEach((image, imageIndex) => {
            gsap.to(image, {
              autoAlpha: imageIndex === activeIndex ? 1 : 0,
              scale: imageIndex === activeIndex ? 1 : 1.025,
              duration: 0.65,
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
      });
    }, scope);

    return () => {
      media.revert();
      context.revert();
    };
  }, []);

  return (
    <main ref={pageRef} className="bg-white">
      <section ref={heroRef} className="relative flex min-h-[94vh] items-end overflow-hidden bg-lab-black px-6 pb-12 pt-32 text-white sm:px-8 lg:px-10 lg:pb-16">
        <img src="/assets/images/about-hero-v3.webp" alt="Merchcraft makers working across printing, embroidery, and finishing stations" className="about-hero-image absolute inset-0 h-[110%] w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-lab-black/20 via-lab-black/10 to-lab-black/90" />

        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <p className="mb-7 font-accent text-sm font-bold uppercase tracking-[0.14em] text-lab-gold">About Merchcraft</p>
          <h1 className="font-display text-[clamp(3.1rem,11vw,11rem)] font-bold uppercase leading-[0.82] tracking-tighter">
            <span className="block overflow-hidden"><span className="about-hero-word block">The people</span></span>
            <span className="block overflow-hidden"><span className="about-hero-word block">behind <span className="font-display normal-case text-lab-gold">the work.</span></span></span>
          </h1>
          <div className="mt-9 flex flex-col gap-6 border-t border-white/35 pt-7 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-2xl text-base font-medium leading-relaxed text-white/72 sm:text-lg">We help brands turn ideas into apparel through thoughtful production, close collaboration, and careful finishing.</p>
            <a href="#how-we-work" className="inline-flex items-center gap-3 self-start font-sans text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-60 sm:self-auto">
              See how we work <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.55fr_1.45fr]">
          <div>
            <p className="font-accent text-sm font-bold uppercase tracking-[0.14em] text-lab-red">Who we are</p>
          </div>
          <div>
            <h2 className="max-w-5xl font-display text-[clamp(3rem,6vw,6.5rem)] font-bold uppercase leading-[0.9] tracking-tighter">A hands-on apparel partner from concept through delivery.</h2>
            <div className="mt-12 grid gap-9 border-t border-lab-line pt-9 md:grid-cols-2">
              <p className="text-base font-medium leading-relaxed text-lab-black/62">Merchcraft works with founders, marketing teams, agencies, and creative directors on everything from focused drops to ongoing programs.</p>
              <p className="text-base font-medium leading-relaxed text-lab-black/62">We bring the garment, decoration, finishing, and fulfillment pieces together so every detail feels considered.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-we-work" ref={processRef} className="border-y border-lab-line bg-lab-white px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 grid gap-8 lg:grid-cols-2 lg:items-end">
            <h2 className="font-display text-[clamp(3.5rem,7vw,7.5rem)] font-bold uppercase leading-[0.86] tracking-tighter">One garment.<br /><span className="font-display normal-case text-lab-red">Many hands.</span></h2>
            <p className="max-w-xl text-base font-medium leading-relaxed text-lab-black/60 lg:justify-self-end">Every project moves through a series of human decisions—from the first conversation to the final fold.</p>
          </div>

          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div className="sticky top-[88px] hidden h-[calc(100vh-120px)] min-h-[590px] overflow-hidden bg-lab-black lg:block">
              {processSteps.map((step) => (
                <img key={step.index} src={step.image} alt={step.alt} className="process-image absolute inset-0 h-full w-full object-cover opacity-0" />
              ))}
            </div>

            <div>
              {processSteps.map((step) => (
                <article key={step.index} className="process-card flex min-h-[72vh] flex-col justify-center border-t border-lab-line py-16 first:border-t-0 lg:min-h-[82vh] lg:py-24">
                  <div className="mb-8 overflow-hidden bg-lab-black lg:hidden">
                    <img src={step.image} alt={step.alt} loading="lazy" className="aspect-[4/3] h-full w-full object-cover" />
                  </div>
                  <span className="font-impact text-[clamp(4rem,7vw,7rem)] leading-none text-lab-gold">{step.index}</span>
                  <h3 className="mt-8 max-w-xl font-display text-[clamp(2.6rem,4.5vw,5rem)] font-bold uppercase leading-[0.92] tracking-tighter">{step.title}</h3>
                  <p className="mt-7 max-w-xl text-base font-medium leading-relaxed text-lab-black/62">{step.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="font-accent text-sm font-bold uppercase tracking-[0.14em] text-lab-red">Who we work with</p>
              <h2 className="mt-7 font-display text-[clamp(3rem,5.5vw,6rem)] font-bold uppercase leading-[0.9] tracking-tighter">Built for a first drop.<br />Ready for what comes next.</h2>
            </div>
            <p className="max-w-xl text-base font-medium leading-relaxed text-lab-black/62 lg:justify-self-end">The work can be a focused launch or a continuing program. The standard stays the same: clear direction and production details that hold together.</p>
          </div>

          <div className="mt-14 grid border-t border-lab-line md:grid-cols-2 lg:grid-cols-4">
            {[
              ['Founders', 'Focused launches, growing brands, and the details that make a first run feel established.'],
              ['Marketing teams', 'Campaign apparel, events, internal programs, and repeatable brand consistency.'],
              ['Agencies', 'A production partner that protects the creative idea through execution.'],
              ['Creative directors', 'Thoughtful garment, method, placement, and finishing collaboration.'],
            ].map(([title, copy], index) => (
              <motion.article key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.45 }} transition={{ delay: index * 0.07 }} className="min-h-[270px] border-b border-lab-line py-9 md:border-r md:px-8 lg:border-b-0 first:md:pl-0 last:lg:border-r-0">
                <h3 className="font-display text-2xl font-bold uppercase tracking-tight">{title}</h3>
                <p className="mt-6 text-sm font-medium leading-relaxed text-lab-black/55">{copy}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-lab-black px-6 py-20 text-white sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="overflow-hidden">
            <img src="/assets/images/about-team-v3.webp" alt="Merchcraft team reviewing a finished garment and fabric details" loading="lazy" className="aspect-[4/3] h-full w-full object-cover" />
          </div>
          <div className="lg:pl-8">
            <p className="font-accent text-sm font-bold uppercase tracking-[0.14em] text-lab-gold">The team behind the work</p>
            <h2 className="mt-7 font-display text-[clamp(3rem,5.5vw,6rem)] font-bold uppercase leading-[0.9] tracking-tighter">Different skills.<br />One finished piece.</h2>
            <div className="mt-10 grid gap-x-8 sm:grid-cols-2">
              {teamFunctions.map(([title, copy]) => (
                <div key={title} className="border-t border-white/15 py-6">
                  <h3 className="font-display text-lg font-bold uppercase tracking-tight">{title}</h3>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-white/55">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-lab-gold px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.55fr_1.45fr] lg:items-end">
          <img src="/assets/brand/merchcraft-mark-full.svg" alt="" className="h-20 w-auto" />
          <div>
            <h2 className="font-display text-[clamp(3.8rem,8vw,8.5rem)] font-bold uppercase leading-[0.82] tracking-tighter">Craft matters.<br />So does reliability.</h2>
            <div className="mt-10 flex flex-col items-start justify-between gap-8 border-t border-lab-black/20 pt-8 sm:flex-row sm:items-center">
              <p className="max-w-2xl text-base font-semibold leading-relaxed text-lab-black/70">We care about making apparel look right, feel right, and arrive ready for what comes next.</p>
              <TextLink to="/quote">Tell us what you’re making</TextLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
