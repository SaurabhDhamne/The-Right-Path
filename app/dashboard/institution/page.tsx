"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { syncUserProfile } from "@/app/actions/authActions";
import { getInstitutionDashboardData } from "@/app/actions/institutionActions";
import { submitLead } from "@/app/actions/submitLead";

export default function InstitutionDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // Request Consultation Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [serviceType, setServiceType] = useState("Admission planning & conversion audit");
  const [instName, setInstName] = useState("");
  const [designation, setDesignation] = useState("");
  const [projectTimeline, setProjectTimeline] = useState("");
  const [projectNotes, setProjectNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Selected Detail Modal
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const loadData = useCallback(async (userId: string, email: string) => {
    setLoading(true);
    const res = await getInstitutionDashboardData(userId, email);
    if (res.success) {
      setUserProfile(res.profile);
      setLeads(res.leads || []);
      setStats(res.stats);
      setActivityLogs(res.activityLogs || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const syncRes = await syncUserProfile({
        userId: session.user.id,
        email: session.user.email || "",
      });

      if (!syncRes.success || !syncRes.profile) {
        router.push("/dashboard");
        return;
      }

      // If user is student, send to student dashboard
      if (syncRes.profile.role === "user" && syncRes.profile.user_type === "student") {
        router.push("/dashboard/student");
        return;
      }

      setUserProfile(syncRes.profile);
      await loadData(session.user.id, session.user.email || "");
    }

    checkAuth();
  }, [router, loadData]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSubmitting(true);
    setModalSuccess(null);

    const isBranding = serviceType.toLowerCase().includes("ads") || serviceType.toLowerCase().includes("branding");

    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token || null;

    const res = await submitLead({
      kind: isBranding ? "branding" : "institution",
      name: userProfile.full_name || "Institution Representative",
      phone: userProfile.phone || "+91 9999999999",
      email: userProfile.email,
      organization_name: instName || "Institutional Client",
      designation: designation || "Management Representative",
      branding_service: isBranding ? serviceType : null,
      requirement_notes: `Timeline: ${projectTimeline || "Immediate"} | Details: ${projectNotes}`,
      consent: true,
      authToken,
    });

    setSubmitting(false);

    if (res.success) {
      setModalSuccess(`Proposal requested! Reference ID: ${res.uid || "Recorded"}`);
      await loadData(userProfile.id, userProfile.email);
      setTimeout(() => {
        setShowRequestModal(false);
        setModalSuccess(null);
        setProjectNotes("");
        setProjectTimeline("");
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-ink border-t-brand rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink/75">Loading Institutional Portal...</p>
        </div>
      </div>
    );
  }

  const instUid = `INST-${userProfile?.id.slice(0, 6).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-paper text-ink pb-20">
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
            <span className="hidden sm:inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-purple-100 text-purple-900 border border-purple-200">
              Institutional Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-ink leading-tight">
                {userProfile?.full_name || "Institution Representative"}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono text-ink/60 bg-paper px-1.5 py-0.5 rounded border border-ink/10">
                  {instUid}
                </span>
                <span className="text-xs text-ink/60">{userProfile?.email}</span>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-ink via-navy to-[#0b2447] text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-ink/10 mb-8 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand text-ink mb-2">
                Institutional Partner
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
                {userProfile?.full_name || "Institutional Client"}
              </h1>
              <p className="text-sm text-mist max-w-xl mt-1 leading-relaxed">
                Manage your college admission strategies, digital lead generation campaigns, and
                institutional development deliverables with The Right Path Consultants.
              </p>
            </div>

            <button
              onClick={() => setShowRequestModal(true)}
              className="self-start md:self-auto px-5 py-3 rounded-xl bg-brand text-ink font-bold text-xs hover:brightness-105 active:scale-95 transition-all shadow-md shadow-brand/20 whitespace-nowrap"
            >
              + Request Strategic Proposal
            </button>
          </div>

          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-ink/10 shadow-sm">
            <p className="text-xs font-bold uppercase text-ink/60">Projects / Proposals</p>
            <p className="text-3xl font-bold font-display text-ink mt-1">
              {stats?.totalRequests || 0}
            </p>
            <p className="text-[11px] text-ink/50 mt-1">Total consultancy records</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-ink/10 shadow-sm">
            <p className="text-xs font-bold uppercase text-ink/60">Pending Scoping</p>
            <p className="text-3xl font-bold font-display text-amber-600 mt-1">
              {stats?.pendingReview || 0}
            </p>
            <p className="text-[11px] text-amber-700 font-semibold mt-1">Strategy under drafting</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-ink/10 shadow-sm">
            <p className="text-xs font-bold uppercase text-ink/60">Active Partnerships</p>
            <p className="text-3xl font-bold font-display text-purple-900 mt-1">
              {stats?.activeProjects || 0}
            </p>
            <p className="text-[11px] text-purple-800 font-semibold mt-1">Campaigns & outreach in progress</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-ink/10 shadow-sm">
            <p className="text-xs font-bold uppercase text-ink/60">Completed Deliverables</p>
            <p className="text-3xl font-bold font-display text-emerald-700 mt-1">
              {stats?.completedProjects || 0}
            </p>
            <p className="text-[11px] text-emerald-800 font-semibold mt-1">Audits & cycles delivered</p>
          </div>
        </div>

        {/* 2-Column Content: Projects & Services */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 Cols): Project Requests */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-ink/10 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold font-display text-ink">
                    Institutional Engagements & Proposals
                  </h2>
                  <p className="text-xs text-ink/60 mt-0.5">
                    Review progress on admissions planning, student recruitment, and digital branding.
                  </p>
                </div>
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="text-xs font-bold text-navy hover:underline"
                >
                  + New Proposal
                </button>
              </div>

              {leads.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-paper/60 border border-dashed border-ink/15">
                  <span className="text-3xl block mb-2">🏛️</span>
                  <p className="font-bold text-sm text-ink">No active consultancy projects</p>
                  <p className="text-xs text-ink/60 max-w-sm mx-auto mt-1">
                    Request an admission conversion audit or high-impact branding campaign for your
                    upcoming academic cycle.
                  </p>
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="mt-4 px-4 py-2 bg-ink text-white rounded-xl text-xs font-bold hover:bg-navy transition-all"
                  >
                    Request Strategy Proposal
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-ink/5">
                  {leads.map((lead) => {
                    const cleanUid = lead.uid || `RP-${lead.id.slice(0, 5).toUpperCase()}`;

                    return (
                      <div
                        key={lead.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-paper/30 p-2 rounded-xl transition-colors cursor-pointer"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center font-bold text-lg flex-shrink-0">
                            📊
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-ink">
                                {lead.organization_name || "Institutional Strategy"}
                              </span>
                              <span className="font-mono text-[10px] font-bold bg-paper px-2 py-0.5 rounded border border-ink/10 text-ink">
                                {cleanUid}
                              </span>
                            </div>
                            <p className="text-xs text-ink/60 mt-0.5">
                              Service: {lead.branding_service || lead.kind || "Admission Consultancy"}
                              {lead.designation && ` • Rep: ${lead.designation}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                              lead.status === "new"
                                ? "bg-amber-100 text-amber-900 border border-amber-200"
                                : lead.status === "contacted"
                                ? "bg-blue-100 text-blue-900 border border-blue-200"
                                : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                            }`}
                          >
                            {lead.status === "new"
                              ? "Scoping Underway"
                              : lead.status === "contacted"
                              ? "Meeting Scheduled"
                              : "Project Active / Delivered"}
                          </span>
                          <span className="text-xs text-ink/40">›</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Strategic Deliverables Timeline */}
            <div className="bg-white p-6 rounded-3xl border border-ink/10 shadow-sm">
              <h3 className="text-base font-bold font-display text-ink mb-3">
                Consultancy Activity Log
              </h3>
              {activityLogs.length === 0 ? (
                <p className="text-xs text-ink/50 py-4">No recent consultation activity logged.</p>
              ) : (
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-paper/60 text-xs"
                    >
                      <span className="text-sm">📌</span>
                      <div>
                        <p className="font-bold text-ink">
                          {log.action.replace(/_/g, " ").toUpperCase()}
                        </p>
                        <p className="text-[11px] text-ink/60">
                          {new Date(log.created_at).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Institutional Services Modules */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-ink/10 shadow-sm">
              <h3 className="font-bold font-display text-base text-ink mb-2">
                Available Institutional Solutions
              </h3>
              <p className="text-xs text-ink/60 mb-4">
                Core development solutions deployed for colleges across Maharashtra:
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-paper border border-ink/5">
                  <p className="font-bold text-ink">Admission Funnel & Enquiry Audit</p>
                  <p className="text-ink/60 text-[11px] mt-0.5">
                    Identify leakages in campus visits, tele-calling, and online enquiry drop-offs.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-paper border border-ink/5">
                  <p className="font-bold text-ink">Performance Marketing (Meta & Google)</p>
                  <p className="text-ink/60 text-[11px] mt-0.5">
                    Drive high-intent student leads during critical cutoff and round deadlines.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-paper border border-ink/5">
                  <p className="font-bold text-ink">Campus Rebranding & Prospectus</p>
                  <p className="text-ink/60 text-[11px] mt-0.5">
                    Modernise website, identity, and visual collateral for parent credibility.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-paper border border-ink/5">
                  <p className="font-bold text-ink">Outsourced Marketing Management</p>
                  <p className="text-ink/60 text-[11px] mt-0.5">
                    Full agency retainer managing strategy, creative, campaigns, and conversion.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRequestModal(true)}
                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-ink text-white font-bold text-xs hover:bg-navy transition-all"
              >
                Discuss Custom Solution
              </button>
            </div>

            {/* Direct Director Contact */}
            <div className="bg-white p-6 rounded-3xl border border-ink/10 shadow-sm text-xs">
              <h4 className="font-bold text-ink text-sm mb-1">Direct Director Hotline</h4>
              <p className="text-ink/60 leading-relaxed">
                Connect directly with our institutional director for confidentiality agreements and
                board presentations.
              </p>
              <div className="mt-3 p-3 rounded-xl bg-paper border border-ink/10 font-mono text-ink font-bold">
                +91 7276420236
              </div>
            </div>
          </div>
        </div>

        {/* MODAL: Request Strategic Proposal */}
        {showRequestModal && (
          <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-ink/10">
              <div className="flex items-center justify-between pb-4 border-b border-ink/10">
                <h3 className="text-lg font-bold font-display text-ink">
                  Request Institutional Proposal
                </h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="w-8 h-8 rounded-full bg-paper text-ink/70 hover:text-ink font-bold flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {modalSuccess ? (
                <div className="py-8 text-center">
                  <span className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 text-2xl flex items-center justify-center mx-auto mb-3">
                    ✓
                  </span>
                  <p className="font-bold text-ink">{modalSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleRequestSubmit} className="py-4 space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-ink mb-1">Institution / College Name</label>
                    <input
                      type="text"
                      required
                      value={instName}
                      onChange={(e) => setInstName(e.target.value)}
                      placeholder="e.g. MGM Institute of Technology"
                      className="form-field"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1">Your Designation / Role</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Director, Principal, Head of Admissions"
                      className="form-field"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1">Primary Scope / Solution</label>
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      className="form-field"
                    >
                      <option value="Admission planning & conversion audit">Admission planning & conversion audit</option>
                      <option value="Meta & Google Ads Performance Marketing">Meta & Google Ads Performance Marketing</option>
                      <option value="Social media marketing & campus presence">Social media marketing & campus presence</option>
                      <option value="Website development & admission landing pages">Website development & admission landing pages</option>
                      <option value="Accreditation, branding & prospectus design">Accreditation, branding & prospectus design</option>
                      <option value="Outsourced marketing department management">Outsourced marketing department management</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1">Target Academic Cycle / Timeline</label>
                    <input
                      type="text"
                      value={projectTimeline}
                      onChange={(e) => setProjectTimeline(e.target.value)}
                      placeholder="e.g. 2026-27 Intake, Starting next month"
                      className="form-field"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1">Specific Goals or Challenges</label>
                    <textarea
                      rows={3}
                      value={projectNotes}
                      onChange={(e) => setProjectNotes(e.target.value)}
                      placeholder="Tell us about your target seats, regional catchments, or current admission drop-offs..."
                      className="form-field"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-4 py-3 rounded-xl bg-brand font-bold text-ink hover:brightness-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {submitting ? "Submitting..." : "Submit Strategic Request →"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* MODAL: View Project Details */}
        {selectedLead && (
          <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-ink/10">
              <div className="flex items-center justify-between pb-3 border-b border-ink/10">
                <span className="font-mono text-xs font-bold bg-ink text-white px-2 py-0.5 rounded">
                  {selectedLead.uid || "LEAD"}
                </span>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="w-7 h-7 rounded-full bg-paper text-ink/70 hover:text-ink font-bold flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <div>
                  <span className="text-ink/50 text-[10px] uppercase font-bold">Organization</span>
                  <p className="font-bold text-base text-ink mt-0.5">
                    {selectedLead.organization_name || "Institution"}
                  </p>
                  <p className="text-ink/60 text-[11px] mt-0.5">
                    {selectedLead.branding_service || selectedLead.kind}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-paper p-3 rounded-xl">
                  <div>
                    <span className="text-ink/50 text-[10px] font-bold">Status</span>
                    <p className="font-bold text-ink capitalize mt-0.5">{selectedLead.status}</p>
                  </div>
                  <div>
                    <span className="text-ink/50 text-[10px] font-bold">Submitted Date</span>
                    <p className="font-medium text-ink mt-0.5">
                      {new Date(selectedLead.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>

                {selectedLead.requirement_notes && (
                  <div>
                    <span className="text-ink/50 text-[10px] font-bold">Requirement Notes</span>
                    <p className="p-3 rounded-xl bg-paper text-ink mt-1">
                      {selectedLead.requirement_notes}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedLead(null)}
                className="w-full py-2.5 rounded-xl bg-ink text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
