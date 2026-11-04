"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

type Lead = {
  id: string;
  uid?: string;
  kind: "student" | "institution" | "branding";
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  exam: string | null;
  course: string | null;
  academic_year: string | null;
  organization_name: string | null;
  designation: string | null;
  branding_service: string | null;
  requirement_notes: string | null;
  status: "new" | "contacted" | "closed";
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [fetchingLeads, setFetchingLeads] = useState(true);
  const [filter, setFilter] = useState<"all" | "student" | "institution" | "branding">("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Check Auth State
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      setLoading(false);
      loadLeads();
    }
    checkAuth();
  }, [router]);

  async function loadLeads() {
    setFetchingLeads(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLeads(data as Lead[]);
    }
    setFetchingLeads(false);
  }

  async function handleStatusChange(leadId: string, newStatus: "new" | "contacted" | "closed") {
    setUpdatingId(leadId);
    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", leadId);

    if (!error) {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
    }
    setUpdatingId(null);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Filter & Search logic
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchKind = filter === "all" || l.kind === filter;
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        l.name.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.course && l.course.toLowerCase().includes(q)) ||
        (l.organization_name && l.organization_name.toLowerCase().includes(q)) ||
        (l.city && l.city.toLowerCase().includes(q));

      return matchKind && matchSearch;
    });
  }, [leads, filter, search]);

  const stats = useMemo(() => {
    return {
      total: leads.length,
      students: leads.filter((l) => l.kind === "student").length,
      institutions: leads.filter((l) => l.kind === "institution").length,
      branding: leads.filter((l) => l.kind === "branding").length,
      newLeads: leads.filter((l) => l.status === "new").length,
    };
  }, [leads]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-ink border-t-brand rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink/75">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Generate a clean short human-readable user ID
  const displayUid = user ? `USR-${user.id.slice(0, 6).toUpperCase()}` : "";
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-paper text-ink pb-16">
      {/* Top Navigation */}
      <header className="bg-white border-b border-ink/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="relative block h-14 w-48 overflow-hidden">
              <Image
                src="/logo.jpeg"
                alt="The Right Path Consultants"
                fill
                priority
                className="object-contain scale-[1.6]"
              />
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-ink text-white">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-ink leading-none">{userName}</p>
              <div className="flex items-center justify-end gap-1.5 mt-1">
                <span className="text-[11px] font-mono text-ink/60 bg-paper px-1.5 py-0.5 rounded border border-ink/10">
                  {displayUid}
                </span>
                <span className="text-xs text-ink/60">{user?.email}</span>
              </div>
            </div>

            <Link
              href="/"
              className="text-xs font-semibold text-ink/70 hover:text-ink px-3 py-2 rounded-lg hover:bg-paper transition-colors hidden md:block"
            >
              Website ↗
            </Link>

            <button
              onClick={handleSignOut}
              className="text-xs font-bold text-ink bg-paper border border-ink/15 hover:border-ink/40 px-3.5 py-2 rounded-lg transition-all"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Welcome & Stats */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-ink">
                Enquiries & Lead Management
              </h1>
              <p className="text-sm text-ink/70 mt-1">
                Monitor student applications, institutional partnerships, and branding requests.
              </p>
            </div>
            <button
              onClick={loadLeads}
              disabled={fetchingLeads}
              className="self-start sm:self-auto px-4 py-2 text-xs font-bold rounded-lg bg-white border border-ink/10 hover:border-ink/30 shadow-sm flex items-center gap-2"
            >
              <svg className={`w-3.5 h-3.5 ${fetchingLeads ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{fetchingLeads ? "Refreshing..." : "Refresh leads"}</span>
            </button>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
            <div className="bg-white p-4 rounded-xl border border-ink/10 shadow-sm">
              <p className="text-xs font-bold uppercase text-ink/60">Total Leads</p>
              <p className="text-2xl font-bold font-display text-ink mt-1">{stats.total}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-ink/10 shadow-sm">
              <p className="text-xs font-bold uppercase text-ink/60">New Enquiries</p>
              <p className="text-2xl font-bold font-display text-brand mt-1">{stats.newLeads}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-ink/10 shadow-sm">
              <p className="text-xs font-bold uppercase text-ink/60">Students</p>
              <p className="text-2xl font-bold font-display text-navy mt-1">{stats.students}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-ink/10 shadow-sm">
              <p className="text-xs font-bold uppercase text-ink/60">Institutions</p>
              <p className="text-2xl font-bold font-display text-ink mt-1">{stats.institutions}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-ink/10 shadow-sm col-span-2 lg:col-span-1">
              <p className="text-xs font-bold uppercase text-ink/60">Branding</p>
              <p className="text-2xl font-bold font-display text-ink mt-1">{stats.branding}</p>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-ink/10 shadow-sm mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex rounded-xl bg-paper p-1 border border-ink/10 overflow-x-auto">
            {(["all", "student", "institution", "branding"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`py-1.5 px-3.5 text-xs font-bold rounded-lg transition-all capitalize whitespace-nowrap ${
                  filter === cat
                    ? "bg-ink text-white shadow-sm"
                    : "text-ink/70 hover:text-ink"
                }`}
              >
                {cat === "all" ? `All (${leads.length})` : cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, course, college..."
              className="w-full text-xs py-2 pl-9 pr-3 rounded-lg bg-paper border border-ink/15 focus:outline-none focus:border-brand"
            />
            <svg
              className="w-4 h-4 text-ink/40 absolute left-3 top-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-2xl border border-ink/10 shadow-sm overflow-hidden">
          {fetchingLeads ? (
            <div className="py-16 text-center text-sm text-ink/60">Loading enquiries...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="py-16 text-center text-sm text-ink/60">
              No enquiries found matching your filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-paper text-ink/70 uppercase text-[11px] font-bold border-b border-ink/10">
                  <tr>
                    <th className="py-3 px-4">UID</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Requirement / Details</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5 font-medium">
                  {filteredLeads.map((lead) => {
                    // Clean, short human-readable reference UID
                    const cleanUid =
                      lead.uid || `RP-${lead.id.slice(0, 5).toUpperCase()}`;

                    return (
                      <tr key={lead.id} className="hover:bg-paper/50 transition-colors">
                        {/* Short UID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-ink">
                          <span className="px-2 py-1 rounded bg-ink/5 border border-ink/10">
                            {cleanUid}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                              lead.kind === "student"
                                ? "bg-blue-100 text-blue-900"
                                : lead.kind === "institution"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-purple-100 text-purple-900"
                            }`}
                          >
                            {lead.kind}
                          </span>
                        </td>

                        {/* Contact info */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-ink text-sm">{lead.name}</p>
                          <p className="text-ink/75 font-mono text-[11px]">{lead.phone}</p>
                          {lead.email && <p className="text-ink/60 text-[11px]">{lead.email}</p>}
                          {lead.city && <p className="text-ink/50 text-[11px] mt-0.5">📍 {lead.city}</p>}
                        </td>

                        {/* Details */}
                        <td className="py-3.5 px-4 max-w-xs">
                          {lead.kind === "student" && (
                            <div>
                              <p className="font-semibold text-ink">
                                {lead.course || "General Counselling"}
                              </p>
                              <p className="text-ink/60 text-[11px]">
                                Exam: {lead.exam || "N/A"} • Year: {lead.academic_year || "N/A"}
                              </p>
                            </div>
                          )}

                          {lead.kind === "institution" && (
                            <div>
                              <p className="font-semibold text-ink">
                                {lead.organization_name}
                              </p>
                              {lead.designation && (
                                <p className="text-ink/60 text-[11px]">{lead.designation}</p>
                              )}
                              {lead.requirement_notes && (
                                <p className="text-ink/70 text-[11px] italic mt-1 line-clamp-2">
                                  &ldquo;{lead.requirement_notes}&rdquo;
                                </p>
                              )}
                            </div>
                          )}

                          {lead.kind === "branding" && (
                            <div>
                              <p className="font-semibold text-ink">
                                {lead.organization_name}
                              </p>
                              <p className="text-purple-700 font-semibold text-[11px]">
                                {lead.branding_service || "Branding Services"}
                              </p>
                              {lead.requirement_notes && (
                                <p className="text-ink/70 text-[11px] italic mt-1 line-clamp-2">
                                  &ldquo;{lead.requirement_notes}&rdquo;
                                </p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Status Change */}
                        <td className="py-3.5 px-4">
                          <select
                            disabled={updatingId === lead.id}
                            value={lead.status}
                            onChange={(e) =>
                              handleStatusChange(
                                lead.id,
                                e.target.value as "new" | "contacted" | "closed"
                              )
                            }
                            className={`py-1 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              lead.status === "new"
                                ? "bg-amber-50 text-amber-900 border-amber-300"
                                : lead.status === "contacted"
                                ? "bg-blue-50 text-blue-900 border-blue-300"
                                : "bg-emerald-50 text-emerald-900 border-emerald-300"
                            }`}
                          >
                            <option value="new">● New</option>
                            <option value="contacted">● Contacted</option>
                            <option value="closed">● Closed</option>
                          </select>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-ink/60 text-[11px] whitespace-nowrap">
                          {new Date(lead.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
