import { type FormEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, FileUp, Send } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

type QuoteData = {
  projectType: string;
  products: string[];
  methods: string[];
  quantity: string;
  targetDate: string;
  artworkStatus: string;
  notes: string;
  name: string;
  company: string;
  email: string;
  phone: string;
};

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

const initialData: QuoteData = {
  projectType: '',
  products: [],
  methods: [],
  quantity: '',
  targetDate: '',
  artworkStatus: '',
  notes: '',
  name: '',
  company: '',
  email: '',
  phone: '',
};

const steps = [
  { title: 'Project', note: 'What are you making?' },
  { title: 'Decoration', note: 'How would you like it decorated?' },
  { title: 'Details', note: 'Quantity, timing, and artwork' },
  { title: 'Contact', note: 'How can we reach you?' },
];

const serviceMap: Record<string, string> = {
  'screen-printing': 'Screen printing',
  'dtg-dtf': 'DTG and DTF',
  embroidery: 'Embroidery',
  finishing: 'Labels and retail finishing',
  fulfillment: 'Fulfillment and program support',
};

function ChoiceCard({
  type,
  name,
  value,
  label,
  checked,
  onChange,
}: {
  key?: string;
  type: 'radio' | 'checkbox';
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className={`group flex min-h-[84px] cursor-pointer items-center justify-between rounded-sm border p-5 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-lab-red ${checked ? 'border-lab-black bg-lab-black text-white' : 'border-lab-line bg-white hover:border-lab-black/45'}`}>
      <input type={type} name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span className="max-w-[85%] text-sm font-semibold">{label}</span>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center ${type === 'radio' ? 'rounded-full' : ''} border ${checked ? 'border-lab-gold bg-lab-gold text-lab-black' : 'border-lab-black/25'}`}>
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />}
      </span>
    </label>
  );
}

export default function QuotePage() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<QuoteData>(initialData);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const progressNavRef = useRef<HTMLElement>(null);
  const progressButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const requestedService = searchParams.get('service');
    const mappedService = requestedService ? serviceMap[requestedService] : undefined;
    if (mappedService) {
      setData((current) => ({ ...current, methods: current.methods.includes(mappedService) ? current.methods : [...current.methods, mappedService] }));
    }
  }, [searchParams]);

  useEffect(() => {
    const focusTimer = window.setTimeout(() => {
      if (step > 0) stepHeadingRef.current?.focus();
    }, 280);
    const nav = progressNavRef.current;
    const activeButton = progressButtonRefs.current[step];
    if (!nav || !activeButton) return () => window.clearTimeout(focusTimer);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const left = activeButton.offsetLeft - (nav.clientWidth - activeButton.offsetWidth) / 2;
    nav.scrollTo({ left: Math.max(0, left), behavior: reducedMotion ? 'auto' : 'smooth' });
    return () => window.clearTimeout(focusTimer);
  }, [step]);

  useEffect(() => {
    if (status === 'success') requestAnimationFrame(() => successHeadingRef.current?.focus());
  }, [status]);

  const update = <K extends keyof QuoteData>(key: K, value: QuoteData[K]) => {
    setData((current) => ({ ...current, [key]: value }));
    setValidationError('');
  };

  const toggleList = (key: 'products' | 'methods', value: string) => {
    const current = data[key];
    update(key, current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const validateStep = (stepIndex: number) => {
    if (stepIndex === 0 && (!data.projectType || data.products.length === 0)) {
      setValidationError('Choose a project type and at least one product direction.');
      return false;
    }
    if (stepIndex === 1 && data.methods.length === 0) {
      setValidationError('Choose at least one decoration or finishing option. “Not sure” is completely fine.');
      return false;
    }
    if (stepIndex === 2 && (!data.quantity || !data.artworkStatus)) {
      setValidationError('Choose an approximate quantity and tell us where the artwork stands.');
      return false;
    }
    if (stepIndex === 3 && (!data.name || !data.email || !/^\S+@\S+\.\S+$/.test(data.email))) {
      setValidationError('Add your name and a valid email address so the team can follow up.');
      return false;
    }
    setValidationError('');
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateStep(3)) return;

    const formData = new FormData();
    formData.set('form-name', 'quote');
    formData.set('project_type', data.projectType);
    formData.set('products', data.products.join(', '));
    formData.set('methods', data.methods.join(', '));
    formData.set('quantity', data.quantity);
    formData.set('target_date', data.targetDate);
    formData.set('artwork_status', data.artworkStatus);
    formData.set('notes', data.notes);
    formData.set('name', data.name);
    formData.set('company', data.company);
    formData.set('email', data.email);
    formData.set('phone', data.phone);
    if (artworkFile) formData.set('artwork_file', artworkFile);

    setStatus('submitting');
    try {
      const response = await fetch('/', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Submission failed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <main className="flex min-h-screen items-center bg-lab-gold px-6 pb-20 pt-36 sm:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-5xl text-center">
          <span role="status" className="sr-only">Quote request received successfully.</span>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lab-black text-white"><Check className="h-7 w-7" strokeWidth={3} aria-hidden="true" /></span>
          <p className="mt-8 font-accent text-sm font-bold uppercase tracking-[0.14em] text-lab-black/55">Request received</p>
          <h1 ref={successHeadingRef} tabIndex={-1} className="mt-6 font-display text-[clamp(4rem,10vw,9rem)] font-bold uppercase leading-[0.84] tracking-tighter">Thanks for<br />your request.</h1>
          <p className="mx-auto mt-8 max-w-2xl text-base font-semibold leading-relaxed text-lab-black/65">We’ll review the details and follow up with recommendations, pricing, and next steps. This is a project request, not a final quote.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/" className="rounded-full bg-lab-black px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest text-white">Back to home</Link>
            <button type="button" onClick={() => { setStatus('idle'); setStep(0); setData(initialData); setArtworkFile(null); }} className="rounded-full border border-lab-black/25 px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest">Start another request</button>
          </div>
        </div>
      </main>
    );
  }

  const summaryRows = [
    ['Project', data.projectType || 'Not set'],
    ['Products', data.products.length ? data.products.join(', ') : 'Not set'],
    ['Decoration', data.methods.length ? data.methods.join(', ') : 'Not set'],
    ['Quantity', data.quantity || 'Not set'],
    ['Target', data.targetDate || 'Flexible'],
    ['Contact', data.name || 'Not set'],
  ];

  const Summary = () => (
    <div className="border border-lab-line bg-white p-6 sm:p-8">
      <h3 className="font-display text-2xl font-bold uppercase tracking-tighter">Project summary</h3>
      <dl className="mt-5">
        {summaryRows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[88px_1fr] gap-4 border-b border-lab-line py-4">
            <dt className="text-xs font-semibold text-lab-black/40">{label}</dt>
            <dd className="text-xs font-semibold leading-relaxed text-lab-black/72">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-xs font-medium leading-relaxed text-lab-black/45">This is a request summary, not a final quote or production approval.</p>
    </div>
  );

  return (
    <main className="overflow-hidden bg-white">
      <section className="bg-lab-black px-6 pb-16 pt-32 text-white sm:px-8 lg:px-10 lg:pb-24 lg:pt-40">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-8 lg:gap-12">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <p className="font-accent text-sm font-bold uppercase tracking-[0.14em] text-lab-gold">Request a quote</p>
            <h1 className="mt-7 font-display text-[clamp(4rem,8vw,8.5rem)] font-bold uppercase leading-[0.84] tracking-tighter">Tell us what<br />you’re <span className="font-display normal-case text-lab-gold">making.</span></h1>
            <p className="mt-9 max-w-xl text-base font-medium leading-relaxed text-white/65 sm:text-lg">Share a few project details and we’ll follow up with recommendations, pricing, and next steps.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 1.035 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
            <img src="/assets/images/quote-hero-v3.webp" alt="A custom-apparel build kit with garments, cap, tote, thread, and material swatches" className="aspect-[4/3] h-full w-full object-cover object-center" />
          </motion.div>
        </div>
      </section>

      <section className="bg-lab-white px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 border-b border-lab-line">
            <div className="h-1 bg-lab-line"><motion.div animate={{ width: `${((step + 1) / steps.length) * 100}%` }} transition={{ duration: 0.3 }} className="h-full bg-lab-red" /></div>
            <nav ref={progressNavRef} aria-label="Quote progress" className="no-scrollbar flex overflow-x-auto">
              {steps.map((item, index) => (
                <button
                  ref={(element) => { progressButtonRefs.current[index] = element; }}
                  key={item.title}
                  type="button"
                  disabled={index > step}
                  aria-current={index === step ? 'step' : undefined}
                  onClick={() => index < step && setStep(index)}
                  className={`min-w-[180px] flex-1 border-r border-lab-line px-5 py-5 text-left last:border-r-0 ${index === step ? 'bg-lab-black text-white' : index < step ? 'bg-white text-lab-black' : 'cursor-not-allowed text-lab-black/35'}`}
                >
                  <span className="block text-xs font-semibold opacity-50">{index + 1}</span>
                  <span className="mt-1 block font-sans text-xs font-bold uppercase tracking-[0.1em]">{item.title}</span>
                </button>
              ))}
            </nav>
          </div>

          <details className="mb-6 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between border border-lab-line bg-white p-5 font-sans text-xs font-bold uppercase tracking-widest">
              View project summary <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </summary>
            <Summary />
          </details>

          <div className="grid gap-8 lg:grid-cols-[1.32fr_0.68fr] lg:items-start">
            <form name="quote" method="POST" data-netlify="true" netlify-honeypot="bot-field" encType="multipart/form-data" onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 lg:p-12">
              <input type="hidden" name="form-name" value="quote" />
              <p className="hidden"><label>Do not fill this out: <input name="bot-field" /></label></p>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <div className="mb-10 border-b border-lab-line pb-7">
                    <p className="text-sm font-semibold text-lab-red">Step {step + 1} of {steps.length}</p>
                    <h2 ref={stepHeadingRef} tabIndex={-1} className="mt-3 font-display text-3xl font-bold uppercase tracking-tighter outline-none sm:text-5xl">{steps[step].note}</h2>
                  </div>

                  {step === 0 && (
                    <div>
                      <fieldset>
                        <legend className="mb-4 text-sm font-semibold text-lab-black/55">Project type *</legend>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {['Brand merch', 'Event or campaign', 'Team or workwear', 'Retail product', 'Ongoing program', 'Other or not sure'].map((item) => (
                            <ChoiceCard key={item} type="radio" name="project_type" value={item} label={item} checked={data.projectType === item} onChange={() => update('projectType', item)} />
                          ))}
                        </div>
                      </fieldset>
                      <fieldset className="mt-10">
                        <legend className="mb-4 text-sm font-semibold text-lab-black/55">Product direction *</legend>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {['T-shirts', 'Fleece', 'Headwear', 'Outerwear', 'Totes and accessories', 'Not sure yet'].map((item) => (
                            <ChoiceCard key={item} type="checkbox" name="products" value={item} label={item} checked={data.products.includes(item)} onChange={() => toggleList('products', item)} />
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  )}

                  {step === 1 && (
                    <fieldset>
                      <legend className="mb-4 text-sm font-semibold text-lab-black/55">Decoration and finishing *</legend>
                      <p className="mb-7 max-w-2xl text-sm font-medium leading-relaxed text-lab-black/55">Choose everything you are considering. We can narrow the options after reviewing the artwork, garment, quantity, and desired feel.</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {['Screen printing', 'DTG and DTF', 'Embroidery', 'Sewing and patches', 'Labels and retail finishing', 'Fulfillment and program support', 'Live event production', 'Not sure — recommend a method'].map((item) => (
                          <ChoiceCard key={item} type="checkbox" name="methods" value={item} label={item} checked={data.methods.includes(item)} onChange={() => toggleList('methods', item)} />
                        ))}
                      </div>
                    </fieldset>
                  )}

                  {step === 2 && (
                    <fieldset className="grid gap-x-8 gap-y-9 sm:grid-cols-2">
                      <label className="field-line block border-b border-lab-line pb-2">
                        <span className="mb-3 block text-sm font-semibold text-lab-black/55">Approximate quantity *</span>
                        <select value={data.quantity} onChange={(event) => update('quantity', event.target.value)} className="w-full cursor-pointer bg-transparent py-3 text-base font-semibold outline-none">
                          <option value="">Select a range</option>
                          <option>Under 50</option><option>50–99</option><option>100–249</option><option>250–499</option><option>500+</option><option>Not sure yet</option>
                        </select>
                      </label>
                      <label className="field-line block border-b border-lab-line pb-2">
                        <span className="mb-3 block text-sm font-semibold text-lab-black/55">Desired delivery date</span>
                        <input type="date" value={data.targetDate} onChange={(event) => update('targetDate', event.target.value)} className="w-full bg-transparent py-3 text-base font-semibold outline-none" />
                      </label>

                      <div className="sm:col-span-2">
                        <span className="mb-4 block text-sm font-semibold text-lab-black/55">Artwork status *</span>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {['Production-ready', 'Needs review', 'Still developing'].map((item) => (
                            <ChoiceCard key={item} type="radio" name="artwork_status" value={item} label={item} checked={data.artworkStatus === item} onChange={() => update('artworkStatus', item)} />
                          ))}
                        </div>
                      </div>

                      <label className="group flex min-h-[130px] cursor-pointer items-center gap-5 border border-dashed border-lab-black/25 p-5 transition-colors hover:border-lab-red focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-lab-red sm:col-span-2">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lab-white"><FileUp className="h-5 w-5 text-lab-red" aria-hidden="true" /></span>
                        <span>
                          <span className="block text-sm font-semibold">{artworkFile ? artworkFile.name : 'Attach available artwork'}</span>
                          <span className="mt-2 block text-xs font-medium text-lab-black/45">Optional. Vector files, PDF proofs, or reference images are helpful.</span>
                        </span>
                        <input type="file" accept=".ai,.eps,.svg,.pdf,.png,.jpg,.jpeg,.zip" onChange={(event) => setArtworkFile(event.target.files?.[0] ?? null)} className="sr-only" />
                      </label>

                      <label className="field-line block border-b border-lab-line pb-2 sm:col-span-2">
                        <span className="mb-3 block text-sm font-semibold text-lab-black/55">Anything else we should know?</span>
                        <textarea value={data.notes} onChange={(event) => update('notes', event.target.value)} rows={5} className="w-full resize-y bg-transparent py-3 text-base font-semibold leading-relaxed outline-none placeholder:text-lab-black/25" placeholder="Colors, placements, garment references, delivery needs, or links." />
                      </label>
                    </fieldset>
                  )}

                  {step === 3 && (
                    <fieldset className="grid gap-x-8 gap-y-9 sm:grid-cols-2">
                      <label className="field-line block border-b border-lab-line pb-2">
                        <span className="mb-3 block text-sm font-semibold text-lab-black/55">Full name *</span>
                        <input value={data.name} onChange={(event) => update('name', event.target.value)} autoComplete="name" className="w-full bg-transparent py-3 text-base font-semibold outline-none placeholder:text-lab-black/25" placeholder="Your name" />
                      </label>
                      <label className="field-line block border-b border-lab-line pb-2">
                        <span className="mb-3 block text-sm font-semibold text-lab-black/55">Company</span>
                        <input value={data.company} onChange={(event) => update('company', event.target.value)} autoComplete="organization" className="w-full bg-transparent py-3 text-base font-semibold outline-none placeholder:text-lab-black/25" placeholder="Brand or organization" />
                      </label>
                      <label className="field-line block border-b border-lab-line pb-2">
                        <span className="mb-3 block text-sm font-semibold text-lab-black/55">Email *</span>
                        <input type="email" value={data.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" className="w-full bg-transparent py-3 text-base font-semibold outline-none placeholder:text-lab-black/25" placeholder="you@company.com" />
                      </label>
                      <label className="field-line block border-b border-lab-line pb-2">
                        <span className="mb-3 block text-sm font-semibold text-lab-black/55">Phone</span>
                        <input type="tel" value={data.phone} onChange={(event) => update('phone', event.target.value)} autoComplete="tel" className="w-full bg-transparent py-3 text-base font-semibold outline-none placeholder:text-lab-black/25" placeholder="Optional" />
                      </label>
                      <div className="border border-lab-line bg-lab-white p-6 sm:col-span-2">
                        <h3 className="font-display text-xl font-bold uppercase tracking-tighter">Before you send</h3>
                        <p className="mt-3 text-sm font-medium leading-relaxed text-lab-black/55">This submits a project request for review. It is not a final quote, production approval, or guaranteed delivery date.</p>
                      </div>
                    </fieldset>
                  )}
                </motion.div>
              </AnimatePresence>

              <div aria-live="polite" className="mt-8 min-h-7">
                {validationError && <p className="text-sm font-semibold text-lab-red">{validationError}</p>}
                {status === 'error' && <p className="text-sm font-semibold text-lab-red">We couldn’t send your request. Please email the project details to shop@merchcraft.com.</p>}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-lab-line pt-8">
                <button type="button" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} className="inline-flex min-h-12 items-center gap-3 text-xs font-bold uppercase tracking-widest disabled:invisible">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
                </button>
                {step < steps.length - 1 ? (
                  <button type="button" onClick={goNext} className="group inline-flex min-h-14 items-center gap-5 rounded-full bg-lab-red px-8 font-sans text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-lab-black">
                    Next <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </button>
                ) : (
                  <button disabled={status === 'submitting'} type="submit" className="group inline-flex min-h-14 items-center gap-5 rounded-full bg-lab-red px-8 font-sans text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-lab-black disabled:cursor-wait disabled:opacity-60">
                    {status === 'submitting' ? 'Sending…' : 'Request quote'} <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </button>
                )}
              </div>
            </form>

            <aside className="sticky top-24 hidden lg:block">
              <Summary />
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
