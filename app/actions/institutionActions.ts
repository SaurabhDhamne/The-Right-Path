"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getInstitutionDashboardData(userId: string, userEmail?: string) {
  try {
    // 1. Fetch institution profile
    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profErr) throw profErr;

    // 2. Fetch institution's submitted projects/consulting requests
    let query = supabaseAdmin
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (userEmail) {
      query = query.or(`user_id.eq.${userId},email.eq.${userEmail.trim().toLowerCase()}`);
    } else {
      query = query.eq("user_id", userId);
    }

    const { data: leads, error: leadsErr } = await query;
    if (leadsErr) throw leadsErr;

    const institutionLeads = leads || [];

    // 3. Stats
    const totalRequests = institutionLeads.length;
    const activeProjects = institutionLeads.filter((l) => l.status === "contacted").length;
    const pendingReview = institutionLeads.filter((l) => l.status === "new").length;
    const completedProjects = institutionLeads.filter((l) => l.status === "closed").length;

    // 4. Activity logs
    const { data: logs } = await supabaseAdmin
      .from("activity_logs")
      .select("*")
      .eq("actor_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    return {
      success: true,
      profile,
      leads: institutionLeads,
      stats: {
        totalRequests,
        activeProjects,
        pendingReview,
        completedProjects,
      },
      activityLogs: logs || [],
    };
  } catch (err: any) {
    console.error("getInstitutionDashboardData error:", err);
    return { success: false, error: err.message };
  }
}
