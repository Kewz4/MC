import { type ChangeEvent, type FormEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, Check, FileUp, Mail, Send, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import StickerSplineScene from '../components/StickerSplineScene';

gsap.registerPlugin(ScrollTrigger);

type StickerQuote = {
  name: string;
  email: string;
  company: string;
  phone: string;
  quantity: string;
  designCount: string;
  width: string;
  height: string;
  unit: 'in' | 'mm';
  sizeUnknown: boolean;
  shape: string;
  surface: string;
  intendedUse: string;
  targetDate: string;
  artworkStatus: string;
  artworkLink: string;
  notes: string;
};

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error' | 'unavailable';

const initialQuote: StickerQuote = {
  name: '',
  email: '',
  company: '',
  phone: '',
  quantity: '',
  designCount: '',
  width: '',
  height: '',
  unit: 'in',
  sizeUnknown: false,
  shape: 'Recommend a format',
  surface: 'Recommend a direction',
  intendedUse: '',
  targetDate: '',
  artworkStatus: '',
  artworkLink: '',
  notes: '',
};

const formats = [
  { name: 'Die-cut singles', note: 'Individual pieces shaped around the artwork.' },
  { name: 'Sticker sheets', note: 'Multiple designs arranged on one easy-to-share sheet.' },
  { name: 'Labels', note: 'Practical formats for packaging, products, and mailers.' },
  { name: 'Sticker packs', note: 'A grouped set for merch drops, events, and inserts.' },
];

const materials = [
  {
    name: 'Matte',
    note: 'A soft, low-shine direction for an understated finish.',
    image: '/assets/images/stickers-matte-v2.webp',
    alt: 'A matte tiger-head sticker applied to a cream reusable bottle',
  },
  {
    name: 'Gloss',
    note: 'A polished direction with stronger light and color reflection.',
    image: '/assets/images/stickers-gloss-v2.webp',
    alt: 'A glossy rose sticker applied to a black protective case',
  },
  {
    name: 'Clear',
    note: 'A transparent-base direction that lets the surface show through.',
    image: '/assets/images/stickers-clear-v2.webp',
    alt: 'A transparent orange-blossom sticker applied to a glass bottle',
  },
  {
    name: 'Holographic',
    note: 'A reflective direction with a shifting, prismatic surface.',
    image: '/assets/images/stickers-holographic-v2.webp',
    alt: 'A holographic lightning-bolt sticker applied to a black laptop',
  },
  {
    name: 'Recommend one',
    note: 'Share the artwork and intended use and we can help narrow the direction.',
    image: '/assets/images/stickers-hero-v2.webp',
    alt: 'A collection of custom die-cut stickers, sticker sheets, and label rolls',
  },
];

const process = [
  ['01', 'Share the idea', 'Tell us the quantity, size, use, and where the artwork stands.'],
  ['02', 'Review the project', 'The team reviews the request and identifies any details still needed.'],
  ['03', 'Confirm the direction', 'Production details and artwork requirements are confirmed.'],
  ['04', 'Receive the quote', 'Merchcraft sends official pricing and next steps for approval.'],
];

const inputClass = 'w-full bg-transparent py-3 text-base font-semibold outline-none placeholder:text-lab-black/25';

function SelectTile({
  name,
  value,
  label,
  checked,
  onChange,
  required = false,
  ariaInvalid = false,
}: {
  key?: string;
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  required?: boolean;
  ariaInvalid?: boolean;
}) {
  return (
    <label className={`flex min-h-16 cursor-pointer items-center justify-between gap-4 border px-5 py-4 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-lab-red ${checked ? 'border-lab-black bg-lab-black text-white' : 'border-lab-line bg-white hover:border-lab-black/40'}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} required={required} aria-invalid={ariaInvalid} aria-describedby={ariaInvalid ? 'sticker-form-error' : undefined} className="sr-only" />
      <span className="text-sm font-semibold">{label}</span>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${checked ? 'border-lab-gold bg-lab-gold text-lab-black' : 'border-lab-black/25'}`}>
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />}
      </span>
    </label>
  );
}

