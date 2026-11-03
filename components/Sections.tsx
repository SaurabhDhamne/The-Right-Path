import { site, stats, consultancy, counselling, brandingServices, steps, projects, resources, faqs } from "@/lib/site";
import ScrollLink from "./ScrollLink";
import Reveal from "./Reveal";
import Counter from "./Counter";
import LeadForm from "./LeadForm";
import { BrandingIcon } from "./Icons";

export function Hero() {
  return (
    <section id="home" className="hero-section">
      <div className="hero-grid">
        <div>
          <h1 className="hero-title">Empowering students. Strengthening institutions.</h1>
          <p className="hero-subtitle">
            Personalised admission guidance, strategic consultancy, and high-impact branding for educational institutions in Chhatrapati Sambhajinagar and beyond.
          </p>
        </div>
        <div className="hero-actions">
          <ScrollLink id="counselling" className="hero-card-brand">
            <p className="hero-card-title">For students and parents</p>
            <p className="hero-card-desc">Courses, colleges and admissions. Get guidance →</p>
          </ScrollLink>
          <ScrollLink id="consultancy" className="hero-card-outline">
            <p className="hero-card-title">For educational institutions</p>
            <p className="hero-card-desc">Admissions, consultancy and growth. Discuss a project →</p>
          </ScrollLink>
          <ScrollLink id="branding" className="hero-card-outline">
            <p className="hero-card-title">Branding & Performance Marketing</p>
            <p className="hero-card-desc">Meta & Google Ads, SEO, Web dev & Outsource marketing →</p>
          </ScrollLink>
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <>
      <section id="about" className="about-section">
        <Reveal>
          <h2 className="section-heading">About us</h2>
          <p className="mt-5 about-text">
            We are an independent education partner that connects students with informed decisions and helps institutions grow strategically through proven admission strategies and modern branding.
          </p>
          <p className="mt-4 text-ink/75">
            We never promise guaranteed admission or placement. We give honest, verified guidance.
          </p>
        </Reveal>
        <Reveal delay={150}>
          <div className="about-photo-placeholder">Founder photo</div>
        </Reveal>
      </section>

      <section className="stats-banner">
        <div className="stats-grid">
          {stats.map((s) => (
            <Counter key={s.label} {...s} />
          ))}
        </div>
      </section>
    </>
  );
}

function Cards({ items }: { items: { t: string; d: string }[] }) {
  return (
    <div className="cards-grid">
      {items.map((c, i) => (
        <Reveal key={c.t} delay={i * 80}>
          <div className="service-card">
            <h3 className="card-title">{c.t}</h3>
            <p className="card-desc">{c.d}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function Consultancy() {
  return (
    <section id="consultancy" className="section-container">
      <h2 className="section-heading">Institutional consultancy</h2>
      <p className="section-description">For college management, directors, principals and admission teams.</p>
      <Cards items={consultancy} />
    </section>
  );
}

export function Counselling() {
  return (
    <section id="counselling" className="counselling-bg">
      <div className="section-container">
        <h2 className="section-heading">Student counselling</h2>
        <p className="section-description">Clear guidance for students and parents, from course choice to admission.</p>
        <Cards items={counselling} />
        <div className="steps-grid">
          {steps.map((s, i) => (
            <Reveal key={s.t} delay={i * 120}>
              <div className="step-item">
                <span className="step-badge">{i + 1}</span>
                <div>
                  <h3 className="card-title">{s.t}</h3>
                  <p className="card-desc">{s.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Branding() {
  return (
    <section id="branding" className="branding-section">
      <div className="section-container">
        <Reveal>
          <div className="branding-header-wrap">
            <span className="branding-pill-tag">Admissions & Growth</span>
            <h2 className="section-heading">Branding & Performance Marketing</h2>
            <p className="section-description">
              Elevate your institution’s reputation, attract high-quality enquiries, and scale student enrollment with dedicated digital marketing and web solutions.
            </p>
          </div>
        </Reveal>

        <div className="branding-grid">
          {brandingServices.map((b, i) => (
            <Reveal key={b.t} delay={i * 70}>
              <div className="branding-card">
                <div>
                  <div className="branding-card-icon">
                    <BrandingIcon name={b.t} />
                  </div>
                  <h3 className="branding-card-title">{b.t}</h3>
                  <p className="branding-card-desc">{b.d}</p>
                </div>
                <ScrollLink id="contact" className="branding-card-cta">
                  <span>Enquire for {b.t}</span>
                  <span>→</span>
                </ScrollLink>
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
    <section id="projects" className="section-container">
      <h2 className="section-heading">Our projects</h2>
      <p className="section-description">Placeholder cards. Add only real, approved work.</p>
      <div className="projects-grid">
        {projects.map((p, i) => (
          <Reveal key={i} delay={i * 100}>
            <div className="project-card">
              <div className="project-thumb" />
              <p className="project-tag">{p.tag}</p>
              <h3 className="mt-1 card-title">{p.t}</h3>
              <p className="card-desc">{p.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function Resources() {
  return (
    <section id="resources" className="resources-bg">
      <div className="section-container">
        <h2 className="section-heading">Resources and admission updates</h2>
        <p className="section-description">Verified notices and guides, each with the date it was checked.</p>
        <div className="resources-grid">
          {resources.map((r, i) => (
            <Reveal key={r.t} delay={i * 100}>
              <a href="#" className="resource-card">
                <p className="project-tag">{r.tag}</p>
                <h3 className="mt-1 card-title">{r.t}</h3>
                <p className="card-desc">{r.d}</p>
                <p className="resource-date">{r.date}</p>
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
    <section id="faq" className="faq-wrap">
      <h2 className="section-heading">Frequently asked questions</h2>
      <div className="faq-list">
        {faqs.map((f) => (
          <details key={f.q} className="faq-item">
            <summary className="faq-summary">{f.q}</summary>
            <p className="faq-answer">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" className="contact-section">
      <div className="contact-grid">
        <div>
          <h2 className="section-heading">Request a consultation</h2>
          <p className="mt-4 text-mist">
            Choose Student, Institution, or Branding, tell us what you need, and we will reply within 24 hours.
          </p>
          <dl className="contact-details-list">
            <div>
              <dt className="contact-label">Phone</dt>
              <dd>{site.phone}</dd>
              <dd>{site.phone2}</dd>
            </div>
            <div>
              <dt className="contact-label">Email</dt>
              <dd>{site.email}</dd>
            </div>
            <div>
              <dt className="contact-label">Office</dt>
              <dd>{site.address}</dd>
            </div>
          </dl>
        </div>
        <LeadForm />
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
        <div className="footer-links">
          <a href="/privacy" className="footer-link">Privacy</a>
          <a href="/terms" className="footer-link">Terms and disclaimer</a>
        </div>
      </div>
      <a href={site.whatsapp} aria-label="Chat on WhatsApp" className="whatsapp-float-btn">
        WhatsApp
      </a>
    </footer>
  );
}
