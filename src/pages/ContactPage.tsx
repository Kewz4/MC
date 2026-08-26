import { type FormEvent, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

const contactOptions = [
  {
    title: 'Request a quote',
    copy: 'Planning a new apparel order, campaign, event, or ongoing program? Share your project details and we’ll help with the next step.',
    href: '/quote',
    action: 'Start your request',
    internal: true,
  },
  {
    title: 'General questions',
    copy: 'Questions about production, an active order, finishing, or fulfillment? Email our team.',
    href: 'mailto:shop@merchcraft.com',
    action: 'shop@merchcraft.com',
    internal: false,
  },
  {
    title: 'Partnerships',
    copy: 'For collaborations, partnerships, and brand inquiries, connect with Merchcraft.',
    href: 'mailto:brand@merchcraft.com',
    action: 'brand@merchcraft.com',
    internal: false,
  },
];

export default function ContactPage() {
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (status === 'success') requestAnimationFrame(() => successHeadingRef.current?.focus());
  }, [status]);

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
      <section className="px-6 pb-16 pt-32 sm:px-8 lg:px-10 lg:pb-24 lg:pt-40">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <p className="font-accent text-sm font-bold uppercase tracking-[0.14em] text-lab-red">Contact</p>
            <h1 className="mt-7 font-display text-[clamp(4rem,8vw,8rem)] font-bold uppercase leading-[0.84] tracking-tighter">Let’s make something<br /><span className="font-display normal-case text-lab-gold">worth wearing.</span></h1>
            <p className="mt-9 max-w-xl text-base font-medium leading-relaxed text-lab-black/60 sm:text-lg">Tell us what you’re planning and we’ll connect you with the right person.</p>
            <a href="#message" className="mt-10 inline-flex rounded-full bg-lab-red px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-lab-black">Send a message</a>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 1.035 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden bg-lab-black">
            <img src="/assets/images/contact-planning-v2.webp" alt="Two collaborators planning a custom apparel project around a worktable" className="aspect-[4/3] h-full w-full object-cover object-center" />
          </motion.div>
        </div>
      </section>

      <section className="border-y border-lab-line bg-lab-white px-6 py-20 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="max-w-4xl font-display text-[clamp(3rem,5.5vw,6rem)] font-bold uppercase leading-[0.9] tracking-tighter">How can we help?</h2>
          <div className="mt-12 grid border-t border-lab-line lg:grid-cols-3">
            {contactOptions.map((option, index) => {
              const content = (
                <>
                  <h3 className="font-display text-3xl font-bold uppercase tracking-tighter">{option.title}</h3>
                  <p className="mt-6 text-sm font-medium leading-relaxed text-lab-black/58 lg:min-h-[100px]">{option.copy}</p>
                  <span className="mt-8 flex items-center gap-3 font-sans text-xs font-bold uppercase tracking-widest">
                    {option.action}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </>
              );
              const className = `group block border-b border-lab-line py-9 transition-opacity hover:opacity-55 lg:border-b-0 lg:border-r lg:px-9 ${index === 0 ? 'lg:pl-0' : ''} ${index === contactOptions.length - 1 ? 'lg:border-r-0' : ''}`;
              return option.internal ? <Link key={option.title} to={option.href} className={className}>{content}</Link> : <a key={option.title} href={option.href} className={className}>{content}</a>;
            })}
          </div>
        </div>
      </section>

      <section id="message" className="bg-white px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <div className="sticky top-24">
              <p className="font-accent text-sm font-bold uppercase tracking-[0.14em] text-lab-red">Send us a message</p>
              <h2 className="mt-7 font-display text-[clamp(3.2rem,5.5vw,6rem)] font-bold uppercase leading-[0.9] tracking-tighter">Tell us what<br />you need.</h2>
              <p className="mt-7 max-w-md text-base font-medium leading-relaxed text-lab-black/60">Share a few details and we’ll make sure your message gets to the right person.</p>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} className="border-t border-lab-line pt-10">
            {status === 'success' ? (
              <div className="flex min-h-[600px] flex-col items-start justify-center">
                <span role="status" className="sr-only">Message sent successfully.</span>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lab-gold"><Send className="h-5 w-5" aria-hidden="true" /></span>
                <h3 ref={successHeadingRef} tabIndex={-1} className="mt-8 font-display text-5xl font-bold uppercase leading-[0.92] tracking-tighter">Thanks—we’ve got your message.</h3>
                <p className="mt-6 max-w-lg text-base font-medium leading-relaxed text-lab-black/60">Someone from Merchcraft will follow up soon.</p>
                <button type="button" onClick={() => setStatus('idle')} className="mt-9 rounded-full border border-lab-black/20 px-7 py-4 font-sans text-xs font-bold uppercase tracking-widest transition-colors hover:bg-lab-black hover:text-white">Send another message</button>
              </div>
            ) : (
              <form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" onSubmit={handleSubmit}>
                <input type="hidden" name="form-name" value="contact" />
                <p className="hidden"><label>Do not fill this out: <input name="bot-field" /></label></p>

                <div className="grid gap-x-8 gap-y-9 sm:grid-cols-2">
                  <label className="field-line block border-b border-lab-line pb-2">
                    <span className="mb-3 block text-sm font-semibold text-lab-black/55">Full name *</span>
                    <input required name="name" autoComplete="name" className="w-full bg-transparent py-2 text-base font-semibold outline-none placeholder:text-lab-black/25" placeholder="Your name" />
                  </label>
                  <label className="field-line block border-b border-lab-line pb-2">
                    <span className="mb-3 block text-sm font-semibold text-lab-black/55">Company</span>
                    <input name="company" autoComplete="organization" className="w-full bg-transparent py-2 text-base font-semibold outline-none placeholder:text-lab-black/25" placeholder="Brand or organization" />
                  </label>
                  <label className="field-line block border-b border-lab-line pb-2 sm:col-span-2">
                    <span className="mb-3 block text-sm font-semibold text-lab-black/55">Email *</span>
                    <input required type="email" name="email" autoComplete="email" className="w-full bg-transparent py-2 text-base font-semibold outline-none placeholder:text-lab-black/25" placeholder="you@company.com" />
                  </label>
                  <label className="field-line block border-b border-lab-line pb-2 sm:col-span-2">
                    <span className="mb-3 block text-sm font-semibold text-lab-black/55">What can we help with? *</span>
                    <select required name="topic" defaultValue="" className="w-full cursor-pointer bg-transparent py-2 text-base font-semibold outline-none">
                      <option value="" disabled>Select a topic</option>
                      <option value="general">General question</option>
                      <option value="production">Production or active order</option>
                      <option value="partnership">Brand or partnership</option>
                      <option value="other">Something else</option>
                    </select>
                  </label>
                  <label className="field-line block border-b border-lab-line pb-2 sm:col-span-2">
                    <span className="mb-3 block text-sm font-semibold text-lab-black/55">Message *</span>
                    <textarea required name="message" rows={7} className="w-full resize-y bg-transparent py-2 text-base font-semibold leading-relaxed outline-none placeholder:text-lab-black/25" placeholder="Tell us what you’re working on." />
                  </label>
                </div>

                <div aria-live="polite" className="mt-8 min-h-6 text-sm font-semibold">
                  {status === 'error' && <p className="text-lab-red">We couldn’t send your message. Please email shop@merchcraft.com instead.</p>}
                </div>

                <button disabled={status === 'submitting'} type="submit" className="group mt-4 inline-flex min-h-14 items-center gap-5 rounded-full bg-lab-red px-8 font-sans text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-lab-black disabled:cursor-wait disabled:opacity-60">
                  {status === 'submitting' ? 'Sending…' : 'Send message'}
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
