"use client";
import { useState } from "react";

const field = "w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-ink placeholder:text-ink/50";
type Kind = "student" | "institution";
const Select = ({ name, label, options }: { name: string; label: string; options: string[] }) => (
  <select name={name} required defaultValue="" className={field}>
    <option value="" disabled>{label}</option>
    {options.map((o) => <option key={o}>{o}</option>)}
  </select>
);

export default function LeadForm() {
  const [kind, setKind] = useState<Kind>("student");
  const [sent, setSent] = useState(false);
  return (
    <form onSubmit={(e) => { e.preventDefault(); setSent(true); /* TODO: send to your API / CRM with kind, date, source */ }}
      className="rounded-2xl bg-white p-6 text-ink shadow-xl">
      <div role="tablist" className="mb-5 grid grid-cols-2 rounded-full bg-paper p-1 text-sm font-bold">
        {(["student", "institution"] as Kind[]).map((k) => (
          <button type="button" key={k} role="tab" aria-selected={kind === k} onClick={() => setKind(k)}
            className={`rounded-full py-2 transition ${kind === k ? "bg-ink text-white" : "text-ink/70"}`}>
            {k === "student" ? "Student / Parent" : "Institution"}
          </button>
        ))}
      </div>
      {sent ? (
        <p className="rounded-lg bg-paper p-4">Thanks. We will get back to you within 24 hours.</p>
      ) : (
        <div key={kind} className="space-y-3">
          {kind === "student" ? (
            <>
              <input required name="name" placeholder="Student name" className={field} />
              <input required name="mobile" type="tel" placeholder="Mobile number" className={field} />
              <input name="city" placeholder="City" className={field} />
              <Select name="exam" label="Qualifying examination" options={["10th", "12th (HSC)", "Diploma", "Graduation", "Other"]} />
              <Select name="course" label="Preferred course" options={["Engineering", "Management / MBA", "Law", "Pharmacy", "Science / Computer applications", "Commerce / Arts", "Not sure"]} />
              <Select name="year" label="Academic year" options={["2026-27", "2027-28"]} />
            </>
          ) : (
            <>
              <input required name="institution" placeholder="Institution name" className={field} />
              <input required name="contact" placeholder="Contact person" className={field} />
              <input name="designation" placeholder="Designation" className={field} />
              <input required name="email" type="email" placeholder="Official email" className={field} />
              <input required name="phone" type="tel" placeholder="Phone number" className={field} />
              <textarea name="need" rows={3} placeholder="Consultancy requirement" className={field} />
            </>
          )}
          <label className="flex gap-2 text-sm text-ink/70">
            <input type="checkbox" required className="mt-1" />
            <span>I agree to be contacted about this enquiry and have read the <a href="/privacy" className="underline">privacy notice</a>.</span>
          </label>
          <button className="w-full rounded-lg bg-brand px-4 py-3 font-bold text-ink hover:brightness-110">Submit enquiry</button>
        </div>
      )}
    </form>
  );
}
