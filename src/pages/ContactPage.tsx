import { type FormEvent, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BadgeHelp, Boxes, Mail, MapPin, Send, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LabLabel, PageIntro, RegistrationMarks } from '../components/LabUI';

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

const routes = [
  {
    icon: Sparkles,
    label: 'New project',
    title: 'Start a build',
    copy: 'Have a garment, campaign, event, or merch program in mind? The build ticket collects the production details.',
    href: '/quote',
    action: 'Open quote request',
    internal: true,
  },
  {
    icon: Boxes,
    label: 'General + production',
    title: 'Talk to the shop',
    copy: 'For production questions, an active order, capabilities, finishing, or fulfillment conversations.',
    href: 'mailto:shop@merchcraft.com',
    action: 'shop@merchcraft.com',
    internal: false,
  },
  {
    icon: BadgeHelp,
    label: 'Brand + partnerships',
    title: 'Connect with the brand',
    copy: 'For partnerships, co-branded projects, brand approvals, and broader collaboration questions.',
    href: 'mailto:brand@merchcraft.com',
    action: 'brand@merchcraft.com',
    internal: false,
  },
];

export default function ContactPage() {
  const [status, setStatus] = useState<SubmitStatus>('idle');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set('form-name', 'contact');
    setStatus('submitting');

    try {
      const response = await fetch('/', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Submission failed');
      form.reset();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className="overflow-hidden bg-white">
      <PageIntro
        index="03"
        label="Contact"
        title={<>Let’s talk<br /><span className="text-lab-red">shop.</span></>}
        copy="Route your note to the right bench—start a project, ask a production question, or connect about a brand partnership."
      />

      <section className="border-y border-lab-line bg-lab-paper px-6 py-20 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <LabLabel>Choose a route</LabLabel>
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.24em] text-lab-black/35">Dispatch board / 03 channels</span>
          </div>
          <div className="grid border border-lab-line bg-white lg:grid-cols-3">
            {routes.map((route, index) => {
              const Icon = route.icon;
              const content = (
                <>
                  <div className="flex items-start justify-between">
                    <Icon className="h-6 w-6 text-lab-red" aria-hidden="true" />
                    <span className="font-impact text-5xl text-lab-gold">0{index + 1}</span>
                  </div>
                  <span className="mt-14 block font-display text-[9px] font-bold uppercase tracking-[0.26em] text-lab-red">{route.label}</span>
                  <h2 className="mt-4 font-display text-3xl font-semibold uppercase tracking-[-0.035em]">{route.title}</h2>
                  <p className="mt-5 min-h-[78px] text-sm font-medium leading-relaxed text-lab-black/58">{route.copy}</p>
                  <span className="mt-9 flex items-center gap-3 font-display text-[10px] font-bold uppercase tracking-[0.16em]">
                    {route.action}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1.5" aria-hidden="true" />
                  </span>
                </>
              );

              const className = 'group block min-h-[390px] border-b border-lab-line p-7 transition-colors hover:bg-lab-black hover:text-white lg:border-b-0 lg:border-r lg:p-9 lg:last:border-r-0 [&:hover_p]:text-white/60';
              return route.internal ? (
                <Link key={route.title} to={route.href} className={className}>{content}</Link>
              ) : (
                <a key={route.title} href={route.href} className={className}>{content}</a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1500px] gap-14 lg:grid-cols-[0.76fr_1.24fr] lg:gap-20">
          <div>
            <div className="sticky top-24">
              <LabLabel>Open work order</LabLabel>
              <h2 className="mt-8 font-display text-[clamp(3rem,5vw,5.8rem)] font-semibold uppercase leading-[0.92] tracking-[-0.045em]">Send the essentials.<br />We’ll route the rest.</h2>
              <div className="relative mt-10 aspect-[4/3] overflow-hidden bg-lab-black">
                <img src="/assets/images/bts-table.jpg" alt="Apparel samples and production references on the Merchcraft workbench" loading="lazy" className="h-full w-full object-cover opacity-85" />
                <div className="absolute inset-0 bg-gradient-to-t from-lab-black/75 to-transparent" />
                <RegistrationMarks light />
                <div className="absolute bottom-6 left-6 right-6 z-10 flex items-end justify-between text-white">
                  <span className="font-display text-[9px] font-bold uppercase tracking-[0.23em] text-white/70">Reference desk</span>
                  <span className="flex items-center gap-2 font-display text-[9px] font-bold uppercase tracking-[0.23em] text-lab-gold"><MapPin className="h-3.5 w-3.5" /> Orange County, CA</span>
                </div>
              </div>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} className="border border-lab-line bg-lab-paper p-6 sm:p-10 lg:p-12">
            {status === 'success' ? (
              <div className="flex min-h-[640px] flex-col items-start justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lab-gold text-lab-black"><Send className="h-6 w-6" /></span>
                <p className="mt-10 font-display text-[10px] font-bold uppercase tracking-[0.28em] text-lab-red">Work order received</p>
                <h3 className="mt-5 font-display text-5xl font-semibold uppercase leading-[0.95] tracking-[-0.04em]">Your note is on the bench.</h3>
                <p className="mt-7 max-w-lg text-base font-medium leading-relaxed text-lab-black/62">Thanks for the context. The Merchcraft team can now route your message to the right specialist.</p>
                <button type="button" onClick={() => setStatus('idle')} className="mt-10 rounded-full border border-lab-line px-7 py-4 font-display text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-lab-black hover:text-white">Send another note</button>
              </div>
            ) : (
              <form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" onSubmit={handleSubmit}>
                <input type="hidden" name="form-name" value="contact" />
                <p className="hidden"><label>Do not fill this out: <input name="bot-field" /></label></p>

                <div className="mb-10 flex items-center justify-between border-b border-lab-line pb-6">
                  <div>
                    <span className="font-display text-[9px] font-bold uppercase tracking-[0.27em] text-lab-red">FORM_CT-01</span>
                    <h3 className="mt-2 font-display text-2xl font-semibold uppercase tracking-[-0.03em]">General inquiry</h3>
                  </div>
                  <Mail className="h-5 w-5 text-lab-black/35" aria-hidden="true" />
                </div>

                <div className="grid gap-x-7 gap-y-8 sm:grid-cols-2">
                  <label className="field-line block border-b border-lab-line pb-2">
                    <span className="mb-3 block font-display text-[9px] font-bold uppercase tracking-[0.22em] text-lab-black/45">Full name *</span>
                    <input required name="name" autoComplete="name" className="w-full bg-transparent py-2 text-base font-semibold outline-none placeholder:text-lab-black/25" placeholder="Your name" />
                  </label>
                  <label className="field-line block border-b border-lab-line pb-2">
                    <span className="mb-3 block font-display text-[9px] font-bold uppercase tracking-[0.22em] text-lab-black/45">Company</span>
                    <input name="company" autoComplete="organization" className="w-full bg-transparent py-2 text-base font-semibold outline-none placeholder:text-lab-black/25" placeholder="Brand or organization" />
                  </label>
                  <label className="field-line block border-b border-lab-line pb-2 sm:col-span-2">
                    <span className="mb-3 block font-display text-[9px] font-bold uppercase tracking-[0.22em] text-lab-black/45">Email *</span>
                    <input required type="email" name="email" autoComplete="email" className="w-full bg-transparent py-2 text-base font-semibold outline-none placeholder:text-lab-black/25" placeholder="you@company.com" />
                  </label>
                  <label className="field-line block border-b border-lab-line pb-2 sm:col-span-2">
                    <span className="mb-3 block font-display text-[9px] font-bold uppercase tracking-[0.22em] text-lab-black/45">Route this to *</span>
                    <select required name="topic" defaultValue="" className="w-full cursor-pointer bg-transparent py-2 text-base font-semibold outline-none">
                      <option value="" disabled>Select a topic</option>
                      <option value="general">General question</option>
                      <option value="production">Production or active order</option>
                      <option value="partnership">Brand or partnership</option>
                      <option value="other">Something else</option>
                    </select>
                  </label>
                  <label className="field-line block border-b border-lab-line pb-2 sm:col-span-2">
                    <span className="mb-3 block font-display text-[9px] font-bold uppercase tracking-[0.22em] text-lab-black/45">Message *</span>
                    <textarea required name="message" rows={6} className="w-full resize-y bg-transparent py-2 text-base font-semibold leading-relaxed outline-none placeholder:text-lab-black/25" placeholder="Tell us what you’re working through." />
                  </label>
                </div>

                <div aria-live="polite" className="mt-8 min-h-6 text-sm font-semibold">
                  {status === 'error' && <p className="text-lab-red">The form could not be sent. Please email shop@merchcraft.com instead.</p>}
                </div>

                <button disabled={status === 'submitting'} type="submit" className="group mt-3 inline-flex min-h-14 items-center gap-6 rounded-full bg-lab-gold px-8 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-lab-black transition-colors hover:bg-lab-black hover:text-white disabled:cursor-wait disabled:opacity-60">
                  {status === 'submitting' ? 'Sending work order…' : 'Send work order'}
                  <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </main>
  );
}
