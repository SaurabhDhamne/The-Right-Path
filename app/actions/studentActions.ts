"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getStudentDashboardData(userId: string, userEmail?: string) {
  try {
    // 1. Fetch student profile
    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profErr) throw profErr;

    // 2. Fetch student's submitted applications/enquiries
    // Match by user_id OR email
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

    const studentLeads = leads || [];

    // 3. Stats
    const totalApplications = studentLeads.length;
    const underReview = studentLeads.filter((l) => l.status === "new").length;
    const inProgress = studentLeads.filter((l) => l.status === "contacted").length;
    const completed = studentLeads.filter((l) => l.status === "closed").length;

    // 4. Student activity logs
    const { data: logs } = await supabaseAdmin
      .from("activity_logs")
      .select("*")
      .eq("actor_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    return {
      success: true,
      profile,
      leads: studentLeads,
      stats: {
        totalApplications,
        underReview,
        inProgress,
        completed,
      },
      activityLogs: logs || [],
    };
  } catch (err: any) {
    console.error("getStudentDashboardData error:", err);
    return { success: false, error: err.message };
  }
}
