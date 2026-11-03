"use client";
import { useState } from "react";

type Kind = "student" | "institution" | "branding";

const Select = ({ name, label, options }: { name: string; label: string; options: string[] }) => (
  <select name={name} required defaultValue="" className="form-field">
    <option value="" disabled>{label}</option>
    {options.map((o) => <option key={o} value={o}>{o}</option>)}
  </select>
);

export default function LeadForm() {
  const [kind, setKind] = useState<Kind>("student");
  const [sent, setSent] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="form-card"
    >
      <div role="tablist" className="form-tablist">
        {(["student", "institution", "branding"] as Kind[]).map((k) => (
          <button
            type="button"
            key={k}
            role="tab"
            aria-selected={kind === k}
            onClick={() => setKind(k)}
            className={`form-tab-btn ${kind === k ? "form-tab-btn-active" : "form-tab-btn-inactive"}`}
          >
            {k === "student" ? "Student" : k === "institution" ? "Institution" : "Branding"}
          </button>
        ))}
      </div>

      {sent ? (
        <div className="form-success-box">
          <p>Thanks for reaching out! We will get back to you within 24 hours.</p>
        </div>
      ) : (
        <div key={kind} className="space-y-3">
          {kind === "student" && (
            <>
              <input required name="name" placeholder="Student name" className="form-field" />
              <input required name="mobile" type="tel" placeholder="Mobile number" className="form-field" />
              <input name="city" placeholder="City" className="form-field" />
              <Select name="exam" label="Qualifying examination" options={["10th", "12th (HSC)", "Diploma", "Graduation", "Other"]} />
              <Select name="course" label="Preferred course" options={["Engineering", "Management / MBA", "Law", "Pharmacy", "Science / Computer applications", "Commerce / Arts", "Not sure"]} />
              <Select name="year" label="Academic year" options={["2026-27", "2027-28"]} />
            </>
          )}

          {kind === "institution" && (
            <>
              <input required name="institution" placeholder="Institution name" className="form-field" />
              <input required name="contact" placeholder="Contact person" className="form-field" />
              <input name="designation" placeholder="Designation" className="form-field" />
              <input required name="email" type="email" placeholder="Official email" className="form-field" />
              <input required name="phone" type="tel" placeholder="Phone number" className="form-field" />
              <textarea name="need" rows={3} placeholder="Consultancy requirement" className="form-field" />
            </>
          )}

          {kind === "branding" && (
            <>
              <input required name="brand_or_institution" placeholder="College / Organization name" className="form-field" />
              <input required name="contact_person" placeholder="Contact person" className="form-field" />
              <input required name="phone" type="tel" placeholder="Phone / WhatsApp number" className="form-field" />
              <input required name="email" type="email" placeholder="Email address" className="form-field" />
              <Select
                name="branding_service"
                label="Primary branding / marketing need"
                options={[
                  "Meta ad’s (Facebook & Instagram)",
                  "Google ads (Search & YouTube)",
                  "Social media marketing",
                  "Seo (Search engine ranking)",
                  "Web dev (College & admission site)",
                  "Content marketing & video",
                  "Outsource marketing (Full management)",
                  "Complete 360° Branding & Admissions",
                ]}
              />
              <textarea name="branding_notes" rows={3} placeholder="Tell us about your admission goals & timeline" className="form-field" />
            </>
          )}

          <label className="form-checkbox-wrap">
            <input type="checkbox" required className="mt-1" />
            <span>
              I agree to be contacted about this enquiry and have read the{" "}
              <a href="/privacy" className="underline">privacy notice</a>.
            </span>
          </label>

          <button type="submit" className="form-submit-btn">
            {kind === "branding" ? "Request Branding Strategy" : "Submit enquiry"}
          </button>
        </div>
      )}
    </form>
  );
}
