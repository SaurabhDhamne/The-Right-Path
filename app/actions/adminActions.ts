"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logActivity } from "./authActions";

export type AdminLeadFilter = {
  page?: number;
  limit?: number;
  search?: string;
  submissionType?: "all" | "guest" | "authenticated";
  kind?: "all" | "student" | "institution" | "branding";
  status?: "all" | "new" | "contacted" | "closed";
  sortBy?: "newest" | "oldest";
};

/**
 * 1. Admin Overview Statistics
 */
export async function getAdminOverview() {
  try {
    // 1. Leads counts
    const { data: allLeads, error: leadsErr } = await supabaseAdmin
      .from("leads")
      .select("id, kind, status, submission_type, created_at, name, email, course, branding_service, uid");

    if (leadsErr) throw leadsErr;

    const leads = allLeads || [];
    const totalLeads = leads.length;
    const guestLeads = leads.filter((l) => l.submission_type === "guest").length;
    const authLeads = leads.filter((l) => l.submission_type === "authenticated").length;
    const newLeads = leads.filter((l) => l.status === "new").length;
    const contactedLeads = leads.filter((l) => l.status === "contacted").length;
    const closedLeads = leads.filter((l) => l.status === "closed").length;

    const conversionRate = totalLeads > 0
      ? Math.round(((contactedLeads + closedLeads) / totalLeads) * 100)
      : 0;

    // 2. Users counts
    const { data: allProfiles, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, user_type, role, created_at");

    if (profErr) throw profErr;

    const profiles = allProfiles || [];
    const totalUsers = profiles.length;
    const totalStudents = profiles.filter((p) => p.user_type === "student").length;
    const totalInstitutions = profiles.filter((p) => p.user_type === "institution").length;

    // 3. Recent 5 leads
    const recentLeads = [...leads]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // 4. Recent 5 users
    const recentUsers = [...profiles]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return {
      success: true,
      stats: {
        totalLeads,
        guestLeads,
        authLeads,
        newLeads,
        contactedLeads,
        closedLeads,
        conversionRate,
        totalUsers,
        totalStudents,
        totalInstitutions,
      },
      recentLeads,
      recentUsers,
    };
  } catch (err: any) {
    console.error("getAdminOverview error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 2. All Leads with Search, Filters, Sorting & Pagination
 */
export async function getAdminLeads(filter: AdminLeadFilter = {}) {
  try {
    const page = filter.page || 1;
    const limit = filter.limit || 15;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("leads")
      .select("*", { count: "exact" });

    // Filter by submission type
    if (filter.submissionType && filter.submissionType !== "all") {
      query = query.eq("submission_type", filter.submissionType);
    }

    // Filter by kind
    if (filter.kind && filter.kind !== "all") {
      query = query.eq("kind", filter.kind);
    }

    // Filter by status
    if (filter.status && filter.status !== "all") {
      query = query.eq("status", filter.status);
    }

    // Search query
    if (filter.search && filter.search.trim()) {
      const q = `%${filter.search.trim()}%`;
      query = query.or(
        `name.ilike.${q},email.ilike.${q},phone.ilike.${q},organization_name.ilike.${q},uid.ilike.${q}`
      );
    }

    // Sorting
    const ascending = filter.sortBy === "oldest";
    query = query.order("created_at", { ascending });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      success: true,
      leads: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  } catch (err: any) {
    console.error("getAdminLeads error:", err);
    return { success: false, error: err.message, leads: [], total: 0, totalPages: 1 };
  }
}

/**
 * 3. Update Lead Status
 */
export async function updateLeadStatus(params: {
  leadId: string;
  newStatus: "new" | "contacted" | "closed";
  adminEmail?: string;
  adminId?: string;
}) {
  try {
    const { leadId, newStatus, adminEmail, adminId } = params;

    // Fetch previous status
    const { data: prevLead } = await supabaseAdmin
      .from("leads")
      .select("status, uid, name")
      .eq("id", leadId)
      .single();

    const { error } = await supabaseAdmin
      .from("leads")
      .update({ status: newStatus })
      .eq("id", leadId);

    if (error) throw error;

    // Log the status update
    await logActivity({
      actor_id: adminId || null,
      actor_email: adminEmail || null,
      actor_name: adminEmail ? adminEmail.split("@")[0] : "Admin",
      action: "lead_status_updated",
      entity_type: "lead",
      entity_id: leadId,
      details: {
        lead_uid: prevLead?.uid,
        lead_name: prevLead?.name,
        old_status: prevLead?.status,
        new_status: newStatus,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("updateLeadStatus error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 4. Update Lead Internal Notes
 */
export async function updateLeadNotes(params: {
  leadId: string;
  internalNotes: string;
  adminEmail?: string;
  adminId?: string;
}) {
  try {
    const { leadId, internalNotes, adminEmail, adminId } = params;

    const { data: prevLead } = await supabaseAdmin
      .from("leads")
      .select("uid, name")
      .eq("id", leadId)
      .single();

    const { error } = await supabaseAdmin
      .from("leads")
      .update({ internal_notes: internalNotes.trim() })
      .eq("id", leadId);

    if (error) throw error;

    await logActivity({
      actor_id: adminId || null,
      actor_email: adminEmail || null,
      actor_name: adminEmail ? adminEmail.split("@")[0] : "Admin",
      action: "lead_notes_updated",
      entity_type: "lead",
      entity_id: leadId,
      details: {
        lead_uid: prevLead?.uid,
        lead_name: prevLead?.name,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("updateLeadNotes error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 5. Registered Users List
 */
export async function getAdminUsers(params: {
  search?: string;
  userType?: "all" | "student" | "institution";
  role?: "all" | "admin" | "user";
}) {
  try {
    let query = supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (params.userType && params.userType !== "all") {
      query = query.eq("user_type", params.userType);
    }

    if (params.role && params.role !== "all") {
      query = query.eq("role", params.role);
    }

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      query = query.or(`full_name.ilike.${q},email.ilike.${q},phone.ilike.${q}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, users: data || [] };
  } catch (err: any) {
    console.error("getAdminUsers error:", err);
    return { success: false, error: err.message, users: [] };
  }
}

/**
 * 6. Historical Activity Logs
 */
export async function getAdminActivityLogs(limit: number = 30) {
  try {
    const { data, error } = await supabaseAdmin
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, logs: data || [] };
  } catch (err: any) {
    console.error("getAdminActivityLogs error:", err);
    return { success: false, error: err.message, logs: [] };
  }
}

/**
 * 7. Export Leads to CSV
 */
export async function exportLeadsCSV() {
  try {
    const { data, error } = await supabaseAdmin
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const headers = [
      "Lead UID",
      "Created At",
      "Category",
      "Submission Type",
      "Name",
      "Phone",
      "Email",
      "City",
      "Course / Service",
      "Exam",
      "Academic Year",
      "Institution Name",
      "Designation",
      "Status",
      "Requirement Notes",
      "Internal Notes",
    ];

    const escapeCSV = (str?: string | null) => {
      if (!str) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = (data || []).map((lead) => {
      const uid = lead.uid || `RP-${lead.id.slice(0, 5).toUpperCase()}`;
      const courseOrService = lead.course || lead.branding_service || "";

      return [
        escapeCSV(uid),
        escapeCSV(new Date(lead.created_at).toLocaleString("en-IN")),
        escapeCSV(lead.kind),
        escapeCSV(lead.submission_type),
        escapeCSV(lead.name),
        escapeCSV(lead.phone),
        escapeCSV(lead.email),
        escapeCSV(lead.city),
        escapeCSV(courseOrService),
        escapeCSV(lead.exam),
        escapeCSV(lead.academic_year),
        escapeCSV(lead.organization_name),
        escapeCSV(lead.designation),
        escapeCSV(lead.status),
        escapeCSV(lead.requirement_notes),
        escapeCSV(lead.internal_notes),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    return { success: true, csv: csvContent };
  } catch (err: any) {
    console.error("exportLeadsCSV error:", err);
    return { success: false, error: err.message };
  }
}
