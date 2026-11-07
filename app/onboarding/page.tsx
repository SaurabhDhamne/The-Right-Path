"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { updateUserType, syncUserProfile } from "@/app/actions/authActions";

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<"student" | "institution">("student");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      // Check current profile
      const res = await syncUserProfile({
        userId: session.user.id,
        email: session.user.email || "",
      });

      if (res.success && res.profile) {
        if (res.profile.role === "admin") {
          router.push("/dashboard/admin");
          return;
        }
        if (res.profile.user_type === "student") {
          router.push("/dashboard/student");
          return;
        }
        if (res.profile.user_type === "institution") {
          router.push("/dashboard/institution");
          return;
        }
      }

      setChecking(false);
    }

    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);

    const res = await updateUserType(user.id, selectedType);
    setLoading(false);

    if (res.success) {
      if (selectedType === "student") {
        router.push("/dashboard/student");
      } else {
        router.push("/dashboard/institution");
      }
    } else {
      setErrorMsg(res.error || "Failed to update account type. Please try again.");
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-ink border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Brand Header */}
        <div className="flex flex-col items-center">
          <Link href="/" className="inline-block relative h-20 w-64 overflow-hidden mb-2">
            <Image
              src="/logo.jpeg"
              alt="The Right Path Consultants"
              fill
              priority
              className="object-contain scale-[1.7]"
            />
          </Link>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand/20 text-ink uppercase tracking-wider mb-2">
            Account Setup
          </span>
          <h2 className="text-center text-2xl font-bold font-display text-ink">
            Tell us about yourself
          </h2>
          <p className="mt-1 text-center text-sm text-ink/70 max-w-sm">
            Select your account type to personalise your portal experience and guidance tools.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-xl shadow-ink/5 rounded-3xl border border-ink/10 sm:px-10">
          {errorMsg && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Option 1: Student */}
            <label
              onClick={() => setSelectedType("student")}
              className={`block p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedType === "student"
                  ? "border-brand bg-brand/5 shadow-md shadow-brand/10"
                  : "border-ink/10 hover:border-ink/30 bg-white"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-bold ${
                    selectedType === "student" ? "bg-brand text-ink" : "bg-paper text-ink/60"
                  }`}
                >
                  🎓
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-base text-ink">Student / Parent</p>
                    <input
                      type="radio"
                      name="userType"
                      checked={selectedType === "student"}
                      onChange={() => setSelectedType("student")}
                      className="accent-brand w-4 h-4"
                    />
                  </div>
                  <p className="mt-1 text-xs text-ink/70 leading-relaxed">
                    I am seeking course guidance, college shortlisting, CAP admission updates,
                    or career counselling.
                  </p>
                </div>
              </div>
            </label>

            {/* Option 2: Institution */}
            <label
              onClick={() => setSelectedType("institution")}
              className={`block p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedType === "institution"
                  ? "border-brand bg-brand/5 shadow-md shadow-brand/10"
                  : "border-ink/10 hover:border-ink/30 bg-white"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-bold ${
                    selectedType === "institution" ? "bg-brand text-ink" : "bg-paper text-ink/60"
                  }`}
                >
                  🏛️
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-base text-ink">Educational Institution</p>
                    <input
                      type="radio"
                      name="userType"
                      checked={selectedType === "institution"}
                      onChange={() => setSelectedType("institution")}
                      className="accent-brand w-4 h-4"
                    />
                  </div>
                  <p className="mt-1 text-xs text-ink/70 leading-relaxed">
                    I represent a college, university, or institute looking for admission
                    strategy, branding, digital marketing, or development.
                  </p>
                </div>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3.5 px-4 rounded-xl bg-brand font-bold text-ink hover:brightness-105 active:scale-[0.99] transition-all shadow-md shadow-brand/20 flex items-center justify-center gap-2"
            >
              {loading ? "Setting up portal..." : "Continue to Dashboard →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
