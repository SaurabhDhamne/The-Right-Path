import { site, stats, consultancy, counselling, steps, projects, resources, faqs } from "@/lib/site";
import ScrollLink from "./ScrollLink";
import Reveal from "./Reveal";
import Counter from "./Counter";
import LeadForm from "./LeadForm";

const h2 = "font-display text-3xl font-bold md:text-5xl";

export function Hero() {
  return (
    <section id="home" className="bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1.2fr_1fr] md:py-28">
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">Empowering students. Strengthening institutions.</h1>
          <p className="mt-6 max-w-xl text-lg text-mist">Personalised admission guidance and strategic consultancy for educational institutions in Chhatrapati Sambhajinagar and beyond.</p>
        </div>
        <div className="space-y-4">
          <ScrollLink id="counselling" className="block rounded-2xl bg-brand p-6 text-ink transition hover:-translate-y-1">
            <p className="font-display text-2xl font-bold">For students and parents</p>
            <p className="mt-1">Courses, colleges and admissions. Get guidance</p>
          </ScrollLink>
          <ScrollLink id="consultancy" className="block rounded-2xl border border-white/25 p-6 transition hover:-translate-y-1 hover:border-brand">
            <p className="font-display text-2xl font-bold">For educational institutions</p>
            <p className="mt-1 text-mist">Admissions, branding and growth. Discuss a project</p>
          </ScrollLink>
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <>
      <section id="about" className="mx-auto grid max-w-6xl gap-12 px-5 py-24 md:grid-cols-2">
        <Reveal>
          <h2 className={h2}>About us</h2>
          <p className="mt-5 text-lg text-ink/75">We are an independent education partner that connects students with informed decisions and helps institutions grow strategically. Replace this paragraph with your mission, vision and founder story.</p>
          <p className="mt-4 text-ink/75">We never promise guaranteed admission or placement. We give honest, verified guidance.</p>
        </Reveal>
        <Reveal delay={150}>
          <div className="grid aspect-[4/3] place-items-center rounded-2xl border-2 border-dashed border-navy/40 bg-white text-navy/60">Founder photo</div>
        </Reveal>
      </section>
      <section className="bg-navy">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => <Counter key={s.label} {...s} />)}
        </div>
      </section>
    </>
  );
}

function Cards({ items }: { items: { t: string; d: string }[] }) {
  return (
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c, i) => (
        <Reveal key={c.t} delay={i * 80}>
          <div className="h-full rounded-2xl border-t-4 border-brand bg-white p-6">
            <h3 className="font-display text-xl font-bold">{c.t}</h3>
            <p className="mt-2 text-ink/70">{c.d}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function Consultancy() {
  return (
    <section id="consultancy" className="mx-auto max-w-6xl px-5 py-24">
      <h2 className={h2}>Institutional consultancy</h2>
      <p className="mt-4 max-w-2xl text-ink/70">For college management, directors, principals and admission teams.</p>
      <Cards items={consultancy} />
    </section>
  );
}

export function Counselling() {
  return (
    <section id="counselling" className="bg-white">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <h2 className={h2}>Student counselling</h2>
        <p className="mt-4 max-w-2xl text-ink/70">Clear guidance for students and parents, from course choice to admission.</p>
        <Cards items={counselling} />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.t} delay={i * 120}>
              <div className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink font-bold text-brand">{i + 1}</span>
                <div><h3 className="font-display text-xl font-bold">{s.t}</h3><p className="text-ink/70">{s.d}</p></div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Projects() {
  return (
    <section id="projects" className="mx-auto max-w-6xl px-5 py-24">
      <h2 className={h2}>Our projects</h2>
      <p className="mt-4 max-w-2xl text-ink/70">Placeholder cards. Add only real, approved work.</p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {projects.map((p, i) => (
          <Reveal key={i} delay={i * 100}>
            <div className="h-full rounded-2xl border-2 border-dashed border-navy/30 p-6">
              <div className="mb-5 aspect-video rounded-lg bg-navy/10" />
              <p className="text-sm font-semibold text-navy">{p.tag}</p>
              <h3 className="mt-1 font-display text-xl font-bold">{p.t}</h3>
              <p className="mt-2 text-ink/70">{p.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function Resources() {
  return (
    <section id="resources" className="bg-white">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <h2 className={h2}>Resources and admission updates</h2>
        <p className="mt-4 max-w-2xl text-ink/70">Verified notices and guides, each with the date it was checked.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {resources.map((r, i) => (
            <Reveal key={r.t} delay={i * 100}>
              <a href="#" className="block h-full rounded-2xl bg-paper p-6 transition hover:-translate-y-1">
                <p className="text-sm font-semibold text-navy">{r.tag}</p>
                <h3 className="mt-1 font-display text-xl font-bold">{r.t}</h3>
                <p className="mt-2 text-ink/70">{r.d}</p>
                <p className="mt-4 text-sm text-ink/50">{r.date}</p>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-24">
      <h2 className={h2}>Frequently asked questions</h2>
      <div className="mt-8 divide-y divide-ink/15 border-y border-ink/15">
        {faqs.map((f) => (
          <details key={f.q} className="py-5">
            <summary className="cursor-pointer font-display text-lg font-bold">{f.q}</summary>
            <p className="mt-3 text-ink/70">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" className="bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 md:grid-cols-2">
        <div>
          <h2 className={h2}>Request a consultation</h2>
          <p className="mt-4 text-mist">Choose Student or Institution, tell us what you need, and we will reply within 24 hours.</p>
          <dl className="mt-8 space-y-3 text-mist">
            <div><dt className="font-bold text-white">Phone</dt><dd>{site.phone}</dd></div>
            <div><dt className="font-bold text-white">Email</dt><dd>{site.email}</dd></div>
            <div><dt className="font-bold text-white">Office</dt><dd>{site.address}</dd></div>
          </dl>
        </div>
        <LeadForm />
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink text-sm text-mist">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-8">
        <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
        <p className="flex gap-5"><a href="/privacy" className="hover:text-white">Privacy</a><a href="/terms" className="hover:text-white">Terms and disclaimer</a></p>
      </div>
      <a href={site.whatsapp} aria-label="Chat on WhatsApp" className="fixed bottom-5 right-5 z-40 rounded-full bg-brand px-5 py-3 font-bold text-ink shadow-lg">WhatsApp</a>
    </footer>
  );
}