export default function StickersPage() {
  const pageRef = useRef<HTMLElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const materialImageRef = useRef<HTMLImageElement>(null);
  const quoteHeadingRef = useRef<HTMLHeadingElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [activeMaterial, setActiveMaterial] = useState(materials[materials.length - 1]);
  const [quote, setQuote] = useState<StickerQuote>(initialQuote);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [artworkPreview, setArtworkPreview] = useState('');
  const [validationError, setValidationError] = useState('');
  const [invalidField, setInvalidField] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const stickerQuoteEndpoint = String(import.meta.env.VITE_STICKER_QUOTE_ENDPOINT ?? '').trim();
  const formProvider = String(import.meta.env.VITE_FORM_PROVIDER ?? '').trim().toLowerCase();
  const isNetlifyProvider = formProvider === 'netlify';
  const supportsDirectArtworkUpload = Boolean(stickerQuoteEndpoint) || isNetlifyProvider;

  useLayoutEffect(() => {
    const scope = pageRef.current;
    if (!scope) return;

    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.sticker-hero-copy > *', {
          y: 28,
          autoAlpha: 0,
          duration: 0.85,
          stagger: 0.08,
          ease: 'power3.out',
        });
        gsap.from('.sticker-hero-card', {
          y: 32,
          scale: 0.97,
          autoAlpha: 0,
          duration: 1.05,
          delay: 0.12,
          ease: 'power3.out',
        });
        gsap.from('.sticker-process-card', {
          y: 34,
          autoAlpha: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.sticker-process-grid',
            start: 'top 78%',
            once: true,
          },
        });
      });

      media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
        const card = heroCardRef.current;
        if (!card) return;

        gsap.set(card, { transformPerspective: 900, transformOrigin: '50% 50%' });
        const rotateX = gsap.quickTo(card, 'rotationX', { duration: 0.35, ease: 'power2.out' });
        const rotateY = gsap.quickTo(card, 'rotationY', { duration: 0.35, ease: 'power2.out' });
        let cardRect = card.getBoundingClientRect();

        const measureCard = () => { cardRect = card.getBoundingClientRect(); };
        const moveCard = (event: PointerEvent) => {
          const x = (event.clientX - cardRect.left) / cardRect.width - 0.5;
          const y = (event.clientY - cardRect.top) / cardRect.height - 0.5;
          rotateX(y * -4);
          rotateY(x * 5);
        };
        const resetCard = () => {
          rotateX(0);
          rotateY(0);
        };

        card.addEventListener('pointerenter', measureCard);
        card.addEventListener('pointermove', moveCard);
        card.addEventListener('pointerleave', resetCard);

        const resizeObserver = new ResizeObserver(measureCard);
        resizeObserver.observe(card);

        return () => {
          resizeObserver.disconnect();
          card.removeEventListener('pointerenter', measureCard);
          card.removeEventListener('pointermove', moveCard);
          card.removeEventListener('pointerleave', resetCard);
        };
      });
    }, scope);

    return () => {
      media.revert();
      context.revert();
    };
  }, []);

  useEffect(() => {
    materials.forEach((material) => {
      const image = new Image();
      image.src = material.image;
    });
  }, []);

  useEffect(() => {
    const image = materialImageRef.current;
    if (!image || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tween = gsap.fromTo(
      image,
      { autoAlpha: 0.25, scale: 1.025 },
      { autoAlpha: 1, scale: 1, duration: 0.42, ease: 'power2.out' },
    );
    return () => tween.kill();
  }, [activeMaterial.image]);

  useEffect(() => {
    if (!artworkFile || !artworkFile.type.startsWith('image/')) {
      setArtworkPreview('');
      return;
    }

    const preview = URL.createObjectURL(artworkFile);
    setArtworkPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [artworkFile]);

  useEffect(() => {
    if (status === 'success') requestAnimationFrame(() => successHeadingRef.current?.focus());
  }, [status]);

  const update = <K extends keyof StickerQuote>(key: K, value: StickerQuote[K]) => {
    setQuote((current) => ({ ...current, [key]: value }));
    setValidationError('');
    setInvalidField('');
    if (key === 'surface') {
      const matchingMaterial = materials.find((material) => material.name === String(value)) ?? materials[materials.length - 1];
      setActiveMaterial(matchingMaterial);
    }
    if (status === 'error' || status === 'unavailable') setStatus('idle');
  };

  const chooseMaterial = (material: typeof materials[number]) => {
    update('surface', material.name === 'Recommend one' ? 'Recommend a direction' : material.name);
  };

  const handleArtwork = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file && isNetlifyProvider && file.size > 7 * 1024 * 1024) {
      event.target.value = '';
      setArtworkFile(null);
      setValidationError('Please keep the artwork file under 7 MB for this form, or add a share link instead.');
      return;
    }
    setArtworkFile(file);
    setValidationError('');
  };

  const showValidationError = (field: string, message: string) => {
    setInvalidField(field);
    setValidationError(message);
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus());
    return false;
  };

  const validate = () => {
    if (!quote.name.trim() || !/^\S+@\S+\.\S+$/.test(quote.email)) {
      return showValidationError(!quote.name.trim() ? 'name' : 'email', 'Add your name and a valid email address.');
    }
    if (!quote.quantity || !Number.isInteger(Number(quote.quantity)) || Number(quote.quantity) < 1) {
      return showValidationError('quantity', 'Add an approximate whole-number sticker quantity.');
    }
    if (!quote.sizeUnknown && (!quote.width || !quote.height || Number(quote.width) <= 0 || Number(quote.height) <= 0)) {
      return showValidationError(!quote.width || Number(quote.width) <= 0 ? 'width' : 'height', 'Add the approximate width and height, or choose “I need a size recommendation.”');
    }
    if (!quote.artworkStatus) {
      return showValidationError('artworkStatus', 'Tell us where the artwork stands.');
    }
    setInvalidField('');
    setValidationError('');
    return true;
  };

  const buildFormData = () => {
    const formData = new FormData();
    formData.set('form-name', 'sticker_quote');
    Object.entries(quote).forEach(([key, value]) => formData.set(key, typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)));
    if (artworkFile) formData.set('artwork_file', artworkFile);
    return formData;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const shopifyContactForm = document.querySelector<HTMLFormElement>('#mc-shopify-contact-form');

    setStatus('submitting');
    try {
      if (stickerQuoteEndpoint) {
        const response = await fetch(stickerQuoteEndpoint, { method: 'POST', body: buildFormData() });
        if (!response.ok) throw new Error('Sticker endpoint rejected the request');
      } else if (isNetlifyProvider) {
        const response = await fetch('/', { method: 'POST', body: buildFormData() });
        if (!response.ok) throw new Error('Netlify rejected the request');
      } else if (shopifyContactForm) {
        const contactFields = {
          'contact[name]': quote.name,
          'contact[email]': quote.email,
          'contact[phone]': quote.phone,
          'contact[tags]': 'Sticker quote request',
          'contact[body]': [
          `Company: ${quote.company || 'Not provided'}`,
          `Quantity: ${quote.quantity}`,
          `Number of designs: ${quote.designCount || 'Not provided'}`,
          `Size: ${quote.sizeUnknown ? 'Needs recommendation' : `${quote.width} × ${quote.height} ${quote.unit}`}`,
          `Format: ${quote.shape}`,
          `Surface direction: ${quote.surface}`,
          `Intended use: ${quote.intendedUse || 'Not provided'}`,
          `Desired date: ${quote.targetDate || 'Flexible'}`,
          `Artwork status: ${quote.artworkStatus}`,
          `Artwork link: ${quote.artworkLink || 'Not provided'}`,
          `Notes: ${quote.notes || 'None'}`,
          ].join('\n'),
        };

        Object.entries(contactFields).forEach(([fieldName, value]) => {
          let field = shopifyContactForm.elements.namedItem(fieldName) as HTMLInputElement | HTMLTextAreaElement | null;
          if (!field) {
            field = document.createElement(fieldName === 'contact[body]' ? 'textarea' : 'input');
            field.name = fieldName;
            field.hidden = true;
            shopifyContactForm.appendChild(field);
          }
          field.value = value;
        });

        // Let Shopify process and confirm its own Liquid contact form. A generic
        // HTTP 200 response is not sufficient evidence that the lead was sent.
        shopifyContactForm.requestSubmit();
        return;
      } else {
        setStatus('unavailable');
        return;
      }

      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const resetQuote = () => {
    setQuote(initialQuote);
    setActiveMaterial(materials[materials.length - 1]);
    setArtworkFile(null);
    setStatus('idle');
    setValidationError('');
    setInvalidField('');
  };

  const moveToQuote = () => {
    const heading = quoteHeadingRef.current;
    if (!heading) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const sizeLabel = quote.sizeUnknown
    ? 'Recommend a size'
    : quote.width && quote.height
      ? `${quote.width} × ${quote.height} ${quote.unit}`
      : 'Not set';
  const quantityLabel = quote.shape === 'Sticker sheets'
    ? 'Approximate number of sheets *'
    : quote.shape === 'Sticker packs'
      ? 'Approximate number of packs *'
      : 'Approximate quantity *';
  const sizePrompt = quote.shape === 'Sticker sheets'
    ? 'Approximate overall sheet size *'
    : 'Approximate finished size *';

  return (
    <main ref={pageRef} className="overflow-x-clip bg-white">
      <section className="relative bg-lab-black px-6 pb-16 pt-32 text-white sm:px-8 lg:px-10 lg:pb-24 lg:pt-40">
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/15" />
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div className="sticker-hero-copy relative z-10">
            <p className="font-accent text-sm font-bold uppercase tracking-[0.14em] text-lab-gold">Custom stickers</p>
            <h1 className="mt-7 font-display text-[clamp(4rem,9vw,9rem)] font-bold uppercase leading-[0.84] tracking-tighter">
              Make your<br />brand <span className="font-display normal-case text-lab-gold">stick.</span>
            </h1>
            <p className="mt-9 max-w-xl text-base font-medium leading-relaxed text-white/72 sm:text-lg">
              Custom stickers for packaging, events, merch drops, and more. Share the details and we’ll send an official quote.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a href="#sticker-quote" className="inline-flex min-h-14 items-center gap-4 rounded-full bg-lab-red px-8 font-sans text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-lab-black">
                Build a sticker quote <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href="#materials" className="inline-flex min-h-14 items-center gap-3 rounded-full border border-white/30 px-8 font-sans text-xs font-bold uppercase tracking-widest transition-colors hover:border-white hover:bg-white hover:text-lab-black">
                Explore finishes <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div ref={heroCardRef} className="sticker-hero-card relative overflow-hidden bg-white/5 shadow-[0_30px_90px_rgba(0,0,0,0.35)] will-change-transform">
            <img src="/assets/images/stickers-hero-v2.webp" alt="A studio arrangement of custom die-cut stickers, sticker sheets, and label rolls" className="aspect-[3/2] h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-lab-black/30 via-transparent to-white/5" />
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="font-accent text-sm font-bold uppercase tracking-[0.14em] text-lab-red">Choose a starting point</p>
              <h2 className="mt-6 max-w-4xl font-display text-[clamp(3rem,6vw,6.5rem)] font-bold uppercase tracking-tighter">One idea.<br />More ways to share it.</h2>
            </div>
            <p className="max-w-xl text-base font-medium leading-relaxed text-lab-black/60 lg:justify-self-end">Start with a project format or let the team recommend one after reviewing the artwork, quantity, and intended use. Final availability is confirmed with the quote.</p>
          </div>

          <div className="mt-14 grid border-l border-t border-lab-line sm:grid-cols-2 lg:grid-cols-4">
            {formats.map((format, index) => (
              <article key={format.name} className="group min-h-64 border-b border-r border-lab-line p-7 transition-colors hover:bg-lab-gold sm:p-8">
                <span className="font-impact text-4xl text-lab-gold transition-colors group-hover:text-lab-black">0{index + 1}</span>
                <h3 className="mt-16 font-display text-2xl font-bold uppercase tracking-tight">{format.name}</h3>
                <p className="mt-4 text-sm font-medium leading-relaxed text-lab-black/58">{format.note}</p>
                <button type="button" onClick={() => { update('shape', format.name); moveToQuote(); }} className="mt-7 inline-flex min-h-11 items-center gap-2 font-sans text-[11px] font-bold uppercase tracking-widest opacity-55 transition-opacity hover:opacity-100">
                  Add to request <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <StickerSplineScene />

      <section id="materials" className="scroll-mt-24 bg-lab-black px-6 py-20 text-white sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="font-accent text-sm font-bold uppercase tracking-[0.14em] text-lab-gold">Sticker finishes</p>
            <h2 className="mt-6 font-display text-[clamp(3.2rem,6vw,6.5rem)] font-bold uppercase tracking-tighter">Compare the<br />finish.</h2>
            <p className="mt-7 max-w-xl text-base font-medium leading-relaxed text-white/68">Choose a finish to see it on a real product, then include that direction in your request. Final availability and the best production approach will be confirmed with the official quote.</p>

            <div className="mt-10 grid grid-cols-2 gap-2 sm:max-w-xl">
              {materials.map((material) => (
                <button
                  key={material.name}
                  type="button"
                  aria-pressed={activeMaterial.name === material.name}
                  onClick={() => chooseMaterial(material)}
                  className={`min-h-14 border px-4 text-left font-sans text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${material.name === 'Recommend one' ? 'col-span-2' : ''} ${activeMaterial.name === material.name ? 'border-lab-gold bg-lab-gold text-lab-black' : 'border-white/18 text-white/68 hover:border-white/55 hover:text-white'}`}
                >
                  {material.name}
                </button>
              ))}
            </div>

            <div className="mt-8 border-l-2 border-lab-gold pl-5" aria-live="polite">
              <p className="font-display text-xl font-bold uppercase">{activeMaterial.name}</p>
              <p className="mt-2 max-w-lg text-sm font-medium leading-relaxed text-white/62">{activeMaterial.note}</p>
            </div>
          </div>

          <div className="overflow-hidden bg-white/5">
            <img
              ref={materialImageRef}
              src={activeMaterial.image}
              alt={activeMaterial.alt}
              loading="lazy"
              className="aspect-[3/2] h-full w-full object-cover will-change-[transform,opacity]"
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="font-accent text-sm font-bold uppercase tracking-[0.14em] text-lab-red">How it works</p>
              <h2 className="mt-6 font-display text-[clamp(3.2rem,6vw,6.5rem)] font-bold uppercase tracking-tighter">From idea to<br />official quote.</h2>
            </div>
            <div className="overflow-hidden">
              <img src="/assets/images/stickers-process-v2.webp" alt="Hands comparing a sticker proof with a finished die-cut sample at a workbench" loading="lazy" className="aspect-[16/9] h-full w-full object-cover" />
            </div>
          </div>

          <div className="sticker-process-grid mt-12 grid border-l border-t border-lab-line md:grid-cols-2 lg:grid-cols-4">
            {process.map(([number, title, copy]) => (
              <article key={number} className="sticker-process-card min-h-64 border-b border-r border-lab-line p-7 sm:p-8">
                <span className="font-impact text-4xl text-lab-gold">{number}</span>
                <h3 className="mt-14 font-display text-xl font-bold uppercase tracking-tight">{title}</h3>
                <p className="mt-4 text-sm font-medium leading-relaxed text-lab-black/58">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="sticker-quote" className="scroll-mt-20 bg-lab-white px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 grid gap-8 border-b border-lab-line pb-10 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="font-accent text-sm font-bold uppercase tracking-[0.14em] text-lab-red">Sticker quote request</p>
              <h2 ref={quoteHeadingRef} tabIndex={-1} className="mt-6 font-display text-[clamp(3.2rem,6vw,6.5rem)] font-bold uppercase tracking-tighter outline-none">Tell us what<br />you want to make.</h2>
            </div>
            <p className="max-w-xl text-base font-medium leading-relaxed text-lab-black/60 lg:justify-self-end">Share what you know. If a detail is still open, choose a recommendation option and the team can help narrow it down.</p>
          </div>

          {status === 'success' ? (
            <div className="grid overflow-hidden border border-lab-line bg-white lg:grid-cols-[1fr_0.72fr]">
              <div className="p-8 sm:p-12 lg:p-16">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lab-gold text-lab-black"><Check className="h-6 w-6" strokeWidth={3} aria-hidden="true" /></span>
                <p className="mt-8 font-accent text-sm font-bold uppercase tracking-[0.14em] text-lab-red">Request received</p>
                <h3 ref={successHeadingRef} tabIndex={-1} className="mt-5 font-display text-4xl font-bold uppercase tracking-tighter outline-none sm:text-6xl">Thanks. We’ll take it from here.</h3>
                <p className="mt-6 max-w-2xl text-base font-medium leading-relaxed text-lab-black/60">Merchcraft will review the details and follow up with the official quote and next steps. Your submission is not final pricing or production approval.</p>
                <button type="button" onClick={resetQuote} className="mt-9 rounded-full bg-lab-black px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-lab-red">Start another request</button>
              </div>
              <img src="/assets/images/stickers-process-v2.webp" alt="" className="hidden h-full w-full object-cover lg:block" />
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
              <form ref={formRef} name="sticker_quote" method="POST" data-netlify="true" netlify-honeypot="bot-field" encType="multipart/form-data" noValidate onSubmit={handleSubmit} className="border border-lab-line bg-white p-6 sm:p-10 lg:p-12">
                <input type="hidden" name="form-name" value="sticker_quote" />
                <p className="hidden"><label>Do not fill this out: <input name="bot-field" /></label></p>

                <fieldset>
                  <legend className="font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">01 / Contact</legend>
                  <div className="mt-8 grid gap-x-8 gap-y-9 sm:grid-cols-2">
                    <label className="field-line block border-b border-lab-line pb-2">
                      <span className="mb-2 block text-sm font-semibold text-lab-black/58">Full name *</span>
                      <input name="name" required aria-invalid={invalidField === 'name'} aria-describedby={invalidField === 'name' ? 'sticker-form-error' : undefined} value={quote.name} onChange={(event) => update('name', event.target.value)} autoComplete="name" className={inputClass} placeholder="Your name" />
                    </label>
                    <label className="field-line block border-b border-lab-line pb-2">
                      <span className="mb-2 block text-sm font-semibold text-lab-black/58">Email *</span>
                      <input name="email" type="email" required aria-invalid={invalidField === 'email'} aria-describedby={invalidField === 'email' ? 'sticker-form-error' : undefined} value={quote.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" className={inputClass} placeholder="you@company.com" />
                    </label>
                    <label className="field-line block border-b border-lab-line pb-2">
                      <span className="mb-2 block text-sm font-semibold text-lab-black/58">Company</span>
                      <input name="company" value={quote.company} onChange={(event) => update('company', event.target.value)} autoComplete="organization" className={inputClass} placeholder="Brand or organization" />
                    </label>
                    <label className="field-line block border-b border-lab-line pb-2">
                      <span className="mb-2 block text-sm font-semibold text-lab-black/58">Phone</span>
                      <input name="phone" type="tel" value={quote.phone} onChange={(event) => update('phone', event.target.value)} autoComplete="tel" className={inputClass} placeholder="Optional" />
                    </label>
                  </div>
                </fieldset>

                <fieldset className="mt-14 border-t border-lab-line pt-10">
                  <legend className="font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">02 / Project details</legend>
                  <div className="mt-8 grid gap-x-8 gap-y-9 sm:grid-cols-2">
                    <label className="field-line block border-b border-lab-line pb-2">
                      <span className="mb-2 block text-sm font-semibold text-lab-black/58">{quantityLabel}</span>
                      <input name="quantity" type="number" min="1" step="1" required aria-invalid={invalidField === 'quantity'} aria-describedby={invalidField === 'quantity' ? 'sticker-form-error' : undefined} inputMode="numeric" value={quote.quantity} onChange={(event) => update('quantity', event.target.value)} className={inputClass} placeholder="e.g. 250" />
                    </label>
                    <label className="field-line block border-b border-lab-line pb-2">
                      <span className="mb-2 block text-sm font-semibold text-lab-black/58">Desired date</span>
                      <input name="targetDate" type="date" value={quote.targetDate} onChange={(event) => update('targetDate', event.target.value)} className={inputClass} />
                    </label>

                    <label className="field-line block border-b border-lab-line pb-2">
                      <span className="mb-2 block text-sm font-semibold text-lab-black/58">Unique designs</span>
                      <input name="designCount" type="number" min="1" inputMode="numeric" value={quote.designCount} onChange={(event) => update('designCount', event.target.value)} className={inputClass} placeholder="e.g. 1" />
                    </label>

                    <div className="sm:col-span-2">
                      <span className="mb-4 block text-sm font-semibold text-lab-black/58">{sizePrompt}</span>
                      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_0.72fr]">
                        <label className="border border-lab-line p-4">
                          <span className="block text-xs font-semibold text-lab-black/45">Width</span>
                          <input name="width" type="number" min="0" step="0.125" inputMode="decimal" disabled={quote.sizeUnknown} required={!quote.sizeUnknown} aria-invalid={invalidField === 'width'} aria-describedby={invalidField === 'width' ? 'sticker-form-error' : undefined} value={quote.width} onChange={(event) => update('width', event.target.value)} className={`${inputClass} disabled:opacity-30`} placeholder="3" />
                        </label>
                        <label className="border border-lab-line p-4">
                          <span className="block text-xs font-semibold text-lab-black/45">Height</span>
                          <input name="height" type="number" min="0" step="0.125" inputMode="decimal" disabled={quote.sizeUnknown} required={!quote.sizeUnknown} aria-invalid={invalidField === 'height'} aria-describedby={invalidField === 'height' ? 'sticker-form-error' : undefined} value={quote.height} onChange={(event) => update('height', event.target.value)} className={`${inputClass} disabled:opacity-30`} placeholder="3" />
                        </label>
                        <label className="border border-lab-line p-4">
                          <span className="block text-xs font-semibold text-lab-black/45">Unit</span>
                          <select name="unit" disabled={quote.sizeUnknown} value={quote.unit} onChange={(event) => update('unit', event.target.value as 'in' | 'mm')} className={`${inputClass} cursor-pointer disabled:opacity-30`}>
                            <option value="in">Inches</option>
                            <option value="mm">Millimeters</option>
                          </select>
                        </label>
                      </div>
                      <label className="mt-3 flex min-h-12 cursor-pointer items-center gap-3 text-sm font-semibold text-lab-black/62">
                        <input name="sizeUnknown" type="checkbox" checked={quote.sizeUnknown} onChange={(event) => update('sizeUnknown', event.target.checked)} className="h-5 w-5 accent-lab-red" />
                        I need a size recommendation
                      </label>
                    </div>

                    <fieldset className="sm:col-span-2">
                      <legend className="mb-4 text-sm font-semibold text-lab-black/58">Shape or format</legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {['Die-cut singles', 'Sticker sheets', 'Labels', 'Sticker packs', 'Circle / square / rectangle', 'Recommend a format'].map((item) => (
                          <SelectTile key={item} name="shape" value={item} label={item} checked={quote.shape === item} onChange={() => update('shape', item)} />
                        ))}
                      </div>
                    </fieldset>

                    <fieldset className="sm:col-span-2">
                      <legend className="mb-4 text-sm font-semibold text-lab-black/58">Surface direction</legend>
                      <p className="mb-4 text-xs font-medium leading-relaxed text-lab-black/48">A visual preference only. Merchcraft will confirm the available stock and production finish with the official quote.</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {['Matte', 'Gloss', 'Clear', 'Holographic', 'Recommend a direction'].map((item) => (
                          <div key={item} className={item === 'Recommend a direction' ? 'sm:col-span-2' : ''}>
                            <SelectTile name="surface" value={item} label={item} checked={quote.surface === item} onChange={() => update('surface', item)} />
                          </div>
                        ))}
                      </div>
                    </fieldset>

                    <label className="field-line block border-b border-lab-line pb-2 sm:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-lab-black/58">Intended use or surface</span>
                      <input name="intendedUse" value={quote.intendedUse} onChange={(event) => update('intendedUse', event.target.value)} className={inputClass} placeholder="Packaging, event, product…" />
                    </label>
                  </div>
                </fieldset>

                <fieldset className="mt-14 border-t border-lab-line pt-10">
                  <legend className="font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">03 / Artwork</legend>
                  <fieldset className="mt-8">
                    <legend className="mb-4 text-sm font-semibold text-lab-black/58">Artwork status *</legend>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {['Ready to review', 'Still developing', 'I need guidance'].map((item) => (
                        <SelectTile key={item} name="artworkStatus" value={item} label={item} checked={quote.artworkStatus === item} onChange={() => update('artworkStatus', item)} required ariaInvalid={invalidField === 'artworkStatus'} />
                      ))}
                    </div>
                  </fieldset>

                  <label className="field-line mt-9 block border-b border-lab-line pb-2">
                    <span className="mb-2 block text-sm font-semibold text-lab-black/58">Artwork share link</span>
                    <input name="artworkLink" type="url" value={quote.artworkLink} onChange={(event) => update('artworkLink', event.target.value)} className={inputClass} placeholder="Google Drive, Dropbox, WeTransfer…" />
                    <span className="mt-2 block text-xs font-medium leading-relaxed text-lab-black/45">A share link works on every preview and is the safest option for production files.</span>
                  </label>

                  <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.72fr]">
                    <label className={`group flex min-h-40 items-center gap-5 border border-dashed border-lab-black/25 p-5 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-lab-red ${supportsDirectArtworkUpload ? 'cursor-pointer hover:border-lab-red' : 'cursor-not-allowed bg-lab-white opacity-65'}`}>
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lab-white"><FileUp className="h-5 w-5 text-lab-red" aria-hidden="true" /></span>
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-semibold">{artworkFile ? artworkFile.name : 'Upload available artwork'}</span>
                        <span className="mt-2 block text-xs font-medium leading-relaxed text-lab-black/45">
                          {supportsDirectArtworkUpload
                            ? `Optional production file or reference image.${isNetlifyProvider ? ' Maximum 7 MB.' : ''}`
                            : 'Direct upload activates when the form delivery endpoint is connected. Use a share link for this preview.'}
                        </span>
                      </span>
                      <input name="artwork_file" type="file" disabled={!supportsDirectArtworkUpload} accept=".ai,.eps,.svg,.pdf,.png,.jpg,.jpeg,.webp,.zip" onChange={handleArtwork} className="sr-only" />
                    </label>
                    <div className="relative min-h-40 overflow-hidden bg-lab-black">
                      {artworkPreview ? (
                        <img src={artworkPreview} alt="Temporary preview of the selected artwork" className="absolute inset-0 h-full w-full object-contain p-5" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white/55">
                          <Sparkles className="h-5 w-5 text-lab-gold" aria-hidden="true" />
                          <span className="mt-3 font-accent text-[10px] font-bold uppercase tracking-[0.13em]">Image preview appears here</span>
                        </div>
                      )}
                      <span className="absolute bottom-3 left-3 bg-white px-3 py-1.5 font-accent text-[9px] font-bold uppercase tracking-[0.12em] text-lab-black">Approximate preview</span>
                    </div>
                  </div>

                  <div className="mt-9 grid gap-x-8 gap-y-9">
                    <label className="field-line block border-b border-lab-line pb-2">
                      <span className="mb-2 block text-sm font-semibold text-lab-black/58">Notes</span>
                      <textarea name="notes" value={quote.notes} onChange={(event) => update('notes', event.target.value)} rows={5} className={`${inputClass} resize-y leading-relaxed`} placeholder="Colors, surface, packaging needs, references, or anything else that will help." />
                    </label>
                  </div>
                </fieldset>

                <div aria-live="polite" className="mt-8 min-h-12">
                  {validationError && <p id="sticker-form-error" role="alert" className="text-sm font-semibold leading-relaxed text-lab-red">{validationError}</p>}
                  {status === 'error' && <p className="text-sm font-semibold leading-relaxed text-lab-red">We couldn’t deliver the request. Please email the details to shop@merchcraft.com.</p>}
                  {status === 'unavailable' && <p className="text-sm font-semibold leading-relaxed text-lab-red">The sticker form is ready, but its delivery endpoint has not been connected on this preview yet. Email the request for now, or connect the production form endpoint before launch.</p>}
                </div>

                <div className="mt-5 flex flex-col gap-5 border-t border-lab-line pt-8 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-xl text-xs font-medium leading-relaxed text-lab-black/48">Merchcraft will use these details to respond to your request. Submitting does not confirm pricing, availability, or production.</p>
                  <button disabled={status === 'submitting'} type="submit" className="group inline-flex min-h-14 shrink-0 items-center justify-center gap-4 rounded-full bg-lab-red px-8 font-sans text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-lab-black disabled:cursor-wait disabled:opacity-55">
                    {status === 'submitting' ? 'Sending…' : 'Request sticker quote'} <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </button>
                </div>

                {status === 'unavailable' && (
                  <a href="mailto:shop@merchcraft.com?subject=Sticker%20quote%20request" className="mt-5 inline-flex min-h-12 items-center gap-3 font-sans text-xs font-bold uppercase tracking-widest text-lab-red">
                    <Mail className="h-4 w-4" aria-hidden="true" /> Email the request
                  </a>
                )}
              </form>

              <aside className="lg:sticky lg:top-28">
                <div className="bg-lab-black p-7 text-white sm:p-8">
                  <p className="font-accent text-[11px] font-bold uppercase tracking-[0.14em] text-lab-gold">Request summary</p>
                  <h3 className="mt-5 font-display text-3xl font-bold uppercase tracking-tight">Your sticker brief</h3>
                  <dl className="mt-7">
                    {[
                      ['Quantity', quote.quantity || 'Not set'],
                      ['Designs', quote.designCount || 'Not set'],
                      ['Size', sizeLabel],
                      ['Format', quote.shape],
                      ['Surface', quote.surface],
                      ['Artwork', quote.artworkStatus || 'Not set'],
                    ].map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[82px_1fr] gap-4 border-b border-white/14 py-4">
                        <dt className="text-xs font-semibold text-white/45">{label}</dt>
                        <dd className="text-xs font-semibold leading-relaxed text-white/78">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-6 text-xs font-medium leading-relaxed text-white/48">A working summary only. Final specifications and pricing are confirmed by Merchcraft.</p>
                </div>
                <div className="mt-4 border border-lab-line bg-white p-7 sm:p-8">
                  <h3 className="font-display text-xl font-bold uppercase tracking-tight">Not sure about a detail?</h3>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-lab-black/55">Choose a recommendation option or describe the intended use in your notes.</p>
                  <Link to="/contact" className="mt-6 inline-flex items-center gap-3 font-sans text-[11px] font-bold uppercase tracking-widest text-lab-red">Talk to the team <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      <section className="bg-lab-gold px-6 py-20 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-accent text-sm font-bold uppercase tracking-[0.14em] text-lab-black/55">Need apparel too?</p>
            <h2 className="mt-5 max-w-4xl font-display text-[clamp(3rem,6vw,6rem)] font-bold uppercase tracking-tighter">Build the full<br />merch program.</h2>
          </div>
          <Link to="/services" className="inline-flex min-h-14 items-center gap-4 self-start rounded-full bg-lab-black px-8 font-sans text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-lab-red lg:self-auto">Explore apparel services <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </section>
    </main>
  );
}
