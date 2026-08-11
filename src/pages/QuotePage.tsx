import { type FormEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, FileUp, FlaskConical, Send } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { LabLabel, PageIntro, RegistrationMarks } from '../components/LabUI';

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
  { index: '01', title: 'Project', note: 'What are we building?' },
  { index: '02', title: 'Method', note: 'How should it come to life?' },
  { index: '03', title: 'Run', note: 'What does production need?' },
  { index: '04', title: 'Contact', note: 'Where should we follow up?' },
];

const serviceMap: Record<string, string> = {
  'screen-printing': 'Screen printing',
  'dtg-dtf': 'DTG / DTF',
  embroidery: 'Embroidery',
  finishing: 'Labels + retail finishing',
  fulfillment: 'Fulfillment / program support',
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
    <label className={`group relative flex min-h-[92px] cursor-pointer items-center justify-between border p-5 transition-colors ${checked ? 'border-lab-black bg-lab-black text-white' : 'border-lab-line bg-white hover:border-lab-black/45'}`}>
      <input type={type} name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span className="max-w-[85%] font-display text-sm font-bold uppercase tracking-[0.07em]">{label}</span>
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

  useEffect(() => {
    const requestedService = searchParams.get('service');
    const mappedService = requestedService ? serviceMap[requestedService] : undefined;
    if (mappedService) {
      setData((current) => ({ ...current, methods: current.methods.includes(mappedService) ? current.methods : [...current.methods, mappedService] }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (step > 0) stepHeadingRef.current?.focus();
  }, [step]);

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
      setValidationError('Choose at least one production or finishing method. “Not sure” is completely fine.');
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
      <main className="relative flex min-h-screen items-center overflow-hidden bg-lab-black px-6 pb-20 pt-36 text-white sm:px-8 lg:px-10">
        <div className="lab-grid absolute inset-0 opacity-25 [--grid-color:rgba(255,255,255,0.08)]" />
        <RegistrationMarks light />
        <div className="relative mx-auto w-full max-w-[1100px] text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-lab-gold text-lab-black"><Check className="h-8 w-8" strokeWidth={3} /></span>
          <p className="mt-9 font-display text-[10px] font-bold uppercase tracking-[0.3em] text-lab-gold">Build ticket received / BT-READY</p>
          <h1 className="mt-6 font-impact text-[clamp(5rem,13vw,12rem)] uppercase leading-[0.8]">Your brief is<br />on the bench.</h1>
          <p className="mx-auto mt-9 max-w-2xl text-base font-medium leading-relaxed text-white/65">This request gives the Merchcraft team a starting point for method, garment, finishing, and production follow-up. It is a project request, not a final quote.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/" className="rounded-full bg-lab-gold px-8 py-4 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-lab-black">Back to the lab</Link>
            <button type="button" onClick={() => { setStatus('idle'); setStep(0); setData(initialData); setArtworkFile(null); }} className="rounded-full border border-white/25 px-8 py-4 font-display text-[11px] font-bold uppercase tracking-[0.18em]">Start another build</button>
          </div>
        </div>
      </main>
    );
  }

  const summaryRows = [
    ['Project', data.projectType || 'Not set'],
    ['Products', data.products.length ? data.products.join(', ') : 'Not set'],
    ['Methods', data.methods.length ? data.methods.join(', ') : 'Not set'],
    ['Quantity', data.quantity || 'Not set'],
    ['Target', data.targetDate || 'Flexible / not set'],
    ['Contact', data.name || 'Not set'],
  ];

  const Summary = () => (
    <div className="bg-lab-black p-6 text-white sm:p-8">
      <div className="flex items-center justify-between border-b border-white/15 pb-5">
        <div>
          <span className="font-display text-[9px] font-bold uppercase tracking-[0.27em] text-lab-gold">BUILD_TICKET</span>
          <h3 className="mt-2 font-display text-xl font-semibold uppercase">Live summary</h3>
        </div>
        <FlaskConical className="h-5 w-5 text-white/45" aria-hidden="true" />
      </div>
      <dl className="mt-2">
        {summaryRows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[85px_1fr] gap-4 border-b border-white/10 py-4">
            <dt className="font-display text-[8px] font-bold uppercase tracking-[0.22em] text-white/35">{label}</dt>
            <dd className="text-xs font-semibold leading-relaxed text-white/72">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-[11px] font-medium leading-relaxed text-white/42">This summary is a request brief, not a final quote or production approval.</p>
    </div>
  );

  return (
    <main className="overflow-hidden bg-white">
      <PageIntro
        index="04"
        label="Quote request"
        title={<>Start your<br /><span className="text-lab-gold">build.</span></>}
        copy="Give us the shape of the project. If the method or garment is still unclear, say so—the production recommendation is part of the conversation."
        dark
      />

      <section className="bg-lab-paper px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-10 border border-lab-line bg-white">
            <div className="h-1 bg-lab-line"><motion.div animate={{ width: `${((step + 1) / steps.length) * 100}%` }} transition={{ duration: 0.3 }} className="h-full bg-lab-red" /></div>
            <nav aria-label="Quote progress" className="no-scrollbar flex overflow-x-auto lg:grid lg:grid-cols-4">
              {steps.map((item, index) => (
                <button
                  key={item.index}
                  type="button"
                  disabled={index > step}
                  aria-current={index === step ? 'step' : undefined}
                  onClick={() => index < step && setStep(index)}
                  className={`min-w-[210px] border-r border-lab-line p-5 text-left last:border-r-0 lg:min-w-0 ${index === step ? 'bg-lab-black text-white' : index < step ? 'bg-white text-lab-black' : 'cursor-not-allowed bg-lab-paper text-lab-black/35'}`}
                >
                  <span className={`font-impact text-3xl ${index === step ? 'text-lab-gold' : 'text-lab-red'}`}>{item.index}</span>
                  <span className="ml-4 font-display text-[11px] font-bold uppercase tracking-[0.13em]">{item.title}</span>
                </button>
              ))}
            </nav>
          </div>

          <details className="mb-6 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between bg-lab-black p-5 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-white">
              View build summary <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </summary>
            <Summary />
          </details>

          <div className="grid gap-8 lg:grid-cols-[1.32fr_0.68fr] lg:items-start">
            <form name="quote" method="POST" data-netlify="true" netlify-honeypot="bot-field" encType="multipart/form-data" onSubmit={handleSubmit} className="border border-lab-line bg-white p-6 sm:p-10 lg:p-12">
              <input type="hidden" name="form-name" value="quote" />
              <p className="hidden"><label>Do not fill this out: <input name="bot-field" /></label></p>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <div className="mb-10 flex items-start justify-between gap-8 border-b border-lab-line pb-7">
                    <div>
                      <span className="font-display text-[9px] font-bold uppercase tracking-[0.28em] text-lab-red">Step {steps[step].index} / 04</span>
                      <h2 ref={stepHeadingRef} tabIndex={-1} className="mt-3 font-display text-3xl font-semibold uppercase tracking-[-0.04em] outline-none sm:text-4xl">{steps[step].note}</h2>
                    </div>
                    <span className="hidden font-impact text-6xl text-lab-gold sm:block">{steps[step].index}</span>
                  </div>

                  {step === 0 && (
                    <div>
                      <fieldset>
                        <legend className="mb-4 font-display text-[10px] font-bold uppercase tracking-[0.23em] text-lab-black/45">Project type *</legend>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {['Brand merch', 'Event or campaign', 'Team or workwear', 'Retail product', 'Ongoing program', 'Other / not sure'].map((item) => (
                            <ChoiceCard key={item} type="radio" name="project_type" value={item} label={item} checked={data.projectType === item} onChange={() => update('projectType', item)} />
                          ))}
                        </div>
                      </fieldset>
                      <fieldset className="mt-10">
                        <legend className="mb-4 font-display text-[10px] font-bold uppercase tracking-[0.23em] text-lab-black/45">Product direction *</legend>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {['T-shirts', 'Fleece', 'Headwear', 'Outerwear', 'Totes / accessories', 'Not sure yet'].map((item) => (
                            <ChoiceCard key={item} type="checkbox" name="products" value={item} label={item} checked={data.products.includes(item)} onChange={() => toggleList('products', item)} />
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  )}

                  {step === 1 && (
                    <fieldset>
                      <legend className="mb-5 font-display text-[10px] font-bold uppercase tracking-[0.23em] text-lab-black/45">Production + finishing methods *</legend>
                      <p className="mb-7 max-w-2xl text-sm font-medium leading-relaxed text-lab-black/55">Choose everything you are considering. The team can narrow the method after reviewing the art, garment, quantity, and desired feel.</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {['Screen printing', 'DTG / DTF', 'Embroidery', 'Sewing / patches', 'Labels + retail finishing', 'Fulfillment / program support', 'Live event production', 'Not sure — recommend a method'].map((item) => (
                          <ChoiceCard key={item} type="checkbox" name="methods" value={item} label={item} checked={data.methods.includes(item)} onChange={() => toggleList('methods', item)} />
                        ))}
                      </div>
                    </fieldset>
                  )}

                  {step === 2 && (
                    <fieldset className="grid gap-x-7 gap-y-8 sm:grid-cols-2">
                      <label className="field-line block border-b border-lab-line pb-2">
                        <span className="mb-3 block font-display text-[9px] font-bold uppercase tracking-[0.22em] text-lab-black/45">Approximate quantity *</span>
                        <select value={data.quantity} onChange={(event) => update('quantity', event.target.value)} className="w-full cursor-pointer bg-transparent py-3 text-base font-semibold outline-none">
                          <option value="">Select a range</option>
                          <option>Under 50</option>
                          <option>50–99</option>
                          <option>100–249</option>
                          <option>250–499</option>
                          <option>500+</option>
                          <option>Not sure yet</option>
                        </select>
                      </label>
                      <label className="field-line block border-b border-lab-line pb-2">
                        <span className="mb-3 block font-display text-[9px] font-bold uppercase tracking-[0.22em] text-lab-black/45">Desired delivery date</span>
                        <input type="date" value={data.targetDate} onChange={(event) => update('targetDate', event.target.value)} className="w-full bg-transparent py-3 text-base font-semibold outline-none" />
                      </label>

                      <div className="sm:col-span-2">
                        <span className="mb-4 block font-display text-[9px] font-bold uppercase tracking-[0.22em] text-lab-black/45">Artwork status *</span>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {['Production-ready', 'Needs review', 'Still developing'].map((item) => (
                            <ChoiceCard key={item} type="radio" name="artwork_status" value={item} label={item} checked={data.artworkStatus === item} onChange={() => update('artworkStatus', item)} />
                          ))}
                        </div>
                      </div>

                      <label className="group flex min-h-[130px] cursor-pointer items-center gap-5 border border-dashed border-lab-black/25 p-5 transition-colors hover:border-lab-red sm:col-span-2">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lab-paper"><FileUp className="h-5 w-5 text-lab-red" aria-hidden="true" /></span>
                        <span>
                          <span className="block font-display text-[10px] font-bold uppercase tracking-[0.18em]">{artworkFile ? artworkFile.name : 'Attach available artwork'}</span>
                          <span className="mt-2 block text-xs font-medium text-lab-black/45">Optional. Vector files, PDF proofs, or reference images are helpful.</span>
                        </span>
                        <input type="file" accept=".ai,.eps,.svg,.pdf,.png,.jpg,.jpeg,.zip" onChange={(event) => setArtworkFile(event.target.files?.[0] ?? null)} className="sr-only" />
                      </label>

                      <label className="field-line block border-b border-lab-line pb-2 sm:col-span-2">
                        <span className="mb-3 block font-display text-[9px] font-bold uppercase tracking-[0.22em] text-lab-black/45">Anything else the lab should know?</span>
                        <textarea value={data.notes} onChange={(event) => update('notes', event.target.value)} rows={5} className="w-full resize-y bg-transparent py-3 text-base font-semibold leading-relaxed outline-none placeholder:text-lab-black/25" placeholder="Colors, placements, garment references, delivery needs, or links." />
                      </label>
                    </fieldset>
                  )}

                  {step === 3 && (
                    <fieldset className="grid gap-x-7 gap-y-8 sm:grid-cols-2">
                      <label className="field-line block border-b border-lab-line pb-2">
                        <span className="mb-3 block font-display text-[9px] font-bold uppercase tracking-[0.22em] text-lab-black/45">Full name *</span>
                        <input value={data.name} onChange={(event) => update('name', event.target.value)} autoComplete="name" className="w-full bg-transparent py-3 text-base font-semibold outline-none placeholder:text-lab-black/25" placeholder="Your name" />
                      </label>
                      <label className="field-line block border-b border-lab-line pb-2">
                        <span className="mb-3 block font-display text-[9px] font-bold uppercase tracking-[0.22em] text-lab-black/45">Company</span>
                        <input value={data.company} onChange={(event) => update('company', event.target.value)} autoComplete="organization" className="w-full bg-transparent py-3 text-base font-semibold outline-none placeholder:text-lab-black/25" placeholder="Brand or organization" />
                      </label>
                      <label className="field-line block border-b border-lab-line pb-2">
                        <span className="mb-3 block font-display text-[9px] font-bold uppercase tracking-[0.22em] text-lab-black/45">Email *</span>
                        <input type="email" value={data.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" className="w-full bg-transparent py-3 text-base font-semibold outline-none placeholder:text-lab-black/25" placeholder="you@company.com" />
                      </label>
                      <label className="field-line block border-b border-lab-line pb-2">
                        <span className="mb-3 block font-display text-[9px] font-bold uppercase tracking-[0.22em] text-lab-black/45">Phone</span>
                        <input type="tel" value={data.phone} onChange={(event) => update('phone', event.target.value)} autoComplete="tel" className="w-full bg-transparent py-3 text-base font-semibold outline-none placeholder:text-lab-black/25" placeholder="Optional" />
                      </label>
                      <div className="border border-lab-line bg-lab-paper p-6 sm:col-span-2">
                        <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em]">Before you send</p>
                        <p className="mt-3 text-sm font-medium leading-relaxed text-lab-black/55">This submits a project request for review. It is not a final quote, production approval, or guaranteed delivery date.</p>
                      </div>
                    </fieldset>
                  )}
                </motion.div>
              </AnimatePresence>

              <div aria-live="polite" className="mt-8 min-h-7">
                {validationError && <p className="text-sm font-semibold text-lab-red">{validationError}</p>}
                {status === 'error' && <p className="text-sm font-semibold text-lab-red">The ticket could not be sent. Please email the project details to shop@merchcraft.com.</p>}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-lab-line pt-8">
                <button type="button" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} className="inline-flex min-h-12 items-center gap-3 font-display text-[10px] font-bold uppercase tracking-[0.2em] disabled:invisible">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
                </button>
                {step < steps.length - 1 ? (
                  <button type="button" onClick={goNext} className="group inline-flex min-h-14 items-center gap-6 rounded-full bg-lab-gold px-8 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-lab-black transition-colors hover:bg-lab-black hover:text-white">
                    Next step <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </button>
                ) : (
                  <button disabled={status === 'submitting'} type="submit" className="group inline-flex min-h-14 items-center gap-6 rounded-full bg-lab-gold px-8 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-lab-black transition-colors hover:bg-lab-black hover:text-white disabled:cursor-wait disabled:opacity-60">
                    {status === 'submitting' ? 'Sending ticket…' : 'Submit build ticket'} <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </button>
                )}
              </div>
            </form>

            <aside className="sticky top-24 hidden lg:block"><Summary /></aside>
          </div>
        </div>
      </section>
    </main>
  );
}
