"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { syncUserProfile } from "@/app/actions/authActions";
import { getStudentDashboardData } from "@/app/actions/studentActions";
import { submitLead } from "@/app/actions/submitLead";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // Quick Application Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [course, setCourse] = useState("Engineering");
  const [exam, setExam] = useState("12th (HSC)");
  const [year, setYear] = useState("2026-27");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Selected Lead Detail Modal
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const loadData = useCallback(async (userId: string, email: string) => {
    setLoading(true);
    const res = await getStudentDashboardData(userId, email);
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

      // If user is institution, send to institution dashboard
      if (syncRes.profile.role === "user" && syncRes.profile.user_type === "institution") {
        router.push("/dashboard/institution");
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

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSubmitting(true);
    setModalSuccess(null);

    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token || null;

    const res = await submitLead({
      kind: "student",
      name: userProfile.full_name || userProfile.email.split("@")[0],
      phone: userProfile.phone || "+91 9999999999",
      email: userProfile.email,
      city: city || null,
      course,
      exam,
      academic_year: year,
      requirement_notes: notes || null,
      consent: true,
      authToken,
    });

    setSubmitting(false);

    if (res.success) {
      setModalSuccess(`Application submitted! Reference ID: ${res.uid || "Recorded"}`);
      await loadData(userProfile.id, userProfile.email);
      setTimeout(() => {
        setShowNewModal(false);
        setModalSuccess(null);
        setNotes("");
        setCity("");
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-ink border-t-brand rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink/75">Loading Student Portal...</p>
        </div>
      </div>
    );
  }

  const studentUid = `STU-${userProfile?.id.slice(0, 6).toUpperCase()}`;

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
            <span className="hidden sm:inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-blue-100 text-blue-900 border border-blue-200">
              Student Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-ink leading-tight">
                {userProfile?.full_name || "Student"}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono text-ink/60 bg-paper px-1.5 py-0.5 rounded border border-ink/10">
                  {studentUid}
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
        <div className="bg-gradient-to-r from-ink to-navy text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-ink/10 mb-8 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand text-ink mb-2">
                Student Account
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
                Welcome, {userProfile?.full_name || "Student"}!
              </h1>
              <p className="text-sm text-mist max-w-xl mt-1 leading-relaxed">
                Track your course counselling enquiries, review college admission options, and
                receive verified updates on Maharashtra admission rounds.
              </p>
            </div>

            <button
              onClick={() => setShowNewModal(true)}
              className="self-start md:self-auto px-5 py-3 rounded-xl bg-brand text-ink font-bold text-xs hover:brightness-105 active:scale-95 transition-all shadow-md shadow-brand/20 whitespace-nowrap"
            >
              + Submit New Course Enquiry
            </button>
          </div>

          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-ink/10 shadow-sm">
            <p className="text-xs font-bold uppercase text-ink/60">Total Enquiries</p>
            <p className="text-3xl font-bold font-display text-ink mt-1">
              {stats?.totalApplications || 0}
            </p>
            <p className="text-[11px] text-ink/50 mt-1">Submitted applications</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-ink/10 shadow-sm">
            <p className="text-xs font-bold uppercase text-ink/60">Under Review</p>
            <p className="text-3xl font-bold font-display text-amber-600 mt-1">
              {stats?.underReview || 0}
            </p>
            <p className="text-[11px] text-amber-700 font-semibold mt-1">Assigned to counsellor</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-ink/10 shadow-sm">
            <p className="text-xs font-bold uppercase text-ink/60">In Discussion</p>
            <p className="text-3xl font-bold font-display text-blue-900 mt-1">
              {stats?.inProgress || 0}
            </p>
            <p className="text-[11px] text-blue-800 font-semibold mt-1">Active college shortlisting</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-ink/10 shadow-sm">
            <p className="text-xs font-bold uppercase text-ink/60">Admissions Finalised</p>
            <p className="text-3xl font-bold font-display text-emerald-700 mt-1">
              {stats?.completed || 0}
            </p>
            <p className="text-[11px] text-emerald-800 font-semibold mt-1">Confirmed selections</p>
          </div>
        </div>

        {/* 2-Column Content: Enquiries & Resources */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 Cols): My Submitted Applications */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-ink/10 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold font-display text-ink">My Applications & Enquiries</h2>
                  <p className="text-xs text-ink/60 mt-0.5">
                    Real-time status of your course counselling and college shortlists.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="text-xs font-bold text-navy hover:underline"
                >
                  + Add Enquiry
                </button>
              </div>

              {leads.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-paper/60 border border-dashed border-ink/15">
                  <span className="text-3xl block mb-2">🎓</span>
                  <p className="font-bold text-sm text-ink">No course applications yet</p>
                  <p className="text-xs text-ink/60 max-w-sm mx-auto mt-1">
                    Fill out our quick guidance form to receive personalized recommendations from
                    our expert counsellors.
                  </p>
                  <button
                    onClick={() => setShowNewModal(true)}
                    className="mt-4 px-4 py-2 bg-ink text-white rounded-xl text-xs font-bold hover:bg-navy transition-all"
                  >
                    Submit First Enquiry
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
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold text-lg flex-shrink-0">
                            📚
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-ink">
                                {lead.course || "General Counselling"}
                              </span>
                              <span className="font-mono text-[10px] font-bold bg-paper px-2 py-0.5 rounded border border-ink/10 text-ink">
                                {cleanUid}
                              </span>
                            </div>
                            <p className="text-xs text-ink/60 mt-0.5">
                              Exam: {lead.exam || "12th"} • Year: {lead.academic_year || "2026-27"}
                              {lead.city && ` • City: ${lead.city}`}
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
                              ? "Under Review"
                              : lead.status === "contacted"
                              ? "In Discussion"
                              : "Admission Confirmed"}
                          </span>
                          <span className="text-xs text-ink/40">›</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* My Activity Feed */}
            <div className="bg-white p-6 rounded-3xl border border-ink/10 shadow-sm">
              <h3 className="text-base font-bold font-display text-ink mb-3">Activity & Timeline</h3>
              {activityLogs.length === 0 ? (
                <p className="text-xs text-ink/50 py-4">No recent activity logged.</p>
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

          {/* Right Column (1 Col): Resources & Counsellor Connect */}
          <div className="space-y-6">
            {/* Direct Counsellor Connect */}
            <div className="bg-white p-6 rounded-3xl border border-ink/10 shadow-sm">
              <h3 className="font-bold font-display text-base text-ink mb-1">
                Need Immediate Help?
              </h3>
              <p className="text-xs text-ink/70 leading-relaxed">
                Connect directly with our dedicated senior counsellor via WhatsApp or call for
                verified college cutoff and CAP registration details.
              </p>

              <div className="mt-4 p-4 rounded-2xl bg-paper border border-ink/10 space-y-2 text-xs">
                <div>
                  <span className="text-ink/50 font-bold uppercase text-[10px]">Counselling Helpline</span>
                  <p className="font-bold text-ink font-mono text-sm mt-0.5">+91 9356888274</p>
                </div>
                <div>
                  <span className="text-ink/50 font-bold uppercase text-[10px]">Email Support</span>
                  <p className="font-semibold text-ink mt-0.5">counselling@rightpath.com</p>
                </div>
              </div>

              <a
                href="https://wa.me/919356888274?text=Hello%2C%20I%20am%20a%20registered%20student%20on%20The%20Right%20Path%20portal%20and%20would%20like%20admission%20guidance."
                target="_blank"
                rel="noreferrer"
                className="mt-4 w-full py-3 px-4 rounded-xl bg-[#25D366] text-white font-bold text-xs hover:brightness-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>💬 WhatsApp Counsellor</span>
              </a>
            </div>

            {/* Admission Checklist */}
            <div className="bg-white p-6 rounded-3xl border border-ink/10 shadow-sm">
              <h3 className="font-bold font-display text-base text-ink mb-2">
                Essential CAP Checklist
              </h3>
              <p className="text-xs text-ink/60 mb-3">
                Prepare these documents for Centralized Admission Process (CAP):
              </p>
              <ul className="space-y-2 text-xs text-ink/80">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> 10th & 12th Marks Sheet
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Entrance Exam Scorecard (MHT-CET / JEE / NEET / CAT)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Domicile & Nationality Certificate
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Category & Non-Creamy Layer (if applicable)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Transfer & Migration Certificates
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* MODAL: Submit New Enquiry */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-ink/10">
              <div className="flex items-center justify-between pb-4 border-b border-ink/10">
                <h3 className="text-lg font-bold font-display text-ink">
                  New Course & College Enquiry
                </h3>
                <button
                  onClick={() => setShowNewModal(false)}
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
                <form onSubmit={handleQuickSubmit} className="py-4 space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-ink mb-1">Preferred Course</label>
                    <select
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="form-field"
                    >
                      <option value="Engineering">Engineering (B.Tech / B.E.)</option>
                      <option value="Management / MBA">Management (MBA / MMS / BBA)</option>
                      <option value="Pharmacy">Pharmacy (B.Pharm / D.Pharm)</option>
                      <option value="Law">Law (LLB 3yr / 5yr)</option>
                      <option value="Science / Computer applications">MCA / Computer Applications</option>
                      <option value="Commerce / Arts">Commerce & Arts</option>
                      <option value="Not sure">Not sure yet (Need evaluation)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-ink mb-1">Qualifying Exam</label>
                      <select
                        value={exam}
                        onChange={(e) => setExam(e.target.value)}
                        className="form-field"
                      >
                        <option value="12th (HSC)">12th (HSC)</option>
                        <option value="10th">10th</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Graduation">Graduation</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-ink mb-1">Academic Year</label>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="form-field"
                      >
                        <option value="2026-27">2026-27</option>
                        <option value="2027-28">2027-28</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1">Preferred City / College</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Sambhajinagar, Pune, Mumbai"
                      className="form-field"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1">Specific Questions or Target College</label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tell us about your CET score, college preference, or budget..."
                      className="form-field"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-4 py-3 rounded-xl bg-brand font-bold text-ink hover:brightness-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {submitting ? "Submitting..." : "Submit Application →"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* MODAL: View Application Details */}
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
                  <span className="text-ink/50 text-[10px] uppercase font-bold">Course Choice</span>
                  <p className="font-bold text-base text-ink mt-0.5">{selectedLead.course || "General"}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-paper p-3 rounded-xl">
                  <div>
                    <span className="text-ink/50 text-[10px] font-bold">Status</span>
                    <p className="font-bold text-ink capitalize mt-0.5">{selectedLead.status}</p>
                  </div>
                  <div>
                    <span className="text-ink/50 text-[10px] font-bold">Submitted</span>
                    <p className="font-medium text-ink mt-0.5">
                      {new Date(selectedLead.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>

                {selectedLead.requirement_notes && (
                  <div>
                    <span className="text-ink/50 text-[10px] font-bold">Your Notes</span>
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
