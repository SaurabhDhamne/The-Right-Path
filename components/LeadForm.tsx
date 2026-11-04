"use client";
import { useState } from "react";
import { submitLead, LeadPayload } from "@/app/actions/submitLead";

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
  const [submittedUid, setSubmittedUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);

    let payload: LeadPayload;

    if (kind === "student") {
      payload = {
        kind: "student",
        name: (formData.get("name") as string) || "",
        phone: (formData.get("mobile") as string) || "",
        city: (formData.get("city") as string) || null,
        exam: (formData.get("exam") as string) || null,
        course: (formData.get("course") as string) || null,
        academic_year: (formData.get("year") as string) || null,
        consent: true,
      };
    } else if (kind === "institution") {
      payload = {
        kind: "institution",
        name: (formData.get("contact") as string) || "",
        organization_name: (formData.get("institution") as string) || "",
        designation: (formData.get("designation") as string) || null,
        email: (formData.get("email") as string) || null,
        phone: (formData.get("phone") as string) || "",
        requirement_notes: (formData.get("need") as string) || null,
        consent: true,
      };
    } else {
      payload = {
        kind: "branding",
        name: (formData.get("contact_person") as string) || "",
        organization_name: (formData.get("brand_or_institution") as string) || "",
        phone: (formData.get("phone") as string) || "",
        email: (formData.get("email") as string) || null,
        branding_service: (formData.get("branding_service") as string) || null,
        requirement_notes: (formData.get("branding_notes") as string) || null,
        consent: true,
      };
    }

    const res = await submitLead(payload);
    setLoading(false);

    if (res.success) {
      setSubmittedUid(res.uid || null);
      setSent(true);
    } else {
      setErrorMsg(res.error || "Failed to submit. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <div role="tablist" className="form-tablist">
        {(["student", "institution", "branding"] as Kind[]).map((k) => (
          <button
            type="button"
            key={k}
            role="tab"
            aria-selected={kind === k}
            onClick={() => {
              setKind(k);
              setErrorMsg(null);
            }}
            className={`form-tab-btn ${kind === k ? "form-tab-btn-active" : "form-tab-btn-inactive"}`}
          >
            {k === "student" ? "Student" : k === "institution" ? "Institution" : "Branding"}
          </button>
        ))}
      </div>

      {sent ? (
        <div className="form-success-box">
          <div className="flex items-center gap-2 text-ink">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">✓</span>
            <p className="font-bold text-ink text-base">Thanks for reaching out!</p>
          </div>
          {submittedUid && (
            <div className="mt-3 p-2.5 rounded-lg bg-white border border-ink/10 flex items-center justify-between">
              <span className="text-xs text-ink/70">Reference Enquiry ID:</span>
              <span className="font-mono font-bold text-xs text-ink bg-paper px-2 py-0.5 rounded border border-ink/10">
                {submittedUid}
              </span>
            </div>
          )}
          <p className="mt-2 text-xs text-ink/75">We will review your details and get back to you within 24 hours.</p>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setSubmittedUid(null);
            }}
            className="mt-3 text-xs font-bold text-navy hover:underline block"
          >
            ← Submit another enquiry
          </button>
        </div>
      ) : (
        <div key={kind} className="space-y-3">
          {errorMsg && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

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
            <input type="checkbox" required defaultChecked className="mt-1" />
            <span>
              I agree to be contacted about this enquiry and have read the{" "}
              <a href="/privacy" className="underline">privacy notice</a>.
            </span>
          </label>

          <button type="submit" disabled={loading} className="form-submit-btn flex items-center justify-center gap-2">
            {loading ? (
              <span>Submitting...</span>
            ) : kind === "branding" ? (
              "Request Branding Strategy"
            ) : (
              "Submit enquiry"
            )}
          </button>
        </div>
      )}
    </form>
  );
}
