"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { syncUserProfile } from "@/app/actions/authActions";
import {
  getAdminOverview,
  getAdminLeads,
  updateLeadStatus,
  updateLeadNotes,
  getAdminUsers,
  getAdminActivityLogs,
  exportLeadsCSV,
} from "@/app/actions/adminActions";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "leads" | "users" | "activity">("overview");

  // Overview Data
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  // Leads Data
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadSubmissionType, setLeadSubmissionType] = useState<"all" | "guest" | "authenticated">("all");
  const [leadKind, setLeadKind] = useState<"all" | "student" | "institution" | "branding">("all");
  const [leadStatus, setLeadStatus] = useState<"all" | "new" | "contacted" | "closed">("all");
  const [leadSort, setLeadSort] = useState<"newest" | "oldest">("newest");
  const [selectedLead, setSelectedLead] = useState<any>(null); // For detail view modal
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Users Data
  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<"all" | "student" | "institution">("all");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "admin" | "user">("all");

  // Activity Logs
  const [logsLoading, setLogsLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Verify Admin Role
  useEffect(() => {
    async function verifyAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const res = await syncUserProfile({
        userId: session.user.id,
        email: session.user.email || "",
      });

      if (!res.success || res.profile?.role !== "admin") {
        // Non-admin attempted access -> redirect to proper portal
        router.push("/dashboard");
        return;
      }

      setCurrentUser(res.profile);
      setAuthChecking(false);
    }

    verifyAdmin();
  }, [router]);

  // Load Overview Data
  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    const res = await getAdminOverview();
    if (res.success) {
      setStats(res.stats);
      setRecentLeads(res.recentLeads || []);
      setRecentUsers(res.recentUsers || []);
    }
    setOverviewLoading(false);
  }, []);

  // Load Leads Data
  const loadLeads = useCallback(async () => {
    setLeadsLoading(true);
    const res = await getAdminLeads({
      page: currentPage,
      limit: 12,
      search: leadSearch,
      submissionType: leadSubmissionType,
      kind: leadKind,
      status: leadStatus,
      sortBy: leadSort,
    });

    if (res.success) {
      setLeads(res.leads);
      setTotalLeadsCount(res.total);
      setTotalPages(res.totalPages);
    }
    setLeadsLoading(false);
  }, [currentPage, leadSearch, leadSubmissionType, leadKind, leadStatus, leadSort]);

  // Load Users Data
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    const res = await getAdminUsers({
      search: userSearch,
      userType: userTypeFilter,
      role: userRoleFilter,
    });
    if (res.success) {
      setUsers(res.users);
    }
    setUsersLoading(false);
  }, [userSearch, userTypeFilter, userRoleFilter]);

  // Load Activity Logs
  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    const res = await getAdminActivityLogs(50);
    if (res.success) {
      setLogs(res.logs);
    }
    setLogsLoading(false);
  }, []);

  // Trigger loads based on active tab
  useEffect(() => {
    if (authChecking) return;
    if (activeTab === "overview") loadOverview();
    if (activeTab === "leads") loadLeads();
    if (activeTab === "users") loadUsers();
    if (activeTab === "activity") loadLogs();
  }, [authChecking, activeTab, loadOverview, loadLeads, loadUsers, loadLogs]);

  // Status Change Handler
  const handleStatusChange = async (leadId: string, newStatus: "new" | "contacted" | "closed") => {
    setUpdatingStatusId(leadId);
    const res = await updateLeadStatus({
      leadId,
      newStatus,
      adminId: currentUser?.id,
      adminEmail: currentUser?.email,
    });
    setUpdatingStatusId(null);

    if (res.success) {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus });
      }
      showToast(`Lead status updated to ${newStatus}`);
    } else {
      showToast("Failed to update status");
    }
  };

  // Save Internal Note Handler
  const handleSaveNote = async () => {
    if (!selectedLead) return;
    setSavingNote(true);
    const res = await updateLeadNotes({
      leadId: selectedLead.id,
      internalNotes: noteDraft,
      adminId: currentUser?.id,
      adminEmail: currentUser?.email,
    });
    setSavingNote(false);

    if (res.success) {
      setSelectedLead({ ...selectedLead, internal_notes: noteDraft });
      setLeads((prev) =>
        prev.map((l) => (l.id === selectedLead.id ? { ...l, internal_notes: noteDraft } : l))
      );
      showToast("Internal note saved successfully");
    } else {
      showToast("Failed to save note");
    }
  };

  // CSV Export Handler
  const handleExportCSV = async () => {
    const res = await exportLeadsCSV();
    if (res.success && res.csv) {
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `rightpath_leads_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Leads exported to CSV");
    } else {
      showToast("Failed to export leads");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-ink border-t-brand rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink/75">Authenticating Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-ink text-white px-4 py-3 rounded-xl shadow-2xl border border-brand/30 flex items-center gap-2 text-xs font-semibold animate-bounce">
          <span className="w-2 h-2 rounded-full bg-brand" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-ink/10 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="relative block h-14 w-44 overflow-hidden">
              <Image
                src="/logo.jpeg"
                alt="The Right Path"
                fill
                priority
                className="object-contain scale-[1.6]"
              />
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md bg-ink text-brand">
                Admin Console
              </span>
              <span className="text-xs font-mono text-ink/50 bg-paper px-2 py-0.5 rounded border border-ink/10">
                RBAC: Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-ink leading-tight">{currentUser?.full_name || "Administrator"}</p>
              <p className="text-xs text-ink/60">{currentUser?.email}</p>
            </div>
            <Link
              href="/"
              className="text-xs font-semibold text-ink/70 hover:text-ink px-3 py-2 rounded-lg hover:bg-paper transition-colors hidden md:block"
            >
              Live Site ↗
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs font-bold text-ink bg-paper border border-ink/15 hover:border-ink/40 px-3.5 py-2 rounded-lg transition-all"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-6 border-t border-ink/5 text-xs font-bold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3.5 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-brand text-ink"
                : "border-transparent text-ink/60 hover:text-ink"
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`py-3.5 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "leads"
                ? "border-brand text-ink"
                : "border-transparent text-ink/60 hover:text-ink"
            }`}
          >
            📋 All Leads
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`py-3.5 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "users"
                ? "border-brand text-ink"
                : "border-transparent text-ink/60 hover:text-ink"
            }`}
          >
            👥 Registered Users
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`py-3.5 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "activity"
                ? "border-brand text-ink"
                : "border-transparent text-ink/60 hover:text-ink"
            }`}
          >
            ⏱️ Activity Trail
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================= */}
        {activeTab === "overview" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-ink">
                  Executive Overview
                </h1>
                <p className="text-sm text-ink/70 mt-1">
                  High-level metrics across lead generations, registrations, and conversion health.
                </p>
              </div>
              <button
                onClick={loadOverview}
                disabled={overviewLoading}
                className="self-start sm:self-auto px-3.5 py-2 text-xs font-bold rounded-lg bg-white border border-ink/10 hover:border-ink/30 shadow-sm flex items-center gap-2"
              >
                <span>{overviewLoading ? "Refreshing..." : "↻ Refresh Stats"}</span>
              </button>
            </div>

            {overviewLoading ? (
              <div className="py-20 text-center text-ink/60 text-sm">Loading executive summary...</div>
            ) : (
              <>
                {/* Metric Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                  <div className="bg-white p-4 rounded-2xl border border-ink/10 shadow-sm">
                    <p className="text-[11px] font-bold uppercase text-ink/60">Total Leads</p>
                    <p className="text-3xl font-bold font-display text-ink mt-1">{stats?.totalLeads || 0}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-ink/60 font-semibold">
                      <span className="text-brand font-bold">{stats?.authLeads || 0}</span> auth •{" "}
                      <span>{stats?.guestLeads || 0}</span> guest
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-ink/10 shadow-sm">
                    <p className="text-[11px] font-bold uppercase text-ink/60">Registered Users</p>
                    <p className="text-3xl font-bold font-display text-navy mt-1">{stats?.totalUsers || 0}</p>
                    <p className="mt-2 text-[10px] text-ink/60 font-semibold">Active in database</p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-ink/10 shadow-sm">
                    <p className="text-[11px] font-bold uppercase text-ink/60">Students</p>
                    <p className="text-3xl font-bold font-display text-blue-900 mt-1">{stats?.totalStudents || 0}</p>
                    <p className="mt-2 text-[10px] text-ink/60 font-semibold">Registered students</p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-ink/10 shadow-sm">
                    <p className="text-[11px] font-bold uppercase text-ink/60">Institutions</p>
                    <p className="text-3xl font-bold font-display text-purple-900 mt-1">{stats?.totalInstitutions || 0}</p>
                    <p className="mt-2 text-[10px] text-ink/60 font-semibold">Registered colleges</p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-ink/10 shadow-sm">
                    <p className="text-[11px] font-bold uppercase text-ink/60">New Enquiries</p>
                    <p className="text-3xl font-bold font-display text-amber-600 mt-1">{stats?.newLeads || 0}</p>
                    <p className="mt-2 text-[10px] text-amber-700 font-bold">Needs follow-up</p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-ink/10 shadow-sm">
                    <p className="text-[11px] font-bold uppercase text-ink/60">Conversion Rate</p>
                    <p className="text-3xl font-bold font-display text-emerald-700 mt-1">{stats?.conversionRate || 0}%</p>
                    <p className="mt-2 text-[10px] text-emerald-800 font-bold">Contacted / closed</p>
                  </div>
                </div>

                {/* Submissions by Type & Recent Activity Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Leads Submissions */}
                  <div className="bg-white p-5 rounded-3xl border border-ink/10 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold font-display text-base text-ink">Recent Form Submissions</h3>
                      <button
                        onClick={() => setActiveTab("leads")}
                        className="text-xs font-bold text-navy hover:underline"
                      >
                        View All Leads →
                      </button>
                    </div>

                    <div className="divide-y divide-ink/5">
                      {recentLeads.length === 0 ? (
                        <p className="py-6 text-center text-xs text-ink/50">No submissions recorded yet.</p>
                      ) : (
                        recentLeads.map((lead) => (
                          <div key={lead.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-ink">{lead.name}</span>
                                <span className="font-mono text-[10px] bg-paper px-1.5 py-0.5 rounded text-ink/60">
                                  {lead.uid || "LEAD"}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                    lead.submission_type === "authenticated"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {lead.submission_type || "guest"}
                                </span>
                              </div>
                              <p className="text-ink/60 text-[11px] mt-0.5">
                                {lead.course || lead.branding_service || lead.kind}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                                lead.status === "new"
                                  ? "bg-amber-100 text-amber-800"
                                  : lead.status === "contacted"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {lead.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Recent Registrations */}
                  <div className="bg-white p-5 rounded-3xl border border-ink/10 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold font-display text-base text-ink">Recent Registered Users</h3>
                      <button
                        onClick={() => setActiveTab("users")}
                        className="text-xs font-bold text-navy hover:underline"
                      >
                        View All Users →
                      </button>
                    </div>

                    <div className="divide-y divide-ink/5">
                      {recentUsers.length === 0 ? (
                        <p className="py-6 text-center text-xs text-ink/50">No users registered yet.</p>
                      ) : (
                        recentUsers.map((u) => (
                          <div key={u.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                            <div>
                              <p className="font-bold text-ink">{u.full_name || "User"}</p>
                              <p className="text-ink/60 text-[11px]">{u.email}</p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                  u.user_type === "student"
                                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                                    : u.user_type === "institution"
                                    ? "bg-purple-50 text-purple-800 border border-purple-200"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {u.user_type || "unassigned"}
                              </span>
                              <p className="text-[10px] text-ink/50 mt-1">
                                {new Date(u.created_at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ALL LEADS (CRM & FULL MANAGEMENT) */}
        {/* ========================================================= */}
        {activeTab === "leads" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-ink">
                  Lead Management CRM
                </h1>
                <p className="text-sm text-ink/70 mt-1">
                  Search, review full responses, filter by guest/auth, assign statuses, and record internal notes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 text-xs font-bold rounded-lg bg-brand text-ink hover:brightness-105 shadow-sm flex items-center gap-1.5 transition-all"
                >
                  📥 Export CSV
                </button>
                <button
                  onClick={loadLeads}
                  disabled={leadsLoading}
                  className="px-3.5 py-2 text-xs font-bold rounded-lg bg-white border border-ink/10 hover:border-ink/30 shadow-sm flex items-center gap-1.5"
                >
                  ↻ Refresh
                </button>
              </div>
            </div>

            {/* Filter & Search Bar Controls */}
            <div className="bg-white p-4 rounded-2xl border border-ink/10 shadow-sm mb-6 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Search */}
                <div className="lg:col-span-2 relative">
                  <input
                    type="text"
                    value={leadSearch}
                    onChange={(e) => {
                      setLeadSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search name, email, phone, Lead UID..."
                    className="w-full text-xs py-2 pl-9 pr-3 rounded-lg bg-paper border border-ink/15 focus:outline-none focus:border-brand"
                  />
                  <svg className="w-4 h-4 text-ink/40 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Submission Type */}
                <select
                  value={leadSubmissionType}
                  onChange={(e: any) => {
                    setLeadSubmissionType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs py-2 px-3 rounded-lg bg-paper border border-ink/15 font-semibold text-ink"
                >
                  <option value="all">Submission: All (Guest & Auth)</option>
                  <option value="guest">Guest Submissions Only</option>
                  <option value="authenticated">Authenticated (Registered)</option>
                </select>

                {/* Category */}
                <select
                  value={leadKind}
                  onChange={(e: any) => {
                    setLeadKind(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs py-2 px-3 rounded-lg bg-paper border border-ink/15 font-semibold text-ink"
                >
                  <option value="all">Category: All</option>
                  <option value="student">Student</option>
                  <option value="institution">Institution</option>
                  <option value="branding">Branding</option>
                </select>

                {/* Status & Sort */}
                <div className="flex gap-2">
                  <select
                    value={leadStatus}
                    onChange={(e: any) => {
                      setLeadStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-1/2 text-xs py-2 px-2.5 rounded-lg bg-paper border border-ink/15 font-semibold text-ink"
                  >
                    <option value="all">Status: All</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>

                  <select
                    value={leadSort}
                    onChange={(e: any) => {
                      setLeadSort(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-1/2 text-xs py-2 px-2.5 rounded-lg bg-paper border border-ink/15 font-semibold text-ink"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-2xl border border-ink/10 shadow-sm overflow-hidden mb-6">
              {leadsLoading ? (
                <div className="py-20 text-center text-xs text-ink/60">Fetching leads...</div>
              ) : leads.length === 0 ? (
                <div className="py-20 text-center text-xs text-ink/60">No leads matched your criteria.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-paper text-ink/70 uppercase text-[11px] font-bold border-b border-ink/10">
                      <tr>
                        <th className="py-3 px-4">UID</th>
                        <th className="py-3 px-4">Submission</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Interest / Service</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5 font-medium">
                      {leads.map((l) => (
                        <tr key={l.id} className="hover:bg-paper/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-ink">
                            <span className="px-2 py-0.5 rounded bg-ink/5 border border-ink/10">
                              {l.uid || `RP-${l.id.slice(0, 5).toUpperCase()}`}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-block w-fit px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                  l.submission_type === "authenticated"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {l.submission_type || "guest"}
                              </span>
                              <span className="text-[10px] font-semibold text-ink/60 capitalize">
                                {l.kind}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-ink text-sm">{l.name}</p>
                            <p className="font-mono text-[11px] text-ink/75">{l.phone}</p>
                            {l.email && <p className="text-[11px] text-ink/60">{l.email}</p>}
                            {l.city && <p className="text-[10px] text-ink/50 mt-0.5">📍 {l.city}</p>}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="font-semibold text-ink truncate">
                              {l.course || l.branding_service || l.organization_name || "General"}
                            </p>
                            {l.exam && (
                              <p className="text-[10px] text-ink/60">
                                Exam: {l.exam} • Year: {l.academic_year || "N/A"}
                              </p>
                            )}
                            {l.internal_notes && (
                              <span className="inline-block mt-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                📝 Note added
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              disabled={updatingStatusId === l.id}
                              value={l.status}
                              onChange={(e: any) => handleStatusChange(l.id, e.target.value)}
                              className={`py-1 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                l.status === "new"
                                  ? "bg-amber-50 text-amber-900 border-amber-300"
                                  : l.status === "contacted"
                                  ? "bg-blue-50 text-blue-900 border-blue-300"
                                  : "bg-emerald-50 text-emerald-900 border-emerald-300"
                              }`}
                            >
                              <option value="new">● New</option>
                              <option value="contacted">● Contacted</option>
                              <option value="closed">● Closed</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-ink/60 text-[11px] whitespace-nowrap">
                            {new Date(l.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedLead(l);
                                setNoteDraft(l.internal_notes || "");
                              }}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-ink text-white hover:bg-navy transition-all"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Footer */}
              <div className="bg-paper px-4 py-3 border-t border-ink/10 flex items-center justify-between text-xs text-ink/70">
                <span>
                  Showing {leads.length} of {totalLeadsCount} leads
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage <= 1 || leadsLoading}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-white border border-ink/15 rounded-md disabled:opacity-40 font-bold"
                  >
                    Previous
                  </button>
                  <span className="font-semibold">
                    Page {currentPage} of {Math.max(1, totalPages)}
                  </span>
                  <button
                    disabled={currentPage >= totalPages || leadsLoading}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3 py-1 bg-white border border-ink/15 rounded-md disabled:opacity-40 font-bold"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* DETAIL & NOTES MODAL */}
            {selectedLead && (
              <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-ink/10">
                  <div className="flex items-center justify-between pb-4 border-b border-ink/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold bg-ink text-white px-2 py-0.5 rounded">
                          {selectedLead.uid || "LEAD"}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-ink/60">
                          {selectedLead.kind} lead
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            selectedLead.submission_type === "authenticated"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {selectedLead.submission_type || "guest"}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold font-display text-ink mt-1">
                        {selectedLead.name}
                      </h2>
                    </div>

                    <button
                      onClick={() => setSelectedLead(null)}
                      className="w-8 h-8 rounded-full bg-paper text-ink/70 hover:text-ink font-bold flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Body Information */}
                  <div className="py-4 space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3 bg-paper p-4 rounded-2xl">
                      <div>
                        <span className="text-ink/50 uppercase text-[10px] font-bold">Phone Number</span>
                        <p className="font-bold text-sm text-ink font-mono mt-0.5">{selectedLead.phone}</p>
                      </div>
                      <div>
                        <span className="text-ink/50 uppercase text-[10px] font-bold">Email Address</span>
                        <p className="font-bold text-sm text-ink mt-0.5">{selectedLead.email || "Not provided"}</p>
                      </div>
                      <div>
                        <span className="text-ink/50 uppercase text-[10px] font-bold">City / Region</span>
                        <p className="font-bold text-ink mt-0.5">{selectedLead.city || "Not provided"}</p>
                      </div>
                      <div>
                        <span className="text-ink/50 uppercase text-[10px] font-bold">Submitted Date</span>
                        <p className="font-bold text-ink mt-0.5">
                          {new Date(selectedLead.created_at).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    {/* Specific Field Responses */}
                    <div className="p-4 rounded-2xl border border-ink/10 space-y-2">
                      <h4 className="font-bold text-ink uppercase text-[11px] tracking-wider mb-1">
                        Submitted Form Responses
                      </h4>
                      {selectedLead.course && (
                        <p><strong className="text-ink/70">Preferred Course:</strong> {selectedLead.course}</p>
                      )}
                      {selectedLead.exam && (
                        <p><strong className="text-ink/70">Qualifying Exam:</strong> {selectedLead.exam}</p>
                      )}
                      {selectedLead.academic_year && (
                        <p><strong className="text-ink/70">Academic Year:</strong> {selectedLead.academic_year}</p>
                      )}
                      {selectedLead.organization_name && (
                        <p><strong className="text-ink/70">Organization / College:</strong> {selectedLead.organization_name}</p>
                      )}
                      {selectedLead.designation && (
                        <p><strong className="text-ink/70">Designation:</strong> {selectedLead.designation}</p>
                      )}
                      {selectedLead.branding_service && (
                        <p><strong className="text-ink/70">Branding Service:</strong> {selectedLead.branding_service}</p>
                      )}
                      {selectedLead.requirement_notes && (
                        <div className="mt-2 pt-2 border-t border-ink/10">
                          <strong className="text-ink/70 block mb-1">Requirement Notes:</strong>
                          <p className="p-3 rounded-xl bg-paper text-ink leading-relaxed whitespace-pre-wrap">
                            {selectedLead.requirement_notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Internal Administrative Notes */}
                    <div className="p-4 rounded-2xl border border-brand/40 bg-brand/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-ink text-xs uppercase tracking-wider">
                          Internal Notes & Follow-Up History
                        </h4>
                        <span className="text-[10px] text-ink/60">Visible only to admins</span>
                      </div>
                      <textarea
                        rows={3}
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Add internal notes about calls, counselling discussions, or fee arrangements..."
                        className="w-full text-xs p-3 rounded-xl border border-ink/15 bg-white focus:outline-none focus:border-brand"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={handleSaveNote}
                          disabled={savingNote}
                          className="px-4 py-2 bg-ink text-white rounded-lg text-xs font-bold hover:bg-navy disabled:opacity-50"
                        >
                          {savingNote ? "Saving Note..." : "Save Note"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-ink/10 flex justify-end">
                    <button
                      onClick={() => setSelectedLead(null)}
                      className="px-4 py-2 rounded-xl bg-paper text-ink font-bold text-xs"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: REGISTERED USERS */}
        {/* ========================================================= */}
        {activeTab === "users" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-ink">
                  Registered Users Directory
                </h1>
                <p className="text-sm text-ink/70 mt-1">
                  View all registered accounts independently of the lead submissions database.
                </p>
              </div>

              <button
                onClick={loadUsers}
                disabled={usersLoading}
                className="self-start sm:self-auto px-3.5 py-2 text-xs font-bold rounded-lg bg-white border border-ink/10 hover:border-ink/30 shadow-sm flex items-center gap-1.5"
              >
                ↻ Refresh Users
              </button>
            </div>

            {/* Filter Controls */}
            <div className="bg-white p-4 rounded-2xl border border-ink/10 shadow-sm mb-6 flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by user name, email, or phone..."
                className="flex-1 text-xs py-2 px-3 rounded-lg bg-paper border border-ink/15 focus:outline-none focus:border-brand"
              />

              <select
                value={userTypeFilter}
                onChange={(e: any) => setUserTypeFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-lg bg-paper border border-ink/15 font-semibold text-ink"
              >
                <option value="all">User Type: All</option>
                <option value="student">Student</option>
                <option value="institution">Institution</option>
              </select>

              <select
                value={userRoleFilter}
                onChange={(e: any) => setUserRoleFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-lg bg-paper border border-ink/15 font-semibold text-ink"
              >
                <option value="all">Role: All</option>
                <option value="admin">Admins</option>
                <option value="user">Regular Users</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-ink/10 shadow-sm overflow-hidden">
              {usersLoading ? (
                <div className="py-20 text-center text-xs text-ink/60">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="py-20 text-center text-xs text-ink/60">No registered users found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-paper text-ink/70 uppercase text-[11px] font-bold border-b border-ink/10">
                      <tr>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">User ID</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Registered</th>
                        <th className="py-3 px-4">Last Login</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5 font-medium">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-paper/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-ink text-sm">{u.full_name || "Unnamed User"}</p>
                            <p className="text-ink/60 text-[11px]">{u.email}</p>
                            {u.phone && <p className="text-ink/50 text-[10px] font-mono">{u.phone}</p>}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-ink/70">
                            <span className="px-2 py-0.5 rounded bg-ink/5 border border-ink/10">
                              USR-{u.id.slice(0, 6).toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                u.user_type === "student"
                                  ? "bg-blue-100 text-blue-800"
                                  : u.user_type === "institution"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {u.user_type || "Unassigned"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                                u.role === "admin"
                                  ? "bg-brand/20 text-ink border border-brand/40 font-extrabold"
                                  : "bg-paper text-ink/70"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Active
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-ink/60 text-[11px] whitespace-nowrap">
                            {new Date(u.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-ink/60 text-[11px] whitespace-nowrap">
                            {u.last_login_at
                              ? new Date(u.last_login_at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Never"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ACTIVITY AUDIT TRAIL */}
        {/* ========================================================= */}
        {activeTab === "activity" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-ink">
                  System Audit Trail & Activity
                </h1>
                <p className="text-sm text-ink/70 mt-1">
                  Historical database-backed records of form submissions, user registrations, and administrative updates.
                </p>
              </div>

              <button
                onClick={loadLogs}
                disabled={logsLoading}
                className="self-start sm:self-auto px-3.5 py-2 text-xs font-bold rounded-lg bg-white border border-ink/10 hover:border-ink/30 shadow-sm flex items-center gap-1.5"
              >
                ↻ Refresh Logs
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-ink/10 p-6 shadow-sm">
              {logsLoading ? (
                <div className="py-16 text-center text-xs text-ink/60">Loading activity trail...</div>
              ) : logs.length === 0 ? (
                <div className="py-16 text-center text-xs text-ink/60">No activity recorded yet.</div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 rounded-2xl bg-paper/60 border border-ink/5 hover:border-ink/15 transition-all text-xs"
                    >
                      <div className="w-8 h-8 rounded-full bg-ink text-brand flex items-center justify-center font-bold flex-shrink-0 text-sm">
                        {log.action.includes("lead")
                          ? "📋"
                          : log.action.includes("user")
                          ? "👤"
                          : "⚙️"}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <p className="font-bold text-ink">
                            {log.action.replace(/_/g, " ").toUpperCase()}
                          </p>
                          <span className="text-[11px] text-ink/50 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <p className="text-ink/75 mt-0.5">
                          Triggered by: <span className="font-semibold text-ink">{log.actor_name || log.actor_email || "Guest Visitor"}</span>
                          {log.actor_email && ` (${log.actor_email})`}
                        </p>

                        {log.details && (
                          <div className="mt-2 p-2.5 rounded-xl bg-white border border-ink/10 text-[11px] font-mono text-ink/80">
                            {Object.entries(log.details).map(([k, v]) => (
                              <span key={k} className="inline-block mr-3">
                                <strong>{k}:</strong> {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
