"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logActivity } from "./authActions";

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
  authToken?: string | null; // Cryptographically signed JWT token from supabase.auth
};

export async function submitLead(payload: LeadPayload) {
  try {
    // 1. Cryptographically verify the session token on the server
    // Never trust a client-supplied user ID
    let verifiedUserId: string | null = null;
    let verifiedUserEmail: string | null = null;
    let verifiedUserName: string | null = null;

    if (payload.authToken && payload.authToken.trim()) {
      const {
        data: { user },
        error: authErr,
      } = await supabaseAdmin.auth.getUser(payload.authToken);

      if (!authErr && user) {
        verifiedUserId = user.id;
        verifiedUserEmail = user.email || null;
        verifiedUserName =
          user.user_metadata?.full_name || user.email?.split("@")[0] || null;
      }
    }

    const isAuth = Boolean(verifiedUserId);
    const submissionType = isAuth ? "authenticated" : "guest";

    const record = {
      kind: payload.kind,
      name: payload.name.trim(), // Name of the applicant/lead for this enquiry
      phone: payload.phone.trim(),
      email: payload.email?.trim() || verifiedUserEmail || null,
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
      user_id: verifiedUserId, // Guaranteed safe: extracted strictly from verified token
      submission_type: submissionType,
    };

    // Use admin client so it reliably inserts into database
    const { data, error } = await supabaseAdmin
      .from("leads")
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert lead error:", error);
      return { success: false, error: error.message };
    }

    const inserted = data;
    const uid = inserted
      ? (inserted.uid as string) || `RP-${inserted.id.slice(0, 5).toUpperCase()}`
      : undefined;

    // Log the submission in activity_logs
    await logActivity({
      actor_id: verifiedUserId,
      actor_name: verifiedUserName || payload.name.trim(),
      actor_email: verifiedUserEmail || payload.email?.trim() || null,
      action: "lead_submitted",
      entity_type: "lead",
      entity_id: inserted?.id,
      details: {
        uid,
        kind: payload.kind,
        submission_type: submissionType,
        applicant_name: payload.name.trim(),
        authenticated_account: verifiedUserEmail || "Guest",
        course_or_service:
          payload.course || payload.branding_service || "Institutional Consulting",
      },
    });

    return { success: true, uid };
  } catch (err: any) {
    console.error("Unexpected error in submitLead:", err);
    return {
      success: false,
      error: err?.message || "Something went wrong. Please try again.",
    };
  }
}
