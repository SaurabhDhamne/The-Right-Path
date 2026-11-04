"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  "";

export type LeadPayload = {
  kind: "student" | "institution" | "branding";
  name: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  exam?: string | null;
  course?: string | null;
  academic_year?: string | null;
  organization_name?: string | null;
  designation?: string | null;
  branding_service?: string | null;
  requirement_notes?: string | null;
  consent: boolean;
};

export async function submitLead(payload: LeadPayload) {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URL or Key missing in environment variables");
    return {
      success: false,
      error: "Database configuration is missing. Please check .env.local",
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const record = {
      kind: payload.kind,
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      email: payload.email?.trim() || null,
      city: payload.city?.trim() || null,
      exam: payload.exam || null,
      course: payload.course || null,
      academic_year: payload.academic_year || null,
      organization_name: payload.organization_name?.trim() || null,
      designation: payload.designation?.trim() || null,
      branding_service: payload.branding_service || null,
      requirement_notes: payload.requirement_notes?.trim() || null,
      consent: payload.consent,
      status: "new",
    };

    const { data, error } = await supabase
      .from("leads")
      .insert([record])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return { success: false, error: error.message };
    }

    const inserted = data && data[0];
    const uid = inserted
      ? (inserted.uid as string) || `RP-${inserted.id.slice(0, 5).toUpperCase()}`
      : undefined;

    return { success: true, uid };
  } catch (err: any) {
    console.error("Unexpected error in submitLead:", err);
    return {
      success: false,
      error: err?.message || "Something went wrong. Please try again.",
    };
  }
}
